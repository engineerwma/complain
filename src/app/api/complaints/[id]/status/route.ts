import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params is now a Promise
) {
  try {
    const { id } = await context.params; // ✅ Await the params first!
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { statusId } = body

    // Check if complaint exists and user has permission
    const complaint = await prisma.complaint.findUnique({
      where: { id } // ✅ Use id instead of params.id
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Check if user has permission to update this complaint
    if (session.user.role !== "ADMIN" && 
        complaint.createdById !== session.user.id && 
        complaint.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get status name
    const status = await prisma.complaintStatus.findUnique({
      where: { id: statusId }
    })

    if (!status) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }

    // Update complaint status
    const updateData: any = { statusId }
    
    // If status is RESOLVED, set resolvedAt timestamp
    if (status.name === "RESOLVED") {
      updateData.resolvedAt = new Date()
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id }, // ✅ Use id instead of params.id
      data: updateData,
      include: {
        status: true,
        type: true,
        branch: true,
        lineOfBusiness: true,
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedComplaint)
  } catch (error) {
    console.error("Error updating complaint status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}