import { useState } from "react";
import "./layout.css";
import Logo from "../assets/logo.png"
export default function Layout() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    console.log("Google login clicked!");

    setTimeout(() => {
      alert("✅ Google login clicked! (Demo for now)");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="auth-container">
      
      {/* Rotating 3D Pink/Purple Background - unchanged */}
      <div className="hero-background">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="neon-ring"></div>
      </div>

      {/* Centered Login Card */}
      <div className="auth-card-wrapper">
        <div className="auth-card">
          
          {/* ONLY THIS PART IS CHANGED - Now using your new logo image */}
          <div className="logo-container">
            <img 
              src={Logo}
              alt="Coders Syndicate" 
              className="logo-image"
            />
          </div>

          <h1 className="auth-title">Welcome to Coders Syndicate</h1>
          <p className="auth-subtitle">Sign in with Google to join the arena</p>

          <button 
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <p className="tagline">Turning concepts into code, and code into impact.</p>
        </div>
      </div>
    </div>
  );
}