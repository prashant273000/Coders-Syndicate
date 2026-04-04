import ExploreCards from "./sections/ExploreCards"; 
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Navbar from "./components/NavBar";
import Hero from "./sections/Hero";
import VideoBG from "./components/VideoBG";
import AnimatedBadge from "./components/AnimatedBadge";
import Layout from "./components/Layout";

const HomePage = () => (
  <main className="relative">
    <VideoBG />
    <Navbar />
    <Hero />
    <ExploreCards />
    <AnimatedBadge />
  </main>
);
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Documentation from "./pages/Documentation";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* If the URL is exactly "/", load the Home page */}
        <Route path="/" element={<Home />} />
        
        {/* If the URL is "/documentation", load the new Document page */}
        <Route path="/documentation" element={<Documentation />} />
      </Routes>
    </Router>
  );
};

const LoginRoute = () => {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/" replace />;
  return <Layout />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;