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
  badgeText,
  className = '',
  glow = true,
}) => {
  // Dimensions according to size
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
    hero: 'w-28 h-28 sm:w-36 sm:h-36',
  }[size];

  const typographySizes = {
    xs: {
      brand: 'text-sm font-black',
      slogan: 'text-[7px]',
      badge: 'text-[8px] px-1 py-0.2',
    },
    sm: {
      brand: 'text-base sm:text-lg font-black',
      slogan: 'text-[8px] sm:text-[9px]',
      badge: 'text-[8px] px-1.5 py-0.5',
    },
    md: {
      brand: 'text-lg sm:text-xl md:text-2xl font-black',
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

  // SVG Icon Component containing the glowing Cloud + 3D Camera Lens + Floating Photo Card + Orbital Ring
  const LogoIcon = (
    <div
      className={`relative flex items-center justify-center shrink-0 ${iconDimensions} ${
        glow ? 'group-hover:scale-105 transition-transform duration-300' : ''
      }`}
    >
      {/* Background ambient neon flare */}
      {glow && (
        <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-md -z-10 group-hover:bg-cyan-400/35 transition-colors pointer-events-none" />
      )}

      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]"
      >
        <defs>
          {/* Ambient Neon Glow */}
          <filter id="cortexNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="cortexSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="cloudGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="60%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>

          <linearGradient id="cloudRimComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <radialGradient id="lensReflectComp" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          <linearGradient id="orbitGradComp" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#00f2fe" />
            <stop offset="85%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          <linearGradient id="cardGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Ambient Cloud Aura */}
        <path
          d="M60 120 C35 120 25 102 36 84 C41 74 53 66 65 69 C72 49 98 38 118 48 C128 53 135 63 138 73 C155 72 169 86 165 103 C163 117 150 123 135 123 Z"
          fill="url(#cloudGradComp)"
          opacity="0.35"
          filter="url(#cortexNeonGlow)"
        />

        {/* Cloud Body Rim */}
        <path
          d="M60 118 C38 118 30 102 39 86 C44 77 55 70 66 73 C72 54 96 44 115 53 C124 57 130 66 133 75 C149 74 161 87 157 102 C154 114 142 119 129 119 Z"
          fill="url(#cloudGradComp)"
          stroke="url(#cloudRimComp)"
          strokeWidth="3.5"
          filter="url(#cortexSoftGlow)"
        />

        {/* Camera Body */}
        <g transform="translate(48, 56)">
          <path d="M34 6 L39 1 L65 1 L70 6 Z" fill="#0A1020" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="80" cy="16" r="3" fill="#38bdf8" filter="url(#cortexSoftGlow)" />
          
          <rect x="14" y="6" width="76" height="54" rx="14" fill="#070D1D" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="16" y="8" width="72" height="50" rx="12" fill="#0A1020" />

          <circle cx="52" cy="33" r="22" fill="#030712" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="52" cy="33" r="18" fill="url(#lensReflectComp)" stroke="#00f2fe" strokeWidth="1.8" />
          
          <circle cx="52" cy="33" r="10" fill="#020617" />
          <circle cx="48" cy="29" r="4" fill="#38bdf8" opacity="0.85" />
          <circle cx="55" cy="35" r="2" fill="#ffffff" opacity="0.95" />
        </g>

        {/* Floating Photo Card on Top-Right */}
        <g transform="translate(108, 62) rotate(14)">
          <rect x="0" y="0" width="38" height="38" rx="8" fill="#0A1020" stroke="#a855f7" strokeWidth="2.5" filter="url(#cortexSoftGlow)" />
          <rect x="3" y="3" width="32" height="32" rx="6" fill="url(#cardGradComp)" opacity="0.9" />
          <circle cx="24" cy="11" r="3.5" fill="#ffffff" opacity="0.9" />
          <path d="M6 29 L16 16 L22 23 L26 19 L32 29 Z" fill="#070D1D" opacity="0.85" />
        </g>

        {/* Orbiting Glowing Light Streak Ring */}
        <g filter="url(#cortexNeonGlow)">
          <path
            d="M38 100 C34 116 58 132 100 128 C136 125 158 108 160 92"
            fill="none"
            stroke="url(#orbitGradComp)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
        </g>

        {/* Sparkles */}
        <g fill="#38bdf8" filter="url(#cortexSoftGlow)">
          <path d="M142 42 Q144 48 150 50 Q144 52 142 58 Q140 52 134 50 Q140 48 142 42 Z" />
          <path d="M48 48 Q49 53 54 54 Q49 55 48 60 Q47 55 42 54 Q47 53 48 48 Z" fill="#60a5fa" />
          <path d="M168 118 Q169 121 172 122 Q169 123 168 126 Q167 123 164 122 Q167 121 168 118 Z" fill="#c084fc" />
        </g>
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
            className={`${typographySizes.brand} tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]`}
          >
            IMG<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 drop-shadow-[0_0_18px_rgba(56,189,248,0.7)]">IVO</span>
          </span>
          {badgeText && (
            <span
              className={`${typographySizes.badge} font-extrabold rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Subtitle / Slogan */}
        {(showSlogan || variant === 'banner' || variant === 'full') && (
          <div className="mt-2.5 flex items-center justify-center gap-3 w-full max-w-xs sm:max-w-sm">
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-cyan-400 to-cyan-500/50" />
            <span
              className={`${typographySizes.slogan} font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap`}
            >
              SHARE <span className="text-cyan-400">•</span> STORE <span className="text-purple-400">•</span> ENJOY
            </span>
            <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-fuchsia-400 to-purple-500/50" />
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
            className={`${typographySizes.brand} tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]`}
          >
            IMG<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-fuchsia-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">IVO</span>
          </span>
          {badgeText && (
            <span
              className={`${typographySizes.badge} font-black rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showSlogan && (
          <div className="mt-1 flex items-center gap-1">
            <span className={`${typographySizes.slogan} font-bold text-slate-400 uppercase tracking-widest leading-none`}>
              SHARE • STORE • ENJOY
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

