import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Home from "./pages/Home";
import Battle from "./pages/Battle";
import Arena from "./pages/Arena";
import Leaderboard from "./pages/Leaderboard";
import Layout from "./components/Layout";


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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/arena" element={<Arena />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/battle/:roomId" element={<Battle />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;