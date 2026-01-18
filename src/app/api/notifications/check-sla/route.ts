import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendSLABreachEmail } from "@/lib/email"

export async function GET() {
  try {
    const now = new Date()
    
    // Find complaints that are overdue and not resolved
    const overdueComplaints = await prisma.complaint.findMany({
      where: {
        dueDate: {
          lt: now
        },
        status: {
          name: {
            not: "RESOLVED"
          }
        },
        // Only check complaints that haven't had an SLA breach notification in the last 24 hours
        notifications: {
          none: {
            type: "SLA_BREACH",
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
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
        notifications: {
          where: {
            type: "SLA_BREACH"
          }
        }
      }
    })

    let processedCount = 0
    const results = []

    // Send notifications for each overdue complaint
    for (const complaint of overdueComplaints) {
      try {
        if (complaint.assignedTo && complaint.assignedTo.email) {
          // Send email notification
          await sendSLABreachEmail({
            to: complaint.assignedTo.email,
            userName: complaint.assignedTo.name,
            complaintNumber: complaint.complaintNumber,
            customerName: complaint.customerName,
            dueDate: complaint.dueDate!
          })

          // Create notification record for assigned user
          await prisma.notification.create({
            data: {
              title: "SLA Breach Alert",
              message: `Complaint ${complaint.complaintNumber} - ${complaint.customerName} has breached its SLA deadline`,
              userId: complaint.assignedTo.id,
              complaintId: complaint.id,
              type: "SLA_BREACH"
            }
          })
        }

        // Also notify the complaint creator if different from assigned user
        if (complaint.createdById !== complaint.assignedTo?.id) {
          await prisma.notification.create({
            data: {
              title: "SLA Breach Alert",
              message: `Complaint ${complaint.complaintNumber} you created has breached its SLA deadline`,
              userId: complaint.createdById,
              complaintId: complaint.id,
              type: "SLA_BREACH"
            }
          })
        }

        processedCount++
        results.push({
          complaintNumber: complaint.complaintNumber,
          assignedTo: complaint.assignedTo?.name,
          dueDate: complaint.dueDate
        })
      } catch (error) {
        console.error(`Error processing breach for complaint ${complaint.complaintNumber}:`, error)
        // Continue with next complaint even if one fails
      }
    }

    // Also notify admins about overdue complaints
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" }
      })

      for (const admin of admins) {
        // Check if admin already has a notification about this in the last 24 hours
        const hasRecentNotification = await prisma.notification.findFirst({
          where: {
            userId: admin.id,
            type: "SLA_BREACH_SUMMARY",
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }
        })

        if (!hasRecentNotification && overdueComplaints.length > 0) {
          await prisma.notification.create({
            data: {
              title: "SLA Breach Alert",
              message: `${overdueComplaints.length} complaints have breached their SLA deadline`,
              userId: admin.id,
              type: "SLA_BREACH_SUMMARY"
            }
          })
          processedCount++
        }
      }
    } catch (adminError) {
      console.error("Error notifying admins:", adminError)
    }

    return NextResponse.json({ 
      success: true,
      message: `Processed ${processedCount} notifications for ${overdueComplaints.length} overdue complaints`,
      processed: processedCount,
      overdueComplaints: overdueComplaints.length,
      results
    })
  } catch (error) {
    console.error("Error checking SLA breaches:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}