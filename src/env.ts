import { defineEnvVars } from '@sveltejs/kit/env'

export const variables = defineEnvVars({
	LISTMONK_URL: { schema: (input) => input ?? '' },
	LISTMONK_LIST_UUID: { schema: (input) => input ?? '' }
})
