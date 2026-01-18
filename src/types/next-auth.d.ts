// types/next-auth.d.ts
import { Role, Branch, LineOfBusiness } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      branch?: Branch | null
      lineOfBusiness?: LineOfBusiness | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: Role
    branch?: Branch | null
    lineOfBusiness?: LineOfBusiness | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    branch?: Branch | null
    lineOfBusiness?: LineOfBusiness | null
  }
}