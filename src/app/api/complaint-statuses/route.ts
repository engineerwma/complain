import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const complaintStatuses = await prisma.complaintStatus.findMany({
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(complaintStatuses)
  } catch (error) {
    console.error("Error fetching complaint statuses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Create complaint status
    const complaintStatus = await prisma.complaintStatus.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json(complaintStatus, { status: 201 })
  } catch (error) {
    console.error("Error creating complaint status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}