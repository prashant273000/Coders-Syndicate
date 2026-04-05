const VideoBG = () => {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
    >
      <source src="/images/kling_video.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBG;