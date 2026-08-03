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
// The rate limit runs FIRST, and the order is load-bearing. The layers below
// it return early, so a check placed after them never sees the requests they
// caught. Counting first is what lets it limit an abusive address whatever
// shape its requests take — including bodies that are not even valid JSON,
// which the route hands through rather than rejecting on its own.
//
// A SILENT rejection is only safe for a check a real person cannot trip. The
// honeypot qualifies: nobody fills an off-screen field. A submit-timing trap
// does not, which is why there isn't one here — it was written, then removed
// once it turned out a password manager filling the field can beat any
// human-plausible threshold, and any already-open page would trip it the
// instant a deploy changed the payload. Both failures end with a real
// subscriber being told they joined and silently not joining, which is worse
// than the handful of bots the layer would have caught. What it defended that
// the others do not — a bare {"email":"..."} POST straight at this endpoint,
// skipping the form — is now covered only by the rate limit above.
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

function isRateLimited(ip: string, now: number): boolean {
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
	// Caller returns a normal 200 without calling listmonk. The bot cannot
	// learn which layer caught it, so it has nothing to tune against.
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
	company?: unknown
	ip: string
	/** Injectable so the tests do not have to sleep. */
	now?: number
}): GuardVerdict {
	const now = input.now ?? Date.now()
	const email = typeof input.email === 'string' ? input.email.trim() : ''

	// First, so the counter sees every request rather than only the ones the
	// layers below let through. See the ordering note in the header.
	if (isRateLimited(input.ip, now)) {
		return { pass: false, silent: false, status: 429, message: 'too many requests' }
	}

	if (!email) {
		return { pass: false, silent: false, status: 400, message: 'email required' }
	}
	if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
		return { pass: false, silent: false, status: 400, message: 'invalid email' }
	}

	// The form always posts an empty string. Absent is tolerated, which is what
	// keeps a page that was already open when a deploy landed from breaking;
	// anything else — text, whitespace, or a value that is not a string at all
	// — means something other than this form filled it. Compared rather than
	// trimmed, so `"  "` is caught too.
	if (input.company !== undefined && input.company !== '') {
		return { pass: false, silent: true }
	}

	return { pass: true, email }
}
