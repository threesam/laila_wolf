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
	// Never let analytics break the UI it's attached to.
	try {
		window.umami?.track(name, data)
	} catch (err) {
		console.error('umami track failed', err)
	}
}
