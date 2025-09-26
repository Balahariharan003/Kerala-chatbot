import os
import tempfile
import asyncio
import re
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from deepgram import DeepgramClient, PrerecordedOptions, SpeakOptions
import google.generativeai as genai
import shutil
import json
from dotenv import load_dotenv

# ---------------------------
# Load API keys
# ---------------------------
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

if not GEMINI_API_KEY or not DEEPGRAM_API_KEY:
    raise RuntimeError("Error: API keys not set in .env")

genai.configure(api_key=GEMINI_API_KEY)
deepgram = DeepgramClient(api_key=DEEPGRAM_API_KEY)

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local dev use "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Request Models
# ---------------------------
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# ---------------------------
# Helper: Clean Markdown
# ---------------------------
def clean_markdown(text: str) -> str:
    """Remove markdown formatting but preserve paragraph breaks."""
    if not text:
        return ""
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"_(.*?)_", r"\1", text)
    text = re.sub(r"`(.*?)`", r"\1", text)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return "\n\n".join(paragraphs)


# ---------------------------
# Gemini Chat Function
# ---------------------------
def generate_text(prompt: str) -> str:
    if prompt.lower().strip() in ["hello", "hi", "hii", "hello?"]:
        return "Hi! I'm your Kerala Agri Chatbot. Ask me about farming, weather, or anything else!"

    if "today" in prompt.lower():
        current_date = datetime.now().strftime("%A, %B %d, %Y")
        prompt = f"{prompt} (Current date is {current_date})"

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)

    # Clean and structure the response for proper alignment
    cleaned_text = clean_markdown(response.text)
    if cleaned_text:
        # Split into sentences or key points and format
        sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
        formatted_text = ""
        for sentence in sentences:
            if sentence.strip():
                formatted_text += sentence.strip() + " "
        formatted_text = formatted_text.strip()
        # Add line breaks for paragraph-like structure
        return "\n".join(formatted_text.split(". ")[:-1]) + "." if formatted_text.endswith(".") else formatted_text
    
    # Clean markdown for plain text output
    return clean_markdown(response.text)

# ---------------------------
# Deepgram STT Function
# ---------------------------
async def transcribe_audio_file(file_path: str) -> str:
    with open(file_path, "rb") as audio:
        source = {"buffer": audio}
        options = PrerecordedOptions(model="nova-2", language="en-IN", smart_format=True)
        response = deepgram.listen.rest.v("1").transcribe_file(source, options)
        transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        return transcript.strip() if transcript else ""

# ---------------------------
# Deepgram TTS Function
# ---------------------------
async def async_generate_speech(text: str, filename: str):
    options = SpeakOptions(model="aura-asteria-en", encoding="mp3")
    payload = {"text": text}
    await deepgram.speak.asyncrest.v("1").save(filename, payload, options)

def generate_speech_file(text: str) -> str:
    tmp_file = tempfile.mktemp(suffix=".mp3")
    asyncio.run(async_generate_speech(text, tmp_file))
    return tmp_file

# ---------------------------
# API Endpoints
# ---------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Text-based chat (no TTS)"""
    prompt = req.message.strip()
    if not prompt:
        return {"reply": "⚠️ Please enter a valid message."}
    reply = generate_text(prompt)
    return {"reply": reply}

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
    """Voice input -> transcript"""
    tmp_file = tempfile.mktemp(suffix=".wav")
    with open(tmp_file, "wb") as f:
        shutil.copyfileobj(file.file, f)

    transcript = await transcribe_audio_file(tmp_file)

    try:
        os.unlink(tmp_file)
    except:
        pass

    return {"reply": transcript if transcript else "⚠️ Could not transcribe audio."}

@app.post("/tts")
async def tts(req: ChatRequest):
    """Generate TTS MP3 from text and return as audio stream"""
    text = req.message.strip()
    if not text:
        return {"error": "Empty text"}

    mp3_file = generate_speech_file(text)

    def iterfile():
        with open(mp3_file, "rb") as f:
            yield from f
        try:
            os.remove(mp3_file)
        except:
            pass

    return StreamingResponse(iterfile(), media_type="audio/mpeg")

@app.get("/stream-chat")
async def stream_chat(request: Request, query: str):
    """
    Streams Gemini bot responses word by word for live typing in frontend.
    """
    async def event_generator():
        reply = generate_text(query)
        for word in reply.split():
            if await request.is_disconnected():
                break
            chunk = json.dumps({"text": word + " "})
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.05)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ---------------------------
# Run locally
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 FastAPI running at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
