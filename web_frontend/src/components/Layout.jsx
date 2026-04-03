import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../services/auth";
import "./Layout.css";
// import Logo from "../assets/logo.png"; // uncomment when you add your logo

export default function Layout() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const user = await loginWithGoogle();
      const token = await user.getIdToken();

      await fetch("http://localhost:5000/api/auth", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Rotating 3D Pink/Purple Background */}
      <div className="hero-background">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
        <div className="neon-ring"></div>
      </div>

      {/* Centered Login Card */}
      <div className="auth-card-wrapper">
        <div className="auth-card">

          {/* Uncomment once logo is added back */}
          {/* <div className="logo-container">
            <img src={Logo} alt="Coders Syndicate" className="logo-image" />
          </div> */}

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