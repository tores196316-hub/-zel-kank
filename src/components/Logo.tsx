import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'horizontal' | 'vertical' | 'icon' | 'full' | 'banner';
  showSlogan?: boolean;
  badgeText?: string;
  className?: string;
  glow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSlogan = false,
  badgeText = 'V5',
  className = '',
  glow = true,
}) => {
  // Dimensions according to size
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    hero: 'w-24 h-24 sm:w-28 sm:h-28',
  }[size];

  const typographySizes = {
    xs: {
      brand: 'text-sm font-black',
      slogan: 'text-[7px]',
      badge: 'text-[8px] px-1 py-0.2',
    },
    sm: {
      brand: 'text-base font-black',
      slogan: 'text-[8px]',
      badge: 'text-[8px] px-1.5 py-0.5',
    },
    md: {
      brand: 'text-lg sm:text-xl font-black',
      slogan: 'text-[9px] sm:text-[10px]',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    lg: {
      brand: 'text-2xl sm:text-3xl font-black',
      slogan: 'text-[11px] sm:text-xs',
      badge: 'text-[10px] px-2 py-0.5',
    },
    xl: {
      brand: 'text-3xl sm:text-4xl font-black',
      slogan: 'text-xs sm:text-sm',
      badge: 'text-xs px-2.5 py-0.5',
    },
    hero: {
      brand: 'text-4xl sm:text-5xl md:text-6xl font-black',
      slogan: 'text-xs sm:text-sm md:text-base tracking-[0.25em]',
      badge: 'text-xs px-3 py-1',
    },
  }[size];

  // SVG Icon Component containing the glowing Cloud + Camera + Orbiting Upload Arrow
  const LogoIcon = (
    <div
      className={`relative flex items-center justify-center shrink-0 ${iconDimensions} ${
        glow ? 'group-hover:scale-105 transition-transform duration-300' : ''
      }`}
    >
      {/* Background ambient neon flare */}
      {glow && (
        <div className="absolute inset-0 bg-cyan-500/25 rounded-2xl blur-md -z-10 group-hover:bg-cyan-400/40 transition-colors pointer-events-none" />
      )}

      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(0,180,255,0.45)]"
      >
        <defs>
          <linearGradient id="cloudBodyGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>

          <linearGradient id="neonRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="40%" stopColor="#00F2FE" />
            <stop offset="80%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="orbitArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="30%" stopColor="#38BDF8" />
            <stop offset="80%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <linearGradient id="lensGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="40%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#00F2FE" />
          </linearGradient>

          <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Glowing Cloud Layer */}
        <g filter="url(#neonBlur)">
          <path
            d="M34 74 C20 74 14 61 21 49 C25 42 32 37 40 39 C44 26 60 20 73 26 C80 29 84 36 86 42 C97 41 106 50 103 61 C101 70 93 74 83 74 Z"
            fill="url(#cloudBodyGrad)"
            stroke="url(#neonRimGrad)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
        </g>

        {/* 2. Sleek Dark Metallic Camera */}
        <g transform="translate(33, 38)">
          {/* Top Shutter Notch */}
          <path
            d="M17 6 L21 2 L33 2 L37 6 Z"
            fill="#090E17"
            stroke="#38BDF8"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Flash Sensor */}
          <circle cx="43" cy="11" r="2.5" fill="#38BDF8" />
          <circle cx="43" cy="11" r="1" fill="#FFFFFF" />

          {/* Camera Housing */}
          <rect
            x="6"
            y="6"
            width="42"
            height="29"
            rx="7"
            fill="#0B132B"
            stroke="#38BDF8"
            strokeWidth="2.2"
          />

          {/* Outer Lens Bezel */}
          <circle cx="27" cy="20.5" r="11" fill="#070D1D" stroke="#00F2FE" strokeWidth="2" />
          {/* Inner Optics */}
          <circle cx="27" cy="20.5" r="7.5" fill="url(#lensGlassGrad)" />
          {/* Lens Glass Glint */}
          <circle cx="29.5" cy="17.5" r="2.4" fill="#FFFFFF" opacity="0.9" />
        </g>

        {/* 3. Orbiting Upward Arrow (Fast Upload Motion) */}
        <g filter="url(#neonBlur)">
          {/* Swoosh Trail */}
          <path
            d="M26 80 C36 89 54 91 72 87 C83 83 91 75 99 64"
            fill="none"
            stroke="url(#orbitArrowGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Dynamic Arrowhead */}
          <path
            d="M86 58 L103 60 L97 77 Z"
            fill="url(#orbitArrowGrad)"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        {/* 4. Electric Flash Sparkles */}
        <line x1="91" y1="26" x2="91" y2="19" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="98" y1="30" x2="105" y2="25" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="102" y1="39" x2="109" y2="39" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  );

  // If icon-only variant requested
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {LogoIcon}
      </div>
    );
  }

  // If banner or full vertical layout requested (for Hero section, About page, Modals)
  if (variant === 'vertical' || variant === 'banner' || variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {LogoIcon}

        {/* Brand Text */}
        <div className="mt-3 flex items-baseline justify-center gap-1.5">
          <span
            className={`${typographySizes.brand} tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}
          >
            Anlık<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">Resim</span>
          </span>
          {badgeText && (
            <span
              className={`${typographySizes.badge} font-extrabold rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Subtitle / Slogan */}
        {(showSlogan || variant === 'banner' || variant === 'full') && (
          <div className="mt-2 flex items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-sm">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            <span
              className={`${typographySizes.slogan} font-black text-slate-300 uppercase tracking-[0.18em] whitespace-nowrap`}
            >
              HIZLI <span className="text-cyan-400">•</span> GÜVENLİ <span className="text-cyan-400">•</span> SINIRSIZ
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Navbar / Header Layout
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {LogoIcon}

      <div className="flex flex-col justify-center text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${typographySizes.brand} tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]`}
          >
            Anlık<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Resim</span>
          </span>
          {badgeText && (
            <span
              className={`${typographySizes.badge} font-black rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showSlogan && (
          <div className="mt-1 flex items-center gap-1">
            <span className={`${typographySizes.slogan} font-bold text-slate-400 uppercase tracking-widest leading-none`}>
              HIZLI • GÜVENLİ • SINIRSIZ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
