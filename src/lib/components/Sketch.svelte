<script lang="ts">
	import { onMount } from 'svelte'

	let width = 0
	let height = 0
	let visible = false
	let container: HTMLDivElement

	onMount(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						visible = true
						io.disconnect()
					}
				}
			},
			{ rootMargin: '200px' }
		)
		io.observe(container)
		return () => io.disconnect()
	})

	type Point = {
		x: number
		y: number
		size: number
		color: number[]
	}

	let component: typeof import('p5-svelte').default | undefined
	let sketch: import('p5-svelte').Sketch | undefined

	$: if (visible && !component) {
		Promise.all([
			import('p5-svelte'),
		]).then(([mod]) => {
			component = mod.default
			sketch = (p5) => {
				const points: Point[] = []
				p5.setup = () => {
					p5.createCanvas(width, height)
					for (let i = 0; i < 200; i++) {
						const size = p5.random(3, 20)
						const x = p5.random(width - size)
						const y = p5.random(height)
						const color = p5.random() > 0.5 ? [183, 198, 175] : [56, 80, 69]
						let collision = false
						for (const point of points) {
							if (p5.dist(x, y, point.x, point.y) < 25) collision = true
						}
						if (!collision) points.push({ x, y, size, color })
					}
				}
				p5.draw = () => {
					p5.frameRate(30)
					p5.background(17, 17, 17)
					for (const point of points) {
						const { x, y, size, color } = point
						if (y < -size) point.y = height + size
						else point.y -= 1
						p5.stroke(color[0] ?? 0, color[1] ?? 0, color[2] ?? 0)
						p5.fill(17, 17, 17)
						p5.strokeWeight(2)
						p5.circle(x, y, size)
					}
				}
			}
		})
	}
</script>

<div
	bind:this={container}
	bind:clientWidth={width}
	bind:clientHeight={height}
	class="absolute inset-0 overflow-hidden bg-[#111]"
>
	{#if visible && component && sketch}
		<svelte:component this={component} {sketch} />
	{/if}
</div>
