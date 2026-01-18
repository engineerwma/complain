"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  ArrowLeft, 
  Edit, 
  Paperclip, 
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Briefcase,
  Calendar,
  MessageSquare,
  Upload,
  Download,
  Trash2,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  resolvedAt: string | null
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
  }
  lineOfBusiness: {
    id: string
    name: string
  }
  assignedTo: {
    id: string
    name: string
  } | null
  createdBy: {
    id: string
    name: string
  }
  actions: {
    id: string
    description: string
    createdAt: string
    user: {
      id: string
      name: string
    }
  }[]
  attachments: {
    id: string
    filename: string
    mimetype: string
    size: number
    createdAt: string
    path: string
  }[]
}

export default function ComplaintDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [actionDescription, setActionDescription] = useState("")
  const [isAddingAction, setIsAddingAction] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintRes, statusesRes] = await Promise.all([
          fetch(`/api/complaints/${params.id}`),
          fetch("/api/complaint-statuses")
        ])

        if (complaintRes.ok) {
          const complaintData = await complaintRes.json()
          // Ensure actions and attachments are always arrays
          setComplaint({
            ...complaintData,
            actions: complaintData.actions || [],
            attachments: complaintData.attachments || []
          })
          setSelectedStatus(complaintData.status.id)
        } else if (complaintRes.status === 404) {
          router.push("/complaints")
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatuses(statusesData)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)
    setUploadStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("complaintId", params.id as string)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        setUploadStatus("File uploaded successfully")
        // Refresh complaint data to show new attachment
        const complaintResponse = await fetch(`/api/complaints/${params.id}`)
        if (complaintResponse.ok) {
          const data = await complaintResponse.json()
          setComplaint({
            ...data,
            actions: data.actions || [],
            attachments: data.attachments || []
          })
        }
      } else {
        const errorData = await response.json()
        setUploadStatus(errorData.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadStatus("Error uploading file")
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionDescription.trim()) return

    setIsAddingAction(true)

    try {
      const response = await fetch(`/api/complaints/${params.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description: actionDescription
        })
      })

      if (response.ok) {
        setActionDescription("")
        // Refresh complaint data to show new action
        const complaintResponse = await fetch(`/api/complaints/${params.id}`)
        if (complaintResponse.ok) {
          const data = await complaintResponse.json()
          setComplaint({
            ...data,
            actions: data.actions || [],
            attachments: data.attachments || []
          })
        }
      } else {
        console.error("Failed to add action")
      }
    } catch (error) {
      console.error("Error adding action:", error)
    } finally {
      setIsAddingAction(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // Refresh complaint data to update attachments list
        const complaintResponse = await fetch(`/api/complaints/${params.id}`)
        if (complaintResponse.ok) {
          const data = await complaintResponse.json()
          setComplaint({
            ...data,
            actions: data.actions || [],
            attachments: data.attachments || []
          })
        }
      } else {
        console.error("Failed to delete attachment")
      }
    } catch (error) {
      console.error("Error deleting attachment:", error)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return

    setIsUpdatingStatus(true)

    try {
      const response = await fetch(`/api/complaints/${params.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          statusId: selectedStatus
        })
      })

      if (response.ok) {
        // Refresh complaint data to show updated status
        const complaintResponse = await fetch(`/api/complaints/${params.id}`)
        if (complaintResponse.ok) {
          const data = await complaintResponse.json()
          setComplaint({
            ...data,
            actions: data.actions || [],
            attachments: data.attachments || []
          })
        }
      } else {
        console.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusBadge = (statusName: string) => {
    switch (statusName) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "RESOLVED":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "CLOSED":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge variant="outline">{statusName}</Badge>
    }
  }

  const getSLAStatus = (dueDate: string | null) => {
    if (!dueDate) return null
    
    const due = new Date(dueDate)
    const now = new Date()
    const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 0) {
      return (
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span className="text-sm">Overdue</span>
        </div>
      )
    } else if (diffInHours < 24) {
      return (
        <div className="flex items-center text-yellow-600">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">Due soon</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-sm">On track</span>
        </div>
      )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading complaint details...</div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/complaints">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {complaint.complaintNumber}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {complaint.customerName} - {complaint.policyNumber}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/complaints/${complaint.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href={`/complaints/${complaint.id}/assign`}>
                <Button variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Complaint Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">{complaint.description}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Channel</h3>
                        <p className="mt-1 text-sm text-gray-900">{complaint.channel}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Type</h3>
                        <p className="mt-1 text-sm text-gray-900">{complaint.type.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <div className="mt-1 flex items-center space-x-2">
                          {getStatusBadge(complaint.status.name)}
                          {session.user.role === "ADMIN" && (
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((status) => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {session.user.role === "ADMIN" && (
                            <Button 
                              size="sm" 
                              onClick={handleStatusUpdate}
                              disabled={isUpdatingStatus || selectedStatus === complaint.status.id}
                            >
                              {isUpdatingStatus ? "Updating..." : "Update"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">SLA Status</h3>
                        <div className="mt-1">{getSLAStatus(complaint.dueDate)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddAction} className="space-y-4">
                      <div>
                        <Label htmlFor="action-description">Action Description</Label>
                        <Textarea
                          id="action-description"
                          value={actionDescription}
                          onChange={(e) => setActionDescription(e.target.value)}
                          rows={3}
                          placeholder="Describe the action taken..."
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isAddingAction || !actionDescription.trim()}>
                          {isAddingAction ? "Adding..." : "Add Action"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Action History</CardTitle>
                    <CardDescription>
                      Timeline of all actions taken on this complaint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!complaint.actions || complaint.actions.length === 0) ? (
                      <p className="text-sm text-gray-500">No actions recorded yet</p>
                    ) : (
                      <div className="space-y-4">
                        {complaint.actions.map((action) => (
                          <div key={action.id} className="flex">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {action.user.name}
                              </div>
                              <div className="mt-1 text-sm text-gray-500">
                                {action.description}
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                {formatDate(action.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="attachments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload New File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadStatus && (
                      <div className={`mb-4 p-3 rounded-md ${
                        uploadStatus.includes("successfully") 
                          ? "bg-green-50 text-green-700" 
                          : "bg-red-50 text-red-700"
                      }`}>
                        {uploadStatus}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <Label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload New File
                      </Label>
                      <div className="flex items-center">
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {isUploading ? "Uploading..." : "Choose File"}
                        </label>
                        <span className="ml-3 text-sm text-gray-500">
                          PDF, JPG, PNG, DOC up to 10MB
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                    <CardDescription>
                      Files attached to this complaint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(!complaint.attachments || complaint.attachments.length === 0) ? (
                      <p className="text-sm text-gray-500">No attachments</p>
                    ) : (
                      <div className="space-y-4">
                        {complaint.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center">
                              <Paperclip className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {attachment.filename}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={attachment.path} download={attachment.filename}>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {complaint.customerId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.policyNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {complaint.policyType}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Assignment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.branch.name}
                    </div>
                    <div className="text-sm text-gray-500">Branch</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.lineOfBusiness.name}
                    </div>
                    <div className="text-sm text-gray-500">Line of Business</div>
                  </div>
                </div>
                {complaint.assignedTo && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.assignedTo.name}
                      </div>
                      <div className="text-sm text-gray-500">Assigned To</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {complaint.createdBy.name}
                    </div>
                    <div className="text-sm text-gray-500">Created By</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Created
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(complaint.createdAt)}
                    </div>
                  </div>
                </div>
                {complaint.dueDate && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Due Date
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(complaint.dueDate)}
                      </div>
                    </div>
                  </div>
                )}
                {complaint.resolvedAt && (
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Resolved
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(complaint.resolvedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}