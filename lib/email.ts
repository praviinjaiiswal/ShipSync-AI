import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'ShipSync AI <onboarding@resend.dev>',
    to: email,
    subject: 'Welcome to ShipSync AI!',
    html: `<h1>Welcome, ${name}!</h1><p>Start automating your export compliance today.</p>`,
  })
}

export async function sendComplianceAlert(email: string, shipmentId: string, issues: string[]) {
  await resend.emails.send({
    from: 'ShipSync AI <onboarding@resend.dev>',
    to: email,
    subject: 'Compliance Alert: Action Required',
    html: `<h1>Compliance Issues Found</h1><ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>`,
  })
}

export async function sendLicenseExpiryReminder(email: string, licenseName: string, daysLeft: number) {
  await resend.emails.send({
    from: 'ShipSync AI <onboarding@resend.dev>',
    to: email,
    subject: `Reminder: ${licenseName} expires in ${daysLeft} days`,
    html: `<h1>License Expiry Reminder</h1><p><strong>${licenseName}</strong> expires in <strong>${daysLeft} days</strong>. Renew it soon to avoid compliance issues.</p>`,
  })
}

export async function sendTeamInviteEmail(email: string, inviterName: string, role: string, token: string) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite/${token}`
  const { error } = await resend.emails.send({
    from: 'ShipSync AI <onboarding@resend.dev>',
    to: email,
    subject: `${inviterName} invited you to ShipSync AI`,
    html: `<h1>You're invited!</h1><p>${inviterName} invited you to join their team on ShipSync AI as <strong>${role.replace(/_/g, ' ')}</strong>.</p><p><a href="${acceptUrl}">Accept Invitation</a></p>`,
  })
  if (error) {
    console.error('Resend error (invite):', error)
    throw new Error(error.message)
  }
}