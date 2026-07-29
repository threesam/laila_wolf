// Prerender by default, declared here because the quota-sensitive Sanity read
// lives in the root layout load — so the invariant belongs at the same boundary.
// Declaring it per-leaf instead would let a new page silently go dynamic and
// start hitting Sanity once per visitor again, which is what took this site
// down. Routes that genuinely need a server opt out explicitly.
//
// The read now happens once per deploy, so content republishes on rebuild —
// point a Sanity webhook at a Vercel deploy hook if edits need to land sooner.
//
// Trade-off worth knowing: this moves the fallback from request-time resilience
// to a deploy-time snapshot. If Sanity is unreachable during a build, the
// committed fallback is baked in and stays published until the next deploy, even
// once Sanity recovers. That is the intended bias — a deploy during an outage
// still ships a working site — and the load logs a warning on that path, so the
// build output shows when it happened. Redeploy to pick content back up.
export const prerender = true
