import React from "react";

interface CofeelLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const CofeelLogo: React.FC<CofeelLogoProps> = ({
  className = "h-16",
  variant = "light",
}) => {
  // Brand colors
  const mainColor = variant === "light" ? "#3D1105" : "#FFF7ED"; // Deep Brown vs Warm White/Amber-50
  const leafColor = "#A8C315"; // Fresh Lime Green
  const crackColor = variant === "light" ? "#FDFBF7" : "#3D1105"; // Contrast line inside beans

  return (
    <svg
      viewBox="0 0 520 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Brand logo "C" */}
      <text
        x="20"
        y="125"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="120"
        fontWeight="bold"
        fill={mainColor}
      >
        C
      </text>

      {/* "o" representado por el grano de café grande */}
      <g transform="translate(100, 45) rotate(-22 55 45)">
        <ellipse cx="55" cy="45" rx="46" ry="29" fill={mainColor} />
        {/* Curved crack in the large bean */}
        <path
          d="M 16,52 C 32,47 43,49 55,44 C 67,39 78,41 94,34"
          stroke={crackColor}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* "F" */}
      <text
        x="240"
        y="125"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="105"
        fontWeight="semi-bold"
        fill={mainColor}
      >
        F
      </text>

      {/* First "e" cookie-bean with leaf */}
      <g transform="translate(290, 50)">
        {/* Leaf 1 (curves downwards first then up to point right-down) */}
        <path
          d="M 12,50 C 25,75 52,70 65,58 C 42,54 25,48 12,50"
          fill={leafColor}
          stroke={mainColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Small Bean 1 */}
        <g transform="translate(10, 10) rotate(-15 22 15)">
          <ellipse cx="22" cy="15" rx="22" ry="14" fill={mainColor} />
          <path
            d="M 5,17 C 11,16 16,17 22,15 C 28,13 33,14 39,12"
            stroke={crackColor}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Second "e" cookie-bean with leaf */}
      <g transform="translate(350, 50)">
        {/* Leaf 2 */}
        <path
          d="M 12,50 C 25,75 52,70 65,58 C 42,54 25,48 12,50"
          fill={leafColor}
          stroke={mainColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Small Bean 2 */}
        <g transform="translate(10, 10) rotate(-15 22 15)">
          <ellipse cx="22" cy="15" rx="22" ry="14" fill={mainColor} />
          <path
            d="M 5,17 C 11,16 16,17 22,15 C 28,13 33,14 39,12"
            stroke={crackColor}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* "L" with graceful end curl */}
      <text
        x="410"
        y="125"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="105"
        fontWeight="semi-bold"
        fill={mainColor}
      >
        L
      </text>
      {/* Decorative curl at the bottom right corner of L */}
      <path
        d="M 465,123 C 480,123 490,118 495,120 C 500,122 501,126 498,128 C 493,131 480,128 470,125"
        stroke={mainColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Chinese Text "凱飛鮮烘豆" and Steam/Small Bean decoration */}
      <g transform="translate(370, 140)">
        {/* Steam waves rising from '凱' (which sits at x=0 in local coordinates) */}
        <path
          d="M 12,12 C 11,6 14,3 12,-3 C 10,-9 13,-12 11,-18"
          stroke={mainColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 17,14 C 16,8 19,5 17,-1 C 15,-7 18,-10 16,-16"
          stroke={mainColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 22,16 C 21,10 24,7 22,1 C 20,-5 23,-8 21,-14"
          stroke={mainColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Customized calligraphy-like font representation or text */}
        <text
          x="10"
          y="32"
          fontFamily="'Noto Serif TC', 'Shippori Mincho', 'Songti TC', serif"
          fontSize="24"
          fontWeight="900"
          letterSpacing="2"
          fill={mainColor}
        >
          凱飛鮮烘豆
        </text>

        {/* Tiny coffee bean at the end of Chinese characters */}
        <g transform="translate(142, 17) rotate(-20 6 4)">
          <ellipse cx="6" cy="4" rx="6.5" ry="4" fill={mainColor} />
          <path
            d="M 1,5 Q 6,4 11,3"
            stroke={crackColor}
            strokeWidth="0.8"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
};
