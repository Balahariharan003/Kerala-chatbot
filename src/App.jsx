import React, { useState, useRef } from "react";
import ChatWindow from "./components/ChatWindow";
import MicButton from "./components/MicButton";
import "./App.css";

const initialMessages = [
  { sender: "bot", text: "👋 Hello! I’m your assistant. Ask me anything!" },
];

function ChatApp() {
  const [messages, setMessages] = useState(initialMessages);
  const inputRef = useRef(null);

  // -------------------------
  // Live partial transcript
  // -------------------------
  const handlePartial = (text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last.sender === "user" && last.isPartial) {
        const updated = [...prev];
        updated[updated.length - 1].text = text;
        return updated;
      } else {
        return [...prev, { sender: "user", text, isPartial: true }];
      }
    });
  };

  // -------------------------
  // Handle final audio transcript
  // -------------------------
  const handleAudio = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "voice.wav");

    try {
      const res = await fetch("http://localhost:8000/stt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const finalText = data.reply;

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.sender === "user" && last.isPartial) {
          updated[updated.length - 1] = { sender: "user", text: finalText };
        } else {
          updated.push({ sender: "user", text: finalText });
        }
        return updated;
      });

      sendToBot(finalText, true); // ✅ mark as voice input
    } catch (err) {
      console.error("STT Error:", err);
    }
  };

  // -------------------------
  // Handle text input send
  // -------------------------
  const handleSend = (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    sendToBot(text, false); // ✅ mark as text input (no TTS)
  };

  // -------------------------
  // Send text to backend
  // -------------------------
  const sendToBot = async (text, isVoiceInput) => {
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const botText = data.reply;

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);

      // ✅ Only play TTS if the message came from voice input
      if (isVoiceInput) {
        const audioRes = await fetch("http://localhost:8000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: botText }),
        });
        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (err) {
      console.error("Chat/TTS Error:", err);
    }
  };

  return (
    <div className="main-container">
      <div className="chat-body">
        <ChatWindow messages={messages} />
      </div>
      <div className="input-area">
        <div className="input-wrapper">
          {/* MicButton with waves and live partial */}
          <MicButton onAudio={handleAudio} onPartial={handlePartial} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e.target.value);
                e.target.value = "";
              }
            }}
          />
          <button
            className="send-btn"
            onClick={() => {
              if (inputRef.current?.value) {
                handleSend(inputRef.current.value);
                inputRef.current.value = "";
              }
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return <ChatApp />;
}

export default App;
