// Prerendered so the Sanity read happens once per deploy instead of once per
// visitor. That is what keeps this site inside the plan's request quota — the
// quota tripping is what took it down. Content is republished on rebuild, so
// wire a Sanity webhook to a Vercel deploy hook if edits need to land sooner.
export const prerender = true
