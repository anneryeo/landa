export default function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash-logo-wrap">
        {/* Wi-Fi style icon in pink gradient */}
        <svg className="splash-wifi" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wg1" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f4a7b9" />
              <stop offset="100%" stopColor="#b5546a" />
            </linearGradient>
          </defs>
          {/* Outer arc */}
          <path d="M12 38 C12 22 22 12 36 10 C50 12 60 22 60 38" stroke="url(#wg1)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
          {/* Mid arc */}
          <path d="M20 44 C20 33 27 26 36 24 C45 26 52 33 52 44" stroke="url(#wg1)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.75"/>
          {/* Inner arc */}
          <path d="M28 50 C28 44 32 40 36 39 C40 40 44 44 44 50" stroke="url(#wg1)" strokeWidth="4" strokeLinecap="round" fill="none"/>
          {/* Dot */}
          <circle cx="36" cy="58" r="4" fill="url(#wg1)" />
        </svg>

        <h1 className="splash-title">
          Project <em>Landa</em>
        </h1>
        <p className="splash-sub">Laure Wi-Fi Sensing</p>

        <div className="splash-bar-wrap">
          <div className="splash-bar" />
        </div>
      </div>
    </div>
  );
}
