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
	window.umami?.track(name, data)
}
