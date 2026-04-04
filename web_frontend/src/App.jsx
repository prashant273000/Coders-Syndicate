import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Navbar from "./components/NavBar";
import Hero from "./sections/Hero";
import VideoBG from "./components/VideoBG";
import AnimatedBadge from "./components/AnimatedBadge";
import ExploreCards from "./sections/ExploreCards";
import Layout from "./components/Layout";
import Documentation from "./pages/Documentation";
import Home from "./pages/Home";
import Battle from "./pages/Battle";
import Arena from "./pages/Arena";
import Leaderboard from "./pages/Leaderboard";
import About from "./pages/About"; // Add this
import Help from "./pages/Help";   // Add this

// ---- Pages ----
const HomePage = () => (
  <main className="relative">
    <VideoBG />
    <Navbar />
    <Hero />
    <ExploreCards />
    <AnimatedBadge />
  </main>
);

// ---- Login route guard ----
const LoginRoute = () => {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/" replace />;
  return <Layout />;




};

// ---- Root App ----
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/arena" element={<Arena />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;