import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        lineOfBusiness: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            assignedComplaints: true,
            createdComplaints: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't return the password hash
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, role, branchId, lineOfBusinessId, password } = body

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      email,
      name,
      role,
      branchId: branchId || null,
      lineOfBusinessId: lineOfBusinessId || null
    }

    // If password is provided, hash it
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update the user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        lineOfBusiness: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            assignedComplaints: true,
            createdComplaints: true
          }
        }
      }
    })

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has assigned complaints
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            assignedComplaints: true,
            createdComplaints: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user._count.assignedComplaints > 0) {
      return NextResponse.json({ 
        error: "Cannot delete user with assigned complaints" 
      }, { status: 400 })
    }

    // Don't allow deleting the current user
    if (session.user.id === params.id) {
      return NextResponse.json({ 
        error: "Cannot delete your own account" 
      }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}