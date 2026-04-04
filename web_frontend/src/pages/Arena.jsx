import { useState } from "react";
import Navbar from "../components/NavBar";

const Arena = () => {
  const [activeTab, setActiveTab] = useState("description");
  const [consoleTab, setConsoleTab] = useState("testcase");

  // Mock data based on your screenshot
  const problem = {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      { input: "nums = [3,3], target = 6", output: "[0,1]" }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ]
  };

  return (
    // We use a dark background (#0a0a0a) specifically for the Arena page
    <main className="h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-[#0a0a0a] text-gray-300 overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      {/* Keeping your exact NavBar, but we wrap it in a dark header context if needed */}
      <div className="relative z-30 w-full bg-white/5 border-b border-white/10">
        <Navbar />
      </div>

      {/* 2. ARENA WORKSPACE (Split Screen) */}
      <div className="flex-grow flex w-full p-2 gap-2 overflow-hidden h-[calc(100vh-80px)]">
        
        {/* ========================================= */}
        {/* LEFT PANE: PROBLEM DESCRIPTION            */}
        {/* ========================================= */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-[#252526] px-2 pt-2 border-b border-gray-800">
            <button className="px-4 py-2 text-sm font-semibold text-white border-b-2 border-blue-500 bg-[#1e1e1e] rounded-t-lg flex items-center gap-2">
              📝 Description
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 flex items-center gap-2">
              🧪 Solutions
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-300 flex items-center gap-2">
              🕒 Submissions
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            <h1 className="text-2xl font-bold text-white mb-4">{problem.id}. {problem.title}</h1>
            
            <div className="flex gap-3 mb-6">
              <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-bold">Easy</span>
              <span className="text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">🏷️ Array</span>
              <span className="text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">🏷️ Hash Table</span>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {problem.description}
            </div>

            <div className="mt-8">
              {problem.examples.map((ex, idx) => (
                <div key={idx} className="mb-6">
                  <p className="font-bold text-white mb-2">Example {idx + 1}:</p>
                  <div className="bg-[#2d2d2d] border border-gray-700 rounded-lg p-4 font-mono text-sm">
                    <p><span className="text-gray-400">Input:</span> {ex.input}</p>
                    <p><span className="text-gray-400">Output:</span> {ex.output}</p>
                    {ex.explanation && <p><span className="text-gray-400">Explanation:</span> {ex.explanation}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 mb-8">
              <p className="font-bold text-white mb-2">Constraints:</p>
              <ul className="list-disc list-inside text-sm font-mono text-gray-400 bg-[#2d2d2d] border border-gray-700 rounded-lg p-4 space-y-1">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT PANE: EDITOR & CONSOLE              */}
        {/* ========================================= */}
        <div className="w-1/2 flex flex-col gap-2">
          
          {/* TOP RIGHT: CODE EDITOR */}
          <div className="flex-grow flex flex-col bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between bg-[#252526] px-4 py-2 border-b border-gray-800">
              <select className="bg-[#333333] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded outline-none border border-gray-700 focus:border-gray-500 cursor-pointer">
                <option>C++</option>
                <option>Java</option>
                <option>Python</option>
                <option>JavaScript</option>
              </select>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-white transition-colors" title="Settings">⚙️</button>
                <button className="text-gray-400 hover:text-white transition-colors" title="Fullscreen">⛶</button>
              </div>
            </div>

            {/* Simulated Code Editor Area */}
            <div className="flex-grow p-4 font-mono text-sm overflow-y-auto bg-[#1e1e1e]">
              <div className="flex">
                {/* Line Numbers */}
                <div className="text-gray-600 text-right pr-4 select-none flex flex-col">
                  <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                </div>
                {/* Code Content (Hardcoded to match image for now) */}
                <div className="text-gray-300 flex flex-col">
                  <span><span className="text-blue-400">class</span> <span className="text-green-400">Solution</span> {"{"}</span>
                  <span><span className="text-blue-400 ml-4">public:</span></span>
                  <span><span className="ml-8 text-green-400">vector</span>{"<"}<span className="text-blue-400">int</span>{"> "} <span className="text-yellow-200">twoSum</span>{"("}<span className="text-green-400">vector</span>{"<"}<span className="text-blue-400">int</span>{">& nums, "} <span className="text-blue-400">int</span>{" target) {"}</span>
                  <span className="ml-12 text-gray-500 italic"> // Your code here</span>
                  <span><span className="ml-8">{"}"}</span></span>
                  <span>{"};"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: TEST CONSOLE */}
          <div className="h-[30%] min-h-[200px] flex flex-col bg-[#1e1e1e] rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
            
            {/* Console Tabs */}
            <div className="flex bg-[#252526] px-2 pt-2 border-b border-gray-800">
              <button 
                onClick={() => setConsoleTab("testcase")}
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-t-lg ${consoleTab === "testcase" ? "text-white bg-[#1e1e1e]" : "text-gray-500 hover:text-gray-300"}`}
              >
                ✅ Testcase
              </button>
              <button 
                onClick={() => setConsoleTab("result")}
                className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-t-lg ${consoleTab === "result" ? "text-white bg-[#1e1e1e]" : "text-gray-500 hover:text-gray-300"}`}
              >
                ▶️ Test Result
              </button>
            </div>

            {/* Console Content */}
            <div className="flex-grow p-4 overflow-y-auto">
              {consoleTab === "testcase" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">nums =</p>
                    <div className="bg-[#2d2d2d] border border-gray-700 rounded p-2 font-mono text-sm text-gray-300">
                      [2,7,11,15]
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">target =</p>
                    <div className="bg-[#2d2d2d] border border-gray-700 rounded p-2 font-mono text-sm text-gray-300">
                      9
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic mt-4 text-center">
                  Run your code to see results here.
                </div>
              )}
            </div>

            {/* Action Buttons (Run / Submit) */}
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg">
                Run
              </button>
              <button className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-green-900/50">
                Submit
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Arena;