import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail", // Or any other email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Define the type for the parameters
interface SendEmailArgs {
  to: string
  subject: string
  text?: string
  html?: string
}

export default async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailArgs): Promise<{ success: boolean }> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false }
  }
}