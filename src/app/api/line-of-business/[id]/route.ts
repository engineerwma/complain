import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lineOfBusiness = await prisma.lineOfBusiness.findUnique({
      where: { id }, // ✅ استخدم id بدلاً من params.id
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    })

    if (!lineOfBusiness) {
      return NextResponse.json({ error: "Line of business not found" }, { status: 404 })
    }

    return NextResponse.json(lineOfBusiness)
  } catch (error) {
    console.error("Error fetching line of business:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const lineOfBusiness = await prisma.lineOfBusiness.update({
      where: { id }, // ✅ استخدم id بدلاً من params.id
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

    return NextResponse.json(lineOfBusiness)
  } catch (error) {
    console.error("Error updating line of business:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params أصبح Promise
) {
  try {
    const { id } = await context.params; // ✅ انتظر params أولاً!
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if line of business has users or complaints
    const lineOfBusiness = await prisma.lineOfBusiness.findUnique({
      where: { id }, // ✅ استخدم id بدلاً من params.id
      include: {
        _count: {
          select: {
            users: true,
            complaints: true
          }
        }
      }
    })

    if (!lineOfBusiness) {
      return NextResponse.json({ error: "Line of business not found" }, { status: 404 })
    }

    if (lineOfBusiness._count.users > 0 || lineOfBusiness._count.complaints > 0) {
      return NextResponse.json({ 
        error: "Cannot delete line of business with associated users or complaints" 
      }, { status: 400 })
    }

    await prisma.lineOfBusiness.delete({
      where: { id } // ✅ استخدم id بدلاً من params.id
    })

    return NextResponse.json({ message: "Line of business deleted successfully" })
  } catch (error) {
    console.error("Error deleting line of business:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}