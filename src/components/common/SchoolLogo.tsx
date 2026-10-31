import React from 'react';

interface SchoolLogoProps {
  url?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  url,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  if (url && url.trim().length > 0) {
    return (
      <img
        src={url}
        alt={`${name} Crest`}
        className={`object-contain rounded-full shadow-xs border border-amber-500/30 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Default Ugandan School Crest SVG with Crested Crane motif & academic open book
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-linear-to-b from-amber-600 to-amber-900 text-white font-bold shadow-md border-2 border-amber-300 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <circle cx="50" cy="50" r="46" stroke="#FDE047" strokeWidth="2.5" strokeDasharray="3 2" />
        <path
          d="M20 75 C35 65 65 65 80 75 L75 30 L50 18 L25 30 Z"
          fill="#1E293B"
          stroke="#FDE047"
          strokeWidth="2"
        />
        {/* Open Book */}
        <path
          d="M32 55 C38 52 45 52 50 56 C55 52 62 52 68 55 L68 68 C62 65 55 65 50 69 C45 65 38 65 32 68 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1.5"
        />
        {/* Academic Torch / Flame */}
        <path
          d="M50 25 C47 32 46 36 50 42 C54 36 53 32 50 25 Z"
          fill="#F59E0B"
        />
        <circle cx="50" cy="36" r="3" fill="#EF4444" />
        {/* Small stars */}
        <polygon points="36,36 38,39 42,39 39,41 40,45 36,42 32,45 33,41 30,39 34,39" fill="#FDE047" transform="scale(0.5) translate(40, 20)" />
        <polygon points="36,36 38,39 42,39 39,41 40,45 36,42 32,45 33,41 30,39 34,39" fill="#FDE047" transform="scale(0.5) translate(85, 20)" />
      </svg>
    </div>
  );
};
