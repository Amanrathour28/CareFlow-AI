import React from 'react';

export default function DemoFlowModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        maxWidth: 720,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🎯</span> Interview Demonstration Flow Guide
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >&times;</button>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Follow this 6-step walkthrough during technical interviews to showcase full-stack healthcare coordination, AI guardrails, RBAC data scoping, and live workflow automation.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#60a5fa', fontSize: '1rem' }}>Step 1: Caregiver Login & Intake</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Log in as <code>caregiver_smith</code> (Password: <code>demopassword123</code>). Create a new patient or review <b>John Doe</b>. Notice the automated <b>Data Quality Engine Score</b> calculated on intake.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #8b5cf6' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#a78bfa', fontSize: '1rem' }}>Step 2: AI Referral Completeness Triage</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Open the Upper GI Endoscopy referral. Trigger <b>AI Analysis</b>. Groq LLM (or Fallback Engine) inspects clinical SOAP notes and flags missing prior authorization forms.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #ec4899' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#f472b6', fontSize: '1rem' }}>Step 3: Administrative Task Assignment</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Navigate to <b>Tasks Board</b>. Drag the prior authorization task into <i>In Progress</i> or <i>Completed</i> once clinical progress notes or insurance cards are uploaded.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #10b981' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#34d399', fontSize: '1rem' }}>Step 4: Doctor Review & State Transition</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Log in as <code>dr_house</code> (Password: <code>demopassword123</code>). Review assigned patients, inspect AI findings, and advance referral status from <i>Under Review</i> to <i>Ready for Authorization</i> or <i>Approved</i>.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #f59e0b' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#fbbf24', fontSize: '1rem' }}>Step 5: Referral Timeline & Audit Inspection</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Inspect the visual <b>Referral Timeline</b> showing timestamped status transitions, performing staff IDs, and transition notes for clinical compliance.
            </p>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #06b6d4' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#22d3ee', fontSize: '1rem' }}>Step 6: Admin System-Wide Dashboard & Audit Trail</h4>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Log in as <code>admin_demo</code> (Password: <code>demopassword123</code>). Access system-wide metrics, quality distributions, user role management, and audit logs.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.4rem',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Got it, Let's Demo!
          </button>
        </div>
      </div>
    </div>
  );
}
