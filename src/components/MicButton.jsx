import React, { useState } from "react";

export default function MicButton() {
  const [isRecording, setIsRecording] = useState(false);

  const handleClick = () => {
    setIsRecording(!isRecording);
    // Add your recording logic here
  };

  return (
    <button 
      type="button" 
      className={`mic-btn ${isRecording ? 'recording' : ''}`}
      onClick={handleClick}
    >
      {/* Mic icon - hidden when recording */}
      {!isRecording && (
        <svg
          width="16"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mic-icon"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
      
      {/* BIG Sound waves animation - shown when recording */}
      {isRecording && (
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