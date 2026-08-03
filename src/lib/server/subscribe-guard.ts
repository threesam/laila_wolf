// Bot guard for the newsletter endpoint.
//
// Five junk signups in five weeks got on the list because the endpoint's only
// check was `if (!email)` — `{"email":"x"}` was a valid submission and anything
// gmail-shaped went straight through. Three layers now, different in kind:
//
//   rate limit  every request from one address, whatever shape it takes
//   shape       a malformed or oversized address never reaches listmonk
//   honeypot    a field only an automated filler will populate
//
// The rate limit is a REQUEST-level concern, the other two are PAYLOAD-level, so
// they are separate exports. The route calls isRateLimited() before reading the
// body: counting after the parse let malformed floods buy parse work untracked.
//
// SILENT vs VISIBLE is the line that matters most here, and it is about who can
// trip a check, not how bad the check is. A silent rejection tells the sender
// nothing — which is right for a bot and catastrophic for a person, because it
// reports success while doing nothing. So silence is reserved for the single
// check no real visitor can trip: a honeypot that was actually FILLED. A missing
// one is refused visibly, because a page open since before a deploy sends none.
//
// A submit-timing trap was written and then removed for failing that test: a
// password manager can beat any human-plausible threshold, silently. The
// honeypot field is named to avoid the same trap from the other direction —
// `company` is an autofill target, so it is not called that. See $lib/honeypot.

export const MAX_EMAIL_LENGTH = 254

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_SWEEP_AT = 10_000

// Per-instance and in-memory: on a serverless adapter it resets on cold start
// and is not shared between instances. A real ceiling, not a rate limiter — it
// stops one bot hammering one warm instance and nothing more.
const requestLog = new Map<string, number[]>()

export function resetGuardForTests(): void {
	requestLog.clear()
}

/**
 * Records this attempt and reports whether the address is now over its limit.
 * Call once per request, before any other work — that is what makes the count
 * cover every request rather than only the ones that parse.
 */
export function isRateLimited(ip: string, now: number = Date.now()): boolean {
	if (requestLog.size > RATE_LIMIT_SWEEP_AT) {
		for (const [key, stamps] of requestLog) {
			const fresh = stamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
			if (fresh.length === 0) requestLog.delete(key)
			else requestLog.set(key, fresh)
		}
	}
	const recent = requestLog.get(ip)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? []
	recent.push(now)
	requestLog.set(ip, recent)
	return recent.length > RATE_LIMIT_MAX_REQUESTS
}

export type GuardVerdict =
	| { pass: true; email: string }
	| { pass: false; silent: true }
	| { pass: false; silent: false; status: number; message: string }

export function guardSubmission(input: {
	// `unknown`, not string, and that is the point: these come off a parsed JSON
	// body where the `as` cast at the call site is erased and guarantees nothing.
	// Typed as strings, `{"email":123}` reached `.trim()` and threw — a 500 out
	// of the layer whose job is controlled rejection.
	email: unknown
	honeypot: unknown
}): GuardVerdict {
	const email = typeof input.email === 'string' ? input.email.trim() : ''

	if (!email) {
		return { pass: false, silent: false, status: 400, message: 'email required' }
	}
	if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
		return { pass: false, silent: false, status: 400, message: 'invalid email' }
	}

	// Absent: a direct API caller that never knew the field existed, or a page
	// open since before this deployed. Both refused, visibly — see the header.
	if (typeof input.honeypot !== 'string') {
		return { pass: false, silent: false, status: 400, message: 'stale form, please refresh' }
	}
	// Filled: the one check a real visitor cannot trip, so the only silent one.
	// Compared rather than trimmed, so `"  "` is caught too.
	if (input.honeypot !== '') {
		return { pass: false, silent: true }
	}

	return { pass: true, email }
}
