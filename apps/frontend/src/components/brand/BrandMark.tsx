/** Shared logo used on public pages and in the patient/care-team layout. */
export function BrandMark({
  className = "",
  id,
}: {
  className?: string;
  id?: string;
}) {
  return (
    <img
      id={id}
      src="/brand-logo.png"
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      className={`object-contain ${className}`}
      decoding="async"
    />
  );
}
