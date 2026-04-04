import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Arena from "./pages/Arena";
import Documentation from "./pages/Documentation";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* If the URL is exactly "/", load the Home page */}
        <Route path="/" element={<Home />} />
        
        {/* If the URL is "/documentation", load the new Document page */}
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/arena" element={<Arena />} />
      </Routes>
    </Router>
  );
};

export default App;