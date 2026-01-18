import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { writeFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File
    const complaintId = data.get("complaintId") as string

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    if (!complaintId) {
      return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 })
    }

    // Check if complaint exists and user has permission
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // Check if user has permission to upload to this complaint
    if (session.user.role !== "ADMIN" && 
        complaint.createdById !== session.user.id && 
        complaint.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PDF, JPG, PNG, and DOC files are allowed." 
      }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File size exceeds the 10MB limit." 
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const extension = path.extname(originalName)
    const filename = `${timestamp}-${originalName}`

    // Save file to public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public/uploads")
    
    // Ensure uploads directory exists
    const fs = require('fs')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, buffer)

    // Save file info to database
    const attachment = await prisma.attachment.create({
      data: {
        filename: originalName,
        path: `/uploads/${filename}`,
        mimetype: file.type,
        size: file.size,
        complaintId
      }
    })

    return NextResponse.json({ 
      message: "File uploaded successfully",
      attachment
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}