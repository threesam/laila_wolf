type Block = { _type?: string; style?: string; children?: { text?: string }[] }

// Sanity content here has an empty heading and headings that skip levels (the
// bio's first heading is an h4 straight under the page h1). Both break the
// outline screen readers navigate by. Drop empty headings and re-level the rest
// so each sits exactly one below its nearest shallower authored heading (the page
// h1 is the root): h4 h4 h5 -> h2 h2 h3, siblings stay siblings. The authored
// style is kept as authoredStyle so the renderer can keep its visual size.
export function relevelHeadings<T>(blocks: T[]): T[] {
	const open: { authored: number; level: number }[] = []
	return blocks.flatMap((b) => {
		const block = b as Block
		const match = block._type === 'block' ? /^h([1-6])$/.exec(block.style ?? '') : null
		if (!match) return [b]
		if (!block.children?.some((c) => c.text?.trim())) return []
		const authored = Number(match[1])
		while ((open.at(-1)?.authored ?? 0) >= authored) open.pop()
		const level = Math.min((open.at(-1)?.level ?? 1) + 1, 6)
		open.push({ authored, level })
		return [{ ...b, style: `h${level}`, authoredStyle: block.style }]
	})
}
