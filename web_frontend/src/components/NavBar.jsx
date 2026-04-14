import { useState, useEffect, useContext, useRef } from "react";
import FriendRequestToast from "./FriendRequestToast";
import { Link } from "react-router-dom";
import { navLinks } from "../constants";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/auth";
import { HiOutlineUserAdd } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  // Chatbot States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Add Friend State
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  // Refs
  const chatScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [selectionTooltip, setSelectionTooltip] = useState({ show: false, x: 0, y: 0, text: "" });

  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Got questions? I'm here to clarify... ask about specific sections or concepts!" }
  ]);

  const { user } = useContext(AuthContext);

  // Global Text Selection Listener
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionTooltip({
            show: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 45,
            text: text,
          });
        } else {
          setSelectionTooltip({ show: false, x: 0, y: 0, text: "" });
        }
      }, 10);
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('.selection-tooltip')) {
        setSelectionTooltip((prev) => ({ ...prev, show: false }));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const handleAskXSyndicate = () => {
    setChatInput(`Can you explain this: "${selectionTooltip.text}"`);
    setIsChatOpen(true);
    setSelectionTooltip({ show: false, x: 0, y: 0, text: "" });
    window.getSelection().removeAllRanges();
  };

  useEffect(() => {
    const fetchUserFromBackend = async () => {
      if (!user) {
        setDbUser(null);
        return;
      }
      if (dbUser && dbUser.uid === user.uid) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:5000/api/auth", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDbUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUserFromBackend();
  }, [user, dbUser]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!dbUser?.uid) return;

      try {
        const res = await fetch(`http://localhost:5000/api/friends/list/${dbUser.uid}`);
        const data = await res.json();
        if (res.ok) {
          setFriends(data);
        }
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };

    fetchFriends();
  }, [dbUser]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!dbUser?.uid) return;

      try {
        const res = await fetch(`http://localhost:5000/api/friends/requests/${dbUser.uid}`);
        const data = await res.json();
        if (res.ok) {
          setIncomingRequests(data);
        }
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      }
    };

    fetchRequests();
  }, [dbUser]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  const handleLogout = async () => {
    await logout();
    setDbUser(null);
    setIsProfileModalOpen(false);
    setIsOpen(false);
  };

  // Real Backend Logic
  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const res = await fetch("http://localhost:5000/api/voice/ask", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Voice request failed");
    }

    return data;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();

    const newUserMsg = {
      id: Date.now(),
      sender: "user",
      text: userMessage,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setChatInput("");
    setIsAiTyping(true);

    try {
      const res = await fetch("http://localhost:5000/api/voice/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Text chat failed");
      }

      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: data.reply,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("Text chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Sorry, something went wrong while getting the response.",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsRecording(false);
          setIsAiTyping(true);

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          const data = await sendAudioToBackend(audioBlob);

          const userMsg = {
            id: Date.now(),
            sender: "user",
            text: data.transcript,
          };

          const aiMsg = {
            id: Date.now() + 1,
            sender: "ai",
            text: data.reply,
          };

          setMessages((prev) => [...prev, userMsg, aiMsg]);
        } catch (err) {
          console.error("Voice chat error:", err);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "ai",
              text: "Sorry, I could not process your voice message.",
            },
          ]);
        } finally {
          setIsAiTyping(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Microphone access failed.");
      setIsRecording(false);
    }
  };

  const handleSearchFriend = async (e) => {
    e.preventDefault();
    if (!friendSearchQuery.trim() || !dbUser?.uid) return;

    setIsSearchingFriend(true);
    setFriendSearchResult(null);

    try {
      const res = await fetch(
        `http://localhost:5000/api/friends/search?q=${encodeURIComponent(friendSearchQuery)}&currentUid=${dbUser.uid}`
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        setFriendSearchResult({
          id: first._id,
          uid: first.uid,
          name: first.name,
          rank: "Diamond Tier",
          league: "Champion's League",
          photoURL: first.picture,
        });
      } else {
        setFriendSearchResult("not_found");
      }
    } catch (err) {
      console.error("Friend search failed:", err);
      setFriendSearchResult("not_found");
    } finally {
      setIsSearchingFriend(false);
    }
  };

  const handleSendRequest = async () => {
    if (!dbUser?.uid || !friendSearchResult?.uid) return;

    try {
      const res = await fetch("http://localhost:5000/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUid: dbUser.uid,
          receiverUid: friendSearchResult.uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send friend request");
      }

      alert(`Friend request sent to ${friendSearchResult.name}!`);
      setIsAddFriendOpen(false);
      setFriendSearchQuery("");
      setFriendSearchResult(null);
    } catch (err) {
      console.error("Send request failed:", err);
      alert(err.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await fetch("http://localhost:5000/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept request");
      }

      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));

      const friendsRes = await fetch(`http://localhost:5000/api/friends/list/${dbUser.uid}`);
      const friendsData = await friendsRes.json();
      if (friendsRes.ok) {
        setFriends(friendsData);
      }
    } catch (err) {
      console.error("Accept request failed:", err);
      alert(err.message);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const res = await fetch("http://localhost:5000/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to decline request");
      }

      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error("Decline request failed:", err);
      alert(err.message);
    }
  };

  const handleAcceptMatchInvite = async (matchId) => {
    try {
      const res = await fetch("http://localhost:5000/api/match/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          uid: dbUser.uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }

      navigate(`/battle/${data.roomId}`);
    } catch (err) {
      console.error("Match accept failed:", err);
      alert(err.message);
    }
  };

  const displayUser = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
        photoURL: dbUser.picture,
        rank: "Diamond Tier",
        league: "Champion's League",
        currentRank: "#1,024",
        xpEarned: "24,500",
        docsRead: 142,
        battlesWon: 87,
        battlesLost: 12,
      }
    : user
    ? {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        rank: "—",
        league: "—",
        currentRank: "—",
        xpEarned: "—",
        docsRead: 0,
        battlesWon: 0,
        battlesLost: 0,
      }
    : null;

  console.log("user:", user);
  console.log("dbUser:", dbUser);
  console.log("friendSearchQuery:", friendSearchQuery);

  return (
    <>
      {/* FLOATING TEXT SELECTION TOOLTIP */}
      {selectionTooltip.show && (
        <div
          className="selection-tooltip fixed z-[9999] -translate-x-1/2 animate-slide-up drop-shadow-xl"
          style={{ left: selectionTooltip.x, top: selectionTooltip.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={handleAskXSyndicate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-[0_10px_25px_rgba(168,85,247,0.5)] transition-transform hover:scale-105 pointer-events-auto cursor-pointer border border-purple-400"
          >
            <img src="/images/bot-avatar.png" alt="bot" className="size-5 rounded-full bg-black object-cover border border-purple-300" />
            <span className="tracking-wide">Ask XSyndicate</span>
            <div className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-600"></div>
          </button>
        </div>
      )}

      {/* NAVBAR */}
      <header className={`navbar ${scrolled ? "scrolled" : "not-scrolled"}`}>
        <div className="inner w-full flex items-center justify-between px-4 md:px-8">
          <Link to="/" className="logo flex items-center gap-3 transition-all hover:scale-105 shrink-0 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-purple-200 group-hover:border-pink-400 flex items-center justify-center bg-white shadow-md transition-colors duration-300">
              <img src="/images/web_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="hidden lg:inline font-black text-2xl md:text-3xl uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-500 to-indigo-600 drop-shadow-md">
              Coder_Syndicate
            </span>
          </Link>

          <nav className="hidden md:flex items-center">
            <ul className="flex space-x-8">
              {navLinks.map(({ link, name }) => (
                <li key={name} className="group relative">
                  <Link
                    to={name === "Home" ? "/" : link}
                    className="text-black font-bold hover:text-purple-600 transition-colors pb-1 tracking-wide"
                  >
                    {name}
                  </Link>
                  <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-purple-600 transition-all duration-300 ease-out group-hover:w-full"></span>
                </li>
              ))}
            </ul>
          </nav>

          <div className="right-actions flex items-center gap-2 md:gap-4">
            {user && (
              <button
                onClick={() => setIsAddFriendOpen(true)}
                className="size-9 md:size-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-110 shrink-0"
                title="Add Friend"
              >
                <HiOutlineUserAdd className="size-5" />
              </button>
            )}

            <button
              className={`relative size-9 md:size-11 flex items-center justify-center rounded-full overflow-hidden transition-all shadow-md hover:scale-110 shrink-0 ${isChatOpen ? 'ring-2 ring-purple-500 border-2 border-white' : 'border border-gray-200'}`}
              onClick={() => setIsChatOpen(!isChatOpen)}
              title="XSyndicate Assistant"
            >
              <img src="/images/bot-avatar.png" alt="XSyndicate" className="w-full h-full object-cover bg-black" />
            </button>

            {displayUser ? (
              <button
                className="size-9 md:size-10 rounded-full overflow-hidden border-2 border-white cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300 shrink-0 bg-purple-600 flex items-center justify-center"
                onClick={() => setIsProfileModalOpen(true)}
                title="View Profile"
              >
                {displayUser.photoURL ? (
                  <img src={displayUser.photoURL} alt={displayUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm md:text-lg">
                    {displayUser.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <Link to="/login" className="hidden md:flex login-text group relative font-bold">
                Login
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}

            <button
              className="md:hidden text-2xl ml-1 w-8 h-8 flex items-center justify-center text-gray-800 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {isOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white/95 backdrop-blur-2xl border-b border-purple-100 shadow-2xl md:hidden flex flex-col py-6 px-6 gap-2 z-[200] animate-slide-up">
            {navLinks.map(({ link, name }) => (
              <Link
                key={name}
                to={name === "Home" ? "/" : link}
                onClick={() => setIsOpen(false)}
                className="w-full text-left text-lg font-black text-gray-800 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                {name}
              </Link>
            ))}
            {!displayUser && (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 bg-purple-600 text-white text-center font-black py-3 rounded-xl shadow-lg shadow-purple-500/30"
              >
                LOGIN
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ADD FRIEND MODAL */}
      {isAddFriendOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md relative overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add a Friend</h2>
              <button
                onClick={() => {
                  setIsAddFriendOpen(false);
                  setFriendSearchResult(null);
                  setFriendSearchQuery("");
                }}
                className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSearchFriend} className="relative flex items-center w-full mb-6">
              <input
                type="text"
                placeholder="Enter Username or ID..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-4 pr-14 outline-none focus:bg-white focus:ring-2 focus:ring-purple-400 transition-all text-sm font-semibold shadow-inner placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!friendSearchQuery.trim() || isSearchingFriend}
                className={`absolute right-2 size-9 flex items-center justify-center rounded-lg transition-all ${
                  friendSearchQuery.trim()
                    ? "bg-purple-600 text-white shadow-md hover:scale-105"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSearchingFriend ? "..." : "🔍"}
              </button>
            </form>

            <div className="min-h-[150px] flex flex-col justify-center items-center rounded-2xl bg-gray-50 border border-gray-100 p-6 text-center">
              {!friendSearchResult && !isSearchingFriend && (
                <div className="text-gray-400">
                  <span className="text-4xl block mb-2">👋</span>
                  <p className="text-sm font-medium">Search for friends to team up or battle!</p>
                </div>
              )}
              {isSearchingFriend && (
                <div className="flex flex-col items-center">
                  <div className="size-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-bold text-gray-500">Searching Network...</p>
                </div>
              )}
              {friendSearchResult === "not_found" && !isSearchingFriend && (
                <div className="text-red-400">
                  <span className="text-4xl block mb-2">🤔</span>
                  <p className="text-sm font-bold text-gray-700">User not found.</p>
                </div>
              )}
              {friendSearchResult && friendSearchResult !== "not_found" && !isSearchingFriend && (
                <div className="w-full flex flex-col items-center animate-fade-in">
                  <div className="size-20 rounded-full bg-white border-4 border-purple-100 shadow-md overflow-hidden mb-3">
                    <img src={friendSearchResult.photoURL} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{friendSearchResult.name}</h3>
                  <div className="flex gap-2 mt-1 mb-5 text-xs font-bold uppercase tracking-wider">
                    <span className="text-purple-600">{friendSearchResult.rank}</span>
                    <span className="text-pink-500">{friendSearchResult.league}</span>
                  </div>
                  <button
                    onClick={handleSendRequest}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black tracking-widest uppercase transition-transform active:scale-95 shadow-lg shadow-purple-500/30"
                  >
                    Send Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* XSYNDICATE FLOATING CHAT WINDOW */}
      {isChatOpen && (
        <div
          dir="rtl"
          className="fixed top-20 right-4 md:right-6 w-[90vw] md:w-[400px] h-[75vh] md:h-[600px] min-w-[300px] max-w-[400px] min-h-[400px] max-h-[85vh] rounded-[2rem] z-[300] resize overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fade-in border border-white/40"
        >
          <div dir="ltr" className="relative w-full h-full flex flex-col bg-white/40 backdrop-blur-2xl">
            <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/images/circuit-bg.png')" }}></div>

            <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-10 md:size-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 overflow-hidden bg-black">
                    <img src="/images/bot-avatar.png" alt="XSyndicate" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base md:text-lg leading-tight tracking-wide">XSyndicate</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-purple-700 uppercase tracking-widest opacity-80">Digital Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="size-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/60 text-gray-700 transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>

            <div ref={chatScrollRef} className="relative z-10 flex-grow overflow-y-auto p-4 md:p-5 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full animate-slide-up ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 text-sm font-semibold leading-relaxed shadow-md backdrop-blur-md ${
                      msg.sender === "user"
                        ? "bg-indigo-600/90 text-white rounded-[1.5rem] rounded-br-sm border border-indigo-400/50"
                        : "bg-white/70 text-gray-900 rounded-[1.5rem] rounded-bl-sm border border-white/60"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex w-full justify-start animate-slide-up">
                  <div className="px-4 py-3 bg-white/70 backdrop-blur-md border border-white/60 rounded-[1.5rem] rounded-bl-sm shadow-md flex gap-1.5 items-center">
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce"></div>
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 p-3 md:p-4 border-t border-white/40 bg-white/30 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  className={`absolute left-2 size-10 flex items-center justify-center rounded-full transition-all ${
                    isRecording
                      ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"
                      : "bg-white/50 hover:bg-white text-gray-700 shadow-sm"
                  }`}
                >
                  🎙️
                </button>
                <input
                  type="text"
                  placeholder="Ask XSyndicate..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-full py-3 pl-14 pr-14 outline-none focus:bg-white/90 focus:ring-2 focus:ring-indigo-400 transition-all text-sm font-bold shadow-inner placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`absolute right-2 size-10 flex items-center justify-center rounded-full transition-all ${
                    chatInput.trim()
                      ? "bg-indigo-600 text-white shadow-lg hover:scale-105"
                      : "bg-black/10 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  ↑
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {isProfileModalOpen && displayUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full md:w-[85vw] max-w-[1400px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/50 flex flex-col animate-modal-pop">
            <div className="absolute top-8 right-8 flex items-center gap-6 z-10">
              <button
                className="text-xs md:text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
              <button
                className="size-10 md:size-12 flex items-center justify-center rounded-full bg-black/5 text-gray-500 hover:text-black hover:bg-black/10 hover:rotate-90 transition-all duration-300 text-xl font-bold"
                onClick={() => setIsProfileModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start w-full mt-10 md:mt-0 mb-12 gap-8">
              <div className="flex flex-col items-start shrink-0 animate-stagger-1">
                <div className="size-28 md:size-40 rounded-full bg-black shadow-2xl flex justify-center items-center overflow-hidden border-4 border-white mb-6">
                  {displayUser.photoURL ? (
                    <img src={displayUser.photoURL} alt={displayUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-6xl">{displayUser.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-3xl md:text-6xl font-black text-gray-900 tracking-tight text-center lg:text-left">
                  {displayUser.name}
                </h3>
                <p className="text-sm md:text-xl font-bold text-gray-500 mt-1 text-center lg:text-left">
                  {displayUser.email}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-2 lg:pt-16 animate-stagger-2">
                {/* Tier, Battles, XP cards - kept as in original */}
                <div className="flex items-center gap-4 bg-gray-50/80 px-4 py-4 md:px-5 md:py-5 rounded-2xl md:rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-10 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-lg md:text-xl shadow-inner shrink-0">🏆</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tier</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{displayUser.rank}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">⚔️</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Battles</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">
                      {displayUser.battlesWon}W / {displayUser.battlesLost}L
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-4 py-4 md:px-5 md:py-5 rounded-2xl md:rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-10 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-lg md:text-xl shadow-inner shrink-0">⚡</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total XP</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{displayUser.xpEarned}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* XP, Wins, Losses big cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto animate-stagger-3">
              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">⚡</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.xpEarned}</span>
                <span className="text-xs md:text-sm font-bold text-orange-400 uppercase tracking-widest mt-4">Total XP</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">⚔️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.battlesWon}</span>
                <span className="text-xs md:text-sm font-bold text-green-400 uppercase tracking-widest mt-4">Battles Won</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">🛡️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.battlesLost}</span>
                <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-widest mt-4">Battles Lost</span>
              </div>
            </div>

            {/* YOUR SYNDICATE (FRIENDS) */}
            <div className="w-full mt-6 md:mt-8 animate-stagger-4 bg-gray-50/50 border border-gray-200 rounded-[2rem] p-5 md:p-8">
              <div className="flex justify-between items-center mb-5">
                <h4 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>🤝</span> Your Syndicate
                </h4>
                <span className="text-xs md:text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {friends.length} Friends
                </span>
              </div>

              <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {friends.map((friend, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] group cursor-pointer">
                    <div className="size-14 md:size-16 rounded-full border-2 border-transparent group-hover:border-purple-400 shadow-sm overflow-hidden transition-all duration-300 group-hover:scale-110">
                      <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover bg-white" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-gray-700 truncate w-full text-center group-hover:text-purple-600 transition-colors">
                      {friend.name}
                    </span>
                  </div>
                ))}

                <div
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsAddFriendOpen(true);
                  }}
                  className="flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] cursor-pointer group"
                >
                  <div className="size-14 md:size-16 rounded-full border-2 border-dashed border-gray-300 group-hover:border-purple-400 group-hover:bg-purple-50 flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-all duration-300 hover:scale-110">
                    <HiOutlineUserAdd className="size-5 md:size-6" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-500 group-hover:text-purple-600 transition-colors">
                    Find More
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <FriendRequestToast
        request={incomingRequests[0] || null}
        onAccept={(id) => {
          if (incomingRequests[0]?.roomId) {
            handleAcceptMatchInvite(id);
          } else {
            handleAcceptRequest(id);
          }
        }}
        onDecline={handleDeclineRequest}
      />
    </>
  );
};

export default NavBar;