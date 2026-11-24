import React from "react";

interface Hero3DIconProps {
  id: string;
  className?: string;
}

/**
 * 4 Bespoke Studio-Grade 3D Sculpted Pop-Out Hero Icons
 * Designed without any circular/box container — standalone 3D extruded glass & metallic emblems
 * with realistic bevel lighting, specular reflections, cast depth, and floating micro-orbs.
 */
export const Hero3DModuleIcon: React.FC<Hero3DIconProps> = ({
  id,
  className = "w-full h-full",
}) => {
  switch (id) {
    case "kewaspadaan-isolasi":
      return <Hero3DShield className={className} />;
    case "surveilans-hais":
      return <Hero3DHeartbeat className={className} />;
    case "bundles-hais":
      return <Hero3DBundleCube className={className} />;
    case "diklat":
      return <Hero3DGraduationCap className={className} />;
    default:
      return <Hero3DShield className={className} />;
  }
};

/* ============================================================================
   1. KEWASPADAAN ISOLASI — 3D Sapphire & Cyan Forged Medical Shield
   ============================================================================ */
const Hero3DShield: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      {/* Ambient aura glow */}
      <radialGradient id="shAura" cx="50%" cy="48%" r="48%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.48" />
        <stop offset="55%" stopColor="#2563EB" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
      </radialGradient>

      {/* 3D Extrusion Wall */}
      <linearGradient id="shExtrude" x1="25%" y1="15%" x2="85%" y2="95%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="55%" stopColor="#0F1F5C" />
        <stop offset="100%" stopColor="#070E2E" />
      </linearGradient>

      {/* Front Main Sapphire Glass Body */}
      <linearGradient id="shFront" x1="15%" y1="8%" x2="88%" y2="92%">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="28%" stopColor="#3B82F6" />
        <stop offset="68%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>

      {/* Specular Metallic Rim */}
      <linearGradient id="shRim" x1="10%" y1="5%" x2="90%" y2="95%">
        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.98" />
        <stop offset="35%" stopColor="#60A5FA" stopOpacity="0.85" />
        <stop offset="75%" stopColor="#2563EB" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.9" />
      </linearGradient>

      {/* Inner Crystal Glass Core */}
      <linearGradient id="shInner" x1="20%" y1="12%" x2="80%" y2="88%">
        <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.42" />
        <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#0F172A" stopOpacity="0.4" />
      </linearGradient>

      {/* Sweeping Specular Gloss */}
      <linearGradient id="shGloss" x1="0%" y1="0%" x2="70%" y2="85%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
        <stop offset="45%" stopColor="#E0F2FE" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>

      {/* Embossed Checkmark */}
      <linearGradient id="shCheck" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#7DD3FC" />
      </linearGradient>

      {/* Floating 3D Orb */}
      <radialGradient id="shOrb" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="35%" stopColor="#7DD3FC" />
        <stop offset="80%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </radialGradient>

      <filter id="shCheckShadow" x="-25%" y="-25%" width="160%" height="160%">
        <feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#071544" floodOpacity="0.72" />
      </filter>
    </defs>

    {/* Volumetric Glow Behind Icon */}
    <circle cx="80" cy="80" r="68" fill="url(#shAura)" />

    {/* Floating 3D Micro-Orbs & Spark */}
    <circle cx="24" cy="40" r="7.5" fill="url(#shOrb)" opacity="0.92" />
    <circle cx="137" cy="112" r="5" fill="url(#shOrb)" opacity="0.82" />
    <path
      d="M135 28 L137.4 34.6 L144 37 L137.4 39.4 L135 46 L132.6 39.4 L126 37 L132.6 34.6 Z"
      fill="#BAE6FD"
      opacity="0.92"
    />

    {/* Tilted 3D Sculpted Shield Group */}
    <g transform="rotate(-7 80 80)">
      {/* 3D Extruded Back/Side Wall (gives real 3D physical thickness) */}
      <path
        d="M87 21 C106 32 123 36 135 38 C136 80 123 119 87 143 C51 119 38 80 39 38 C51 36 68 32 87 21 Z"
        fill="url(#shExtrude)"
      />
      {/* Connecting 3D Bevel Edge Shadow */}
      <path
        d="M84 19 C103 30 120 34 132 36 C133 78 120 117 84 141 C48 117 35 78 36 36 C48 34 65 30 84 19 Z"
        fill="#1E40AF"
        opacity="0.75"
      />

      {/* Main Front 3D Sculpted Shield Body */}
      <path
        d="M78 15 C97 26 114 30 126 32 C127 74 114 113 78 137 C42 113 29 74 30 32 C42 30 59 26 78 15 Z"
        fill="url(#shFront)"
        stroke="url(#shRim)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Right Facet Subtle 3D Crest Shading */}
      <path
        d="M78 16.5 C96.5 27 113 31 124.8 33 C125.6 73.5 113 111.5 78 135.2 Z"
        fill="#0A1950"
        opacity="0.22"
      />

      {/* Inner Recessed Frosted Crystal Shield Plate */}
      <path
        d="M78 27 C93 36 106.5 39.5 116 41 C116.5 74.5 106 105.5 78 124.5 C50 105.5 39.5 74.5 40 41 C49.5 39.5 63 36 78 27 Z"
        fill="url(#shInner)"
        stroke="#BAE6FD"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />

      {/* Curved Top-Left Glass Specular Gloss Arc */}
      <path
        d="M78 17.5 C60 28 43.5 31.8 32 33.8 C31.8 55 36.5 74 46 89 C52 67 68 46 101 34.5 C92.5 30.5 85 23.5 78 17.5 Z"
        fill="url(#shGloss)"
      />

      {/* 3D Embossed Glowing Medical Checkmark */}
      <g filter="url(#shCheckShadow)">
        <path
          d="M57 78.5 L72 93.5 L102.5 61"
          stroke="#1E3A8A"
          strokeWidth="13.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
          transform="translate(2, 3)"
        />
        <path
          d="M57 78.5 L72 93.5 L102.5 61"
          stroke="url(#shCheck)"
          strokeWidth="11.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Crisp Inner Highlight Spine on Checkmark */}
        <path
          d="M58 77.5 L72 91.5 L101.5 60"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>
    </g>
  </svg>
);

