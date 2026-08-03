/**
 * The honeypot's field name, shared by the form that renders it and the route
 * that reads it. It lives HERE rather than in $lib/server because the component
 * needs it too, and SvelteKit refuses a $lib/server import from client code.
 *
 * Deliberately meaningless to a browser: anything an autofill heuristic
 * recognises (`company`, `organization`, `website`) risks a password manager
 * filling it for a real visitor, who would then be dropped SILENTLY — the exact
 * failure mode the submit-timing trap was removed for. The bots this catches
 * fill every input regardless of name, so an opaque one costs nothing.
 */
export const HONEYPOT_FIELD = 'referral_code'
