import Navbar from "./components/NavBar"; // Keep this import
import Hero from "./sections/Hero";
import VideoBG from "./components/VideoBG"; 
import AnimatedBadge from "./components/AnimatedBadge";

const App = () => (
  <main className="relative">
    <VideoBG /> 
    <Navbar /> {/* Restored Navbar */}
    <Hero />
    <AnimatedBadge />
  </main>
);

export default App;