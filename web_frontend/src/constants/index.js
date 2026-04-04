/**
 * Navigation links for the NavBar
 */
const navLinks = [
  {
    name: "Home",
    link: "#home",
  },
  {
    name: "About Us",
    link: "#aboutus",
  },
  {
    name: "Help",
    link: "#help",
  },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Chat", link: "/chat" },
];

/**
 * Words for the Hero Section vertical slider.
 * Note: For the light theme, ensure these SVGs/Images look good on a white background.
 */
const words = [
  { text: "Arena", imgPath: "/images/arena.svg" },
  { text: "Learning", imgPath: "/images/learning.svg" },
  { text: "Documentation", imgPath: "/images/documentation.svg" },
  { text: "Code", imgPath: "/images/code.svg" },
  { text: "Arena", imgPath: "/images/arena.svg" },
  { text: "Learning", imgPath: "/images/learning.svg" },
  { text: "Documentation", imgPath: "/images/documentation.svg" },
  { text: "Code", imgPath: "/images/code.svg" },
];

/**
 * Social Media Icons for the Footer (if you decide to add it back)
 */
const socialImgs = [
  {
    name: "insta",
    imgPath: "/images/insta.png",
  },
  {
    name: "fb",
    imgPath: "/images/fb.png",
  },
  {
    name: "x",
    imgPath: "/images/x.png",
  },
  {
    name: "linkedin",
    imgPath: "/images/linkedin.png",
  },
];

/** * PLACEHOLDER DATA 
 * These are exported so your code doesn't break, 
 * but you aren't using them in your simplified App.jsx.
 */

const counterItems = [
  { value: 10, suffix: "+", label: "Hackathons Won" },
  { value: 50, suffix: "+", label: "Projects Built" },
];

const logoIconsList = [];
const abilities = [];
const techStackImgs = [];
const techStackIcons = [];
const expCards = [];
const expLogos = [];
const testimonials = [];

export {
  words,
  abilities,
  logoIconsList,
  counterItems,
  expCards,
  expLogos,
  testimonials,
  socialImgs,
  techStackIcons,
  techStackImgs,
  navLinks,
};