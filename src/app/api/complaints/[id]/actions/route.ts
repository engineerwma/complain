import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST /api/complaints/[id]/actions - Add action to complaint
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const complaintId = params.id
    const body = await request.json()
    const { description } = body

    if (!complaintId) {
      return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 })
    }

    if (!description || description.trim() === "") {
      return NextResponse.json({ error: "Action description is required" }, { status: 400 })
    }

    console.log(`Adding action to complaint ${complaintId} by user ${session.user.id}`)

    // Verify the complaint exists and user has access
    let whereClause: any = { id: complaintId }

    if (session.user.role === "USER") {
      // Regular users can only add actions to complaints assigned to them
      whereClause.assignedToId = session.user.id
    }
    // Admin users can add actions to any complaint

    const complaint = await prisma.complaint.findUnique({
      where: whereClause
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found or access denied" }, { status: 404 })
    }

    // Create the action
    const action = await prisma.complaintAction.create({
      data: {
        description: description.trim(),
        complaintId: complaintId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`Action added to complaint ${complaintId} successfully`)

    return NextResponse.json(action)
  } catch (error) {
    console.error("Error adding action:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}