// app/api/email/test/route.ts
import { NextResponse } from "next/server"
import { testEmailConnection, sendComplaintCreatedEmail } from "@/lib/email"

export async function GET() {
  try {
    console.log('🧪 Starting comprehensive email test...')
    
    // Step 1: Check environment variables
    console.log('🔍 Checking environment variables...')
    const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_HOST', 'EMAIL_FROM']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars)
      return NextResponse.json({
        success: false,
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        step: 'environment_check'
      }, { status: 500 })
    }

    console.log('✅ Environment variables check passed')

    // Step 2: Test SMTP connection
    console.log('🔌 Testing SMTP connection to Office 365...')
    const connectionSuccess = await testEmailConnection()
    
    if (!connectionSuccess) {
      console.error('❌ SMTP connection failed')
      return NextResponse.json({
        success: false, 
        error: "SMTP connection failed - check your credentials and Office 365 settings",
        step: "connection_test"
      }, { status: 500 })
    }

    console.log('✅ SMTP connection test passed')

    // Step 3: Send test email
    console.log('📧 Sending test email...')
    const testComplaint = {
      complaintNumber: "TEST" + Date.now(),
      customerName: "Test Customer",
      customerId: "CUST001",
      policyNumber: "POL123",
      policyType: "General",
      description: "This is a test complaint to verify email configuration",
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }

    const emailSent = await sendComplaintCreatedEmail({
      to: [process.env.EMAIL_USER!],
      complaint: testComplaint,
      assignedTo: { name: "Test User" }
    })

    if (!emailSent) {
      console.error('❌ Email sending failed')
      return NextResponse.json({
        success: false,
        error: "Email sending failed - check SMTP settings and credentials",
        step: "email_sending"
      }, { status: 500 })
    }

    console.log('🎉 All email tests completed successfully!')

    return NextResponse.json({
      success: true,
      message: "Email test completed successfully - check your inbox at " + process.env.EMAIL_USER,
      steps: {
        environment_variables: "PASS",
        smtp_connection: "PASS", 
        email_sending: "PASS"
      },
      test_email_sent_to: process.env.EMAIL_USER
    })

  } catch (error: any) {
    console.error("❌ Email test failed:", error)
    
    return NextResponse.json({
      success: false, 
      error: "Email test failed",
      step: "unknown",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}