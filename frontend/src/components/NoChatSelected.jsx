import { MessageSquare, Sparkles } from "lucide-react";

const BilibiliTVSVG = () => (
  <div className="bili-tv-wrapper">
    {/* Floating elements */}
    <svg className="floating-star star-1" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
    <svg className="floating-star heart-1" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
    <svg className="floating-star star-2" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>

    {/* Bilibili TV */}
    <svg className="bili-tv-svg" width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* TV Antennae */}
      <g className="tv-antenna left-ant">
        <line x1="90" y1="45" x2="60" y2="20" stroke="#fb7299" strokeWidth="6" strokeLinecap="round" />
        <circle cx="60" cy="20" r="8" fill="#fb7299" />
      </g>
      <g className="tv-antenna right-ant">
        <line x1="110" y1="45" x2="140" y2="20" stroke="#fb7299" strokeWidth="6" strokeLinecap="round" />
        <circle cx="140" cy="20" r="8" fill="#fb7299" />
      </g>

      {/* TV Stand/Feet */}
      <path d="M70 155 L50 175 C45 180, 55 180, 60 175 Z" fill="#e2e8f0" />
      <path d="M130 155 L150 175 C155 180, 145 180, 140 175 Z" fill="#e2e8f0" />

      {/* TV Body */}
      <rect x="30" y="45" width="140" height="115" rx="28" fill="url(#tv_body_gradient)" stroke="#fb7299" strokeWidth="6" />

      {/* TV Screen */}
      <rect x="42" y="57" width="116" height="91" rx="20" fill="url(#tv_screen_gradient)" stroke="rgba(251, 114, 153, 0.15)" strokeWidth="3" />

      {/* Cute Face details */}
      {/* Happy/Blinking Eyes */}
      <circle className="tv-eye" cx="72" cy="98" r="6" fill="#1f2937" />
      <circle className="tv-eye" cx="128" cy="98" r="6" fill="#1f2937" />

      {/* Blushing Cheeks */}
      <ellipse className="tv-blush" cx="60" cy="112" rx="10" ry="5" fill="#ffa2bc" />
      <ellipse className="tv-blush" cx="140" cy="112" rx="10" ry="5" fill="#ffa2bc" />

      {/* Smiley Mouth */}
      <path d="M92 108 Q100 115 108 108" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Screen Shine */}
      <path d="M52 67 L90 67 C95 67, 95 72, 90 72 L52 72 Z" fill="white" opacity="0.3" />

      {/* Gradients */}
      <defs>
        <linearGradient id="tv_body_gradient" x1="30" y1="45" x2="170" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb3c6" />
          <stop offset="100%" stopColor="#fb7299" />
        </linearGradient>
        <linearGradient id="tv_screen_gradient" x1="42" y1="57" x2="158" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fff5f7" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const NoChatSelected = () => {
  return (
    <div className="no-chat-container">
      <BilibiliTVSVG />
      <h2 className="no-chat-title" style={{ marginTop: "24px", color: "var(--color-primary)" }}>Chào mừng đến với Mya app!</h2>
      <p className="no-chat-desc" style={{ maxWidth: "340px", lineHeight: "1.6" }}>
        Chọn một người bạn bên cột trái để bắt đầu cuộc trò chuyện ngọt ngào ngay nhé! ✨
      </p>
    </div>
  );
};

export default NoChatSelected;
