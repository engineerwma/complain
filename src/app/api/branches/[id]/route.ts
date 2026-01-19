import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    const { id } = await context.params; // Await the params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error("Error fetching branch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    const { id } = await context.params; // Await the params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const branch = await prisma.branch.update({
      where: { id },
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

    return NextResponse.json(branch)
  } catch (error) {
    console.error("Error updating branch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> } // params is now a Promise
) {
  try {
    const { id } = await context.params; // Await the params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if branch has users or complaints
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }

    if (branch._count.users > 0 || branch._count.complaints > 0) {
      return NextResponse.json({ 
        error: "Cannot delete branch with associated users or complaints" 
      }, { status: 400 })
    }

    await prisma.branch.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Branch deleted successfully" })
  } catch (error) {
    console.error("Error deleting branch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}