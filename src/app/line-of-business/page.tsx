"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"

interface LineOfBusiness {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    users: number
    complaints: number
  }
}

export default function LineOfBusinessPage() {
  const { data: session } = useSession()
  const [linesOfBusiness, setLinesOfBusiness] = useState<LineOfBusiness[]>([])
  const [filteredLinesOfBusiness, setFilteredLinesOfBusiness] = useState<LineOfBusiness[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchLinesOfBusiness = async () => {
      try {
        const response = await fetch("/api/line-of-business")
        if (response.ok) {
          const data = await response.json()
          setLinesOfBusiness(data)
          setFilteredLinesOfBusiness(data)
        }
      } catch (error) {
        console.error("Failed to fetch lines of business:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session && session.user.role === "ADMIN") {
      fetchLinesOfBusiness()
    }
  }, [session])

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredLinesOfBusiness(linesOfBusiness)
    } else {
      const filtered = linesOfBusiness.filter(
        (lob) =>
          lob.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lob.description && lob.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredLinesOfBusiness(filtered)
    }
  }, [searchTerm, linesOfBusiness])

  const handleDeleteLineOfBusiness = async (id: string) => {
    if (!confirm("Are you sure you want to delete this line of business?")) return

    try {
      const response = await fetch(`/api/line-of-business/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // Refresh lines of business list
        const lobRes = await fetch("/api/line-of-business")
        if (lobRes.ok) {
          const lobData = await lobRes.json()
          setLinesOfBusiness(lobData)
          setFilteredLinesOfBusiness(lobData)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete line of business")
      }
    } catch (error) {
      console.error("Error deleting line of business:", error)
      alert("An error occurred while deleting the line of business")
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Line of Business</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage system lines of business
            </p>
          </div>
          <Link href="/line-of-business/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Line of Business
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line of Business List</CardTitle>
            <CardDescription>
              A list of all lines of business in the system
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search lines of business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading lines of business...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Complaints</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinesOfBusiness.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No lines of business found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLinesOfBusiness.map((lob) => (
                        <TableRow key={lob.id}>
                          <TableCell className="font-medium">
                            {lob.name}
                          </TableCell>
                          <TableCell>{lob.description || "-"}</TableCell>
                          <TableCell>{lob._count.users}</TableCell>
                          <TableCell>{lob._count.complaints}</TableCell>
                          <TableCell>
                            {new Date(lob.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/line-of-business/${lob.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteLineOfBusiness(lob.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}