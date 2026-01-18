"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  typeId: string
  statusId: string
  branchId: string
  lineOfBusinessId: string
  assignedToId: string | null
}

interface Branch {
  id: string
  name: string
}

interface LineOfBusiness {
  id: string
  name: string
}

interface ComplaintType {
  id: string
  name: string
}

interface ComplaintStatus {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

export default function EditComplaintPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [linesOfBusiness, setLinesOfBusiness] = useState<LineOfBusiness[]>([])
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([])
  const [statuses, setStatuses] = useState<ComplaintStatus[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    policyNumber: "",
    policyType: "",
    description: "",
    channel: "WEB",
    typeId: "",
    statusId: "",
    branchId: "",
    lineOfBusinessId: "",
    assignedToId: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [complaintRes, branchesRes, lobRes, typesRes, statusesRes, usersRes] = await Promise.all([
          fetch(`/api/complaints/${params.id}`),
          fetch("/api/branches"),
          fetch("/api/line-of-business"),
          fetch("/api/complaint-types"),
          fetch("/api/complaint-statuses"),
          fetch("/api/users")
        ])

        if (complaintRes.ok) {
          const complaintData = await complaintRes.json()
          setComplaint(complaintData)
          setFormData({
            customerName: complaintData.customerName || "",
            customerId: complaintData.customerId || "",
            policyNumber: complaintData.policyNumber || "",
            policyType: complaintData.policyType || "",
            description: complaintData.description || "",
            channel: complaintData.channel || "WEB",
            typeId: complaintData.typeId || "",
            statusId: complaintData.statusId || "",
            branchId: complaintData.branchId || "",
            lineOfBusinessId: complaintData.lineOfBusinessId || "",
            assignedToId: complaintData.assignedToId || ""
          })
        } else if (complaintRes.status === 404) {
          setError("Complaint not found")
          toast.error("Complaint not found")
          router.push("/complaints")
        } else {
          setError("Failed to load complaint")
          toast.error("Failed to load complaint")
        }

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData)
        }

        if (lobRes.ok) {
          const lobData = await lobRes.json()
          setLinesOfBusiness(lobData)
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setComplaintTypes(typesData)
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatuses(statusesData)
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setError("Failed to load data")
        toast.error("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session && params.id) {
      fetchData()
    }
  }, [session, params.id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const response = await fetch(`/api/complaints/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Complaint updated successfully")
        router.push(`/complaints/${params.id}`)
      } else {
        const errorData = await response.json()
        console.error("Failed to update complaint:", errorData)
        toast.error(errorData.error || "Failed to update complaint")
      }
    } catch (error) {
      console.error("Error updating complaint:", error)
      toast.error("Error updating complaint")
    } finally {
      setIsSaving(false)
    }
  }

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading complaint...</div>
      </DashboardLayout>
    )
  }

  if (error && !complaint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Link href="/complaints">
            <Button className="mt-4">Back to Complaints</Button>
          </Link>
        </div>
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
          <Link href={`/complaints/${params.id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Complaint</h1>
            <p className="mt-1 text-sm text-gray-500">
              {complaint.complaintNumber}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Information</CardTitle>
            <CardDescription>
              Update the details for this complaint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policyType">Policy Type</Label>
                  <Input
                    id="policyType"
                    name="policyType"
                    value={formData.policyType}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <Select value={formData.channel} onValueChange={(value) => handleSelectChange("channel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="WEB">Web</SelectItem>
                      <SelectItem value="MOBILE">Mobile</SelectItem>
                      <SelectItem value="IN_PERSON">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="typeId">Complaint Type</Label>
                  <Select value={formData.typeId} onValueChange={(value) => handleSelectChange("typeId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select complaint type" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusId">Status</Label>
                  <Select value={formData.statusId} onValueChange={(value) => handleSelectChange("statusId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
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
                      {linesOfBusiness.map((lob) => (
                        <SelectItem key={lob.id} value={lob.id}>
                          {lob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {session.user.role === "ADMIN" && (
                  <div>
                    <Label htmlFor="assignedToId">Assigned To</Label>
                    <Select value={formData.assignedToId} onValueChange={(value) => handleSelectChange("assignedToId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Link href={`/complaints/${params.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
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