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
    <AnimatedBadge />
  </main>
);

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