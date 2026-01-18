import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET single complaint by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Base where clause based on user role
    let whereClause: any = { id }

    if (session.user.role === "USER") {
      whereClause.assignedToId = session.user.id
    } 
    // ADMIN can see all complaints, no additional filter needed

    const complaint = await prisma.complaint.findUnique({
      where: whereClause,
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

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    return NextResponse.json(complaint)
  } catch (error) {
    console.error("Error fetching complaint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// UPDATE complaint by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const {
      customerName,
      customerId,
      policyNumber,
      policyType,
      description,
      channel,
      typeId,
      statusId,
      branchId,
      lineOfBusinessId,
      assignedToId
    } = body

    // Validate required fields
    if (!customerName || !customerId || !policyNumber || !description || !typeId || !branchId || !lineOfBusinessId || !statusId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if complaint exists
    const existingComplaint = await prisma.complaint.findUnique({
      where: { id }
    })

    if (!existingComplaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Update complaint
    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        customerName,
        customerId,
        policyNumber,
        policyType: policyType || "General",
        description,
        channel: channel || "WEB",
        statusId,
        typeId,
        branchId,
        lineOfBusinessId,
        assignedToId: assignedToId || null,
        updatedAt: new Date()
      },
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

    // Create action record for the update
    await prisma.complaintAction.create({
      data: {
        description: "Complaint details updated",
        complaintId: id,
        userId: session.user.id
      }
    })

    return NextResponse.json(updatedComplaint)
  } catch (error) {
    console.error("Error updating complaint:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// You can remove the POST method from this file since it should only handle individual complaints
// The POST method for creating complaints should be in /app/api/complaints/route.ts