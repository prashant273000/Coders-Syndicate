import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Battle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const matchId = location.state?.matchId;
  const socketRef = useRef(null);

  // Opponent state
  const [opponent, setOpponent] = useState(null);
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [bothPlayersJoined, setBothPlayersJoined] = useState(false);

  // Question state
  const [question, setQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  // Battle state
  const [userSolved, setUserSolved] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Loading question...");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);

  // No matchId guard
  if (!matchId) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-['Mona_Sans',sans-serif]">
        <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center border border-gray-100">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">No Match Found</h1>
          <p className="text-gray-500 mb-8">You need to find a match first.</p>
          <button onClick={() => navigate("/arena")} className="bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest">Go to Arena</button>
        </div>
      </div>
    );
  }

  // Load random question
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`${API_URL}/api/questions/random`);
        const data = await res.json();
        setQuestion(data);
        setCode(data.functionSignature?.javascript || "// write your code here");
        setLoadingQuestion(false);
      } catch (err) {
        console.error("Failed to load question:", err);
        setLoadingQuestion(false);
      }
    };
    fetchQuestion();
  }, []);

  // Update code template when language changes
  useEffect(() => {
    if (question) {
      setCode(question.functionSignature?.[language] || "// write your code here");
    }
  }, [language, question]);

  // Socket.io
  useEffect(() => {
    if (!user || !matchId) return;

    socketRef.current = io(API_URL);

    socketRef.current.emit("join_match", {
      matchId,
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });

    socketRef.current.on("player_joined", ({ players }) => {
      const opp = players.find(p => p.uid !== user.uid);
      if (opp) setOpponent(opp);
      if (players.length >= 2) setBothPlayersJoined(true);
    });

    socketRef.current.on("opponent_solved", ({ solvedCount }) => {
      setOpponentSolved(solvedCount);
    });

    socketRef.current.on("match_ended", async ({ winnerId }) => {
      setMatchEnded(true);
      setWinner(winnerId);
      try {
        const token = await user.getIdToken();
        await fetch(`${API_URL}/api/match/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, winnerId }),
        });
      } catch (err) {
        console.error("Failed to save match result:", err);
      }
    });

    socketRef.current.on("opponent_disconnected", () => setOpponentDisconnected(true));

    return () => socketRef.current.disconnect();
  }, [user, matchId]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleTimeUp(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [userSolved, opponentSolved]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Run code with custom input
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Running...");
    setTestResults(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/judge/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input: customInput }),
      });
      const data = await res.json();
      setOutput(`Status: ${data.status}\nTime: ${data.time}s\n\n${data.output}`);
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit against test cases
  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);
    setOutput("Submitting against test cases...");
    setTestResults(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/judge/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, testCases: question.testCases }),
      });
      const data = await res.json();
      setTestResults(data.results);
      if (data.allPassed) {
        const newCount = userSolved + 1;
        setUserSolved(newCount);
        setOutput("✅ All test cases passed! Problem solved.");
        socketRef.current?.emit("problem_solved", { matchId, uid: user.uid, solvedCount: newCount });
      } else {
        const passed = data.results.filter(r => r.passed).length;
        setOutput(`❌ ${passed}/${data.results.length} test cases passed. Keep trying!`);
      }
    } catch (err) {
      setOutput("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    const winnerId = userSolved > opponentSolved ? user.uid : opponent?.uid;
    socketRef.current?.emit("end_match", { matchId, winnerId });
    user.getIdToken().then(token => {
      fetch(`${API_URL}/api/match/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, winnerId }),
      });
    });
  };

  const handleQuit = () => {
    const winnerId = opponent?.uid;
    socketRef.current?.emit("end_match", { matchId, winnerId });
    user.getIdToken().then(token => {
      fetch(`${API_URL}/api/match/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, winnerId }),
      });
    });
    navigate("/arena");
  };

  // Waiting screen
  if (!bothPlayersJoined) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-['Mona_Sans',sans-serif]">
        <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center border border-gray-100">
          <div className="text-8xl mb-6 animate-pulse">⚔️</div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">Match Found!</h1>
          <p className="text-gray-500 font-semibold text-lg mb-8">
            {opponent ? `Waiting for ${opponent.displayName} to connect...` : "Waiting for opponent..."}
          </p>
          <div className="size-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Match ended screen
  if (matchEnded) {
    const isWinner = winner === user.uid;
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-['Mona_Sans',sans-serif]">
        <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl text-center border border-gray-100">
          <div className="text-8xl mb-6">{isWinner ? "🏆" : "💀"}</div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            {isWinner ? "YOU WON!" : "YOU LOST!"}
          </h1>
          <p className="text-gray-500 font-semibold mb-6">
            {isWinner ? "Excellent work! You dominated the arena. +100 XP" : "Better luck next time. Keep grinding! +20 XP"}
          </p>
          <div className="flex gap-10 justify-center mb-10">
            <div className="text-center">
              <p className="text-4xl font-black text-purple-600">{userSolved}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">You Solved</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-pink-500">{opponentSolved}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Opponent Solved</p>
            </div>
          </div>
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
            <button onClick={handleQuit} className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 border border-red-500/30 px-4 py-2 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 cursor-pointer">
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
            {question && (
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full border ${
                question.difficulty === "Easy" ? "text-green-700 bg-green-100 border-green-200" :
                question.difficulty === "Medium" ? "text-yellow-700 bg-yellow-100 border-yellow-200" :
                "text-red-700 bg-red-100 border-red-200"
              }`}>{question.difficulty}</span>
            )}
          </div>
          <div className="flex-grow overflow-y-auto p-8">
            {loadingQuestion ? (
              <div className="flex items-center justify-center h-full">
                <div className="size-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : question ? (
              <>
                <h1 className="text-3xl font-black text-gray-900 mb-6">{question.title}</h1>
                <div className="text-gray-700 text-base font-medium leading-relaxed mb-8">
                  {question.description}
                </div>

                {question.examples?.map((ex, i) => (
                  <div key={i} className="mb-4">
                    <p className="font-bold text-gray-900 mb-2 uppercase tracking-wider text-sm">Example {i + 1}:</p>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 font-mono text-sm text-gray-700">
                      <p className="mb-1"><span className="text-purple-600 font-bold">Input:</span> {ex.input}</p>
                      <p><span className="text-purple-600 font-bold">Output:</span> {ex.output}</p>
                    </div>
                  </div>
                ))}

                {/* Test results inline */}
                {testResults && (
                  <div className="mt-6">
                    <p className="font-bold text-gray-900 mb-3 uppercase tracking-wider text-sm">Test Results:</p>
                    {testResults.map((r, i) => (
                      <div key={i} className={`mb-2 p-3 rounded-xl text-sm font-mono border ${r.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                        <p className="font-bold">{r.passed ? "✅" : "❌"} Test {i + 1} — {r.status}</p>
                        {!r.passed && (
                          <>
                            <p className="text-gray-500 text-xs mt-1">Expected: {r.expectedOutput}</p>
                            <p className="text-gray-500 text-xs">Got: {r.actualOutput || "No output"}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Failed to load question.</p>
            )}
          </div>
        </div>

        {/* Right: Editor */}
        <div className="w-[60%] flex flex-col gap-4">
          <div className="flex-grow flex flex-col bg-[#0f0f13] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between bg-[#1a1a24] px-6 py-3 border-b border-gray-800/80">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#2a2a35] text-purple-200 text-sm font-bold px-4 py-2 rounded-xl outline-none border border-gray-700 cursor-pointer"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-black px-6 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                >
                  {isRunning ? "Running..." : "▶ Run"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-black px-6 py-2.5 rounded-xl uppercase tracking-widest active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all"
                >
                  {isSubmitting ? "Checking..." : "⚡ Submit"}
                </button>
              </div>
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