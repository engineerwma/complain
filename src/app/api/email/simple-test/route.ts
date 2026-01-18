// app/api/email/simple/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set',
      EMAIL_HOST: process.env.EMAIL_HOST || 'Not set',
      EMAIL_FROM: process.env.EMAIL_FROM || 'Not set',
      EMAIL_PORT: process.env.EMAIL_PORT || '587'
    }

    console.log('Simple environment check:', envVars)

    return NextResponse.json({
      success: true,
      message: "Simple test completed",
      environment_variables: envVars
    })
    
  } catch (error: any) {
    console.error("Simple test failed:", error)
    return NextResponse.json({
      success: false, 
      error: "Simple test failed",
      details: error.message
    }, { status: 500 })
  }
}