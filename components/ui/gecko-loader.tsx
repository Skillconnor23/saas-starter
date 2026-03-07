/**
 * Gecko Academy branded loader. Use for route loading, async sections, and suspense fallbacks.
 */
export function GeckoLoader({
  className,
  minHeight = 'min-h-[220px]',
}: {
  className?: string;
  minHeight?: string;
} = {}) {
  return (
    <div
      className={`relative flex w-full items-center justify-center ${minHeight} ${className ?? ''}`}
      role="status"
      aria-label="Loading"
    >
      <div className="loader">
        <div className="jimu-primary-loading" />
      </div>
    </div>
  );
}
