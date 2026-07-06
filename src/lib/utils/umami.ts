type UmamiTrackProps = Record<string, string | number | boolean | undefined>

declare global {
	interface Window {
		umami?: {
			track: (event: string, data?: UmamiTrackProps) => void
		}
	}
}

export function trackEvent(name: string, data?: UmamiTrackProps): void {
	if (typeof window === 'undefined') return
	// Analytics must never break the UI it's attached to — a throw here (blocked
	// tracker, extension collision) would otherwise propagate into callers' own
	// try/catch (e.g. SubscribeForm) and mislabel a successful action as failed.
	try {
		window.umami?.track(name, data)
	} catch (err) {
		console.error('umami track failed', err)
	}
}
