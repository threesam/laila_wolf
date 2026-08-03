// Bot guard for the newsletter endpoint.
//
// The list picked up five junk signups in five weeks. Every one was a
// well-formed gmail address, so listmonk accepted them all — the endpoint's
// only check was `if (!email)`, which meant `{"email":"x"}` was a valid
// submission and anything gmail-shaped went straight onto the list.
//
// Four layers, cheapest first, deliberately different in KIND: a bot that
// defeats one layer usually defeats every other layer of the same kind.
//
//   shape       a malformed or oversized address never reaches listmonk
//   honeypot    a field only an automated filler will populate
//   time-trap   nobody finds this form and submits it inside 1.5 seconds
//   rate limit  the only layer still standing if a bot skips the form and
//               POSTs this endpoint directly
//
// No SvelteKit imports on purpose: everything here is a pure function of its
// arguments, so the whole guard is testable without a request or a server.

export const MAX_EMAIL_LENGTH = 254

// 1.5s, not the 3s sixtom uses, because the failure is asymmetric here: a
// time-trap rejection is SILENT, so a real person who trips it is told they
// subscribed and never does. Bots submit in tens of milliseconds, so 1.5s
// already clears them by more than an order of magnitude, and no human lands
// on a page, finds the field, fills it — autofill included — and clicks inside
// it. Buying a wider margin against bots by silently losing subscribers is the
// wrong trade.
export const MIN_SUBMIT_MS = 1500

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
	email: string | undefined
	/** Honeypot. Named `company` because that is what a field-filler expects. */
	company?: string | undefined
	/** Milliseconds the visitor had the form open. See the note below. */
	elapsedMs?: number | undefined
	ip: string
	/** Injectable so the tests do not have to sleep. */
	now?: number
}): GuardVerdict {
	const now = input.now ?? Date.now()
	const email = (input.email ?? '').trim()

	if (!email) {
		return { pass: false, silent: false, status: 400, message: 'email required' }
	}
	if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
		return { pass: false, silent: false, status: 400, message: 'invalid email' }
	}

	if ((input.company ?? '').trim() !== '') {
		return { pass: false, silent: true }
	}

	// The client sends ELAPSED time, not the timestamp it started at. Comparing
	// a browser clock against the server's would silently drop every visitor
	// whose clock runs fast — they would look like they submitted before they
	// arrived. A bot can forge an elapsed count exactly as easily as a start
	// time, so trusting the client's own subtraction costs nothing and removes
	// a whole class of false rejection.
	//
	// Unconditional, unlike sixtom's version: that form is progressive
	// enhancement and has to survive JS never running. This one only ever
	// submits through fetch, so a request with no elapsed count did not come
	// from the form.
	if (typeof input.elapsedMs !== 'number' || !Number.isFinite(input.elapsedMs)) {
		return { pass: false, silent: true }
	}
	if (input.elapsedMs < MIN_SUBMIT_MS) {
		return { pass: false, silent: true }
	}

	if (isRateLimited(input.ip, now)) {
		return { pass: false, silent: false, status: 429, message: 'too many requests' }
	}

	return { pass: true, email }
}
