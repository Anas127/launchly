from crewai import Crew, Task
from agents.researcher import researcher
from agents.job_finder import job_finder
from agents.writer import writer
from datetime import date
import requests
import os


def company_exists(company_name: str) -> bool:
    response = requests.post(
        "https://google.serper.dev/search",
        headers={
            "X-API-KEY": os.getenv("SERPER_API_KEY"), "Content-Type": "application/json"},
        json={"q": f"{company_name} company"}
    )
    data = response.json()
    organic = data.get("organic", [])
    knowledge_graph = data.get("knowledgeGraph", {})

    if knowledge_graph:
        return True

    if len(organic) >= 3:
        domains = [r.get("link", "") for r in organic]
        company_lower = company_name.lower().replace(" ", "")
        matched = any(company_lower in d.lower() for d in domains)
        return matched

    return False


def run_crew(company_name: str, user_background, tone: str = "professional"):
    if not company_exists(company_name):
        raise ValueError(
            f"Company '{company_name}' not found. Please enter a real company name.")

    research_task = Task(
        description=f"Research {company_name}. Find their mission, culture, tech stack, and recent news.",
        expected_output="A detailed summary of the company including mission, culture, tech stack, and recent news.",
        agent=researcher
    )

    job_task = Task(
        description=f"""Search for current job openings at {company_name} for a {user_background.target_role} role.
    Search Google for "{company_name} {user_background.target_role} jobs" and "{company_name} careers {user_background.target_role}".
    Look for results from the company's official jobs page, LinkedIn, or Greenhouse.
    Return ONLY a raw JSON array. No explanation, no markdown, no backticks.
    Format: [{{"title": "Job Title", "location": "City or Remote", "url": "https://..."}}]
    If no jobs found, return an empty array: []""",
        expected_output="""A raw JSON array of job openings. Nothing else. No markdown. No backticks. Just the array.""",
        agent=job_finder
    )

    tone_instruction = {
        "professional": "Use a formal, professional tone throughout.",
        "confident": "Use a direct, confident tone. No hedging, no filler words.",
        "casual": "Use a conversational, human tone. Avoid corporate language.",
    }.get(tone, "Use a formal, professional tone throughout.")

    write_task = Task(
        description=f"""
Write a cover letter for:

Name: {user_background.name} {user_background.last_name}
Email: {user_background.email}
Phone: {user_background.phone}
Location: {user_background.location}
Date: {date.today().strftime("%B %d, %Y")}

Tone: {tone_instruction}

Candidate Skills and Traits:
{user_background.skills}

Experience:
{user_background.experience_years} years

Candidate Summary:
{user_background.summary}

IMPORTANT:

The cover letter MUST reference or incorporate information from BOTH:

1. Candidate Summary
2. Skills

The candidate summary and skills are the PRIMARY sources of personalization.

Do not ignore unusual, quirky, unconventional, humorous, or informal skills.

If the candidate lists unusual skills, habits, traits, characteristics, interests, or behaviors,
they should influence the tone and content of the cover letter.

The goal is to preserve the candidate's unique voice and personality rather than producing a generic corporate cover letter.

IMPORTANT:

Do not automatically frame negative traits as strengths.

Do not create redemption arcs.

Do not reinterpret flaws as hidden virtues.

Do not assume personal growth unless explicitly stated.

Present candidate-provided traits neutrally.

Company:
{company_name}

Target Role:
{user_background.target_role}

Requirements:
- Use only information provided by the candidate.
- Do not invent experience.
- Do not invent achievements.
- Do not invent certifications.
- The candidate summary is the PRIMARY source of personalization.
- You MUST incorporate information from the candidate summary.
- If the candidate provides motivations, goals, frustrations, ambitions, or personal reasons, use them in the cover letter.
- Preserve the meaning of the candidate summary.
- Informal language may be included when appropriate.
- Mention relevant company facts only when appropriate.
- Keep it realistic and professional.
- Maximum 300 words. """,
        expected_output="""
A realistic cover letter under 300 words with today's actual date, no placeholders.

The cover letter must:
- Use the candidate's actual information.
- Avoid invented claims.
- Avoid exaggerated enthusiasm.
- Be suitable for submission to a real employer.
""",
        agent=writer
    )

    crew = Crew(
        agents=[researcher, job_finder, writer],
        tasks=[research_task, job_task, write_task],
        verbose=True
    )

    return crew.kickoff()
