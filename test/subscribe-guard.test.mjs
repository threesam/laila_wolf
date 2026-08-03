import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
	MIN_SUBMIT_MS,
	guardSubmission,
	resetGuardForTests
} from '../src/lib/server/subscribe-guard.ts'

// A submission that should pass every layer. Each test below changes exactly
// one field, so a failure names the layer that rejected it.
const good = () => ({
	email: 'reader@example.com',
	company: '',
	elapsedMs: MIN_SUBMIT_MS + 1,
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
	for (const email of [undefined, '', '   ', 'x', 'no-at-sign.com', 'two@@at.com', 'a@b']) {
		const verdict = guardSubmission({ ...good(), email })
		assert.equal(verdict.pass, false, `accepted ${JSON.stringify(email)}`)
		assert.equal(verdict.silent, false)
		assert.equal(verdict.status, 400)
	}
})

test('rejects an oversized address', () => {
	const email = `${'a'.repeat(250)}@example.com`
	const verdict = guardSubmission({ ...good(), email })
	assert.equal(verdict.pass, false)
	assert.equal(verdict.status, 400)
})

test('a filled honeypot fails silently, so the bot cannot tell it was caught', () => {
	const verdict = guardSubmission({ ...good(), company: 'Acme' })
	assert.equal(verdict.pass, false)
	assert.equal(verdict.silent, true)
})

test('rejects a submission with no elapsed count — it did not come from the form', () => {
	for (const elapsedMs of [undefined, NaN, Infinity, 'soon']) {
		const verdict = guardSubmission({ ...good(), elapsedMs })
		assert.equal(verdict.pass, false, `accepted ${String(elapsedMs)}`)
		assert.equal(verdict.silent, true)
	}
})

test('rejects a submission faster than a human, and accepts one at the threshold', () => {
	assert.equal(guardSubmission({ ...good(), elapsedMs: 40 }).pass, false)
	assert.equal(guardSubmission({ ...good(), elapsedMs: MIN_SUBMIT_MS - 1 }).pass, false)
	assert.equal(guardSubmission({ ...good(), elapsedMs: MIN_SUBMIT_MS }).pass, true)
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
