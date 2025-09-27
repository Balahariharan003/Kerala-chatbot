import React, { useState } from "react";
import MicButton from "./MicButton";

export default function ChatInput({ onSend, onVoiceInput, onRecordingStatus }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="input-area">
      <form className="input-wrapper" onSubmit={handleSubmit}>
        <MicButton
          onAudio={(blob) => onVoiceInput(blob)}
          onRecordingStatus={onRecordingStatus} // pass status up
        />

        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit" className="send-btn" disabled={!input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}
