from pydantic import BaseModel
from typing import List


class UserBackground(BaseModel):
    name: str
    last_name: str
    email: str
    phone: str
    location: str
    skills: List[str]
    experience_years: int
    target_role: str
    summary: str


class ResearchRequest(BaseModel):
    company_name: str
    user_background: UserBackground
    tone: str = "professional"


class JobOpening(BaseModel):
    title: str
    location: str
    url: str


class ResearchResponse(BaseModel):
    company_summary: str
    job_openings: List[JobOpening]
    cover_letter: str
