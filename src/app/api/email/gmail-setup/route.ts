// app/api/email/gmail-setup/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const setupInfo = {
    // Current configuration
    configuration: {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD_SET: !!process.env.EMAIL_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_PORT: process.env.EMAIL_PORT
    },
    
    // Step-by-step setup guide
    setup_steps: [
      "1. Enable 2-Factor Authentication in Google Account",
      "2. Generate App Password: Google Account → Security → App passwords",
      "3. Select 'Mail' and device 'Other', name it 'Complaint System'",
      "4. Copy the 16-character app password (no spaces)",
      "5. Use this password in your .env file (not your regular password)",
      "6. Test the connection"
    ],
    
    // Troubleshooting
    common_issues: [
      "Using regular password instead of app password",
      "2FA not enabled",
      "App password generated for wrong app (should be 'Mail')",
      "Firewall blocking SMTP connections"
    ],
    
    // Gmail limits
    limits: {
      daily_send_limit: "500 emails per day",
      rate_limit: "100 recipients per email",
      attachment_size: "25MB per email"
    }
  }

  return NextResponse.json({
    success: true,
    message: "Gmail Setup Information",
    ...setupInfo
  })
}