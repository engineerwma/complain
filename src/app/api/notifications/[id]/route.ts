import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET single notification
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id, // ✅ استخدم id بدلاً من params.id
        userId: session.user.id
      },
      include: {
        complaint: {
          select: {
            complaintNumber: true,
            customerName: true
          }
        }
      }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error fetching notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id, // ✅ استخدم id بدلاً من params.id
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id }, // ✅ استخدم id بدلاً من params.id
      data: {
        read: true
      },
      include: {
        complaint: {
          select: {
            complaintNumber: true,
            customerName: true
          }
        }
      }
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Delete notification
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id, // ✅ استخدم id بدلاً من params.id
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await prisma.notification.delete({
      where: { id } // ✅ استخدم id بدلاً من params.id
    })

    return NextResponse.json({ message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}