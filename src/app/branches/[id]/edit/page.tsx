"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Branch {
  id: string
  name: string
  description: string | null
}

export default function EditBranchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [branch, setBranch] = useState<Branch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await fetch(`/api/branches/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setBranch(data)
          setFormData({
            name: data.name,
            description: data.description || ""
          })
        } else if (response.status === 404) {
          router.push("/branches")
        }
      } catch (error) {
        console.error("Failed to fetch branch:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session && params.id) {
      fetchBranch()
    }
  }, [session, params.id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/branches/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push("/branches")
      } else {
        console.error("Failed to update branch")
      }
    } catch (error) {
      console.error("Error updating branch:", error)
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
        <div className="text-center py-12">Loading branch...</div>
      </DashboardLayout>
    )
  }

  if (!branch) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Branch not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/branches">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Branch</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update branch information
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branch Information</CardTitle>
            <CardDescription>
              Update the details for this branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Branch Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
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