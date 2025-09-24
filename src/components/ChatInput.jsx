import React, { useState } from "react";
import MicButton from "./MicButton";

export default function ChatInput({ onSend }) {
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
        {/* Mic button on LEFT */}
        <MicButton />

        {/* Input in the middle */}
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* Send arrow button on RIGHT */}
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
