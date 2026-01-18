import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

// Helper function to automatically assign a complaint to a suitable user
async function assignComplaintAutomatically(complaintId: string) {
  // First get the complaint details
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      branchId: true,
      lineOfBusinessId: true
    }
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  console.log(`Attempting to assign complaint ${complaintId} to branch ${complaint.branchId} and line of business ${complaint.lineOfBusinessId}`);

  // Find users who match the criteria
  const candidateUsers = await prisma.user.findMany({
    where: {
      branchId: complaint.branchId,
      lineOfBusinessId: complaint.lineOfBusinessId,
      role: {
        in: ["USER"] // Only assign to USER role (not ADMIN)
      }
    },
    include: {
      _count: {
        select: {
          assignedComplaints: {
            where: {
              status: {
                name: {
                  in: ["PENDING", "IN_PROGRESS"]
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`Found ${candidateUsers.length} candidate users for assignment`);

  if (candidateUsers.length === 0) {
    console.log("No suitable users found for automatic assignment");
    throw new Error("No suitable users found for assignment");
  }

  // Log candidate users for debugging
  candidateUsers.forEach(user => {
    console.log(`Candidate: ${user.name} (${user.role}) with ${user._count.assignedComplaints} active complaints`);
  });

  // Sort users by the number of active complaints (ascending)
  candidateUsers.sort((a, b) => 
    a._count.assignedComplaints - b._count.assignedComplaints
  );

  // Assign to the user with the least active complaints
  const selectedUser = candidateUsers[0];
  console.log(`Selected user: ${selectedUser.name} with ${selectedUser._count.assignedComplaints} active complaints`);

  // Update the complaint with the assigned user
  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      assignedToId: selectedUser.id
    },
    include: {
      status: true,
      type: true,
      branch: true,
      lineOfBusiness: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  console.log(`Complaint ${complaintId} assigned to ${selectedUser.name}`);

  // Create an action record for the assignment
  await prisma.complaintAction.create({
    data: {
      description: `Automatically assigned to ${selectedUser.name}`,
      complaintId: complaintId,
      userId: selectedUser.id
    }
  });

  return updatedComplaint;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { assignedToId } = body

    // Check if complaint exists
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id }
    })

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 })
    }

    // If assignedToId is provided, do manual assignment
    if (assignedToId) {
      // Only admin can manually assign complaints
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // Update complaint assignment
      const updatedComplaint = await prisma.complaint.update({
        where: { id: params.id },
        data: { assignedToId },
        include: {
          status: true,
          type: true,
          branch: true,
          lineOfBusiness: true,
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Create notification for the assigned user
      await prisma.notification.create({
        data: {
          title: "Complaint Assigned",
          message: `Complaint ${complaint.complaintNumber} has been assigned to you`,
          userId: assignedToId,
          complaintId: complaint.id
        }
      })

      // Create an action record for the assignment
      await prisma.complaintAction.create({
        data: {
          description: `Manually assigned to ${updatedComplaint.assignedTo?.name || "Unknown"} by ${session.user.name}`,
          complaintId: complaint.id,
          userId: session.user.id
        }
      })

      return NextResponse.json(updatedComplaint)
    } else {
      // If no assignedToId is provided, do automatic assignment
      try {
        const updatedComplaint = await assignComplaintAutomatically(params.id);

        // Create notification for the assigned user
        if (updatedComplaint.assignedTo) {
          await prisma.notification.create({
            data: {
              title: "Complaint Assigned",
              message: `Complaint ${complaint.complaintNumber} has been assigned to you`,
              userId: updatedComplaint.assignedTo.id,
              complaintId: complaint.id
            }
          })
        }

        return NextResponse.json(updatedComplaint);
      } catch (assignmentError) {
        console.error("Automatic assignment failed:", assignmentError);
        
        // If automatic assignment fails, notify admins
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" }
        });

        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              title: "Complaint Requires Assignment",
              message: `Complaint ${complaint.complaintNumber} requires manual assignment`,
              userId: admin.id,
              complaintId: complaint.id
            }
          });
        }

        return NextResponse.json(
          { error: "No suitable user found for assignment" },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("Error assigning complaint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}