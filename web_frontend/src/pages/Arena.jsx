import { useState, useContext, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Navbar from "../components/NavBar";
import MatchmakingLoader from "../components/MatchmakingLoader"; 
import { AuthContext } from "../context/AuthContext";
import { io } from 'socket.io-client';

const Arena = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [friends, setFriends] = useState([]);
  const [dbUser, setDbUser] = useState(null);

  // --- NEW: INCOMING BATTLE REQUEST STATE ---
  const [incomingBattleRequest, setIncomingBattleRequest] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchUserFromBackend = async () => {
      if (!user) {
        setDbUser(null);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:5000/api/auth", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setDbUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch backend user:", err);
      }
    };

    fetchUserFromBackend();
  }, [user]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!dbUser?.uid) {
        console.log('No dbUser uid available for fetching friends');
        return;
      }

      try {
        console.log('Fetching friends for user:', dbUser.uid);
        const res = await fetch(`http://localhost:5000/api/friends/list/${dbUser.uid}`);
        const data = await res.json();

        console.log('Friends API response:', res.status, data);

        if (res.ok && Array.isArray(data)) {
          const formattedFriends = data.map((friend) => ({
            ...friend,
            status: "Online",
          }));
          setFriends(formattedFriends);
          console.log('Friends loaded:', formattedFriends.length);
        } else {
          console.warn('Friends API returned non-ok status or non-array data:', data);
          setFriends([]);
        }
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setFriends([]);
      }
    };

    fetchFriends();
  }, [dbUser]);

  // Real socket matchmaking
  useEffect(() => {
    if (isSearching && user) {
      // Connect to socket server
      const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      // Join matchmaking queue
      socket.emit('joinQueue', {
        userId: user.uid,
        username: user.displayName || user.email || 'Player',
        photoURL: user.photoURL || ''
      });

      // When match is found
      socket.on('matchFound', (data) => {
        setIsSearching(false);
        socket.disconnect();
        socketRef.current = null;

        // Save match data to sessionStorage
        sessionStorage.setItem('battleRoomId', data.roomId);
        sessionStorage.setItem('battleOpponent', JSON.stringify({
          name: data.opponent.username,
          photo: data.opponent.photoURL,
          userId: data.opponent.userId
        }));
        sessionStorage.setItem('battleQuestion', JSON.stringify(data.question));

        // Navigate to battle
        navigate(`/battle/${data.roomId}`);
      });

      // Handle errors
      socket.on('error', (data) => {
        console.error('Socket error:', data.message);
        setIsSearching(false);
        socket.disconnect();
        socketRef.current = null;
      });

      // Handle connection error
      socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
        setIsSearching(false);
        socket.disconnect();
        socketRef.current = null;
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isSearching, user, navigate]);

  // =========================================================================
  // --- SIMULATE INCOMING REQUEST (Replace this with Socket.io later!) ---
  // =========================================================================
  useEffect(() => {
    // This will pop up a fake request 8 seconds after the page loads for testing
    const mockIncomingTimer = setTimeout(() => {
      if (!isInviteModalOpen && !isSearching) {
        setIncomingBattleRequest({
          id: "req_998",
          roomId: "simulated_room_xyz",
          challengerName: "Prashant Sengar",
          challengerPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prashant",
          mode: "Friendly Match"
        });
      }
    }, 8000); 
    
    return () => clearTimeout(mockIncomingTimer);
  }, [isInviteModalOpen, isSearching]);
  // =========================================================================

  const handleModeClick = (modeId) => {
    if (modeId === "quick") {
      setIsSearching(true);
    } else if (modeId === "friendly") {
      setIsInviteModalOpen(true); 
    } else if (modeId === "community") {
      console.log("Navigating to Community...");
    }
  };

  const handleSendInvite = async (friend) => {
    try {
      const res = await fetch("http://localhost:5000/api/match/invite-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderUid: dbUser.uid,
          friendUid: friend.uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPendingInvite({
        ...friend,
        roomId: data.roomId,
      });

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setPendingInvite(null); 
  };

  // --- NEW: RECEIVER ACCEPT/DECLINE LOGIC ---
  const handleAcceptBattle = () => {
    const roomId = incomingBattleRequest.roomId;
    // Optional: Call your backend to notify sender you accepted
    setIncomingBattleRequest(null);
    navigate(`/battle/${roomId}`); 
  };

  const handleDeclineBattle = () => {
    // Optional: Call your backend to notify sender you declined
    setIncomingBattleRequest(null);
  };

  const gameModes = [
    {
      id: "quick",
      title: "⚔️ QUICK MATCH",
      description: "Find a 1vs1 opportunity. Matchmaking currently active.",
      btnText: "FIND MATCH",
      borderColor: "border-green-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(34,197,94,0.25)]",
      btnClass: "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/30",
    },
    {
      id: "friendly",
      title: "🤝 FRIENDLY MATCH",
      description: "Invite your friends to a private coding battle.",
      btnText: "INVITE FRIEND",
      borderColor: "border-cyan-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(34,211,238,0.25)]",
      btnClass: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md shadow-cyan-500/30",
    }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* Background CSS & Orbs */}
      <style>{`
        header.navbar {
          background-color: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
        }
        .light-grid {
          background-size: 60px 60px;
          background-image:
            linear-gradient(to right, rgba(168, 85, 247, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.15) 1px, transparent 1px);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
        }
        .purple-text-shadow {
          text-shadow: 0px 10px 30px rgba(168, 85, 247, 0.5);
        }
        @keyframes floatTitle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-title {
          animation: floatTitle 4s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 light-grid z-10"></div>
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-6 pb-20">
        <div className="flex flex-col items-center animate-fade-in mb-16 mt-4">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 uppercase tracking-tight animate-float-title purple-text-shadow">
            Enter The Arena
          </h1>
        </div>

        <div className="w-full max-w-6xl relative flex items-center justify-center mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full max-w-4xl z-10">
            {gameModes.map((mode, index) => (
              <div 
                key={mode.id}
                className={`group bg-white/70 backdrop-blur-xl border-2 ${mode.borderColor} rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[280px] transition-all duration-300 hover:-translate-y-2 ${mode.glowClass} shadow-sm`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-3">
                    {mode.title}
                  </h3>
                  <p className="text-gray-600 font-semibold text-base leading-relaxed pr-4">
                    {mode.description}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleModeClick(mode.id)}
                  className={`mt-8 w-full py-4 text-lg rounded-xl font-black tracking-widest uppercase transition-transform active:scale-95 ${mode.btnClass} cursor-pointer`}
                >
                  {mode.btnText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MATCHMAKING LOADER --- */}
      {isSearching && (
        <MatchmakingLoader 
          onCancel={() => {
            if (socketRef.current) {
              socketRef.current.emit('leaveQueue', { userId: user.uid });
              socketRef.current.disconnect();
              socketRef.current = null;
            }
            setIsSearching(false);
          }} 
          userPhoto={user?.photoURL}
          userName={user?.displayName || user?.email || "Player"}
        />
      )}

      {/* ===================================================== */}
      {/* --- INCOMING BATTLE REQUEST TOAST (Receiver Side) --- */}
      {/* ===================================================== */}
      {incomingBattleRequest && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-sm px-4 animate-slide-down">
          <div className="bg-white/95 backdrop-blur-xl border-2 border-purple-400 rounded-3xl p-5 shadow-[0_20px_50px_rgba(168,85,247,0.3)]">
            
            <div className="flex items-center gap-4 mb-4">
              {/* Pulsing Avatar */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-50"></div>
                <div className="relative size-14 rounded-full border-2 border-purple-200 overflow-hidden bg-white shadow-sm">
                  <img src={incomingBattleRequest.challengerPhoto} alt="Challenger" className="w-full h-full object-cover" />
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                  <span>⚔️</span> BATTLE CHALLENGE
                </h4>
                <p className="text-gray-900 font-black text-lg leading-tight">
                  {incomingBattleRequest.challengerName}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button 
                onClick={handleDeclineBattle}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptBattle}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                Accept
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* --- SEND INVITE MODAL (Sender Side) ---               */}
      {/* ===================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md relative overflow-hidden animate-slide-up">
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {pendingInvite ? "Waiting for Response" : "Invite to Battle"}
              </h2>
              <button 
                onClick={handleCloseInviteModal}
                className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STATE 1: SHOW FRIENDS LIST */}
            {!pendingInvite ? (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {friends.length === 0 ? (
                   <p className="text-gray-500 text-center font-medium my-8">No friends found. Add some from the navbar!</p>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.uid || friend.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="size-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={friend.picture || friend.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={friend.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`absolute bottom-0 right-0 size-3.5 border-2 border-white rounded-full ${
                            friend.status === "Online" ? "bg-green-400" : friend.status === "In a Battle" ? "bg-yellow-400" : "bg-gray-400"
                          }`}></span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-tight">{friend.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{friend.status}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleSendInvite(friend)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          friend.status === "Online" 
                            ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/30 active:scale-95 cursor-pointer" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Invite
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              
              /* STATE 2: WAITING FOR FRIEND TO ACCEPT */
              <div className="flex flex-col items-center justify-center py-8 relative z-10">
                <div className="relative flex items-center justify-center mb-6">
                  {/* Pulsing rings */}
                  <div className="absolute size-32 border-2 border-cyan-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute size-24 border-2 border-cyan-400/60 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                  
                  {/* Friend Avatar in center */}
                  <div className="relative z-10 size-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={pendingInvite.picture || pendingInvite.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt={pendingInvite.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-1 text-center">Invited {pendingInvite.name}</h3>
                <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest animate-pulse">
                  Awaiting Acceptance...
                </p>
                
                <button 
                  onClick={handleCloseInviteModal}
                  className="mt-8 text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors border border-gray-200 px-6 py-2 rounded-full hover:bg-red-50 cursor-pointer"
                >
                  Cancel Invite
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </main>
  );
};

export default Arena;