/* ============================================================================
   2. SURVEILANS HAIs — 3D Emerald Glass Heart + Pop-Out Neon Pulse Wave
   ============================================================================ */
const Hero3DHeartbeat: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="hbAura" cx="50%" cy="50%" r="48%">
        <stop offset="0%" stopColor="#34D399" stopOpacity="0.48" />
        <stop offset="55%" stopColor="#10B981" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0" />
      </radialGradient>

      {/* 3D Extruded Back Wall */}
      <linearGradient id="hbExtrude" x1="20%" y1="20%" x2="85%" y2="95%">
        <stop offset="0%" stopColor="#065F46" />
        <stop offset="60%" stopColor="#044332" />
        <stop offset="100%" stopColor="#022019" />
      </linearGradient>

      {/* Sculpted Glossy Emerald Heart Body */}
      <radialGradient id="hbFront" cx="32%" cy="28%" r="74%">
        <stop offset="0%" stopColor="#A7F3D0" />
        <stop offset="28%" stopColor="#34D399" />
        <stop offset="64%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064E3B" />
      </radialGradient>

      {/* Specular Mint Rim */}
      <linearGradient id="hbRim" x1="12%" y1="10%" x2="88%" y2="90%">
        <stop offset="0%" stopColor="#ECFDF5" stopOpacity="0.98" />
        <stop offset="40%" stopColor="#6EE7B7" stopOpacity="0.82" />
        <stop offset="80%" stopColor="#059669" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.88" />
      </linearGradient>

      {/* Glass Specular Lobe Highlight */}
      <linearGradient id="hbGloss" x1="0%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
        <stop offset="55%" stopColor="#D1FAE5" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>

      {/* Neon ECG Pulse Ribbon */}
      <linearGradient id="hbPulse" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="25%" stopColor="#FFFFFF" />
        <stop offset="75%" stopColor="#ECFDF5" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>

      <radialGradient id="hbOrb" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="38%" stopColor="#6EE7B7" />
        <stop offset="80%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </radialGradient>

      <filter id="hbPulseGlow" x="-25%" y="-35%" width="150%" height="170%">
        <feDropShadow dx="1" dy="5" stdDeviation="3.5" floodColor="#022C22" floodOpacity="0.78" />
      </filter>
    </defs>

    {/* Volumetric Glow */}
    <circle cx="80" cy="80" r="68" fill="url(#hbAura)" />

    {/* Floating 3D Micro-Orbs & Spark */}
    <circle cx="25" cy="36" r="6.5" fill="url(#hbOrb)" opacity="0.92" />
    <circle cx="137" cy="118" r="5" fill="url(#hbOrb)" opacity="0.84" />
    <path
      d="M135 28 L137.3 34.4 L143.5 36.7 L137.3 39 L135 45.4 L132.7 39 L126.5 36.7 L132.7 34.4 Z"
      fill="#A7F3D0"
      opacity="0.92"
    />

    {/* Tilted 3D Sculpted Heart + Pop-Out Pulse */}
    <g transform="rotate(-6 80 82)">
      {/* 3D Extruded Back Heart Slab */}
      <path
        d="M86 138 C86 138 34 106 31 66 C29.5 46 44 33 61 33 C72.5 33 81.5 39.5 86 48 C90.5 39.5 99.5 33 111 33 C128 33 142.5 46 141 66 C138 106 86 138 86 138 Z"
        fill="url(#hbExtrude)"
      />

      {/* Mid Bevel Layer */}
      <path
        d="M82 135 C82 135 30 103 27 63 C25.5 43 40 30 57 30 C68.5 30 77.5 36.5 82 45 C86.5 36.5 95.5 30 107 30 C124 30 138.5 43 137 63 C134 103 82 135 82 135 Z"
        fill="#047857"
        opacity="0.72"
      />

      {/* Main Front 3D Glossy Emerald Heart */}
      <path
        d="M77 132 C77 132 25 100 22 60 C20.5 40 35 27 52 27 C63.5 27 72.5 33.5 77 42 C81.5 33.5 90.5 27 102 27 C119 27 133.5 40 132 60 C129 100 77 132 77 132 Z"
        fill="url(#hbFront)"
        stroke="url(#hbRim)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Left Upper Lobe Liquid-Glass Specular Highlight */}
      <ellipse
        cx="47"
        cy="48"
        rx="16"
        ry="10"
        transform="rotate(-28 47 48)"
        fill="url(#hbGloss)"
      />
      {/* Right Upper Lobe Subtle Rim Reflection */}
      <ellipse
        cx="106"
        cy="45"
        rx="11"
        ry="6.5"
        transform="rotate(24 106 45)"
        fill="#FFFFFF"
        opacity="0.28"
      />

      {/* Pop-Out 3D Glowing ECG Heartbeat Pulse Ribbon */}
      <g filter="url(#hbPulseGlow)">
        {/* Outer Glowing Emerald Tube */}
        <path
          d="M11 81 L45 81 L57 52 L73 105 L90 42 L104 81 L147 81"
          stroke="#34D399"
          strokeWidth="12.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
        />
        {/* Crisp Glossy White-Mint 3D ECG Core */}
        <path
          d="M11 81 L45 81 L57 52 L73 105 L90 42 L104 81 L147 81"
          stroke="url(#hbPulse)"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Specular Center Shine */}
        <path
          d="M12 80 L45 80 L57 51.5 L73 103.5 L90 41.5 L104 80 L146 80"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        {/* Glowing Pulse Tip Node */}
        <circle cx="147" cy="81" r="5" fill="#FFFFFF" />
        <circle cx="147" cy="81" r="8.5" fill="#6EE7B7" opacity="0.4" />
      </g>
    </g>
  </svg>
);

