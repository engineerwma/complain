import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSLAReminderEmail } from "@/lib/email"

export async function GET() {
  try {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    // Find complaints created more than 2 hours ago but less than 4 hours ago
    // that are still not resolved and haven't had a 2-hour reminder
    const complaintsNeeding2HourReminder = await prisma.complaint.findMany({
      where: {
        createdAt: {
          lt: twoHoursAgo,
          gte: fourHoursAgo
        },
        status: {
          name: {
            not: "RESOLVED"
          }
        },
        // Only check complaints that haven't had a 2-hour reminder notification in the last 6 hours
        notifications: {
          none: {
            type: "SLA_REMINDER_2H",
            createdAt: {
              gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6 hours ago
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
            type: "SLA_REMINDER_2H"
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

    console.log(`📊 Found ${complaintsNeeding2HourReminder.length} complaints needing 2-hour reminder`)

    for (const complaint of complaintsNeeding2HourReminder) {
      try {
        const hoursSinceCreation = Math.floor(
          (now.getTime() - new Date(complaint.createdAt).getTime()) / (60 * 60 * 1000)
        )

        const recipients = new Set<string>()
        
        // Notify assigned user
        if (complaint.assignedTo?.email) {
          recipients.add(complaint.assignedTo.email)
        }
        
        // Notify creator if different from assigned user and has email
        if (complaint.createdBy.email && complaint.createdById !== complaint.assignedTo?.id) {
          recipients.add(complaint.createdBy.email)
        }

        // Notify admins
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true }
        })
        admins.forEach((admin: any) => {
          if (admin.email) recipients.add(admin.email)
        })

        if (recipients.size > 0) {
          // FIX: Create a properly typed complaint object
          const emailComplaint = {
            ...complaint,
            dueDate: complaint.dueDate || undefined // Convert null to undefined
          }

          // Send email reminder
          await sendSLAReminderEmail({
            to: Array.from(recipients),
            complaint: emailComplaint, // Use the fixed object
            hours: hoursSinceCreation
          })

          // Create notifications for relevant users
          if (complaint.assignedTo) {
            await prisma.notification.create({
              data: {
                title: "SLA Reminder - 2 Hours",
                message: `Complaint ${complaint.complaintNumber} is still unresolved after ${hoursSinceCreation} hours`,
                userId: complaint.assignedTo.id,
                complaintId: complaint.id,
                type: "SLA_REMINDER_2H"
              }
            })
          }

          // Create notification for creator if different
          if (complaint.createdById !== complaint.assignedTo?.id) {
            await prisma.notification.create({
              data: {
                title: "SLA Reminder - 2 Hours",
                message: `Complaint ${complaint.complaintNumber} you created is still unresolved after ${hoursSinceCreation} hours`,
                userId: complaint.createdById,
                complaintId: complaint.id,
                type: "SLA_REMINDER_2H"
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
          
          console.log(`✅ Sent 2-hour reminder for complaint ${complaint.complaintNumber}`)
        }
      } catch (error: any) {
        console.error(`❌ Error processing complaint ${complaint.complaintNumber}:`, error)
        // Continue with next complaint even if one fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Processed ${processedCount} 2-hour SLA reminders`,
      processed: processedCount,
      totalComplaints: complaintsNeeding2HourReminder.length,
      results,
      timestamp: now.toISOString()
    })
  } catch (error: any) {
    console.error("❌ Error checking 2-hour SLA reminders:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}
