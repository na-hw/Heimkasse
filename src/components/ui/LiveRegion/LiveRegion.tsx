"use client";

import { useAnnouncer } from "./announcer";

/** Visually hidden aria-live regions. Render once at the app root. */
export function LiveRegion() {
  const polite = useAnnouncer((s) => s.polite);
  const assertive = useAnnouncer((s) => s.assertive);
  return (
    <>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="visually-hidden" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </>
  );
}
