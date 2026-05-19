import { env } from '$env/dynamic/private'
import nodemailer from 'nodemailer'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const values = await request.formData()

	const transporter = nodemailer.createTransport({
		host: env.SMTP_SERVER,
		port: Number(env.SMTP_SERVER_PORT),
		secure: false,
		auth: {
			user: env.SMTP_USERNAME,
			pass: env.SMTP_PASSWORD,
		},
	})

	const fromValue = values.get('email')
	await transporter.sendMail({
		from: typeof fromValue === 'string' ? fromValue : undefined,
		to: 'sam@threesam.com',
		subject: 'hello world',
		html: `<html>
			<p>name: ${values.get('name')}</p>
			<p>message: ${values.get('message')}</p>
		</html>`,
	})

	return json({ ok: true })
}
