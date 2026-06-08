from crewai import Agent
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

job_finder = Agent(
    role="Job Finder",
    goal="Find real job openings at {company_name} that match {target_role}",
    backstory="You are a specialist at finding job openings and extracting the title, location, and URL of each one.",
    tools=[search_tool],
    verbose=True
)