/* Original, generated-style maternal-health illustration. Rendered inline as
   an SVG so no external image assets are required. Abstract and tasteful by
   design: soft shapes, no detailed facial features, muted palette. */

export function MaternalHero({
  className = "",
  id = "maternal-hero",
}: {
  className?: string;
  id?: string;
}) {
  const gid = `${id}-grad`;
  const gid2 = `${id}-grad2`;
  return (
    <svg
      viewBox="0 0 260 220"
      fill="none"
      aria-hidden="true"
      className={className}
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe4ee" />
          <stop offset="0.52" stopColor="#ffe9d8" />
          <stop offset="1" stopColor="#efe8f9" />
        </linearGradient>
        <linearGradient id={gid2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c9dc" />
          <stop offset="1" stopColor="#e577a2" />
        </linearGradient>
      </defs>

      {/* soft arch backdrop */}
      <path
        d="M130 8C70 8 24 54 24 114v98h212v-98C236 54 190 8 130 8Z"
        fill={`url(#${gid})`}
      />
      <circle cx="196" cy="52" r="34" fill="#fcd8b4" opacity="0.4" />
      <circle cx="52" cy="168" r="40" fill="#dfd1f2" opacity="0.35" />

      {/* botanical sprigs */}
      <g opacity="0.55">
        <path
          d="M216 168c-2-16-10-28-24-36"
          stroke="#7fa378"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M200 140c-6 2-10 7-12 14m0-16c-7 1-12 5-15 11m22 2c6 2 10 6 12 12"
          stroke="#a5bf9f"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g opacity="0.5">
        <path
          d="M46 58c2-16 10-28 24-36"
          stroke="#e577a2"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M62 30c6 2 10 7 12 14m-16-14c7 1 12 5 15 11M61 42c-6 2-10 6-12 12"
          stroke="#f6c9dc"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* mother figure */}
      <g>
        {/* hair */}
        <path
          d="M148 60c-3-20-22-28-38-22-16 6-22 22-18 36 4 12 14 18 27 18 12 0 22-6 26-16l2-10c1-3 1-5 1-6Z"
          fill="#6e2940"
        />
        {/* face */}
        <circle cx="132" cy="62" r="20" fill="#ffdfc9" />
        {/* hair covering back of head */}
        <path
          d="M124 44c-12 2-18 10-18 20 0 8 4 14 10 17l8-2c-5-3-8-8-8-14 0-8 4-15 12-18 2-1 4-1 6-1l-10-2Z"
          fill="#6e2940"
        />
        {/* eyebrow + closed eye for calm expression */}
        <path d="M136 56c3.5.5 6.5-.5 9-2.5" stroke="#8a4b33" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M137 63c3 1.5 6 1.5 9 0" stroke="#8a4b33" strokeWidth="1.6" strokeLinecap="round" />
        {/* cheek blush */}
        <circle cx="145" cy="66" r="3.4" fill="#e577a2" opacity="0.45" />
        {/* saree / torso wrapping the bump */}
        <path
          d="M120 78c-14 8-22 22-22 38 0 24 12 44 32 56 14-18 20-36 18-56-2-16-12-32-28-38Z"
          fill={`url(#${gid2})`}
        />
        {/* bump shading */}
        <path
          d="M96 118c0 18 10 34 22 42 14-8 20-24 18-42-2-14-10-26-20-30-10 2-18 12-20 30Z"
          fill="#a1355c"
          opacity="0.35"
        />
        {/* dupatta accent */}
        <path
          d="M118 82c-10 2-16 10-16 20 0 8 4 12 9 16"
          stroke="#fcd8b4"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* hands cradling the bump */}
        <path
          d="M96 132c-8 10-10 20-6 30"
          stroke="#ffdfc9"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M134 134c8 9 11 19 8 29"
          stroke="#ffdfc9"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>

      {/* small blossom on the bump */}
      <g>
        <circle cx="117" cy="126" r="6.5" fill="#ffffff" opacity="0.85" />
        <path d="M117 119c2 3 4 4 6 3m-6 8c2 3 4 4 6 3" stroke="#e577a2" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}