import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Google brand colors
const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

const MatchmakingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Initialize socket and join queue
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to matchmaking server");
      setIsConnected(true);

      // Join the queue
      socket.emit("joinQueue", {
        userId: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "Player",
        photoURL: user.photoURL || "",
      });
    });

    socket.on("matchFound", (data) => {
      console.log("🔥 Match found!", data);

      // Store match data in sessionStorage
      sessionStorage.setItem("battleRoomId", data.roomId);
      sessionStorage.setItem("battleOpponent", JSON.stringify(data.opponent));
      sessionStorage.setItem("battleQuestion", JSON.stringify(data.question));
      sessionStorage.setItem("battleIsPlayer1", JSON.stringify(data.isPlayer1));

      // Navigate to battle
      navigate("/battle");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Elapsed time counter
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      socket.close();
    };
  }, [navigate, user]);

  // Handle cancel
  const handleCancel = () => {
    if (socketRef.current) {
      socketRef.current.emit("leaveQueue");
    }
    navigate("/arena");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveQueue");
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFBFD] font-['Product Sans',sans-serif] relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating colorful circles */}
        <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-blue-400/10 animate-bounce" style={{ animationDuration: '3s' }}></div>
