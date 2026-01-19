// app/api/attachments/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// Export the config if needed
export const dynamic = 'force-dynamic'; // or 'auto' | 'force-static'
export const revalidate = 0; // Set revalidation time

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachment details
    const attachment = await prisma.attachment.findUnique({
      where: { id: context.params.id },
      include: {
        complaint: {
          select: {
            createdById: true,
            assignedToId: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check if user has permission to delete this attachment
    if (session.user.role !== "ADMIN" && 
        attachment.complaint.createdById !== session.user.id && 
        attachment.complaint.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), "public", attachment.path);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment from database
    await prisma.attachment.delete({
      where: { id: context.params.id }
    });

    return NextResponse.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add other HTTP methods if needed
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: context.params.id }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}