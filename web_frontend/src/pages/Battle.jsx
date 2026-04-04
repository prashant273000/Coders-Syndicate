import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Battle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Get matchId passed from Arena
  const matchId = location.state?.matchId;

  const socketRef = useRef(null);

  // Opponent state — comes from socket
  const [opponent, setOpponent] = useState(null);
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const [userSolved, setUserSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [code, setCode] = useState("function solve() {\n  // write your code here\n}");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);

  // ============================================
  // SOCKET.IO CONNECTION
  // ============================================
  useEffect(() => {
    if (!user || !matchId) return;

    // Connect to socket
    socketRef.current = io(API_URL);

    // Join the match room
    socketRef.current.emit("join_match", {
      matchId,
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    // When players join, update opponent info
    socketRef.current.on("player_joined", ({ players }) => {
      const opp = players.find(p => p.uid !== user.uid);
      if (opp) setOpponent(opp);
    });

    // Opponent solved a problem
    socketRef.current.on("opponent_solved", ({ solvedCount }) => {
      setOpponentSolved(solvedCount);
    });

    // Match ended
    socketRef.current.on("match_ended", ({ winnerId }) => {
      setMatchEnded(true);
      setWinner(winnerId);
    });

    // Opponent disconnected
    socketRef.current.on("opponent_disconnected", () => {
      setOpponentDisconnected(true);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user, matchId]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleRunCode = () => {
    setOutput("Compiling...\nRunning tests...\n\nOutput: [Placeholder for actual execution result]");
  };

  const handleSolved = () => {
    const newCount = userSolved + 1;
    setUserSolved(newCount);
    // Tell opponent
    socketRef.current?.emit("problem_solved", {
      matchId,
      uid: user.uid,
      solvedCount: newCount,
    });
  };

  const handleTimeUp = () => {
    // Whoever solved more wins
    const winnerId = userSolved > opponentSolved ? user.uid : opponent?.uid;
    socketRef.current?.emit("end_match", { matchId, winnerId });
  };

  const handleQuit = () => {
    socketRef.current?.emit("end_match", {
      matchId,
      winnerId: opponent?.uid, // quitting means opponent wins
    });
    navigate("/arena");
  };

  // Show result screen
  if (matchEnded) {
    const isWinner = winner === user.uid;
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-['Mona_Sans',sans-serif]">
        <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center border border-gray-100">
          <div className="text-8xl mb-6">{isWinner ? "🏆" : "💀"}</div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            {isWinner ? "YOU WON!" : "YOU LOST!"}
          </h1>
          <p className="text-gray-500 font-semibold mb-10">
            {isWinner ? "Excellent work! You dominated the arena." : "Better luck next time. Keep grinding!"}
          </p>
          <button
            onClick={() => navigate("/arena")}
            className="bg-black text-white px-12 py-4 rounded-xl font-black text-lg uppercase tracking-widest hover:bg-purple-600 transition-all"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">

      {/* Background orbs */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Opponent disconnected banner */}
      {opponentDisconnected && (
        <div className="absolute top-0 left-0 w-full z-50 bg-green-500 text-white text-center py-3 font-black uppercase tracking-widest">
          🎉 Opponent disconnected — You Win!
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-white/60 px-6 py-3 z-20 shadow-sm relative">
        <div className="grid grid-cols-3 items-center">

          {/* Left: Quit + User */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleQuit}
              className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 border border-red-500/30 px-4 py-2 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <span>🚪</span> Quit
            </button>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-white border-2 border-purple-200 overflow-hidden flex items-center justify-center shadow-md shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-purple-600 font-black text-xl">{user?.displayName?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-gray-900 font-black text-lg leading-tight">{user?.displayName || "You"}</span>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Solved: {userSolved}</span>
              </div>
            </div>
          </div>

          {/* Center: VS + Timer */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 italic tracking-widest drop-shadow-sm">VS</span>
            <span className={`text-xl font-black font-mono mt-1 px-4 py-1 rounded-full bg-white/50 border border-white/80 shadow-inner ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Right: Opponent */}
          <div className="flex items-center gap-3 justify-end">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-gray-900 font-black text-lg leading-tight">
                {opponent ? opponent.displayName : "Waiting..."}
              </span>
              <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Solved: {opponentSolved}</span>
            </div>
            <div className="size-12 rounded-full bg-white border-2 border-pink-200 overflow-hidden flex items-center justify-center shadow-md shrink-0">
              {opponent?.photoURL ? (
                <img src={opponent.photoURL} alt="Opponent" className="w-full h-full object-cover" />
              ) : (
                <span className="text-pink-500 font-black text-xl">{opponent?.displayName?.charAt(0) || "?"}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Battle Workspace */}
      <div className="flex-grow flex w-full p-4 gap-4 overflow-hidden h-[calc(100vh-80px)] relative z-10">

        {/* Left: Problem */}
        <div className="w-[40%] flex flex-col bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/80 overflow-hidden shadow-xl">
          <div className="bg-white/50 px-6 py-4 border-b border-purple-100/50 flex justify-between items-center">
            <span className="text-sm font-black text-gray-800 tracking-wider uppercase">📝 Problem Statement</span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-4 py-1.5 rounded-full border border-green-200">Easy</span>
          </div>
          <div className="flex-grow overflow-y-auto p-8">
            <h1 className="text-3xl font-black text-gray-900 mb-6">1. Two Sum</h1>
            <div className="text-gray-700 text-base font-medium leading-relaxed">
              Given an array of integers <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">nums</code> and an integer <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
            </div>
            <div className="mt-8">
              <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Example 1:</p>
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 font-mono text-sm text-gray-700">
                <p className="mb-1"><span className="text-purple-600 font-bold">Input:</span> nums = [2,7,11,15], target = 9</p>
                <p><span className="text-purple-600 font-bold">Output:</span> [0,1]</p>
              </div>
            </div>
            {/* Solved button for testing */}
            <button
              onClick={handleSolved}
              className="mt-8 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl uppercase tracking-widest transition-all active:scale-95"
            >
              ✅ Mark as Solved
            </button>
          </div>
        </div>

        {/* Right: Editor */}
        <div className="w-[60%] flex flex-col gap-4">
          <div className="flex-grow flex flex-col bg-[#0f0f13] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between bg-[#1a1a24] px-6 py-3 border-b border-gray-800/80">
              <select className="bg-[#2a2a35] text-purple-200 text-sm font-bold px-4 py-2 rounded-xl outline-none border border-gray-700">
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
              </select>
              <button
                onClick={handleRunCode}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-black px-8 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                ▶ Run Code
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="flex-grow w-full bg-[#0f0f13] text-purple-100 p-6 font-mono text-[15px] leading-relaxed outline-none resize-none"
            />
          </div>

          <div className="h-[15%] min-h-[100px] flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 overflow-hidden shadow-lg">
            <div className="bg-white/50 px-6 py-2.5 border-b border-purple-100/50 text-xs font-black text-purple-700 uppercase tracking-widest">
              📥 Custom Input
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom test cases here..."
              className="flex-grow w-full bg-transparent text-gray-800 p-4 font-mono text-sm outline-none resize-none placeholder-gray-400"
            />
          </div>

          <div className="h-[20%] min-h-[120px] flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 overflow-hidden shadow-lg">
            <div className="bg-white/50 px-6 py-2.5 border-b border-purple-100/50 text-xs font-black text-purple-700 uppercase tracking-widest">
              📤 Output
            </div>
            <div className="flex-grow w-full bg-transparent text-gray-800 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap">
              {output || <span className="text-gray-400 italic font-sans">Run your code to see the output here...</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Battle;