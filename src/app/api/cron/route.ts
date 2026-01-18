import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Simple cron secret validation
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = []
    
    // Run SLA reminder check (every 2 hours)
    console.log('🔄 Running SLA reminder check...')
    const reminderResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/check-sla-reminders`)
    const reminderResult = await reminderResponse.json()
    tasks.push({ name: 'SLA Reminders', result: reminderResult })

    // Run 2-hour SLA reminder check
    console.log('🔄 Running 2-hour SLA reminder check...')
    const twoHourReminderResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/check-sla-reminders-2hours`)
    const twoHourReminderResult = await twoHourReminderResponse.json()
    tasks.push({ name: 'SLA Reminders - 2 Hours', result: twoHourReminderResult })

    // Run SLA breach check
    console.log('🔄 Running SLA breach check...')
    const breachResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/check-sla`)
    const breachResult = await breachResponse.json()
    tasks.push({ name: 'SLA Breach', result: breachResult })

    console.log('✅ All cron jobs executed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Cron jobs executed successfully',
      tasks,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error executing cron jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute cron jobs' },
      { status: 500 }
    )
  }
}