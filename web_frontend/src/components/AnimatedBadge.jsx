import { useState, useEffect } from "react";

const AnimatedBadge = () => {
  const words = ["Learn......", "Win..........", "Level Up........", "Conquer.....", "Enjoy....."];
  const [currentText, setCurrentText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Speed settings (in milliseconds)
    const typingSpeed = 100;
    const deletingSpeed = 60;
    const pauseBeforeDelete = 1500;

    const fullWord = words[wordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting && currentText === fullWord) {
        // Word is fully typed out -> Pause, then start deleting
        setTimeout(() => setIsDeleting(true), pauseBeforeDelete);
      } else if (isDeleting && currentText === "") {
        // Word is fully deleted -> Move to the next word
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        // Typing or Deleting action
        const nextText = isDeleting
          ? fullWord.substring(0, currentText.length - 1)
          : fullWord.substring(0, currentText.length + 1);
        
        setCurrentText(nextText);
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    // Cleanup the timer to prevent memory leaks
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex, words]);

  return (
    <div className="watermark-cover">
      <span className="typewriter-text">
        {currentText}
        {/* Blinking Cursor */}
        <span className="animate-blink">|</span>
      </span>
    </div>
  );
};

export default AnimatedBadge;