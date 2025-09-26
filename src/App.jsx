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
      // Remove existing partials
      const filtered = prev.filter((msg) => !msg.isPartial);
      // Add updated partial
      return [...filtered, { sender: "user", text, isPartial: true }];
    });
  };

  // -------------------------
  // Final audio transcript
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
        // Remove partial messages
        const filtered = prev.filter((msg) => !msg.isPartial);
        return [...filtered, { sender: "user", text: finalText }];
      });

      sendToBot(finalText, true); // ✅ mark as voice input
    } catch (err) {
      console.error("STT Error:", err);
    }
  };

  // -------------------------
  // Text input
  // -------------------------
  const handleSend = (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    sendToBot(text, false); // mark as text input (no TTS)
  };

  // -------------------------
  // Send to backend
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
          {/* MicButton with live partial */}
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

export default ChatApp;
