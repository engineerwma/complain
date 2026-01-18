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

interface Branch {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    users: number
    complaints: number
  }
}

export default function BranchesPage() {
  const { data: session } = useSession()
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches")
        if (response.ok) {
          const data = await response.json()
          setBranches(data)
          setFilteredBranches(data)
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session && session.user.role === "ADMIN") {
      fetchBranches()
    }
  }, [session])

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredBranches(branches)
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (branch.description && branch.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredBranches(filtered)
    }
  }, [searchTerm, branches])

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        // Refresh branches list
        const branchesRes = await fetch("/api/branches")
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData)
          setFilteredBranches(branchesData)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete branch")
      }
    } catch (error) {
      console.error("Error deleting branch:", error)
      alert("An error occurred while deleting the branch")
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
            <h1 className="text-2xl font-semibold text-gray-900">Branches</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage system branches
            </p>
          </div>
          <Link href="/branches/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Branch
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Branch List</CardTitle>
            <CardDescription>
              A list of all branches in the system
            </CardDescription>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading branches...</div>
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
                    {filteredBranches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No branches found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBranches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell className="font-medium">
                            {branch.name}
                          </TableCell>
                          <TableCell>{branch.description || "-"}</TableCell>
                          <TableCell>{branch._count.users}</TableCell>
                          <TableCell>{branch._count.complaints}</TableCell>
                          <TableCell>
                            {new Date(branch.createdAt).toLocaleDateString()}
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
                                <Link href={`/branches/${branch.id}/edit`}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteBranch(branch.id)}
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