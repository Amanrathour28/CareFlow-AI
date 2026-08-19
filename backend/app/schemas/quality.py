from typing import List
from pydantic import BaseModel

class DataQualityIssue(BaseModel):
    field: str
    message: str
    severity: str  # "error" | "warning"

class DataQualityReport(BaseModel):
    quality_score: int  # 0-100
    issues: List[DataQualityIssue]
    passed: bool  # True if quality_score >= 70
