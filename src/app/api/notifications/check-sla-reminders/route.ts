import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSLAReminderEmail } from "@/lib/email"

export async function GET() {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Find complaints created more than 1 hour ago but less than 2 hours ago
    const complaintsNeedingReminder = await prisma.complaint.findMany({
      where: {
        createdAt: {
          lt: oneHourAgo,
          gte: twoHoursAgo
        },
        status: {
          name: {
            not: "RESOLVED"
          }
        },
        // Only check complaints that haven't had a 1-hour reminder notification in the last 23 hours
        notifications: {
          none: {
            type: "SLA_REMINDER_1H",
            createdAt: {
              gte: new Date(now.getTime() - 23 * 60 * 60 * 1000)
            }
          }
        }
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        branch: true,
        lineOfBusiness: true,
        status: true,
        notifications: {
          where: {
            type: "SLA_REMINDER_1H"
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    let processedCount = 0
    const results = []

    console.log(`📊 Found ${complaintsNeedingReminder.length} complaints needing 1-hour reminder`)

    for (const complaint of complaintsNeedingReminder) {
      try {
        const hoursSinceCreation = Math.floor(
          (now.getTime() - new Date(complaint.createdAt).getTime()) / (60 * 60 * 1000)
        )

        const recipients = new Set<string>()
        
        if (complaint.assignedTo?.email) {
          recipients.add(complaint.assignedTo.email)
        }
        
        if (complaint.createdBy.email && complaint.createdById !== complaint.assignedTo?.id) {
          recipients.add(complaint.createdBy.email)
        }

        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true }
        })
        admins.forEach((admin: any) => { // ✅ Add type annotation
          if (admin.email) recipients.add(admin.email)
        })

        if (recipients.size > 0) {
          await sendSLAReminderEmail({
            to: Array.from(recipients),
            complaint: complaint,
            hours: hoursSinceCreation
          })

          if (complaint.assignedTo) {
            await prisma.notification.create({
              data: {
                title: "SLA Reminder - 1 Hour",
                message: `Complaint ${complaint.complaintNumber} is still unresolved after ${hoursSinceCreation} hour${hoursSinceCreation > 1 ? 's' : ''}`,
                userId: complaint.assignedTo.id,
                complaintId: complaint.id,
                type: "SLA_REMINDER_1H"
              }
            })
          }

          if (complaint.createdById !== complaint.assignedTo?.id) {
            await prisma.notification.create({
              data: {
                title: "SLA Reminder - 1 Hour",
                message: `Complaint ${complaint.complaintNumber} you created is still unresolved after ${hoursSinceCreation} hour${hoursSinceCreation > 1 ? 's' : ''}`,
                userId: complaint.createdById,
                complaintId: complaint.id,
                type: "SLA_REMINDER_1H"
              }
            })
          }

          processedCount++
          results.push({
            complaintNumber: complaint.complaintNumber,
            hours: hoursSinceCreation,
            assignedTo: complaint.assignedTo?.name,
            recipients: Array.from(recipients)
          })
          
          console.log(`✅ Sent 1-hour reminder for complaint ${complaint.complaintNumber}`)
        }
      } catch (error: any) { // ✅ Add type annotation
        console.error(`❌ Error processing complaint ${complaint.complaintNumber}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Processed ${processedCount} 1-hour SLA reminders`,
      processed: processedCount,
      remindedComplaints: complaintsNeedingReminder.length,
      results,
      timestamp: now.toISOString()
    })
  } catch (error: any) { // ✅ Add type annotation
    console.error("❌ Error checking SLA reminders:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}