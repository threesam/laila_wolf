<script lang="ts">
	import { onMount } from 'svelte'

	type Point = {
		x: number
		y: number
		size: number
		color: [number, number, number]
	}

	let container = $state<HTMLDivElement | null>(null)
	let canvas = $state<HTMLCanvasElement | null>(null)

	onMount(() => {
		if (!container || !canvas) return

		// Respect prefers-reduced-motion — render a single static frame, no animation.
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		const reduce = motionQuery.matches

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let width = 0
		let height = 0
		let points: Point[] = []
		let rafId = 0
		let started = false
		let cleanups: Array<() => void> = []

		const dpr = Math.min(window.devicePixelRatio || 1, 2)

		function seed(w: number, h: number) {
			points = []
			for (let i = 0; i < 200; i++) {
				const size = 3 + Math.random() * 17
				const x = Math.random() * (w - size)
				const y = Math.random() * h
				const color: [number, number, number] =
					Math.random() > 0.5 ? [183, 198, 175] : [56, 80, 69]
				let collision = false
				for (const p of points) {
					const dx = x - p.x
					const dy = y - p.y
					if (dx * dx + dy * dy < 625) {
						collision = true
						break
					}
				}
				if (!collision) points.push({ x, y, size, color })
			}
		}

		function resize() {
			if (!canvas || !container) return
			width = container.clientWidth
			height = container.clientHeight
			canvas.width = Math.floor(width * dpr)
			canvas.height = Math.floor(height * dpr)
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
			seed(width, height)
		}

		function draw() {
			if (!ctx) return
			ctx.fillStyle = '#111'
			ctx.fillRect(0, 0, width, height)
			ctx.lineWidth = 2
			for (const p of points) {
				if (p.y < -p.size) p.y = height + p.size
				else if (!reduce) p.y -= 1
				ctx.strokeStyle = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`
				ctx.fillStyle = '#111'
				ctx.beginPath()
				ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()
			}
			if (!reduce) rafId = requestAnimationFrame(draw)
		}

		function start() {
			if (started) return
			started = true
			resize()
			const onResize = () => resize()
			window.addEventListener('resize', onResize)
			cleanups.push(() => window.removeEventListener('resize', onResize))
			// First paint via rIC so we don't compete with LCP; fall back to setTimeout.
			const kickoff = () => {
				rafId = requestAnimationFrame(draw)
			}
			const ric = (
				window as Window & {
					requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
				}
			).requestIdleCallback
			if (ric) ric(kickoff, { timeout: 800 })
			else setTimeout(kickoff, 250)
		}

		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						start()
						io.disconnect()
					}
				}
			},
			{ rootMargin: '200px' },
		)
		io.observe(container)
		cleanups.push(() => io.disconnect())

		return () => {
			cancelAnimationFrame(rafId)
			for (const fn of cleanups) fn()
		}
	})
</script>

<div bind:this={container} class="absolute inset-0 overflow-hidden bg-[#111]">
	<canvas bind:this={canvas} aria-hidden="true" class="block h-full w-full"></canvas>
</div>
