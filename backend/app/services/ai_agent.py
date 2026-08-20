import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.referral import Referral

# Dynamic imports inside methods are safer if groq is optional, 
# but since groq is in requirements.txt, we can import it globally.
from groq import Groq

def _generate_mock_analysis(referral: Referral) -> Dict[str, Any]:
    """
    Generate a deterministic, rule-based mock analysis when GROQ_API_KEY is not set.
    Checks demographics and clinical fields to simulate LLM logic.
    """
    missing_info = []
    potential_issues = []
    patient = referral.patient
    
    # Rule 1: Check clinical notes presence
    if not patient.medical_history_summary or len(patient.medical_history_summary.strip()) < 10:
        missing_info.append("Recent clinical history or SOAP progress notes")
        potential_issues.append("Lack of clinical documentation to justify the requested procedure")
        
    # Rule 2: Prior Auth checks for typical imaging or scopes
    proc_upper = referral.requested_procedure.upper()
    if any(k in proc_upper for k in ["MRI", "CT", "COLONOSCOPY", "ENDOSCOPY"]):
        potential_issues.append(f"Prior authorization required by {referral.insurance_provider} for high-tech imaging/diagnostics")
        
    # Rule 3: Insurance documentation
    if not patient.insurance or not patient.insurance.group_number:
        missing_info.append("Insurance group number or subscriber card copy")
        
    # Rule 4: Medication history cross-references
    if not patient.medications and "MRI" in proc_upper:
        potential_issues.append("No active medications listed in patient profile; verify current therapy attempts")

    # Score calculation (clamped to 50-100 for mock)
    completeness_score = max(50, 100 - (len(missing_info) * 15) - (len(potential_issues) * 10))
    
    if missing_info:
        recommendation = f"Request missing documentation ({', '.join(missing_info)}) from referring provider before submitting auth claim."
    elif referral.status == "Pending":
        recommendation = "Referral documentation complete. Proceed to submit prior authorization request to insurer."
    else:
        recommendation = "Verify status update credentials."
        
    return {
        "completeness_score": completeness_score,
        "missing_information": missing_info,
        "potential_issues": potential_issues,
        "recommendation": recommendation,
        "confidence": 0.90 if missing_info else 0.95,
        "human_review_required": True,
        "disclaimer": "Administrative workflow assistance only. Not a clinical decision."
    }


def _run_groq_analysis(referral: Referral) -> Dict[str, Any]:
    """
    Connect to the Groq API using prompt engineering to perform administrative review.
    Forces response format to JSON.
    """
    client = Groq(api_key=settings.GROQ_API_KEY)
    patient = referral.patient
    
    # Format sub-records
    meds_str = ", ".join([f"{m.drug_name} ({m.dosage})" for m in patient.medications]) if patient.medications else "None"
    labs_str = ", ".join([f"{l.test_name}: {l.test_value} {l.unit}" for l in patient.laboratory_results]) if patient.laboratory_results else "None"
    insurance_str = f"Provider: {patient.insurance.insurance_provider}, Policy: {patient.insurance.policy_number}, Plan: {patient.insurance.plan_type}" if patient.insurance else "None"

    system_prompt = (
        "You are an expert AI medical-administrative coordinator at CareFlow AI. Your role is to perform administrative workflow intelligence for healthcare referrals.\n"
        "You must never make clinical judgments, diagnose diseases, or recommend specific medical treatments. Your assessment is purely administrative.\n"
        "Inspect the provided referral and patient clinical profile (including medications, lab results, and insurance).\n"
        "Evaluate:\n"
        "1. Completeness: Are essential clinical documents, policy numbers, or clinical summaries missing for the requested procedure?\n"
        "2. Potential issues: E.g., does the procedure require prior authorization? Are there duplicates?\n"
        "3. Next action recommendation: E.g., 'Request clinical notes', 'Proceed to insurer authorization submission', 'Request missing insurance card'.\n"
        "Provide your output in strict JSON format matching this schema:\n"
        "{\n"
        "  \"completeness_score\": int (0-100),\n"
        "  \"missing_information\": List[str],\n"
        "  \"potential_issues\": List[str],\n"
        "  \"recommendation\": str,\n"
        "  \"confidence\": float (0.0-1.0),\n"
        "  \"human_review_required\": bool\n"
        "}"
    )

    user_content = (
        f"Referral details:\n"
        f"Diagnosis: {referral.diagnosis_code} ({referral.diagnosis_description})\n"
        f"Requested Procedure: {referral.requested_procedure}\n"
        f"Insurance Provider: {referral.insurance_provider}\n\n"
        f"Patient profile details:\n"
        f"Date of birth: {patient.date_of_birth}\n"
        f"Gender: {patient.gender}\n"
        f"Medical History Summary: {patient.medical_history_summary or 'None'}\n"
        f"Active medications: {meds_str}\n"
        f"Laboratory results: {labs_str}\n"
        f"Insurance Details: {insurance_str}"
    )

    response = client.chat.completions.create(
        model="llama3-8b-8192",  # Fast, JSON-capable default model
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    
    result = json.loads(response.choices[0].message.content)
    result["disclaimer"] = "Administrative workflow assistance only. Not a clinical decision."
    result["human_review_required"] = True
    return result


from app.models.ai_analysis_history import AIAnalysisHistory
from app.models.user import User

class AIAgentService:
    def analyze_referral(self, db: Session, referral: Referral, user: Optional[User] = None) -> Dict[str, Any]:
        """
        Gathers context and runs AI analysis. Falls back to mock rules if Groq API key is missing.
        Saves analysis on Referral model AND appends a record in AIAnalysisHistory.
        """
        used_fallback = False
        if not settings.GROQ_API_KEY:
            analysis = _generate_mock_analysis(referral)
            used_fallback = True
        else:
            try:
                analysis = _run_groq_analysis(referral)
            except Exception as e:
                import sys
                print(f"Groq API call error: {e}", file=sys.stderr)
                analysis = _generate_mock_analysis(referral)
                used_fallback = True

        # Save directly on the referral JSON column
        referral.ai_analysis = analysis
        db.add(referral)

        # Create history entry
        history_entry = AIAnalysisHistory(
            referral_id=referral.id,
            triggered_by_user_id=user.id if user else None,
            ai_provider="Groq" if not used_fallback else "HeuristicFallback",
            model_name="llama3-8b-8192" if not used_fallback else "RuleEngine-v1",
            analysis_version="v1.0",
            used_fallback=used_fallback,
            completeness_score=int(analysis.get("completeness_score", 80)),
            confidence=float(analysis.get("confidence", 0.9)),
            analysis_result=analysis
        )
        db.add(history_entry)
        db.commit()
        db.refresh(referral)
        return referral.ai_analysis

ai_agent_service = AIAgentService()
