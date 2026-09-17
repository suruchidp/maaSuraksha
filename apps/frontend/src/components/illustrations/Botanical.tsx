/* Small reusable botanical accent used for subtle decoration. Original SVG,
   no external assets. */

export function BotanicalSprig({
  className = "",
  tone = "rose",
}: {
  className?: string;
  tone?: "rose" | "sage";
}) {
  const leaf = tone === "sage" ? "#a5bf9f" : "#f6c9dc";
  const stem = tone === "sage" ? "#7fa378" : "#e577a2";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 52C12 34 24 20 46 16"
        stroke={stem}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 44c-8-2-13 1-15 6m9-9c-5-5-11-6-16-4m25 11c4-4 5-9 4-14"
        stroke={leaf}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="46" cy="16" r="4.5" fill={leaf} opacity="0.9" />
    </svg>
  );
}