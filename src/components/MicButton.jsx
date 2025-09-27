import React, { useState, useRef } from "react";

export default function MicButton({ onAudio, onPartial, onRecordingStatus }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleClick = async () => {
    if (!isRecording) {
      setIsRecording(true);
      if (onRecordingStatus) onRecordingStatus(true); // notify parent
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      const interval = setInterval(async () => {
        if (audioChunksRef.current.length && onPartial) {
          const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const partialText = await fetchPartialSTT(blob);
          if (partialText) onPartial(partialText);
        }
      }, 500);

      mediaRecorder.onstop = async () => {
        clearInterval(interval);
        if (onRecordingStatus) onRecordingStatus(false); // notify parent
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        if (onAudio) onAudio(blob);
      };

      mediaRecorder.start();
    } else {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  };

  const fetchPartialSTT = async (blob) => {
    if (!blob.size) return "";
    const formData = new FormData();
    formData.append("file", blob, "voice.wav");
    try {
      const res = await fetch("http://localhost:8000/stt", { method: "POST", body: formData });
      const data = await res.json();
      return data.reply || "";
    } catch (e) {
      console.error("STT error:", e);
      return "";
    }
  };

  return (
    <button className={`mic-btn ${isRecording ? "recording" : ""}`} onClick={handleClick}>
      {!isRecording ? (
        "🎤"
      ) : (
        <div className="sound-waves">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
          <div className="wave wave-4"></div>
          <div className="wave wave-5"></div>
        </div>
      )}
    </button>
  );
}
