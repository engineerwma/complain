"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  RefreshCw,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  complaintId?: string
  complaint?: {
    complaintNumber: string
    customerName: string
  }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchNotifications()
  }, [session, status, router])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications?limit=100')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setFilteredNotifications(data)
      } else {
        console.error("Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let result = notifications

    // Apply read/unread filter
    if (filter === "unread") {
      result = result.filter(notification => !notification.read)
    } else if (filter === "read") {
      result = result.filter(notification => notification.read)
    }

    // Apply search
    if (searchTerm) {
      result = result.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.complaint?.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (notification.complaint?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredNotifications(result)
  }, [notifications, filter, searchTerm])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true)
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        )
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    } finally {
      setIsMarkingAll(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        )
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (title: string) => {
    if (title.includes('SLA Breach') || title.includes('Urgent')) {
      return AlertCircle
    } else if (title.includes('Assignment') || title.includes('Assigned')) {
      return UserCheck
    } else if (title.includes('Due') || title.includes('Deadline')) {
      return Clock
    } else {
      return CheckCircle
    }
  }

  const getNotificationColor = (title: string) => {
    if (title.includes('SLA Breach') || title.includes('Urgent')) {
      return 'text-red-500'
    } else if (title.includes('Assignment') || title.includes('Assigned')) {
      return 'text-green-500'
    } else if (title.includes('Due') || title.includes('Deadline')) {
      return 'text-yellow-500'
    } else {
      return 'text-blue-500'
    }
  }

  const getNotificationBadge = (title: string) => {
    if (title.includes('SLA Breach') || title.includes('Urgent')) {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>
    } else if (title.includes('Assignment') || title.includes('Assigned')) {
      return <Badge variant="default" className="text-xs">Assignment</Badge>
    } else if (title.includes('Due') || title.includes('Deadline')) {
      return <Badge variant="secondary" className="text-xs">Reminder</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Info</Badge>
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your notifications and stay updated
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              onClick={fetchNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                disabled={isMarkingAll}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                {isMarkingAll ? "Marking..." : `Mark All Read (${unreadCount})`}
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              You have {notifications.length} notifications, {unreadCount} unread
            </CardDescription>
            
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex space-x-2">
                <Select value={filter} onValueChange={(value: "all" | "unread" | "read") => setFilter(value)}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "You're all caught up! New notifications will appear here."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.title)
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start space-x-4 p-4 rounded-lg border transition-colors",
                        !notification.read 
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", getNotificationColor(notification.title))} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <p className={cn(
                              "text-sm font-medium",
                              !notification.read 
                                ? "text-gray-900 dark:text-white" 
                                : "text-gray-600 dark:text-gray-300"
                            )}>
                              {notification.title}
                            </p>
                            {getNotificationBadge(notification.title)}
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className={cn(
                          "text-sm mb-2",
                          !notification.read 
                            ? "text-gray-700 dark:text-gray-300" 
                            : "text-gray-500 dark:text-gray-400"
                        )}>
                          {notification.message}
                        </p>
                        
                        {notification.complaint && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/complaints/${notification.complaintId}`)}
                              className="h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Complaint: {notification.complaint.complaintNumber}
                            </Button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notification.complaint.customerName}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}