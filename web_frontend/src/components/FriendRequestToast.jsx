import { useState, useEffect } from "react";

const FriendRequestToast = ({ request, onAccept, onDecline }) => {
  const [isClosing, setIsClosing] = useState(false);

  // If there's no request, don't render anything
  if (!request) return null;

  const handleAction = (action) => {
    const requestId = request.id || request._id;

    setIsClosing(true); // Trigger slide-out animation
    setTimeout(() => {
      
      if (action === "accept") onAccept(request.id);
      if (action === "decline") onDecline(request.id);
    }, 300); // Wait for animation to finish
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[500] w-[360px] max-w-[90vw] transition-all duration-300 ease-out ${isClosing ? "translate-x-[120%] opacity-0" : "animate-slide-left"}`}>
      
      {/* Custom Keyframe for sliding in from the right */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Glassmorphism Card */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-purple-100 rounded-3xl p-5 shadow-[0_20px_40px_rgba(168,85,247,0.15)] flex flex-col relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute -top-10 -right-10 size-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start gap-4 relative z-10">
          
          {/* Sender Avatar */}
          <div className="size-14 rounded-full border-2 border-white shadow-md overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
            {request.photoURL ? (
              <img src={request.photoURL} alt={request.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-purple-600">{request.name?.charAt(0) || "?"}</span>
            )}
          </div>

          {/* Sender Info */}
          <div className="flex flex-col flex-grow">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-0.5 flex items-center gap-1">
              <span className="size-2 rounded-full bg-green-400 animate-pulse"></span>
              New Request
            </span>
            <h4 className="text-lg font-black text-gray-900 leading-tight">{request.name}</h4>
            <p className="text-xs font-bold text-gray-500 mt-0.5">{request.league} • {request.rank}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5 relative z-10">
          <button 
            onClick={() => handleAction("decline")}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={() => handleAction("accept")}
            className="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            Accept
          </button>
        </div>

      </div>
    </div>
  );
};

export default FriendRequestToast;