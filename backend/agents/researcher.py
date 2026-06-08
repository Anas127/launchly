from crewai import Agent
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

researcher = Agent(
    role="Company Researcher",
    goal="Research everything about {company_name} — their mission, culture, tech stack, and recent news",
    backstory="You are an expert at analyzing companies and extracting key information that would help a job applicant stand out.",
    tools=[search_tool],
    verbose=True
)