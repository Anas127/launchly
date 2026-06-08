# Launchly

AI-powered job research and cover letter generator. Enter a company name and your background — autonomous agents research the company, find open roles, and write a tailored cover letter.

## How it works

1. **Company Research Agent** — searches the web for the company's mission, culture, and tech stack
2. **Job Finder Agent** — finds real open roles matching your target position
3. **Cover Letter Writer Agent** — writes a personalized cover letter based on your background and company research

## Tech Stack

- **Frontend** — React + Vite
- **Backend** — FastAPI + Python
- **AI Agents** — CrewAI + GPT-4o-mini
- **Search** — Serper (Google Search API)
- **PDF Export** — ReportLab

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key
- Serper API key

### Backend

    cd backend
    pip install -r requirements.txt

Create a `.env` file in `backend/`:

    OPENAI_API_KEY=your_key_here
    SERPER_API_KEY=your_key_here

Run the server:

    uvicorn main:app --reload

### Frontend

    cd frontend
    npm install
    npm run dev

Open `http://localhost:5174`

## Features

- Multi-agent pipeline using CrewAI
- Real-time streaming progress updates
- Job openings displayed as clickable cards
- Tone selector — Professional / Confident / Casual
- Copy to clipboard
- Export to PDF with styled header
- Company validation — rejects fake or non-existent companies