/* ============================================================================
   3. MONITORING BUNDLES HAIs — 3D Royal Violet Isometric Care Bundle Cube
   ============================================================================ */
const Hero3DBundleCube: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="bcAura" cx="50%" cy="50%" r="48%">
        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.48" />
        <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
      </radialGradient>

      {/* Top Face — Lit Lavender Glass */}
      <linearGradient id="bcTop" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stopColor="#EDE9FE" />
        <stop offset="40%" stopColor="#C4B5FD" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>

      {/* Left Front Face — Royal Amethyst */}
      <linearGradient id="bcLeft" x1="10%" y1="5%" x2="90%" y2="95%">
        <stop offset="0%" stopColor="#9333EA" />
        <stop offset="50%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>

      {/* Right Shadow Face — Deep Velvet Violet */}
      <linearGradient id="bcRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6D28D9" />
        <stop offset="55%" stopColor="#4C1D95" />
        <stop offset="100%" stopColor="#260A54" />
      </linearGradient>

      {/* Glowing Care Ribbon Top */}
      <linearGradient id="bcRibTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#BAE6FD" />
        <stop offset="100%" stopColor="#C4B5FD" />
      </linearGradient>

      {/* Ribbon Side */}
      <linearGradient id="bcRibSide" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="60%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>

      {/* Floating Check Medallion */}
      <linearGradient id="bcBadge" x1="10%" y1="5%" x2="90%" y2="95%">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>

      <radialGradient id="bcOrb" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="38%" stopColor="#D8B4FE" />
        <stop offset="80%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </radialGradient>

      <filter id="bcDrop" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#1E0648" floodOpacity="0.72" />
      </filter>
    </defs>

    {/* Volumetric Violet Glow */}
    <circle cx="80" cy="82" r="68" fill="url(#bcAura)" />

    {/* Floating 3D Micro-Orbs & Spark */}
    <circle cx="24" cy="46" r="7" fill="url(#bcOrb)" opacity="0.92" />
    <circle cx="136" cy="42" r="4.8" fill="url(#bcOrb)" opacity="0.82" />
    <path
      d="M36 122 L38 127.6 L43.6 129.6 L38 131.6 L36 137.2 L34 131.6 L28.4 129.6 L34 127.6 Z"
      fill="#DDD6FE"
      opacity="0.9"
    />

    {/* True 3D Isometric Sculpted Bundle Cube */}
    <g transform="rotate(-4 80 80)">
      {/* Base Soft Cast Rim Depth */}
      <path
        d="M80 22 L134 50 L134 112 L80 142 L26 112 L26 50 Z"
        fill="#1E0845"
        transform="translate(4, 6)"
        opacity="0.55"
      />

      {/* Left Front Face */}
      <path
        d="M26 51 L80 79 L80 140 L26 111 Z"
        fill="url(#bcLeft)"
        stroke="#C4B5FD"
        strokeOpacity="0.45"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Right Shadow Face */}
      <path
        d="M134 51 L80 79 L80 140 L134 111 Z"
        fill="url(#bcRight)"
        stroke="#A78BFA"
        strokeOpacity="0.35"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Top Illuminated Face */}
      <path
        d="M80 22 L134 51 L80 79 L26 51 Z"
        fill="url(#bcTop)"
        stroke="#F5F3FF"
        strokeOpacity="0.9"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Glowing Care Bundle Ribbon — Across Top Face (Two Crossed Strips) */}
      <path
        d="M46 40.5 L62 32 L116 60.5 L100 69 Z"
        fill="url(#bcRibTop)"
        opacity="0.92"
      />
      <path
        d="M98 32 L114 40.5 L60 69 L44 60.5 Z"
        fill="url(#bcRibTop)"
        opacity="0.72"
      />

      {/* Ribbon Cascading Down Left Front Face */}
      <path
        d="M44 60.5 L60 69 L60 129.5 L44 121 Z"
        fill="url(#bcRibSide)"
        opacity="0.88"
      />

      {/* Ribbon Cascading Down Right Shadow Face */}
      <path
        d="M100 69 L116 60.5 L116 121 L100 129.5 Z"
        fill="url(#bcRibSide)"
        opacity="0.65"
      />

      {/* Crisp Specular Bevel Highlight Ridges Where Faces Meet */}
      <path
        d="M27.5 51.5 L80 79 L132.5 51.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.88"
      />
      <path
        d="M80 79 L80 138.5"
        stroke="#E9D5FF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Sweeping Specular Glass Reflection on Left Face */}
      <path
        d="M28 53 L78 79 L78 96 L28 73 Z"
        fill="#FFFFFF"
        opacity="0.16"
      />

      {/* Hovering 3D Glossy Checkmark Seal Popping Off Bottom-Right Corner */}
      <g filter="url(#bcDrop)">
        {/* 3D Extruded Back of Seal */}
        <circle cx="122" cy="112" r="21" fill="#1E1B4B" />
        {/* Main Glossy Cyan-Violet Seal */}
        <circle
          cx="119"
          cy="109"
          r="21"
          fill="url(#bcBadge)"
          stroke="#E0F2FE"
          strokeWidth="2"
        />
        {/* Specular Arc on Seal */}
        <ellipse
          cx="113"
          cy="99"
          rx="10"
          ry="5"
          transform="rotate(-25 113 99)"
          fill="#FFFFFF"
          opacity="0.45"
        />
        {/* Crisp Checkmark */}
        <path
          d="M110.5 109.5 L116.5 115.5 L128.5 102.5"
          stroke="#FFFFFF"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  </svg>
);

