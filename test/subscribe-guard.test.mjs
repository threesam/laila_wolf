import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { guardSubmission, resetGuardForTests } from '../src/lib/server/subscribe-guard.ts'

// A submission that should pass every layer. Each test below changes exactly
// one field, so a failure names the layer that rejected it.
const good = () => ({
	email: 'reader@example.com',
	company: '',
	ip: '203.0.113.7',
	now: 1_700_000_000_000
})

beforeEach(resetGuardForTests)

test('passes a real submission and hands back the trimmed address', () => {
	const verdict = guardSubmission({ ...good(), email: '  reader@example.com  ' })
	assert.equal(verdict.pass, true)
	assert.equal(verdict.email, 'reader@example.com')
})

test('rejects a missing or malformed address before listmonk sees it', () => {
	// A distinct address per case. The rate limit runs first now, so sharing one
	// would make the sixth case come back 429 and stop testing shape at all.
	const cases = [undefined, '', '   ', 'x', 'no-at-sign.com', 'two@@at.com', 'a@b']
	cases.forEach((email, i) => {
		const verdict = guardSubmission({ ...good(), email, ip: `203.0.113.${i}` })
		assert.equal(verdict.pass, false, `accepted ${JSON.stringify(email)}`)
		assert.equal(verdict.silent, false)
		assert.equal(verdict.status, 400)
	})
})

test('rejects an oversized address', () => {
	const email = `${'a'.repeat(250)}@example.com`
	const verdict = guardSubmission({ ...good(), email })
	assert.equal(verdict.pass, false)
	assert.equal(verdict.status, 400)
})

test('returns a controlled rejection for non-string json rather than throwing', () => {
	// The `as` cast at the call site is erased at runtime, so the body can hold
	// anything at all. Before these were type-checked, {"email":123} reached
	// .trim() and threw — a 500 out of the layer whose entire purpose is to
	// return controlled rejections, triggerable by three bytes of JSON.
	assert.equal(guardSubmission({ ...good(), email: 123, ip: '192.0.2.1' }).status, 400)
	assert.equal(guardSubmission({ ...good(), email: {}, ip: '192.0.2.2' }).status, 400)
	assert.equal(guardSubmission({ ...good(), email: null, ip: '192.0.2.3' }).status, 400)
	// A non-string honeypot is not this form either, so it fails silently.
	assert.equal(guardSubmission({ ...good(), company: {}, ip: '192.0.2.4' }).silent, true)
	// Whitespace used to be trimmed to empty and let through.
	assert.equal(guardSubmission({ ...good(), company: '  ', ip: '192.0.2.5' }).silent, true)
})

test('a filled honeypot fails silently, so the bot cannot tell it was caught', () => {
	const verdict = guardSubmission({ ...good(), company: 'Acme' })
	assert.equal(verdict.pass, false)
	assert.equal(verdict.silent, true)
})

test('accepts a submission with no honeypot field at all', () => {
	// A page that was already open when a deploy lands still posts the old
	// payload. Rejecting an ABSENT honeypot would fail those visitors silently —
	// they would be told they subscribed and never be. Absent is tolerated;
	// present-and-non-empty is not.
	const { company, ...withoutHoneypot } = good()
	void company
	assert.equal(guardSubmission(withoutHoneypot).pass, true)
})

test('counts every request toward the limit, whatever layer would catch it', () => {
	const now = 1_700_000_000_000
	// Five malformed submissions. Each is rejected on shape — and each still
	// ticks the counter, which is the whole point of the rate limit running
	// first. Were it last, these five would return early without counting and
	// the sixth would come back 400, meaning a bot sending garbage could spray
	// the endpoint forever without ever being limited.
	for (let i = 0; i < 5; i++) guardSubmission({ ...good(), email: 'nope', now: now + i })
	assert.equal(guardSubmission({ ...good(), now: now + 5 }).status, 429)
})

test('rate-limits a burst from one address, and lets a different one through', () => {
	const now = 1_700_000_000_000
	for (let i = 0; i < 5; i++) {
		assert.equal(guardSubmission({ ...good(), now: now + i }).pass, true, `blocked at ${i}`)
	}
	const sixth = guardSubmission({ ...good(), now: now + 5 })
	assert.equal(sixth.pass, false)
	assert.equal(sixth.silent, false)
	assert.equal(sixth.status, 429)

	// A rate limit that leaked across IPs would take the whole list offline the
	// moment one bot showed up.
	assert.equal(guardSubmission({ ...good(), ip: '198.51.100.4', now: now + 5 }).pass, true)
})

test('forgets a burst once the window has passed', () => {
	const now = 1_700_000_000_000
	for (let i = 0; i < 6; i++) guardSubmission({ ...good(), now: now + i })
	assert.equal(guardSubmission({ ...good(), now: now + 61_000 }).pass, true)
})
