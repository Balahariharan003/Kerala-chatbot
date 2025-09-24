import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages }) {
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} sender={msg.sender} text={msg.text} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
