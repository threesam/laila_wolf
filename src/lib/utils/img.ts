/**
 * Append optimization params to Sanity CDN image URLs.
 * No-ops for non-Sanity URLs.
 */
export function optimize(
	src: string | null | undefined,
	opts: { w?: number; q?: number; format?: 'auto' | 'webp' } = {}
): string | undefined {
	if (!src) return undefined
	if (!src.includes('cdn.sanity.io')) return src
	const u = new URL(src)
	if (opts.w) u.searchParams.set('w', String(opts.w))
	if (opts.q) u.searchParams.set('q', String(opts.q))
	u.searchParams.set('auto', opts.format ?? 'format')
	u.searchParams.set('fit', 'max')
	return u.toString()
}
