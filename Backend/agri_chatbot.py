import os
import tempfile
import asyncio
import re
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from deepgram import DeepgramClient, PrerecordedOptions, SpeakOptions
import google.generativeai as genai
import shutil
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
    reply: str  # normal text

# ---------------------------
# Helper: Clean Markdown
# ---------------------------
def clean_markdown(text: str) -> str:
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
    # Handle greetings
    if prompt.lower().strip() in ["hello", "hi", "hii", "hello?"]:
        return "Hi! I'm your Kerala Agri Chatbot. Ask me about farming, weather, or anything else!"

    # Inject current date if "today" mentioned
    if "today" in prompt.lower():
        current_date = datetime.now().strftime("%A, %B %d, %Y")
        prompt = f"{prompt} (Current date is {current_date})"

    # Call Gemini
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    cleaned_text = clean_markdown(response.text)

    return cleaned_text or "Sorry, I couldn't generate a response."

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
# Deepgram TTS Function (with chunking for long text)
# ---------------------------
current_tts_task = None  # global for cancelling previous TTS

async def generate_speech_file(text: str) -> str:
    MAX_CHARS = 800  # safe limit per request
    chunks = []

    while len(text) > MAX_CHARS:
        split_at = text.rfind(".", 0, MAX_CHARS)
        if split_at == -1:
            split_at = text.rfind(" ", 0, MAX_CHARS)
        if split_at == -1:
            split_at = MAX_CHARS
        chunks.append(text[:split_at + 1].strip())
        text = text[split_at + 1:].strip()

    if text:
        chunks.append(text)

    # Merge all audio parts
    final_file = tempfile.mktemp(suffix=".mp3")

    with open(final_file, "wb") as outfile:
        for chunk in chunks:
            tmp_file = tempfile.mktemp(suffix=".mp3")
            options = SpeakOptions(model="aura-asteria-en", encoding="mp3")
            payload = {"text": chunk}
            await deepgram.speak.asyncrest.v("1").save(tmp_file, payload, options)

            with open(tmp_file, "rb") as part:
                outfile.write(part.read())
            try:
                os.remove(tmp_file)
            except:
                pass

    return final_file

# ---------------------------
# API Endpoints
# ---------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    prompt = req.message.strip()
    if not prompt:
        return {"reply": "⚠️ Please enter a valid message."}
    reply = generate_text(prompt)
    return {"reply": reply}

@app.post("/stt")
async def stt(file: UploadFile = File(...)):
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
    global current_tts_task
    text = req.message.strip()
    if not text:
        return {"error": "Empty text"}

    if current_tts_task and not current_tts_task.done():
        current_tts_task.cancel()

    current_tts_task = asyncio.create_task(generate_speech_file(text))
    try:
        mp3_file = await current_tts_task
    except asyncio.CancelledError:
        return {"error": "TTS cancelled due to new input"}

    def iterfile():
        with open(mp3_file, "rb") as f:
            yield from f
        try:
            os.remove(mp3_file)
        except:
            pass

    return StreamingResponse(iterfile(), media_type="audio/mpeg")

# ---------------------------
# Run locally
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 FastAPI running at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
