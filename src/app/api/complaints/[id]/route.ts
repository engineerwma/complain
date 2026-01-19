import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET single complaint by ID
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
  } catch (error: any) {
    console.error("Error updating complaint:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      )
    }
    
    // Handle other Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid reference data. Please check the selected options." },
        { status: 400 }
      )
    }
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A complaint with similar details already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }

    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
