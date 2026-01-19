import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30"
    
    // Calculate date range
    const days = parseInt(range)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    let whereClause: any = {
      createdAt: {
        gte: startDate
      }
    }
    
    if (session.user.role !== "ADMIN") {
      whereClause = {
        AND: [
          {
            createdAt: {
              gte: startDate
            }
          },
          {
            OR: [
              { createdById: session.user.id },
              { assignedToId: session.user.id }
            ]
          }
        ]
      }
    }

    // Get complaints by status
    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ["statusId"],
      where: whereClause,
      _count: {
        statusId: true
      }
    })

    const statusIds = complaintsByStatus.map((item: any) => item.statusId) // ✅ Add type
    const statuses = await prisma.complaintStatus.findMany({
      where: {
        id: {
          in: statusIds
        }
      }
    })

    const statusColors: Record<string, string> = {
      "PENDING": "#FFBB28",
      "IN_PROGRESS": "#0088FE",
      "RESOLVED": "#00C49F",
      "CLOSED": "#FF8042"
    }

    const complaintsByStatusData = complaintsByStatus.map((item: any) => { // ✅ Add type
      const status = statuses.find(s => s.id === item.statusId)
      return {
        name: status?.name || "Unknown",
        count: item._count.statusId,
        color: statusColors[status?.name || ""] || "#8884D8"
      }
    })

    // Get complaints by type
    const complaintsByType = await prisma.complaint.groupBy({
      by: ["typeId"],
      where: whereClause,
      _count: {
        typeId: true
      }
    })

    const typeIds = complaintsByType.map((item: any) => item.typeId) // ✅ Add type
    const types = await prisma.complaintType.findMany({
      where: {
        id: {
          in: typeIds
        }
      }
    })

    const complaintsByTypeData = complaintsByType.map((item: any) => { // ✅ Add type
      const type = types.find(t => t.id === item.typeId)
      return {
        name: type?.name || "Unknown",
        count: item._count.typeId
      }
    })

    // Get complaints by branch
    const complaintsByBranch = await prisma.complaint.groupBy({
      by: ["branchId"],
      where: whereClause,
      _count: {
        branchId: true
      }
    })

    const branchIds = complaintsByBranch.map((item: any) => item.branchId) // ✅ Add type
    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: branchIds
        }
      }
    })

    const complaintsByBranchData = complaintsByBranch.map((item: any) => { // ✅ Add type
      const branch = branches.find(b => b.id === item.branchId)
      return {
        name: branch?.name || "Unknown",
        count: item._count.branchId
      }
    })

    // Get complaints by line of business
    const complaintsByLineOfBusiness = await prisma.complaint.groupBy({
      by: ["lineOfBusinessId"],
      where: whereClause,
      _count: {
        lineOfBusinessId: true
      }
    })

    const lobIds = complaintsByLineOfBusiness.map((item: any) => item.lineOfBusinessId) // ✅ Add type
    const linesOfBusiness = await prisma.lineOfBusiness.findMany({
      where: {
        id: {
          in: lobIds
        }
      }
    })

    const complaintsByLineOfBusinessData = complaintsByLineOfBusiness.map((item: any) => { // ✅ Add type
      const lob = linesOfBusiness.find(l => l.id === item.lineOfBusinessId)
      return {
        name: lob?.name || "Unknown",
        count: item._count.lineOfBusinessId
      }
    })

    // Get complaints trend
    const complaintsTrend = await prisma.complaint.findMany({
      where: whereClause,
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Format the trend data by date
    const trendData: { [key: string]: number } = {}
    complaintsTrend.forEach((complaint: any) => { // ✅ Add type
      const date = new Date(complaint.createdAt).toISOString().split('T')[0]
      if (trendData[date]) {
        trendData[date] += 1
      } else {
        trendData[date] = 1
      }
    })

    // Fill in missing dates
    const currentDate = new Date(startDate)
    const endDate = new Date()
    const allDates = []
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      allDates.push(dateStr)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const complaintsTrendData = allDates.map(date => ({
      date,
      count: trendData[date] || 0
    }))

    // Get average resolution time by type
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        ...whereClause,
        status: {
          name: "RESOLVED"
        },
        resolvedAt: {
          not: null
        }
      },
      include: {
        type: true
      }
    })

    const resolutionTimeByType: { [key: string]: { total: number; count: number } } = {}
    
    resolvedComplaints.forEach((complaint: any) => { // ✅ Add type
      if (complaint.resolvedAt) {
        const typeName = complaint.type.name
        const resolutionTime = complaint.resolvedAt.getTime() - complaint.createdAt.getTime()
        const hours = resolutionTime / (1000 * 60 * 60)
        
        if (!resolutionTimeByType[typeName]) {
          resolutionTimeByType[typeName] = { total: 0, count: 0 }
        }
        
        resolutionTimeByType[typeName].total += hours
        resolutionTimeByType[typeName].count += 1
      }
    })

    const resolutionTimeByTypeData = Object.keys(resolutionTimeByType).map(typeName => ({
      name: typeName,
      time: Math.round(resolutionTimeByType[typeName].total / resolutionTimeByType[typeName].count)
    }))

    // Get SLA compliance
    const now = new Date()
    const overdueComplaints = await prisma.complaint.count({
      where: {
        ...whereClause,
        dueDate: {
          lt: now
        },
        status: {
          name: {
            not: "RESOLVED"
          }
        }
      }
    })

    const onTimeComplaints = await prisma.complaint.count({
      where: {
        ...whereClause,
        OR: [
          {
            dueDate: {
              gte: now
            }
          },
          {
            status: {
              name: "RESOLVED"
            }
          }
        ]
      }
    })

    // Get top users
    const topUsers = await prisma.user.findMany({
      where: {
        role: "USER"
      },
      include: {
        assignedComplaints: {
          where: {
            createdAt: {
              gte: startDate
            }
          },
          include: {
            status: true
          }
        }
      }
    })

    const topUsersData = topUsers.map((user: any) => { // ✅ Add type
      const resolved = user.assignedComplaints.filter((c: any) => c.status.name === "RESOLVED").length // ✅ Add type
      const pending = user.assignedComplaints.filter((c: any) => c.status.name !== "RESOLVED").length // ✅ Add type
      
      return {
        name: user.name,
        resolved,
        pending
      }
    }).filter(user => user.resolved > 0 || user.pending > 0)
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 10)

    // Get channel distribution
    const channelDistribution = await prisma.complaint.groupBy({
      by: ["channel"],
      where: whereClause,
      _count: {
        channel: true
      }
    })

    const channelDistributionData = channelDistribution.map((item: any) => ({ // ✅ Add type
      name: item.channel,
      count: item._count.channel
    }))

    return NextResponse.json({
      complaintsByStatus: complaintsByStatusData,
      complaintsByType: complaintsByTypeData,
      complaintsByBranch: complaintsByBranchData,
      complaintsByLineOfBusiness: complaintsByLineOfBusinessData,
      complaintsTrend: complaintsTrendData,
      resolutionTimeByType: resolutionTimeByTypeData,
      slaCompliance: {
        met: onTimeComplaints,
        breached: overdueComplaints
      },
      topUsers: topUsersData,
      channelDistribution: channelDistributionData
    })
  } catch (error: any) { // ✅ Add type annotation to catch block
    console.error("Error fetching report data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}