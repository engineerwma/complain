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
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  X,
  Download,
  Calendar,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import Link from "next/link"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
}

interface FilterOptions {
  status: string
  type: string
  branch: string
  lineOfBusiness: string
  assignedTo: string
  dateFrom: string
  dateTo: string
  channel: string
  slaStatus: "all" | "onTrack" | "dueSoon" | "overdue"
}

interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export default function ComplaintsPage() {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [displayedComplaints, setDisplayedComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    type: "all",
    branch: "all",
    lineOfBusiness: "all",
    assignedTo: "all",
    dateFrom: "",
    dateTo: "",
    channel: "all",
    slaStatus: "all"
  })
  const [filterOptions, setFilterOptions] = useState({
    statuses: [] as { id: string; name: string }[],
    types: [] as { id: string; name: string }[],
    branches: [] as { id: string; name: string }[],
    linesOfBusiness: [] as { id: string; name: string }[],
    users: [] as { id: string; name: string }[]
  })
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  })

  // Refresh data when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [complaintsRes, statusesRes, typesRes, branchesRes, lobRes, usersRes] = await Promise.all([
          fetch("/api/complaints"),
          fetch("/api/complaint-statuses"),
          fetch("/api/complaint-types"),
          fetch("/api/branches"),
          fetch("/api/line-of-business"),
          fetch("/api/users")
        ])

        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json()
          setComplaints(complaintsData)
          setFilteredComplaints(complaintsData)
          setPagination(prev => ({
            ...prev,
            totalItems: complaintsData.length,
            totalPages: Math.ceil(complaintsData.length / prev.pageSize)
          }))
        } else {
          toast.error("Failed to fetch complaints")
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setFilterOptions(prev => ({ ...prev, statuses: statusesData }))
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json()
          setFilterOptions(prev => ({ ...prev, types: typesData }))
        }

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setFilterOptions(prev => ({ ...prev, branches: branchesData }))
        }

        if (lobRes.ok) {
          const lobData = await lobRes.json()
          setFilterOptions(prev => ({ ...prev, linesOfBusiness: lobData }))
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          // Filter out users with empty IDs
          const validUsers = usersData.filter((user: any) => user.id && user.id.trim() !== '')
          setFilterOptions(prev => ({ ...prev, users: validUsers }))
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session, refreshKey])

  // Update filtered complaints and pagination when filters change
  useEffect(() => {
    let result = complaints

    // Apply search term
    if (searchTerm) {
      result = result.filter(
        (complaint) =>
          complaint.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters (skip "all" values)
    if (filters.status && filters.status !== "all") {
      result = result.filter(complaint => complaint.status.id === filters.status)
    }

    if (filters.type && filters.type !== "all") {
      result = result.filter(complaint => complaint.type.id === filters.type)
    }

    if (filters.branch && filters.branch !== "all") {
      result = result.filter(complaint => complaint.branch.id === filters.branch)
    }

    if (filters.lineOfBusiness && filters.lineOfBusiness !== "all") {
      result = result.filter(complaint => complaint.lineOfBusiness.id === filters.lineOfBusiness)
    }

    if (filters.assignedTo && filters.assignedTo !== "all") {
      result = result.filter(complaint => complaint.assignedTo?.id === filters.assignedTo)
    }

    if (filters.channel && filters.channel !== "all") {
      result = result.filter(complaint => complaint.channel === filters.channel)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(complaint => new Date(complaint.createdAt) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of the day
      result = result.filter(complaint => new Date(complaint.createdAt) <= toDate)
    }

    // Apply SLA status filter
    if (filters.slaStatus !== "all") {
      const now = new Date()
      result = result.filter(complaint => {
        if (!complaint.dueDate) return false
        
        const dueDate = new Date(complaint.dueDate)
        const diffInHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        if (filters.slaStatus === "onTrack") {
          return diffInHours >= 24
        } else if (filters.slaStatus === "dueSoon") {
          return diffInHours >= 0 && diffInHours < 24
        } else if (filters.slaStatus === "overdue") {
          return diffInHours < 0
        }
        
        return true
      })
    }

    setFilteredComplaints(result)
    setPagination(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when filters change
      totalItems: result.length,
      totalPages: Math.ceil(result.length / prev.pageSize)
    }))
  }, [searchTerm, filters, complaints])

  // Update displayed complaints when pagination changes
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    setDisplayedComplaints(filteredComplaints.slice(startIndex, endIndex))
  }, [filteredComplaints, pagination.currentPage, pagination.pageSize])

  const handleFilterChange = (name: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      type: "all",
      branch: "all",
      lineOfBusiness: "all",
      assignedTo: "all",
      dateFrom: "",
      dateTo: "",
      channel: "all",
      slaStatus: "all"
    })
  }

  const hasActiveFilters = Object.values(filters).some(
    value => value !== "" && value !== "all"
  )

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: size,
      currentPage: 1, // Reset to first page when page size changes
      totalPages: Math.ceil(prev.totalItems / size)
    }))
  }

  const exportToCSV = () => {
    const headers = [
      "Complaint #",
      "Customer Name",
      "Customer ID",
      "Policy Number",
      "Policy Type",
      "Type",
      "Status",
      "Channel",
      "Branch",
      "Line of Business",
      "Assigned To",
      "Created By",
      "Created Date",
      "Due Date"
    ]

    // Convert data to CSV format with proper encoding
    const csvContent = [
      // Add BOM (Byte Order Mark) for UTF-8 to support Arabic
      '\uFEFF' + headers.join(","),
      ...filteredComplaints.map(complaint => [
        complaint.complaintNumber,
        `"${complaint.customerName}"`, // Keep quotes for names with commas
        complaint.customerId,
        complaint.policyNumber,
        `"${complaint.policyType}"`,
        complaint.type.name,
        complaint.status.name,
        complaint.channel,
        complaint.branch.name,
        complaint.lineOfBusiness.name,
        complaint.assignedTo?.name || "Unassigned",
        complaint.createdBy.name,
        new Date(complaint.createdAt).toLocaleDateString(),
        complaint.dueDate ? new Date(complaint.dueDate).toLocaleDateString() : ""
      ].join(","))
    ].join("\n")

    // Create blob with proper UTF-8 encoding
    const blob = new Blob([csvContent], { 
      type: "text/csv;charset=utf-8;" 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "complaints.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("CSV exported successfully with Arabic support")
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    toast.success("Complaints refreshed")
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
          <span className="text-xs">Overdue</span>
        </div>
      )
    } else if (diffInHours < 24) {
      return (
        <div className="flex items-center text-yellow-600">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-xs">Due soon</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span className="text-xs">On track</span>
        </div>
      )
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const { currentPage, totalPages } = pagination
    
    if (totalPages <= 7) {
      // Show all pages if total pages is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page, last page, and pages around current page
      if (currentPage <= 4) {
        // Near the start
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Complaints</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all customer complaints
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Link href="/complaints/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Complaint List</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Object.values(filters).filter(value => value !== "" && value !== "all").length}
                  </span>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              A list of all complaints in the system. New complaints are automatically assigned to available agents.
            </CardDescription>
            
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {filterOptions.statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {filterOptions.types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <Select value={filters.branch} onValueChange={(value) => handleFilterChange("branch", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All branches</SelectItem>
                      {filterOptions.branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line of Business</label>
                  <Select value={filters.lineOfBusiness} onValueChange={(value) => handleFilterChange("lineOfBusiness", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All lines of business" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All lines of business</SelectItem>
                      {filterOptions.linesOfBusiness.map((lob) => (
                        <SelectItem key={lob.id} value={lob.id}>
                          {lob.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <Select value={filters.assignedTo} onValueChange={(value) => handleFilterChange("assignedTo", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      {filterOptions.users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <Select value={filters.channel} onValueChange={(value) => handleFilterChange("channel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="WEB">Web</SelectItem>
                      <SelectItem value="MOBILE">Mobile</SelectItem>
                      <SelectItem value="IN_PERSON">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SLA Status</label>
                  <Select value={filters.slaStatus} onValueChange={(value) => handleFilterChange("slaStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="onTrack">On Track</SelectItem>
                      <SelectItem value="dueSoon">Due Soon</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search complaints, customers, creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {displayedComplaints.length} of {filteredComplaints.length} complaints
                {filteredComplaints.length !== complaints.length && ` (filtered from ${complaints.length} total)`}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">Loading complaints...</div>
            ) : (
              <>
                <div className="rounded-md border mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedComplaints.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            No complaints found
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedComplaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-medium">
                              {complaint.complaintNumber}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{complaint.customerName}</div>
                                <div className="text-sm text-gray-500">
                                  {complaint.customerId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{complaint.type.name}</TableCell>
                            <TableCell>
                              {getStatusBadge(complaint.status.name)}
                            </TableCell>
                            <TableCell>
                              {complaint.assignedTo ? (
                                <div className="flex items-center">
                                  <span>{complaint.assignedTo.name}</span>
                                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <span>Unassigned</span>
                                  <AlertTriangle className="ml-1 h-4 w-4 text-yellow-500" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span>{complaint.createdBy.name}</span>
                                <UserCheck className="ml-1 h-4 w-4 text-blue-500" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {getSLAStatus(complaint.dueDate)}
                            </TableCell>
                            <TableCell>
                              {new Date(complaint.createdAt).toLocaleDateString()}
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
                                  <Link href={`/complaints/${complaint.id}`}>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                  </Link>
                                  <Link href={`/complaints/${complaint.id}/edit`}>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </Link>
                                  
                                  {/* Only show manual assignment for Admin users */}
                                  {session.user.role === "ADMIN" && (
                                    <Link href={`/complaints/${complaint.id}/assign`}>
                                      <DropdownMenuItem>
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Assign Manually
                                      </DropdownMenuItem>
                                    </Link>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {filteredComplaints.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Rows per page:
                      </span>
                      <Select
                        value={pagination.pageSize.toString()}
                        onValueChange={(value) => handlePageSizeChange(Number(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-6 lg:space-x-8">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={index} className="px-2 text-sm text-gray-500">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={index}
                              variant={pagination.currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.currentPage === pagination.totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
                      {pagination.totalItems} entries
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}