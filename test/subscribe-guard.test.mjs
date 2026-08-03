import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
	guardSubmission,
	isRateLimited,
	resetGuardForTests
} from '../src/lib/server/subscribe-guard.ts'

// A submission that should pass every layer. Each test below changes exactly
// one field, so a failure names the layer that rejected it.
const good = () => ({ email: 'reader@example.com', honeypot: '' })

beforeEach(resetGuardForTests)

test('passes a real submission and hands back the trimmed address', () => {
	const verdict = guardSubmission({ ...good(), email: '  reader@example.com  ' })
	assert.equal(verdict.pass, true)
	assert.equal(verdict.email, 'reader@example.com')
})

test('rejects a missing or malformed address before listmonk sees it', () => {
	for (const email of [undefined, '', '   ', 'x', 'no-at-sign.com', 'two@@at.com', 'a@b']) {
		const verdict = guardSubmission({ ...good(), email })
		assert.equal(verdict.pass, false, `accepted ${JSON.stringify(email)}`)
		assert.equal(verdict.silent, false)
		assert.equal(verdict.status, 400)
	}
})

test('rejects an oversized address', () => {
	const verdict = guardSubmission({ ...good(), email: `${'a'.repeat(250)}@example.com` })
	assert.equal(verdict.pass, false)
	assert.equal(verdict.status, 400)
})

test('returns a controlled rejection for non-string json rather than throwing', () => {
	// The `as` cast at the call site is erased at runtime, so the body can hold
	// anything at all. Before these were type-checked, {"email":123} reached
	// .trim() and threw — a 500 out of the layer whose entire purpose is to
	// return controlled rejections, triggerable by three bytes of JSON.
	for (const email of [123, {}, null, [], true]) {
		assert.equal(guardSubmission({ ...good(), email }).status, 400, `accepted ${String(email)}`)
	}
})

test('a filled honeypot fails SILENTLY, so the bot cannot tell it was caught', () => {
	// The one check a real visitor cannot trip, which is what makes a silent
	// rejection safe here and nowhere else.
	for (const honeypot of ['Acme', '  ']) {
		const verdict = guardSubmission({ ...good(), honeypot })
		assert.equal(verdict.pass, false)
		assert.equal(verdict.silent, true, `not silent for ${JSON.stringify(honeypot)}`)
	}
})

test('a MISSING honeypot is refused visibly, not silently', () => {
	// Two senders arrive without it: a direct API caller that never knew the
	// field existed, and a page open since before this deployed. Refusing both
	// is the point — but silently would tell a real visitor on a stale page that
	// they subscribed when they did not, which is the failure mode this whole
	// guard is meant to avoid. Visible means a refresh fixes it.
	for (const honeypot of [undefined, null, 123, {}]) {
		const verdict = guardSubmission({ ...good(), honeypot })
		assert.equal(verdict.pass, false, `accepted ${String(honeypot)}`)
		assert.equal(verdict.silent, false, `silently dropped ${String(honeypot)}`)
		assert.equal(verdict.status, 400)
	}
})

test('rate-limits a burst from one address, and lets a different one through', () => {
	const now = 1_700_000_000_000
	for (let i = 0; i < 5; i++) {
		assert.equal(isRateLimited('203.0.113.7', now + i), false, `limited early at ${i}`)
	}
	assert.equal(isRateLimited('203.0.113.7', now + 5), true)

	// A limit that leaked across addresses would take the whole list offline the
	// moment one bot showed up.
	assert.equal(isRateLimited('198.51.100.4', now + 5), false)
})

test('forgets a burst once the window has passed', () => {
	const now = 1_700_000_000_000
	for (let i = 0; i < 6; i++) isRateLimited('203.0.113.7', now + i)
	assert.equal(isRateLimited('203.0.113.7', now + 61_000), false)
})
