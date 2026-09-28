import assert from 'node:assert/strict'
import { test } from 'node:test'
import { relevelHeadings } from '../src/lib/utils/headings.ts'

const h = (style, text = 'x') => ({ _type: 'block', style, children: [{ text }] })
const styles = (blocks) => relevelHeadings(blocks).map((b) => b.style)

test('siblings stay siblings and levels never skip below the page h1', () => {
	// the about page: sibling h4 year headings under the h1
	assert.deepEqual(styles([h('h4'), h('normal'), h('h4'), h('h5'), h('h4')]), [
		'h2',
		'normal',
		'h2',
		'h3',
		'h2'
	])
	assert.deepEqual(styles([h('h2'), h('h4'), h('h3'), h('h2')]), ['h2', 'h3', 'h3', 'h2'])
})

test('drops empty headings, keeps the authored style for sizing', () => {
	const out = relevelHeadings([h('h3', '  '), h('h4'), { _type: 'image' }])
	assert.deepEqual(
		out.map((b) => b.style ?? b._type),
		['h2', 'image']
	)
	assert.equal(out[0].authoredStyle, 'h4')
})
