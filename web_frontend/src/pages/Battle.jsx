import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


const Battle= ()=>{

const navigate = useNavigate();
const { roomId } = useParams();
const { user } = useContext(AuthContext);
const [opponent, setOpponent] = useState({ solved: 0 });

const [dbUser, setDbUser] = useState(null);

  const [userSolved, setUserSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  const [code, setCode] = useState("function solve() {\n  // write your code here\n}");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");

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
  const fetchMatch = async () => {
    const res = await fetch(`http://localhost:5000/api/match/room/${roomId}`);
    const data = await res.json();

    if (res.ok) {
      const opp = data.players.find(p => p.uid !== user.uid);

      setOpponent({
        name: opp.name,
        photoURL: opp.picture,
        solved: 0
      });
    }
  };

  fetchMatch();
}, [roomId]);
  
  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
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

  // --- QUIT HANDLER ---
  const handleQuit = () => {
    navigate("/arena");
  };

  return (
    <main className="h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* ========================================= */}
      {/* --- BACKGROUND VIBRANT ORBS ---           */}
      {/* ========================================= */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ========================================= */}
      {/* --- VERSUS HEADER (GLASSMORPHISM) ---     */}
      {/* ========================================= */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-white/60 px-6 py-3 z-20 shadow-sm relative">
        <div className="grid grid-cols-3 items-center">
          
          {/* TOP LEFT: Quit Button & Current User */}
          <div className="flex items-center gap-6">
            <button 
              onClick={handleQuit}
              className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 border border-red-500/30 px-4 py-2 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>🚪</span> Quit
            </button>
            
            <div className="flex items-center gap-3">
              <div className="size-12 md:size-14 rounded-full bg-white border-2 border-purple-200 overflow-hidden flex items-center justify-center shadow-md shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-purple-600 font-black text-xl">{user?.displayName?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-gray-900 font-black text-lg leading-tight truncate max-w-[150px]">{user?.displayName || "You"}</span>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-0.5">Solved: {userSolved}</span>
              </div>
            </div>
          </div>

          {/* CENTER: VS & Timer */}
          <div className="flex flex-col items-center justify-center animate-fade-in">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 italic tracking-widest drop-shadow-sm">
              VS
            </span>
            <span className={`text-xl font-black font-mono mt-1 px-4 py-1 rounded-full bg-white/50 border border-white/80 shadow-inner ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* TOP RIGHT: Opponent */}
          <div className="flex items-center gap-3 justify-end">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-gray-900 font-black text-lg leading-tight truncate max-w-[150px]">{opponent?.name || "Loading..."}</span>
              <span className="text-xs font-bold text-pink-500 uppercase tracking-widest mt-0.5">Solved: {opponent.solved}</span>
            </div>
            <div className="size-12 md:size-14 rounded-full bg-white border-2 border-pink-200 overflow-hidden flex items-center justify-center shadow-md shrink-0">
              <img src={opponent?.photoURL || ""} alt="Opponent" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* --- BATTLE WORKSPACE (Split Screen) ---   */}
      {/* ========================================= */}
      <div className="flex-grow flex w-full p-4 gap-4 overflow-hidden h-[calc(100vh-80px)] relative z-10">
        
        {/* LEFT PANE: PROBLEM DESCRIPTION (Light Glass) */}
        <div className="w-[40%] flex flex-col bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/80 overflow-hidden shadow-xl shadow-purple-900/5">
          <div className="bg-white/50 px-6 py-4 border-b border-purple-100/50 flex justify-between items-center">
            <span className="text-sm font-black text-gray-800 tracking-wider uppercase">📝 Problem Statement</span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-4 py-1.5 rounded-full shadow-sm border border-green-200">Easy</span>
          </div>
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">1. Two Sum</h1>
            <div className="prose prose-purple max-w-none text-gray-700 text-base font-medium leading-relaxed whitespace-pre-wrap">
              Given an array of integers <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shadow-sm">nums</code> and an integer <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shadow-sm">target</code>, return indices of the two numbers such that they add up to <code className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shadow-sm">target</code>.
              <br/><br/>
              You may assume that each input would have exactly one solution, and you may not use the same element twice.
            </div>
            
            {/* Example Block */}
            <div className="mt-8">
              <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Example 1:</p>
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 font-mono text-sm shadow-inner text-gray-700">
                <p className="mb-1"><span className="text-purple-600 font-bold">Input:</span> nums = [2,7,11,15], target = 9</p>
                <p><span className="text-purple-600 font-bold">Output:</span> [0,1]</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: COMPILER, INPUT, OUTPUT */}
        <div className="w-[60%] flex flex-col gap-4">
          
          {/* COMPILER (High-Contrast Dark Editor inside Light Theme) */}
          <div className="flex-grow flex flex-col bg-[#0f0f13] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl relative">
            
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between bg-[#1a1a24] px-6 py-3 border-b border-gray-800/80">
              <select className="bg-[#2a2a35] text-purple-200 text-sm font-bold px-4 py-2 rounded-xl outline-none border border-gray-700 cursor-pointer shadow-inner focus:border-purple-500 transition-colors">
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
              </select>
              <button 
                onClick={handleRunCode}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-black px-8 py-2.5 rounded-xl uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)]"
              >
                ▶ Run Code
              </button>
            </div>
            
            {/* Code Textarea */}
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="flex-grow w-full bg-[#0f0f13] text-purple-100 p-6 font-mono text-[15px] leading-relaxed outline-none resize-none custom-scrollbar"
            />
          </div>

          {/* INPUT BAR (Light Glass) */}
          <div className="h-[15%] min-h-[100px] flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 overflow-hidden shadow-lg">
            <div className="bg-white/50 px-6 py-2.5 border-b border-purple-100/50 text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
              <span>📥</span> Custom Input
            </div>
            <textarea 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom test cases here..."
              className="flex-grow w-full bg-transparent text-gray-800 p-4 font-mono text-sm outline-none resize-none custom-scrollbar placeholder-gray-400"
            />
          </div>

          {/* OUTPUT BAR (Light Glass) */}
          <div className="h-[20%] min-h-[120px] flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 overflow-hidden shadow-lg">
            <div className="bg-white/50 px-6 py-2.5 border-b border-purple-100/50 text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
              <span>📤</span> Output
            </div>
            <div className="flex-grow w-full bg-transparent text-gray-800 p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap custom-scrollbar">
              {output || <span className="text-gray-400 italic font-sans font-medium">Run your code to see the output here...</span>}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Battle;