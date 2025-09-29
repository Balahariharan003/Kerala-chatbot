# Kerala Chatbot

## Overview

The Kerala Chatbot is a conversational AI application built using **FastAPI**, integrating speech-to-text (STT) and text-to-speech (TTS) functionalities.  
It leverages **Google Gemini API** for natural language understanding and **Deepgram** for audio processing.  

This project provides an interactive platform for voice-based conversations.

---

## Features

- **Speech-to-Text (STT):** Convert audio input into text using Deepgram.  
- **Text-to-Speech (TTS):** Generate audio responses from text using Deepgram.  
- **Chat Interface:** Engage in text-based conversations with the chatbot.  
- **Markdown Parsing:** Clean and format Markdown content for readability.  
- **API Integration:** Use Google Gemini API for generating conversational responses.  

---

## Tech Stack

- **Backend:** FastAPI  
- **ASR & TTS:** Deepgram API  
- **NLP:** Google Gemini API  
- **Audio Processing:** PyAudio  
- **Environment Management:** python-dotenv  

---

## Setup Instructions

### Prerequisites

- Python 3.8+  
- Node.js (for frontend)  
- Git  

---

### Clone the Repository

```bash
git clone https://github.com/Balahariharan003/Kerala-chatbot.git
cd kerala-chatbot-ui

To Run Frontend
cd kerala-chatbot-ui
npm install
npm run dev



### Backend Setup
Add your key in .env file
GEMINI_API_KEY=your_gemini_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

To run Backend
cd Backend
pip install -r requirements.txt
python agri_chatbot.py 

