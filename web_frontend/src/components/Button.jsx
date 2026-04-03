const Button = ({ text, className, id }) => {
  return (
    <a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault(); 

        // FIXED: Now it dynamically uses the 'id' we pass to it instead of hardcoding "counter"
        const target = document.getElementById(id); 

        if (target) {
          const offset = window.innerHeight * 0.15; 
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }}
      className={`${className ?? ""} cta-wrapper`} 
    >
      <div className="cta-button group">
        <div className="bg-circle" />
        <p className="text">{text}</p>
        <div className="arrow-wrapper">
          <img src="/images/arrow-down.svg" alt="arrow" />
        </div>
      </div>
    </a>
  );
};

export default Button;