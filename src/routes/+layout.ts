// Prerender by default, declared here because the quota-sensitive Sanity read
// lives in the root layout load — so the invariant belongs at the same boundary.
// Declaring it per-leaf instead would let a new page silently go dynamic and
// start hitting Sanity once per visitor again, which is what took this site
// down. Routes that genuinely need a server opt out explicitly.
//
// The read now happens once per deploy, so content republishes on rebuild —
// point a Sanity webhook at a Vercel deploy hook if edits need to land sooner.
export const prerender = true