/* ============================================================================
   4. PENDIDIKAN & PELATIHAN STAFF — 3D Golden Amber Graduation Cap (Toga)
   ============================================================================ */
const Hero3DGraduationCap: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="gcAura" cx="50%" cy="48%" r="48%">
        <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.48" />
        <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.17" />
        <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
      </radialGradient>

      {/* Cylindrical Skullcap Base */}
      <linearGradient id="gcBase" x1="15%" y1="15%" x2="90%" y2="85%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="42%" stopColor="#D97706" />
        <stop offset="78%" stopColor="#92400E" />
        <stop offset="100%" stopColor="#581C0C" />
      </linearGradient>

      {/* Thick Mortarboard 3D Rim Wall */}
      <linearGradient id="gcWallLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="gcWallRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>

      {/* Glossy Top Mortarboard Surface */}
      <linearGradient id="gcTop" x1="15%" y1="10%" x2="88%" y2="90%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="32%" stopColor="#FBBF24" />
        <stop offset="72%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#9A3412" />
      </linearGradient>

      {/* Top Specular Gloss */}
      <linearGradient id="gcGloss" x1="0%" y1="0%" x2="75%" y2="95%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.68" />
        <stop offset="50%" stopColor="#FEF3C7" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>

      {/* Metallic Gold Tassel */}
      <linearGradient id="gcTassel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="45%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      <radialGradient id="gcOrb" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="38%" stopColor="#FDE68A" />
        <stop offset="80%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </radialGradient>

      <filter id="gcShadow" x="-25%" y="-25%" width="160%" height="160%">
        <feDropShadow dx="1.5" dy="5" stdDeviation="3.5" floodColor="#451A03" floodOpacity="0.72" />
      </filter>
    </defs>

    {/* Volumetric Warm Gold Glow */}
    <circle cx="80" cy="80" r="68" fill="url(#gcAura)" />

    {/* Floating 3D Micro-Orbs & Spark */}
    <circle cx="136" cy="40" r="6.5" fill="url(#gcOrb)" opacity="0.92" />
    <circle cx="24" cy="122" r="5" fill="url(#gcOrb)" opacity="0.82" />
    <path
      d="M27 32 L29.5 38.6 L36 41 L29.5 43.4 L27 50 L24.5 43.4 L18 41 L24.5 38.6 Z"
      fill="#FEF08A"
      opacity="0.94"
    />

    {/* Tilted 3D Sculpted Graduation Cap */}
    <g transform="rotate(-8 80 80)">
      {/* 3D Cylindrical Skullcap Base Underneath */}
      <path
        d="M44 74 L44 106 C44 119 61 128 82 128 C103 128 120 119 120 106 L120 74 Z"
        fill="url(#gcBase)"
        stroke="#FCD34D"
        strokeOpacity="0.45"
        strokeWidth="1.6"
      />
      {/* Cast Shadow Under Mortarboard Overhang */}
      <path
        d="M44 74 L82 95 L120 74 L120 88 C105 97 93 102 82 103 C71 102 59 97 44 88 Z"
        fill="#3B1104"
        opacity="0.58"
      />
      {/* Specular Vertical Sheen on Left Curve of Base */}
      <path
        d="M52 84 L52 113 C56 116 61 118 65 119 L65 90 Z"
        fill="#FEF08A"
        opacity="0.22"
      />
      {/* Glowing Gold Lower Rim Accent */}
      <path
        d="M45.5 106 C47 118 62.5 126.5 82 126.5 C101.5 126.5 117 118 118.5 106"
        stroke="#FDE68A"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.72"
      />

      {/* 3D Extruded Front-Left Mortarboard Side Wall (Thickness) */}
      <path
        d="M15 62 L82 95 L82 103.5 L15 70.5 Z"
        fill="url(#gcWallLeft)"
      />
      {/* 3D Extruded Front-Right Mortarboard Side Wall */}
      <path
        d="M149 62 L82 95 L82 103.5 L149 70.5 Z"
        fill="url(#gcWallRight)"
      />

      {/* Main Glossy Diamond Mortarboard Top Surface */}
      <path
        d="M82 29 L149 62 L82 95 L15 62 Z"
        fill="url(#gcTop)"
        stroke="#FEF9C3"
        strokeOpacity="0.92"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Curved Specular Reflection Across Top Diamond */}
      <path
        d="M82 31.5 L127 54 C105 58 76 68 50 78 L18 62 Z"
        fill="url(#gcGloss)"
      />

      {/* Center Raised 3D Gold Button & Draped Golden Tassel */}
      <g filter="url(#gcShadow)">
        {/* Golden Cord Sweeping Over Left Corner */}
        <path
          d="M82 61 C62 63 45 69 36 81 C31 88 29 97 29 107"
          stroke="#78350F"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity="0.45"
          transform="translate(1.5, 2.5)"
        />
        <path
          d="M82 61 C62 63 45 69 36 81 C31 88 29 97 29 107"
          stroke="url(#gcTassel)"
          strokeWidth="4.4"
          strokeLinecap="round"
        />

        {/* 3D Gold Top Dome Button */}
        <ellipse cx="82" cy="62" rx="9" ry="5.5" fill="#78350F" opacity="0.55" />
        <ellipse
          cx="82"
          cy="60.5"
          rx="8"
          ry="4.8"
          fill="url(#gcTassel)"
          stroke="#FEF9C3"
          strokeWidth="1.2"
        />
        <ellipse cx="79.5" cy="59" rx="3" ry="1.6" fill="#FFFFFF" opacity="0.8" />

        {/* Tassel Knot Bead */}
        <circle
          cx="29"
          cy="108"
          r="5"
          fill="url(#gcTassel)"
          stroke="#FEF9C3"
          strokeWidth="1.2"
        />

        {/* Sculpted Multi-Ribbed 3D Golden Tassel Bell */}
        <path
          d="M24 112 L34 112 L38 134 C34 136.5 24 136.5 20 134 Z"
          fill="url(#gcTassel)"
          stroke="#FEF9C3"
          strokeOpacity="0.85"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Tassel Strand Highlights */}
        <path
          d="M27 115 L25.5 133 M31 115 L32.5 133"
          stroke="#B45309"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M29 114 L29 134"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  </svg>
);
