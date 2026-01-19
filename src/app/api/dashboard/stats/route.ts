import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

type ResolvedComplaint = {
  createdAt: Date;
  resolvedAt: Date | null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let whereClause = {}
    
    if (session.user.role !== "ADMIN") {
      whereClause = {
        OR: [
          { createdById: session.user.id },
          { assignedToId: session.user.id }
        ]
      }
    }

    const [
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      overdueComplaints
    ] = await Promise.all([
      prisma.complaint.count({ where: whereClause }),
      prisma.complaint.count({ 
        where: { 
          ...whereClause,
          status: { name: "PENDING" }
        }
      }),
      prisma.complaint.count({ 
        where: { 
          ...whereClause,
          status: { name: "RESOLVED" }
        }
      }),
      prisma.complaint.count({ 
        where: { 
          ...whereClause,
          dueDate: { lt: new Date() },
          status: { name: { not: "RESOLVED" } }
        }
      })
    ])

    // Calculate average resolution time (in hours)
    const resolvedComplaintsData = await prisma.complaint.findMany({
      where: {
        ...whereClause,
        status: { name: "RESOLVED" },
        resolvedAt: { not: null }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    })

    let avgResolutionTime = 0
    if (resolvedComplaintsData.length > 0) {
      const totalTime = resolvedComplaintsData.reduce((sum: number, complaint: ResolvedComplaint) => {
        if (complaint.resolvedAt) {
          const diffInMs = complaint.resolvedAt.getTime() - complaint.createdAt.getTime()
          const diffInHours = diffInMs / (1000 * 60 * 60)
          return sum + diffInHours
        }
        return sum
      }, 0)
      avgResolutionTime = Math.round(totalTime / resolvedComplaintsData.length)
    }

    return NextResponse.json({
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      overdueComplaints,
      avgResolutionTime
    })
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}