import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test all cron endpoints
    const endpoints = [
      '/api/notifications/check-sla-reminders',
      '/api/notifications/check-sla-reminders-2hours', 
      '/api/notifications/check-sla'
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}${endpoint}`)
        const data = await response.json()
        results.push({
          endpoint,
          success: data.success,
          message: data.message
        })
      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron endpoints test completed",
      results,
      schedule: "Runs every 2 hours",
      checks: [
        "1-hour SLA reminders",
        "2-hour SLA reminders", 
        "SLA breach alerts"
      ]
    })

  } catch (error) {
    console.error('Cron test failed:', error)
    return NextResponse.json({
      success: false,
      error: "Cron test failed"
    }, { status: 500 })
  }
}