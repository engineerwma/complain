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

    const complaintTypes = await prisma.complaintType.findMany({
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(complaintTypes)
  } catch (error) {
    console.error("Error fetching complaint types:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Create complaint type
    const complaintType = await prisma.complaintType.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json(complaintType, { status: 201 })
  } catch (error) {
    console.error("Error creating complaint type:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}