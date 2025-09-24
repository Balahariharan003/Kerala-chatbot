import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import ChatWindow from "./components/ChatWindow";
import MicButton from "./components/MicButton";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
};

// Auth Hook
const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return { user };
};

const initialMessages = [
  {
    sender: "bot",
    text: "👋 Hello! I’m your assistant. Ask me anything!",
  },
];

function ChatApp() {
  const [messages, setMessages] = useState(initialMessages);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text }]);

    // Dummy bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🤖 I received: " + text },
      ]);
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setShowProfileModal(false);
    navigate("/login");
  };

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
  };

  return (
    <div className="main-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <div
          className="profile"
          onClick={toggleProfileModal}
          style={{ cursor: "pointer" }}
        >
          {user?.firstName?.[0] || "U"}
        </div>
      </div>

      {/* Chat Body */}
      <div className="chat-body">
        <ChatWindow messages={messages} />
      </div>

      {/* Input Bar */}
      <div className="input-area">
        <div className="input-wrapper">
          <MicButton />
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

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={toggleProfileModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div className="profile-avatar-large">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="profile-info">
                <h3>
                  {user?.firstName} {user?.lastName}
                </h3>
                <p>{user?.emailOrPhone}</p>
              </div>
            </div>

            <div className="profile-modal-body">
              <div className="profile-option logout-option" onClick={handleLogout}>
                <span>Logout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatApp />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
