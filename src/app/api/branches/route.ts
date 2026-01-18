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

    const branches = await prisma.branch.findMany({
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

    return NextResponse.json(branches)
  } catch (error) {
    console.error("Error fetching branches:", error)
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

    // Create branch
    const branch = await prisma.branch.create({
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

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error("Error creating branch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}