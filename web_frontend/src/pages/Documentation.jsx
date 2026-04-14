import { useState } from "react";
import Navbar from "../components/NavBar";
import ReactMarkdown from "react-markdown";
import axios from "axios";
const Documentation = () => {
  const [topic, setTopic] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [curriculum, setCurriculum] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleRun = async() => {
    if (!topic.trim()) return;

    setHasSearched(true);
    setIsLoading(true);

   try {
    const res = await axios.post("http://localhost:5000/api/roadmap", {
      topic: topic,
    });

    const data = res.data;
    setCurriculum(data);
    setSelectedNode(data[0]);
    }
    catch(err){
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleTabClick = async (item) => {
  setSelectedNode({
    ...item,
    content: "Loading..."
  });

  try {
    const res = await axios.post("http://localhost:5000/api/content", {
      title: item.title,
      topic: topic,
    });

    setSelectedNode({
      ...item,
      content: res.data.content,
    });
  } catch (err) {
    console.error("TAB CLICK ERROR:", err.response?.data || err.message);

    setSelectedNode({
      ...item,
      content: "Failed to load content from server.",
    });
  }
};


  return (
    <main className="relative min-h-screen flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 text-black">
      
      {/* ========================================= */}
      {/* --- PAGE-SPECIFIC NAVBAR STYLING ---      */}
      {/* ========================================= */}
      {/* This forces the Navbar to be blurry & white ONLY on this page! */}
      <style>{`
        header.navbar {
          background-color: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>

      {/* --- BACKGROUND VIBRANT ORBS --- */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* 1. THE MAIN NAVBAR */}
      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      {/* --- CONDITIONAL LAYOUTS --- */}
      {!hasSearched ? (
        
        // STATE 1: LANDING PAGE (Before Search)
        <div className="flex-grow flex flex-col items-center justify-center px-6 relative z-10 animate-fade-in">
          <div className="w-full max-w-3xl text-center flex flex-col items-center">
            <div className="size-16 bg-black rounded-full flex items-center justify-center text-3xl mb-6 shadow-xl border-4 border-white transition-transform hover:scale-110">📚</div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">Structured Document</h1>
            <p className="text-gray-600 text-lg md:text-xl font-medium mb-12">Enter a topic to generate your customized learning path.</p>

            <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-center">
              <input 
                type="text" 
                placeholder="e.g. Dynamic Programming, React Hooks..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full md:w-[70%] px-8 py-5 rounded-full border-2 border-gray-200 focus:border-purple-500 outline-none text-lg font-bold text-gray-800 transition-colors shadow-lg bg-white/80 backdrop-blur-md"
              />
              <button onClick={handleRun} className="w-full md:w-auto bg-black text-white px-10 py-5 rounded-full font-black text-lg hover:bg-purple-600 transition-all shadow-xl hover:-translate-y-1">
                RUN 🚀
              </button>
            </div>
          </div>
        </div>

      ) : (

        // STATE 2: DOCUMENTATION DASHBOARD
        <div className="flex-grow flex flex-col w-full relative z-10 animate-fade-in max-w-[1600px] mx-auto pt-24">
          
          {/* 2. SECONDARY TOOLBAR */}
          <div className="w-full px-6 md:px-10 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-black rounded-full flex items-center justify-center text-lg shadow-md border-2 border-white">📚</div>
              <h1 className="text-2xl font-black tracking-tight">Structured Document</h1>
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <input 
                type="text" 
                placeholder="Search another topic..." 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full md:w-80 px-5 py-2.5 rounded-full border-2 border-gray-200 focus:border-purple-500 outline-none font-bold text-sm text-gray-800 shadow-sm bg-white/80 backdrop-blur-sm"
              />
              <button 
                onClick={handleRun}
                className="bg-black text-white px-6 py-2.5 rounded-full font-black text-sm hover:bg-purple-600 transition-all shadow-md hover:-translate-y-0.5 whitespace-nowrap"
              >
                RUN 🚀
              </button>
            </div>
          </div>

          {/* 3. TWO-PANE LAYOUT */}
          <div className="flex-grow flex flex-col md:flex-row gap-6 px-6 md:px-10 pb-10 mt-4 h-full">
            
            {/* LEFT: Sidebar Navigation */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-3 bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg max-h-[70vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Learning Path</h3>
              
              {isLoading ? (
                <div className="py-10 flex justify-center"><div className="size-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                curriculum.map((item) => {
                  const isActive = selectedNode?.id === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item)}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl transition-all duration-200 ${
                        isActive 
                          ? "bg-black text-white shadow-md scale-[1.02]" 
                          : "hover:bg-white/80 text-gray-700 hover:shadow-sm"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${isActive ? "text-white" : "text-gray-900"}`}>{item.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'completed' ? 'text-green-400' : 
                          item.status === 'active' ? (isActive ? 'text-purple-300' : 'text-purple-600') : 
                          'text-gray-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* RIGHT: Main Content Viewer */}
            <div className="w-full md:w-2/3 lg:w-3/4 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-xl p-8 md:p-12 min-h-[60vh] flex flex-col">
              
              {isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center animate-pulse">
                  <div className="size-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-600 font-bold uppercase tracking-widest text-sm">Loading Content...</p>
                </div>
              ) : selectedNode ? (
                <div className="animate-fade-in max-w-3xl">
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                    <span className="text-5xl">{selectedNode.icon}</span>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-gray-900">{selectedNode.title}</h2>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedNode.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          selectedNode.status === 'active' ? 'bg-purple-100 text-purple-700' : 
                          'bg-gray-200 text-gray-600'
                        }`}>
                        {selectedNode.status} Module
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-lg text-gray-700 font-medium leading-relaxed">
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <ReactMarkdown
                      components={{
                        code({ inline, className, children, ...props }) {
                          return !inline ? (
                            <pre className="bg-gray-900 text-white p-4 rounded-xl overflow-x-auto">
                              <code {...props}>{children}</code>
                            </pre>
                          ) : (
                            <code className="bg-gray-200 px-1 py-0.5 rounded">
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {selectedNode.content}
                    </ReactMarkdown>
                  </div>
                    
                    {selectedNode.status !== "locked" && (
                      <div className="mt-10 w-full h-64 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-700 shadow-inner">
                        <p className="text-gray-500 font-mono text-sm">&lt; Interactive Content Area /&gt;</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

            </div>

          </div>
        </div>
      )}
    </main>
  );
};

export default Documentation;