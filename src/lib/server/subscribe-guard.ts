// Bot guard for the newsletter endpoint.
//
// The list picked up five junk signups in five weeks. Every one was a
// well-formed gmail address, so listmonk accepted them all — the endpoint's
// only check was `if (!email)`, which meant `{"email":"x"}` was a valid
// submission and anything gmail-shaped went straight onto the list.
//
// Three layers, deliberately different in KIND: a bot that defeats one layer
// usually defeats every other layer of the same kind.
//
//   rate limit  every request from one address, whatever shape it takes
//   shape       a malformed or oversized address never reaches listmonk
//   honeypot    a field only an automated filler will populate
//
// The rate limit is a REQUEST-level concern and the other two are PAYLOAD-level,
// so they are separate exports. The route calls isRateLimited() before it reads
// the body at all: counting after the parse meant a flood of huge or malformed
// bodies bought parse work before anything throttled it, and an unparseable body
// was answered without ever being counted.
//
// SILENT vs VISIBLE rejection is the other line that matters here, and it is not
// about severity — it is about who can trip the check.
//
//   silent   only for a check a real person CANNOT trip. A filled honeypot is
//            the only one that qualifies: nobody types into an off-screen field.
//            The bot gets a normal 200 and learns nothing.
//   visible  everything else, including a MISSING honeypot. A page that was
//            already open when this deployed still posts the old payload, and a
//            direct API caller sends no honeypot either. Answering those
//            silently would tell a real visitor they subscribed when they did
//            not; an error they can recover from with a refresh is strictly
//            better, and it still refuses the direct caller.
//
// A submit-timing trap was written and then removed: a password manager filling
// the field can beat any human-plausible threshold, and it fails silently, so it
// could lose real subscribers invisibly to catch bots the honeypot already gets.
//
// No SvelteKit imports on purpose: everything here is a pure function of its
// arguments, so the whole guard is testable without a request or a server.

export const MAX_EMAIL_LENGTH = 254

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_SWEEP_AT = 10_000

// Per-instance and in-memory, which on a serverless adapter means it resets on
// every cold start and is not shared between concurrent instances. That is a
// real ceiling, not a rate limiter: it stops one bot hammering one warm
// instance, and nothing more. A shared store is the upgrade if volume ever
// justifies one.
const requestLog = new Map<string, number[]>()

export function resetGuardForTests(): void {
	requestLog.clear()
}

/**
 * Records this attempt and reports whether the address is now over its limit.
 * Call it once per request, before any other work — it is what makes the count
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
	// Carries the trimmed address so the caller sends the value that was
	// actually validated, rather than re-deriving it from the raw body.
	| { pass: true; email: string }
	// Caller returns a normal 200 without calling listmonk.
	| { pass: false; silent: true }
	| { pass: false; silent: false; status: number; message: string }

export function guardSubmission(input: {
	// Both are `unknown`, not string, and that is the point. They arrive off a
	// parsed JSON body, where the `as` cast at the call site is erased at
	// compile time and guarantees nothing. Declaring them as strings made
	// `{"email":123}` a TypeError inside `.trim()` — a 500 thrown by the layer
	// whose entire job is to return controlled rejections. `unknown` makes the
	// runtime check impossible to forget.
	email: unknown
	/** Honeypot. Named `company` because that is what a field-filler expects. */
	company: unknown
}): GuardVerdict {
	const email = typeof input.email === 'string' ? input.email.trim() : ''

	if (!email) {
		return { pass: false, silent: false, status: 400, message: 'email required' }
	}
	if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
		return { pass: false, silent: false, status: 400, message: 'invalid email' }
	}

	// The form always posts a string, empty when untouched. Anything else did not
	// come from this form: a direct API call that never knew the field existed,
	// or a page open since before this deployed. Visible, so a stale page shows a
	// recoverable error rather than a false success — see the header.
	if (typeof input.company !== 'string') {
		return { pass: false, silent: false, status: 400, message: 'stale form, please refresh' }
	}
	// Present and non-empty means a filler touched it. Compared rather than
	// trimmed, so `"  "` is caught too. The only silent rejection here.
	if (input.company !== '') {
		return { pass: false, silent: true }
	}

	return { pass: true, email }
}
