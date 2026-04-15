import { useState } from "react";

const SLIDES = [
  {
    icon: (
      <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M26 6L8 15v11c0 11 7.7 21.3 18 24 10.3-2.7 18-13 18-24V15L26 6z"
          fill="#b5546a"
          opacity="0.15"
          stroke="#b5546a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M26 6L8 15v11c0 11 7.7 21.3 18 24 10.3-2.7 18-13 18-24V15L26 6z"
          stroke="#b5546a"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
        />
        <polyline
          points="18,26 24,32 34,20"
          stroke="#b5546a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: (
      <>
        Safety Without <em>Compromise</em>
      </>
    ),
    body: "Monitor loved ones using Wi-Fi waves — no cameras, no wearables, no invasion of privacy.",
    cta: "Get Started →",
  },
  {
    icon: (
      <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Satellite dish */}
        <circle cx="22" cy="30" r="2.5" fill="#b5546a" />
        <path
          d="M22 30 L38 16"
          stroke="#b5546a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 22 C14 14.3 20.3 8 28 8"
          stroke="#b5546a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M18 26 C18 20.5 22.5 16 28 16"
          stroke="#b5546a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
        <path
          d="M22 30 C22 26.7 24.7 24 28 24"
          stroke="#b5546a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Base */}
        <line x1="22" y1="30" x2="22" y2="42" stroke="#b5546a" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="42" x2="28" y2="42" stroke="#b5546a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: (
      <>
        Invisible &amp; <em>Always On</em>
      </>
    ),
    body: "The Laure node reads Wi-Fi wave disruptions. Falls detected instantly — even through walls & in darkness.",
    cta: "Next →",
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [idx, setIdx] = useState(0);

  const handleCta = () => {
    if (idx < SLIDES.length - 1) {
      setIdx(idx + 1);
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[idx];

  return (
    <div className="onboarding fade-in" key={idx}>
      <div /> {/* spacer top */}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
        <div className="ob-icon-wrap">{slide.icon}</div>
        <h2 className="ob-title">{slide.title}</h2>
        <p className="ob-body">{slide.body}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", width: "100%" }}>
        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`ob-dot ${i === idx ? "ob-dot--active" : ""}`} />
          ))}
        </div>
        <div className="ob-actions">
          <button className="btn-primary" onClick={handleCta}>
            {slide.cta}
          </button>
          <button className="btn-ghost" onClick={onComplete}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
