import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendComplaintCreatedEmail, sendComplaintAssignmentEmail } from "@/lib/email"

// Helper function to automatically assign a complaint to a suitable user
async function assignComplaintAutomatically(complaintId: string, branchId: string, lineOfBusinessId: string) {
  try {
    console.log(`Attempting to assign complaint ${complaintId} to branch ${branchId} and line of business ${lineOfBusinessId}`);

    // First, let's verify the branch and LOB exist and get their details
    const [branch, lineOfBusiness] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.lineOfBusiness.findUnique({ where: { id: lineOfBusinessId } })
    ]);

    if (!branch) {
      console.error(`Branch ${branchId} not found`);
      return null;
    }
    if (!lineOfBusiness) {
      console.error(`Line of Business ${lineOfBusinessId} not found`);
      return null;
    }

    console.log(`Looking for users in branch: ${branch.name}, LOB: ${lineOfBusiness.name}`);

    // Find ACTIVE users who match the branch and line of business criteria
    // Using YOUR actual role names: "User" for agents
    const candidateUsers = await prisma.user.findMany({
      where: {
        branchId: branchId,
        lineOfBusinessId: lineOfBusinessId,
        role: {
          in: ["USER"] // Only assign to "User" role (agent role)
        }
      },
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
            assignedComplaints: {
              where: {
                OR: [
                  { 
                    status: {
                      name: "PENDING"
                    }
                  },
                  { 
                    status: {
                      name: "IN_PROGRESS"
                    }
                  }
                ]
              }
            }
          }
        }
      }
    });

    console.log(`Found ${candidateUsers.length} candidate users for assignment`);

    // Log each candidate user for debugging
    candidateUsers.forEach((user: any) => {
      console.log(`- ${user.name} (${user.role}): ${user._count.assignedComplaints} active complaints`);
    });

    if (candidateUsers.length === 0) {
      console.log("No suitable users found for automatic assignment");
      return null;
    }

    // Sort users by the number of active complaints (ascending) - load balancing
    const sortedUsers = [...candidateUsers].sort((a, b) => 
      a._count.assignedComplaints - b._count.assignedComplaints
    );

    // Assign to the user with the least active complaints
    const selectedUser = sortedUsers[0];
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
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Complaint ${complaintId} successfully assigned to ${selectedUser.name}`);

    // Create an action record for the assignment
    await prisma.complaintAction.create({
      data: {
        description: `Automatically assigned to ${selectedUser.name}`,
        complaintId: complaintId,
        userId: selectedUser.id
      }
    });

    return updatedComplaint;
  } catch (error) {
    console.error("Error in automatic assignment:", error);
    return null;
  }
}

// Send email notifications for new complaint
async function sendComplaintNotifications(complaint: any, assignedTo: any | null) {
  try {
    const recipients = [];
    
    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });
    recipients.push(...admins.map((admin: any) => admin.email));

    // Notify branch manager if applicable
    if (complaint.branchId) {
      const branchUsers = await prisma.user.findMany({
        where: { 
          branchId: complaint.branchId,
          role: { in: ["ADMIN", "USER"] }
        }
      });
      recipients.push(...branchUsers.map((user: any) => user.email));
    }

    // Remove duplicates and the creator's email if present
    const uniqueRecipients = [...new Set(recipients)].filter(email => email !== complaint.createdBy.email);

    console.log(`Sending complaint creation emails to: ${uniqueRecipients.join(', ')}`);

    // Send complaint created email
    if (uniqueRecipients.length > 0) {
      await sendComplaintCreatedEmail({
        to: uniqueRecipients,
        complaint: complaint,
        assignedTo: assignedTo
      });
    }

    // If assigned to someone, send assignment email
    if (assignedTo && assignedTo.email) {
      console.log(`Sending assignment email to: ${assignedTo.email}`);
      await sendComplaintAssignmentEmail({
        to: assignedTo.email,
        complaint: complaint
      });
    }

    console.log('✅ All complaint notification emails sent successfully');
  } catch (emailError) {
    console.error('❌ Failed to send email notifications:', emailError);
    // Don't fail the request if emails fail
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received complaint data:", body);

    const {
      customerName,
      customerId,
      policyNumber,
      policyType,
      description,
      channel,
      typeId,
      branchId,
      lineOfBusinessId
    } = body

    // Validate required fields
    if (!customerName || !customerId || !policyNumber || !description || !typeId || !branchId || !lineOfBusinessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate complaint number
    const currentYear = new Date().getFullYear()
    const complaintCount = await prisma.complaint.count({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`)
        }
      }
    })
    
    const complaintNumber = `COMP${currentYear}${(complaintCount + 1).toString().padStart(5, '0')}`

    // Calculate due date (7 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 2)

    // Get the default status (PENDING)
    let defaultStatus = await prisma.complaintStatus.findFirst({
      where: { name: "PENDING" }
    });

    // If PENDING status doesn't exist, create default statuses
    if (!defaultStatus) {
      console.log("Creating default complaint statuses...");
      await prisma.complaintStatus.createMany({
        data: [
          { name: "PENDING", description: "Complaint is pending review" },
          { name: "IN_PROGRESS", description: "Complaint is being worked on" },
          { name: "RESOLVED", description: "Complaint has been resolved" },
          { name: "CLOSED", description: "Complaint is closed" }
        ]
      });
      
      defaultStatus = await prisma.complaintStatus.findFirst({
        where: { name: "PENDING" }
      });
    }

    if (!defaultStatus) {
      return NextResponse.json(
        { error: "Could not find or create default complaint status" },
        { status: 500 }
      )
    }

    console.log("Using status ID:", defaultStatus.id);

    // Verify that the referenced entities exist
    const [typeExists, branchExists, lobExists] = await Promise.all([
      prisma.complaintType.findUnique({ where: { id: typeId } }),
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.lineOfBusiness.findUnique({ where: { id: lineOfBusinessId } })
    ]);

    if (!typeExists) {
      return NextResponse.json({ error: "Invalid complaint type" }, { status: 400 });
    }
    if (!branchExists) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    }
    if (!lobExists) {
      return NextResponse.json({ error: "Invalid line of business" }, { status: 400 });
    }

    // Create complaint - initially without assignment
    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        customerName,
        customerId,
        policyNumber,
        policyType: policyType || "General",
        description,
        channel: channel || "WEB",
        dueDate,
        statusId: defaultStatus.id,
        typeId,
        branchId,
        lineOfBusinessId,
        createdById: session.user.id,
        assignedToId: null // Will be assigned automatically
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
            name: true,
            email: true
          }
        }
      }
    })

    console.log("Complaint created successfully:", complaint.id);

    // Create initial action record
    await prisma.complaintAction.create({
      data: {
        description: "Complaint created",
        complaintId: complaint.id,
        userId: session.user.id
      }
    })

    // Create notification for the creator
    await prisma.notification.create({
      data: {
        title: "Complaint Created Successfully",
        message: `Complaint ${complaint.complaintNumber} has been created and is being processed`,
        userId: session.user.id,
        complaintId: complaint.id,
        type: "COMPLAINT_CREATED"
      }
    });

    // Send initial email notifications (without assignment)
    await sendComplaintNotifications(complaint, null);

    // ALWAYS try automatic assignment after complaint creation
    try {
      console.log("Starting automatic assignment...");
      const updatedComplaint = await assignComplaintAutomatically(complaint.id, branchId, lineOfBusinessId);
      
      if (updatedComplaint && updatedComplaint.assignedTo) {
        // Send assignment email notifications
        await sendComplaintNotifications(updatedComplaint, updatedComplaint.assignedTo);
        
        // Create notification for the assigned user
        await prisma.notification.create({
          data: {
            title: "New Complaint Assigned",
            message: `Complaint ${complaint.complaintNumber} - ${customerName} has been assigned to you`,
            userId: updatedComplaint.assignedTo.id,
            complaintId: complaint.id,
            type: "ASSIGNMENT"
          }
        });
        
        console.log("Automatic assignment successful");
        return NextResponse.json(updatedComplaint);
      } else {
        console.log("Automatic assignment failed - no suitable user found");
        // Notify admins about unassigned complaint
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" }
        });

        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              title: "Complaint Requires Assignment",
              message: `Complaint ${complaint.complaintNumber} requires manual assignment. No suitable agent found for ${branchExists.name} branch and ${lobExists.name} line of business.`,
              userId: admin.id,
              complaintId: complaint.id,
              type: "ASSIGNMENT_NEEDED"
            }
          });
        }
        
        // Return the complaint even if assignment failed
        return NextResponse.json(complaint);
      }
    } catch (assignmentError) {
      console.error("Automatic assignment failed:", assignmentError);
      // Return the complaint even if assignment failed
      return NextResponse.json(complaint);
    }

  } catch (error: any) {
    console.error("Error creating complaint:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid reference data. Please check the selected options." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Proper role-based access control
    let whereClause: any = {}

    if (session.user.role === "USER") {
      // Regular users can only see complaints assigned to them (NOT unassigned)
      whereClause = {
        assignedToId: session.user.id // This ensures only assigned complaints are visible
      }
    } else if (session.user.role === "ADMIN") {
      // Admins can see all complaints - including unassigned ones
      whereClause = {}
    } else {
      // For any other role, restrict to assigned complaints only
      whereClause = {
        assignedToId: session.user.id
      }
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.complaint.count({ where: whereClause })

    return NextResponse.json({
      complaints,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching complaints:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}