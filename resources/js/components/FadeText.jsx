import React from "react";

export const FadeText = ({ text, className }) => {
  const gradientId = "textFadeGradient";
  const maskId = "textFadeMask";

  return (
    <svg
      width="100%"
      height="100%"
      // viewBox diperlebar menjadi 1000 agar "KOLEKSIKAS" masuk sepenuhnya tanpa terpotong
      viewBox="0 0 1000 180" 
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none uppercase ${className || ""}`}
    >
      <defs>
        {/* Gradient dipercepat! Mulai hilang di 30%, dan Lenyap Total di 60% */}
        <linearGradient id={gradientId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="30%" stopColor="white" stopOpacity="0.7" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </mask>
      </defs>
      
      <text
        x="50%"
        y="60%" /* Agak dinaikkan sedikit ke atas */
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="150" /* Ukuran font absolut SVG */
        fontWeight="900" /* Sama dengan font-black */
        letterSpacing="-0.02em" /* Merapatkan huruf sedikit agar lebih modern */
        className="fill-kas-dark font-sans"
        mask={`url(#${maskId})`}
      >
        {text}
      </text>
    </svg>
  );
};