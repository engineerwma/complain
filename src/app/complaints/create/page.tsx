"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "react-hot-toast"

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

export default function CreateComplaintPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [linesOfBusiness, setLinesOfBusiness] = useState<LineOfBusiness[]>([])
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([])
  const [formData, setFormData] = useState({
    customerName: "",
    customerId: "",
    policyNumber: "",
    policyType: "",
    description: "",
    channel: "WEB",
    typeId: "",
    branchId: "",
    lineOfBusinessId: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, lobRes, typesRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/line-of-business"),
          fetch("/api/complaint-types")
        ])

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData)
        } else {
          console.error("Failed to fetch branches")
          toast.error("Failed to load branches")
        }

        if (lobRes.ok) {
          const lobData = await lobRes.json()
          setLinesOfBusiness(lobData)
        } else {
          console.error("Failed to fetch lines of business")
          toast.error("Failed to load lines of business")
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setComplaintTypes(typesData)
        } else {
          console.error("Failed to fetch complaint types")
          toast.error("Failed to load complaint types")
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load form data")
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate required fields
    if (!formData.customerName || !formData.customerId || !formData.policyNumber || 
        !formData.description || !formData.typeId || !formData.branchId || !formData.lineOfBusinessId) {
      toast.error("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      console.log("Submitting form data:", formData)

      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.assignedTo) {
          toast.success(`Complaint created successfully and assigned to ${data.assignedTo.name}!`)
        } else {
          toast.success("Complaint created successfully! It will be assigned to an agent shortly.")
        }
        console.log("Complaint created:", data)
        // Redirect to complaints list page
        router.push("/complaints")
        router.refresh() // Refresh the complaints list to show the new complaint
      } else {
        console.error("Failed to create complaint:", data)
        toast.error(data.error || "Failed to create complaint. Please check your data and try again.")
      }
    } catch (error) {
      console.error("Error creating complaint:", error)
      toast.error("An error occurred while creating the complaint")
    } finally {
      setIsLoading(false)
    }
  }

  // Check if all required fields are filled
  const isFormValid = 
    formData.customerName && 
    formData.customerId && 
    formData.policyNumber && 
    formData.description && 
    formData.typeId && 
    formData.branchId && 
    formData.lineOfBusinessId

  if (!session) {
    return null
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
            <h1 className="text-2xl font-semibold text-gray-900">Create New Complaint</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details to create a new complaint. It will be automatically assigned to an agent based on branch and line of business.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Information</CardTitle>
            <CardDescription>
              Enter the complaint details below. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customerName">
                    Customer Name *
                  </Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerId">
                    Customer ID *
                  </Label>
                  <Input
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    placeholder="Enter customer ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policyNumber">
                    Policy Number *
                  </Label>
                  <Input
                    id="policyNumber"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    placeholder="Enter policy number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="policyType">
                    Policy Type
                  </Label>
                  <Input
                    id="policyType"
                    name="policyType"
                    value={formData.policyType}
                    onChange={handleChange}
                    placeholder="Enter policy type (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="channel">
                    Channel
                  </Label>
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
                  <Label htmlFor="typeId">
                    Complaint Type *
                  </Label>
                  <Select 
                    value={formData.typeId} 
                    onValueChange={(value) => handleSelectChange("typeId", value)}
                    required
                  >
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
                  <Label htmlFor="branchId">
                    Branch *
                  </Label>
                  <Select 
                    value={formData.branchId} 
                    onValueChange={(value) => handleSelectChange("branchId", value)}
                    required
                  >
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
                  <Label htmlFor="lineOfBusinessId">
                    Line of Business *
                  </Label>
                  <Select 
                    value={formData.lineOfBusinessId} 
                    onValueChange={(value) => handleSelectChange("lineOfBusinessId", value)}
                    required
                  >
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
              </div>
              <div>
                <Label htmlFor="description">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter detailed description of the complaint"
                  required
                />
              </div>
              <div>
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload files</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG up to 10MB each
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <Link href="/complaints">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isLoading || !isFormValid}
                  className="min-w-[150px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Complaint"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}