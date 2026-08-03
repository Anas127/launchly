from tempfile import NamedTemporaryFile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from models import ResearchRequest
from crew import run_crew
from pdf_utils import generate_pdf
import json
import asyncio
import re
import json as json_lib
from tempfile import NamedTemporaryFile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://launchly-kappa.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/research-stream")
async def research_stream(request: ResearchRequest):
    async def event_generator():
        loop = asyncio.get_event_loop()
        try:
            yield f"data: {json.dumps({'step': 1, 'message': 'Researching company...'})}\n\n"
            await asyncio.sleep(0.1)
            yield f"data: {json.dumps({'step': 2, 'message': 'Finding job openings...'})}\n\n"

            result = await loop.run_in_executor(
                None, run_crew, request.company_name, request.user_background, request.tone
            )

            jobs_raw = result.tasks_output[1].raw
            jobs_clean = re.sub(r"```json|```", "", jobs_raw).strip()
            try:
                jobs_parsed = json_lib.loads(jobs_clean)
            except:
                jobs_parsed = []

            yield f"data: {json.dumps({'step': 3, 'message': 'Writing your cover letter...'})}\n\n"
            await asyncio.sleep(1)
            yield f"data: {json.dumps({'step': 4, 'message': 'Done', 'result': str(result.raw), 'jobs': jobs_parsed})}\n\n"

        except ValueError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': 'Something went wrong. Please try again.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/export-pdf")
async def export_pdf(data: dict):
    with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        generate_pdf(
            data["cover_letter"],
            tmp.name,
            user_info=data.get("user_info", {})
        )

    return FileResponse(
        tmp.name,
        media_type="application/pdf",
        filename="cover_letter.pdf"
    )
