import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  // Create branches
  const branch1 = await prisma.branch.upsert({
    where: { name: "Head Office" },
    update: {},
    create: {
      name: "Head Office",
      description: "Main branch",
    },
  })

  const branch2 = await prisma.branch.upsert({
    where: { name: "North Branch" },
    update: {},
    create: {
      name: "North Branch",
      description: "Northern region branch",
    },
  })

  // Create lines of business
  const lob1 = await prisma.lineOfBusiness.upsert({
    where: { name: "Claims" },
    update: {},
    create: {
      name: "Claims",
      description: "Claims department",
    },
  })

  const lob2 = await prisma.lineOfBusiness.upsert({
    where: { name: "IT" },
    update: {},
    create: {
      name: "IT",
      description: "Information Technology department",
    },
  })

  const lob3 = await prisma.lineOfBusiness.upsert({
    where: { name: "HR" },
    update: {},
    create: {
      name: "HR",
      description: "Human Resources department",
    },
  })

  // Create regular users
  const hashedPassword2 = await bcrypt.hash("user123", 10)
  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      email: "user1@example.com",
      name: "Claims User",
      password: hashedPassword2,
      role: "USER",
      branchId: branch1.id,
      lineOfBusinessId: lob1.id,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      email: "user2@example.com",
      name: "IT User",
      password: hashedPassword2,
      role: "USER",
      branchId: branch2.id,
      lineOfBusinessId: lob2.id,
    },
  })

  // Create complaint types
  const type1 = await prisma.complaintType.upsert({
    where: { name: "Billing Issue" },
    update: {},
    create: {
      name: "Billing Issue",
      description: "Issues related to billing and payments",
    },
  })

  const type2 = await prisma.complaintType.upsert({
    where: { name: "Service Quality" },
    update: {},
    create: {
      name: "Service Quality",
      description: "Complaints about service quality",
    },
  })

  const type3 = await prisma.complaintType.upsert({
    where: { name: "Policy Clarification" },
    update: {},
    create: {
      name: "Policy Clarification",
      description: "Requests for policy clarification",
    },
  })

  // Create complaint statuses
  const status1 = await prisma.complaintStatus.upsert({
    where: { name: "PENDING" },
    update: {},
    create: {
      name: "PENDING",
      description: "Complaint is pending assignment",
    },
  })

  const status2 = await prisma.complaintStatus.upsert({
    where: { name: "IN_PROGRESS" },
    update: {},
    create: {
      name: "IN_PROGRESS",
      description: "Complaint is being worked on",
    },
  })

  const status3 = await prisma.complaintStatus.upsert({
    where: { name: "RESOLVED" },
    update: {},
    create: {
      name: "RESOLVED",
      description: "Complaint has been resolved",
    },
  })

  const status4 = await prisma.complaintStatus.upsert({
    where: { name: "CLOSED" },
    update: {},
    create: {
      name: "CLOSED",
      description: "Complaint has been closed",
    },
  })

  console.log({ admin, branch1, branch2, lob1, lob2, lob3, user1, user2, type1, type2, type3, status1, status2, status3, status4 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })