"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string
  role: string
  branchId: string | null
  lineOfBusinessId: string | null
}

interface Branch {
  id: string
  name: string
}

interface LineOfBusiness {
  id: string
  name: string
}

export default function EditUserPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [linesOfBusiness, setLinesOfBusiness] = useState<LineOfBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "USER",
    branchId: "",
    lineOfBusinessId: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, branchesRes, lobRes] = await Promise.all([
          fetch(`/api/users/${params.id}`),
          fetch("/api/branches"),
          fetch("/api/line-of-business")
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
          setFormData({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            branchId: userData.branchId || "",
            lineOfBusinessId: userData.lineOfBusinessId || "",
            password: "",
            confirmPassword: ""
          })
        } else if (userRes.status === 404) {
          router.push("/users")
        }

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData)
        }

        if (lobRes.ok) {
          const lobData = await lobRes.json()
          setLinesOfBusiness(lobData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session && params.id) {
      fetchData()
    }
  }, [session, params.id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Only include password if it's provided
      const submitData = { ...formData }
      if (!submitData.password) {
        delete submitData.password
        delete submitData.confirmPassword
      }

      const response = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        router.push("/users")
      } else {
        const errorData = await response.json()
        console.error("Failed to update user:", errorData.error)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading user...</div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">User not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/users">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update user information
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Update the details for this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branchId">Branch</Label>
                  <Select value={formData.branchId} onValueChange={(value) => handleSelectChange("branchId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lineOfBusinessId">Line of Business</Label>
                  <Select value={formData.lineOfBusinessId} onValueChange={(value) => handleSelectChange("lineOfBusinessId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select line of business" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {linesOfBusiness.map((lob) => (
                        <SelectItem key={lob.id} value={lob.id}>
                          {lob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Leave blank if you don't want to change the password
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}