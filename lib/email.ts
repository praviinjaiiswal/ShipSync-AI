import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'ShipSync AI <hello@shipsync.ai>',
    to: email,
    subject: 'Welcome to ShipSync AI!',
    html: `<h1>Welcome, ${name}!</h1><p>Start automating your export compliance today.</p>`,
  })
}

export async function sendComplianceAlert(email: string, shipmentId: string, issues: string[]) {
  await resend.emails.send({
    from: 'ShipSync AI <alerts@shipsync.ai>',
    to: email,
    subject: 'Compliance Alert: Action Required',
    html: `<h1>Compliance Issues Found</h1><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>`,
  })
}