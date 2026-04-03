import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; 
import Login from "./components/Login";
import Profile from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return <h1>App Working</h1>;
  return (
    <Layout>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </Layout>
  );
}

export default App;