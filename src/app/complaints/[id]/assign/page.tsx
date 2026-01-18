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
import { ArrowLeft, UserCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "react-hot-toast"

interface Complaint {
  id: string
  complaintNumber: string
  customerName: string
  customerId: string
  policyNumber: string
  policyType: string
  description: string
  channel: string
  createdAt: string
  dueDate: string | null
  status: {
    id: string
    name: string
  }
  type: {
    id: string
    name: string
  }
  branch: {
    id: string
    name: string
  } | null
  lineOfBusiness: {
    id: string
    name: string
  } | null
  assignedTo: {
    id: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  branch: {
    id: string
    name: string
  } | null
  lineOfBusiness: {
    id: string
    name: string
  } | null
}

export default function AssignComplaintPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const complaintId = params.id as string

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!complaintId) return

      try {
        const [complaintRes, usersRes] = await Promise.all([
          fetch(`/api/complaints/${complaintId}`),
          fetch("/api/users")
        ])

        if (complaintRes.ok) {
          const complaintData = await complaintRes.json()
          setComplaint(complaintData)
        } else {
          console.error("Failed to fetch complaint")
          toast.error("Failed to load complaint")
          router.push("/complaints")
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          // Filter to only show USER role for assignment (not ADMIN)
          const userRoleUsers = usersData.filter((user: User) => user.role === "USER")
          setUsers(userRoleUsers)
        } else {
          console.error("Failed to fetch users")
          toast.error("Failed to load users")
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session, complaintId, router])

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to assign")
      return
    }

    setIsAssigning(true)

    try {
      const response = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignedToId: selectedUserId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Complaint assigned successfully!")
        router.push("/complaints")
      } else {
        console.error("Failed to assign complaint:", data)
        toast.error(data.error || "Failed to assign complaint")
      }
    } catch (error) {
      console.error("Error assigning complaint:", error)
      toast.error("An error occurred while assigning the complaint")
    } finally {
      setIsAssigning(false)
    }
  }

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    )
  }

  if (!complaint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Complaint not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/complaints">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assign Complaint</h1>
            <p className="mt-1 text-sm text-gray-500">
              Assign complaint {complaint.complaintNumber} to a user
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
              <CardDescription>
                Information about the complaint to be assigned
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Complaint Number</div>
                <div className="text-sm text-gray-900">{complaint.complaintNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Customer</div>
                <div className="text-sm text-gray-900">{complaint.customerName}</div>
                <div className="text-sm text-gray-500">{complaint.customerId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Policy</div>
                <div className="text-sm text-gray-900">{complaint.policyNumber}</div>
                <div className="text-sm text-gray-500">{complaint.policyType}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Branch</div>
                <div className="text-sm text-gray-900">{complaint.branch?.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Line of Business</div>
                <div className="text-sm text-gray-900">{complaint.lineOfBusiness?.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Type</div>
                <div className="text-sm text-gray-900">{complaint.type?.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="text-sm text-gray-900">{complaint.status?.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Currently Assigned To</div>
                <div className="text-sm text-gray-900">
                  {complaint.assignedTo ? complaint.assignedTo.name : "Unassigned"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Assign to User</CardTitle>
              <CardDescription>
                Select a user to assign this complaint to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-gray-500">
                            {user.branch?.name || "No branch"} • {user.lineOfBusiness?.name || "No LOB"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Only users with matching branch and line of business are shown
                </p>
              </div>

              {selectedUserId && (
                <div className="p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900">Assignment Summary</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Complaint will be assigned to:{" "}
                    <strong>{users.find(u => u.id === selectedUserId)?.name}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/complaints">
                  <Button variant="outline" disabled={isAssigning}>
                    Cancel
                  </Button>
                </Link>
                <Button 
                  onClick={handleAssign} 
                  disabled={isAssigning || !selectedUserId}
                  className="min-w-[120px]"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}