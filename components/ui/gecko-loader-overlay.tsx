'use client';

import { GeckoLoader } from './gecko-loader';

type GeckoLoaderOverlayProps = {
  /** When true, overlay covers the viewport (fixed). When false, covers parent (absolute). */
  fullScreen?: boolean;
  className?: string;
};

/**
 * Blocking overlay with Gecko loader. Use for submissions, heavy transitions, or modal-like loading.
 */
export function GeckoLoaderOverlay({
  fullScreen = true,
  className = '',
}: GeckoLoaderOverlayProps) {
  const positionClasses = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-40';

  return (
    <div
      className={`${positionClasses} flex items-center justify-center bg-white/60 backdrop-blur-sm ${className}`}
      role="status"
      aria-label="Loading"
    >
      <GeckoLoader minHeight="min-h-0" />
    </div>
  );
}
