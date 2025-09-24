import React from "react";

export default function MessageBubble({ sender, text }) {
  return (
    <div className={`message-bubble ${sender}`}>
      <p>{text}</p>
    </div>
  );
}
