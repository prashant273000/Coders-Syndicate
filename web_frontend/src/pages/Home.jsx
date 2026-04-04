import Navbar from "../components/NavBar"; 
import Hero from "../sections/Hero";
import VideoBG from "../components/VideoBG"; 
import AnimatedBadge from "../components/AnimatedBadge"; 
import ExploreCards from "../sections/ExploreCards"; 

const Home = () => (
  <main className="relative">
    <VideoBG /> 
    <Navbar /> 
    <Hero />
    <ExploreCards />
    <AnimatedBadge />
  </main>
);

export default Home;