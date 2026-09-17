/* MaaSuraksha brand mark: a warm, reassuring mother-and-baby emblem in the
   soft maternal palette. Original SVG, rendered inline so no external assets
   are needed.

   Design intent: a clean, professional healthcare-style silhouette — no facial
   features — so it always reads calm and friendly at any size. A mother (hair
   bun, bust) holds a swaddled baby in the crook of her arm, with a soft bond
   heart between them, on the rose gradient tile. */

export function BrandMark({
  className = "",
  id = "maasuraksha-mark",
}: {
  className?: string;
  id?: string;
}) {
  const gid = `${id}-grad`;
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      role="img"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d95588" />
          <stop offset="1" stopColor="#a1355c" />
        </linearGradient>
      </defs>

      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={`url(#${gid})`} />

      {/* mother: bust, head with hair bun (clean silhouette) */}
      <ellipse
        cx="20"
        cy="32.5"
        rx="5.8"
        ry="9"
        fill="#ffffff"
        transform="rotate(-18 20 32.5)"
      />
      <circle cx="16.8" cy="18.7" r="5.5" fill="#ffffff" />
      <circle cx="12.5" cy="13" r="2.4" fill="#ffffff" />

      {/* mother's arm cradling the baby */}
      <path
        d="M13.8 29c1.8 9.5 17 11 24 4.6"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* baby: swaddled body and head */}
      <ellipse
        cx="31.7"
        cy="35.3"
        rx="4.9"
        ry="3.2"
        fill="#ffffff"
        transform="rotate(-34 31.7 35.3)"
      />
      <circle cx="33.6" cy="28" r="3.5" fill="#ffffff" />

      {/* bond heart */}
      <g transform="translate(24,25) scale(0.21)">
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          fill="#fbe4ee"
        />
      </g>
    </svg>
  );
}