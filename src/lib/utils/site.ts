export const SITE_URL = 'https://lailawolf.com'

export function canonical(pathname: string): string {
	return SITE_URL + pathname
}
