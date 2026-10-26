
import os
import time

import certifi
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Use the verified SSL certificate bundle.
os.environ["SSL_CERT_FILE"] = certifi.where()

from google import genai
from google.genai import errors, types

# Load environment variables from backend/.env.
load_dotenv()

app = FastAPI(title="MindEase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "MindEase API",
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured.",
        )

    try:
        client = genai.Client(api_key=api_key)
        started_at = time.perf_counter()
        response = None

        # Try once more if Gemini returns a temporary server error.
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=request.message,
                    config=types.GenerateContentConfig(
                        system_instruction=(
                            "You are MindEase, a supportive wellbeing companion. "
                            "Respond warmly and naturally to the user's concern. "
                            "Give one practical, easy-to-follow suggestion. "
                            "Keep every response to 2-4 short sentences. "
                            "Do not diagnose conditions or prescribe medication. "
                            "You are not a replacement for a mental health "
                            "professional. If the user describes immediate "
                            "danger or possible self-harm, prioritize immediate "
                            "safety and encourage contacting local emergency "
                            "services or a trusted person immediately."
                        ),
                        max_output_tokens=180,
                    ),
                )
                break

            except errors.ServerError:
                if attempt == 1:
                    raise

                print(
                    "Gemini server temporarily unavailable. "
                    "Retrying once..."
                )
                time.sleep(1)

        print(
            "Gemini generation took "
            f"{time.perf_counter() - started_at:.2f} seconds"
        )

        reply = response.text if response else None

        if not reply or not reply.strip():
            raise HTTPException(
                status_code=502,
                detail="The AI provider returned an empty response.",
            )

        return ChatResponse(reply=reply.strip())

    except HTTPException:
        raise

    except Exception as e:
        print(f"Gemini API error: {type(e).__name__}: {e}")

        raise HTTPException(
            status_code=502,
            detail=(
                "The AI service could not respond. "
                "Please try again shortly."
            ),
        )
