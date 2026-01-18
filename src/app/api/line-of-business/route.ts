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

    const linesOfBusiness = await prisma.lineOfBusiness.findMany({
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(linesOfBusiness)
  } catch (error) {
    console.error("Error fetching lines of business:", error)
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

    // Create line of business
    const lineOfBusiness = await prisma.lineOfBusiness.create({
      data: {
        name,
        description: description || null
      },
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    })

    return NextResponse.json(lineOfBusiness, { status: 201 })
  } catch (error) {
    console.error("Error creating line of business:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}