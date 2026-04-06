import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from 'socket.io-client';

const Battle = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);

  // Battle state
  const [question, setQuestion] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [userSolved, setUserSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [code, setCode] = useState("# Write your solution here\n\n");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");

  // Language mapping for Piston API
  const LANGUAGE_MAP = {
    'JavaScript': 'javascript',
    'Python': 'python',
    'C++': 'c++',
    'Java': 'java',
    'C': 'c'
  };

  // Default code templates per language
  const CODE_TEMPLATES = {
    'python': '# Write your solution here\n\n',
    'javascript': '// Write your solution here\n\n',
    'c++': '#include<bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n  return 0;\n}\n',
    'java': 'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}\n',
    'c': '#include<stdio.h>\n\nint main() {\n  // Write your solution here\n  return 0;\n}\n'
  };

  // Fetch user from backend
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

  // Validate room and load data on mount
  useEffect(() => {
    // If roomId is the old fake one, redirect
    if (roomId === 'quick-match-123') {
      navigate('/arena');
      return;
    }

    // Read from sessionStorage
    const storedOpponent = sessionStorage.getItem('battleOpponent');
    const storedQuestion = sessionStorage.getItem('battleQuestion');
    const storedRoomId = sessionStorage.getItem('battleRoomId');

    if (!storedOpponent || !storedQuestion || !storedRoomId) {
      console.log('No battle data in sessionStorage, redirecting to arena');
      navigate('/arena');
      return;
    }

    // Set state from sessionStorage
    setOpponent(JSON.parse(storedOpponent));
    setQuestion(JSON.parse(storedQuestion));

    // Set initial code template
    setCode(CODE_TEMPLATES[selectedLanguage]);

    // Connect socket and join room
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('joinRoom', { roomId: storedRoomId, userId: user.uid });

    // Listen for battle over
    socket.on('battleOver', (data) => {
      console.log('Battle over:', data);
      setBattleResult(data);
    });

    // Listen for timer updates from server
    socket.on('timerUpdate', (data) => {
      const secondsRemaining = Math.ceil(data.timeRemaining / 1000);
      setTimeLeft(secondsRemaining);
    });

    // Listen for opponent disconnect
    socket.on('opponentDisconnected', (data) => {
      console.log('Opponent disconnected:', data);
      // Show notification that opponent left
      setBattleResult({
        winnerId: user.uid,
        reason: 'opponent_quit',
        quitReason: 'disconnected',
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, navigate, user, selectedLanguage]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const pistonLang = LANGUAGE_MAP[lang];
    setSelectedLanguage(pistonLang);
    setCode(CODE_TEMPLATES[pistonLang]);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Sending code execution request to:', API_URL + '/battle/run');
    try {
      const res = await fetch(API_URL + '/battle/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          stdin: customInput
        })
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (data.error) {
        setOutput('Error:\n' + data.error);
      } else if (data.stderr) {
        setOutput('Error:\n' + data.stderr);
      } else {
        setOutput(data.output || data.stdout || 'No output');
      }
    } catch (err) {
      console.error('Run code error:', err);
      setOutput('Error: Could not connect to server\n' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setIsSubmitting(true);
    setOutput('Submitting and running test cases...');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Sending submission request to:', API_URL + '/battle/submit');
    
    try {
      const storedRoomId = sessionStorage.getItem('battleRoomId');
      const res = await fetch(API_URL + '/battle/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: storedRoomId,
          userId: user.uid,
          code,
          language: selectedLanguage
        })
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.error) {
        setOutput('Submit error: ' + data.error);
      } else {
        let resultText = `Score: ${data.passedCount || data.score}/${data.totalCases || data.total}\n\n`;
        data.testResults?.forEach((t, i) => {
          resultText += `Test ${t.testCase || (i + 1)}: ${t.passed ? '✅ Passed' : '❌ Failed'}\n`;
          if (!t.passed) {
            resultText += `  Expected: ${t.expectedOutput}\n`;
            resultText += `  Got: ${t.actualOutput}\n`;
          }
        });
        setOutput(resultText);
        setSubmitted(true);
        
        // Check if all test cases passed (JDoodle returns passedCount and totalCases)
        const totalCases = data.totalCases || data.total || 0;
        const passedCount = data.passedCount || 0;
        if (passedCount === totalCases && totalCases > 0) {
          setIsSolved(true);
          setUserSolved(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setOutput('Submit error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuit = () => {
    // Emit quit event to server
    const storedRoomId = sessionStorage.getItem('battleRoomId');
    if (socketRef.current && storedRoomId) {
      socketRef.current.emit('playerQuit', {
        roomId: storedRoomId,
        userId: user.uid,
        reason: 'surrendered'
      });
    }
    // Navigate back to arena
    navigate("/arena");
  };

  const handleNextQuestion = () => {
    // Reset states for next question
    setIsSolved(false);
    setSubmitted(false);
    setOutput('');
    setCustomInput('');
    setCode(CODE_TEMPLATES[selectedLanguage]);
    
    // Navigate to arena to find a new match (or you could implement direct next question)
    navigate("/arena");
  };

  const getLanguageDisplayName = (pistonLang) => {
    return Object.entries(LANGUAGE_MAP).find(([_, v]) => v === pistonLang)?.[0] || 'Python';
  };

  return (
    <main className="h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* ========================================= */}
      {/* --- BACKGROUND VIBRANT ORBS ---           */}
      {/* ========================================= */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[500px] bg-pink-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
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
              <span className="text-xs font-bold text-pink-500 uppercase tracking-widest mt-0.5">Solved: {opponent?.solved || 0}</span>
            </div>
            <div className="size-12 md:size-14 rounded-full bg-white border-2 border-pink-200 overflow-hidden flex items-center justify-center shadow-md shrink-0">
              {opponent?.photo ? (
                <img src={opponent.photo} alt="Opponent" className="w-full h-full object-cover" />
              ) : (
                <span className="text-pink-600 font-black text-xl">{opponent?.name?.charAt(0) || "O"}</span>
              )}
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
            <span className="text-xs font-bold text-green-700 bg-green-100 px-4 py-1.5 rounded-full shadow-sm border border-green-200">{question?.difficulty || "Easy"}</span>
          </div>
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{question?.title || "Loading..."}</h1>
            <div className="prose prose-purple max-w-none text-gray-700 text-base font-medium leading-relaxed whitespace-pre-wrap">
              {question?.description || "Loading problem description..."}
            </div>
            
            {/* Example Block */}
            {question?.examples && question.examples.length > 0 && (
              <div className="mt-8">
                <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Example 1:</p>
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 font-mono text-sm shadow-inner text-gray-700">
                  <p className="mb-1"><span className="text-purple-600 font-bold">Input:</span> {question.examples[0].input}</p>
                  <p><span className="text-purple-600 font-bold">Output:</span> {question.examples[0].output}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: COMPILER, INPUT, OUTPUT */}
        <div className="w-[60%] flex flex-col gap-4">
          
          {/* COMPILER (High-Contrast Dark Editor inside Light Theme) */}
          <div className="flex-grow flex flex-col bg-[#0f0f13] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl relative">
            
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between bg-[#1a1a24] px-6 py-3 border-b border-gray-800/80">
              <select 
                value={getLanguageDisplayName(selectedLanguage)} 
                onChange={handleLanguageChange}
                className="bg-[#2a2a35] text-purple-200 text-sm font-bold px-4 py-2 rounded-xl outline-none border border-gray-700 cursor-pointer shadow-inner focus:border-purple-500 transition-colors"
              >
                {Object.keys(LANGUAGE_MAP).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button 
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-black px-6 py-2.5 rounded-xl uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? 'Running...' : '▶ Run Code'}
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitted}
                  className="bg-green-600 hover:bg-green-500 text-white text-sm font-black px-6 py-2.5 rounded-xl uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : submitted ? '✅ Submitted' : '⚡ Submit'}
                </button>
                {isSolved && (
                  <button 
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-black px-6 py-2.5 rounded-xl uppercase tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-pulse"
                  >
                    🚀 Next Question
                  </button>
                )}
              </div>
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

      {/* Battle Result Modal */}
      {battleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-10 text-center border border-white/80 shadow-2xl max-w-md">
            {battleResult.winnerId === user?.uid ? (
              <div>
                <p className="text-6xl mb-4">🏆</p>
                <h2 className="text-4xl font-black text-purple-600">Victory!</h2>
                <p className="text-gray-600 mt-2">You won the battle!</p>
              </div>
            ) : battleResult.winnerId === 'draw' ? (
              <div>
                <p className="text-6xl mb-4">🤝</p>
                <h2 className="text-4xl font-black text-blue-600">Draw!</h2>
                <p className="text-gray-600 mt-2">It's a tie!</p>
              </div>
            ) : (
              <div>
                <p className="text-6xl mb-4">💀</p>
                <h2 className="text-4xl font-black text-pink-500">Defeated</h2>
                <p className="text-gray-600 mt-2">Better luck next time!</p>
              </div>
            )}
            <p className="mt-4 font-bold text-gray-700">
              Your score: {battleResult.myScore || battleResult.loserScore} | 
              Opponent: {battleResult.opponentScore || battleResult.winnerScore}
            </p>
            <button
              onClick={() => navigate('/arena')}
              className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-xl font-black hover:bg-purple-500 transition-colors"
            >
              Back to Arena
            </button>
          </div>
        </div>
      )}

    </main>
  );
};

export default Battle;