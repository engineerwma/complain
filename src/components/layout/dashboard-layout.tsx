"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building, 
  Briefcase, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  BarChart3,
  ChevronDown,
  User,
  LifeBuoy,
  Search,
  Sun,
  Moon,
  Home,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Plus,
  Download
} from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"

// Beautiful color palette
const COLORS = {
  primary: {
    light: "from-purple-500 to-pink-500",
    dark: "from-purple-600 to-pink-600",
    bg: "bg-gradient-to-br from-purple-500 to-pink-500"
  },
  secondary: {
    light: "from-blue-400 to-cyan-400",
    dark: "from-blue-500 to-cyan-500",
    bg: "bg-gradient-to-br from-blue-400 to-cyan-400"
  },
  accent: {
    light: "from-orange-400 to-red-400",
    dark: "from-orange-500 to-red-500",
    bg: "bg-gradient-to-br from-orange-400 to-red-400"
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: COLORS.primary },
  { name: "Complaints", href: "/complaints", icon: FileText, color: COLORS.secondary },
  { name: "Reports", href: "/reports", icon: BarChart3, color: COLORS.accent },
  { name: "Users", href: "/users", icon: Users, adminOnly: true, color: COLORS.primary },
  { name: "Branches", href: "/branches", icon: Building, adminOnly: true, color: COLORS.secondary },
  { name: "Business", href: "/line-of-business", icon: Briefcase, adminOnly: true, color: COLORS.accent },
  { name: "Settings", href: "/settings", icon: Settings, color: COLORS.primary },
]

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

function useNotifications() {
  const { data: session } = useSession()
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch('/api/notifications?includeRead=true&limit=20')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      return response.json()
    },
    enabled: !!session,
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      })
      if (!response.ok) throw new Error('Failed to mark notification as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      })
      if (!response.ok) throw new Error('Failed to mark all notifications as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)

  // Notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useNotifications()
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()

  const searchInputRef = useRef<HTMLInputElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle authentication
  useEffect(() => {
    if (status === "loading") return
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  // Dark mode setup
  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false)
      }
      if (notificationsOpen && !(event.target as Element).closest('.notifications-menu')) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, notificationsOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [darkMode])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery)
      setSearchQuery("")
    }
  }, [searchQuery])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  const markNotificationAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  const markAllNotificationsAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Getting things ready...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || session.user.role === "ADMIN"
  )

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 transition-all duration-500",
      darkMode && "dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900 dark:to-gray-800"
    )}>
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)} 
        />
        <div 
          ref={sidebarRef}
          className={cn(
            "fixed inset-y-0 left-0 flex w-80 max-w-full flex-col bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
            <Image 
                  src="/main-logo.png" 
                  alt="GIG Egypt Life Takaful" 
                  width={60} 
                  height={60}
                  className="object-contain"
                />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                GIG Complain
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(false)}
              className="hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${COLORS.secondary.bg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {session.user.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user.email}
                </p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${COLORS.primary.bg} text-white mt-2 shadow`}>
                  {session.user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-2 px-4">
              <Link
                href="/"
                className="flex items-center px-4 py-4 text-lg font-medium rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-700/50 dark:hover:to-purple-700/50 hover:text-gray-900 dark:hover:text-white transition-all duration-300 group border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
              >
                <Home className="h-6 w-6 mr-4 text-purple-500 group-hover:scale-110 transition-transform" />
                Back to Home
              </Link>
              
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-4 py-4 text-lg font-medium rounded-2xl transition-all duration-300 border-2",
                      isActive
                        ? `bg-gradient-to-r ${item.color.light} dark:${item.color.dark} text-white shadow-lg scale-105 border-transparent`
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={cn(
                        "mr-4 h-6 w-6 transition-all duration-300",
                        isActive 
                          ? "text-white scale-110" 
                          : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:scale-110"
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50 py-4 rounded-2xl transition-all duration-300"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 mr-3 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 mr-3 text-purple-500" />
              )}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50 py-4 rounded-2xl transition-all duration-300"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3 text-red-500" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
          {/* Desktop Header */}
          <div className="flex h-20 flex-shrink-0 items-center px-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
            
              <Image 
                  src="/main-logo.png" 
                  alt="GIG Egypt Life Takaful" 
                  width={60} 
                  height={60}
                  className="object-contain"
                />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                 Complains
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto py-8">
            <nav className="flex-1 space-y-3 px-6">
              <Link
                href="/"
                className="flex items-center px-4 py-4 text-lg font-medium rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-700/50 dark:hover:to-purple-700/50 hover:text-gray-900 dark:hover:text-white transition-all duration-300 group border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
              >
                <Home className="h-6 w-6 mr-4 text-purple-500 group-hover:scale-110 transition-transform" />
                Back to Home
              </Link>
              
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-4 py-4 text-lg font-medium rounded-2xl transition-all duration-300 border-2 hover:scale-105",
                      isActive
                        ? `bg-gradient-to-r ${item.color.light} dark:${item.color.dark} text-white shadow-2xl border-transparent`
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mr-4 h-6 w-6 transition-all duration-300",
                        isActive 
                          ? "text-white scale-110" 
                          : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:scale-110"
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Section */}
          <div className="flex flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="group block w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${COLORS.secondary.bg} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.user.role}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        <div className="flex flex-1 flex-col">
          {/* Top Header */}
          <div className={cn(
            "sticky top-0 z-40 flex h-20 flex-shrink-0 bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-500",
            isScrolled && "shadow-lg bg-white/95 dark:bg-gray-800/95"
          )}>
            <div className="flex flex-1 justify-between px-6 lg:px-8">
              <div className="flex flex-1 items-center">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mr-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-2xl"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search anything... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200/50 dark:border-gray-600/50 rounded-2xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>
                </form>
              </div>

              <div className="ml-6 flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-2xl p-3 transition-all duration-300 hover:scale-110"
                  title={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-purple-500" />
                  )}
                </Button>

                {/* Notifications */}
                <div className="relative notifications-menu">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen)
                      setUserMenuOpen(false)
                    }}
                    className={cn(
                      "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-2xl p-3 transition-all duration-300 hover:scale-110 relative",
                      notificationsOpen && "text-purple-600 dark:text-purple-400"
                    )}
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationsCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-50">
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Notifications
                          {unreadNotificationsCount > 0 && (
                            <span className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full px-2 py-1">
                              {unreadNotificationsCount} new
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {unreadNotificationsCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={markAllNotificationsAsRead}
                              disabled={markAllAsReadMutation.isPending}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            >
                              {markAllAsReadMutation.isPending ? "Marking..." : "Mark all read"}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center">
                            <RefreshCw className="h-8 w-8 text-purple-400 mx-auto mb-3 animate-spin" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50 last:border-b-0 cursor-pointer transition-all duration-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group",
                                !notification.read && "bg-blue-50/50 dark:bg-blue-900/20"
                              )}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 mt-2 rounded-full ${!notification.read ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'}`} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative user-menu">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 px-4 py-3 rounded-2xl transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen)
                      setNotificationsOpen(false)
                    }}
                  >
                    <div className={`w-10 h-10 ${COLORS.accent.bg} rounded-2xl flex items-center justify-center text-white font-bold shadow-lg`}>
                      {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      userMenuOpen && "rotate-180"
                    )} />
                  </Button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-3 z-50">
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {session.user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.user.email}
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={toggleDarkMode}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-300 rounded-xl"
                        >
                          {darkMode ? (
                            <Sun className="h-4 w-4 mr-3 text-yellow-500" />
                          ) : (
                            <Moon className="h-4 w-4 mr-3 text-purple-500" />
                          )}
                          {darkMode ? "Light Mode" : "Dark Mode"}
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-300 rounded-xl"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className="px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {filteredNavigation.find(item => item.href === pathname)?.name || "Dashboard"}
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    Welcome back, {session.user.name}! 👋
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Contextual Actions */}
                  {pathname === "/complaints" && (
                    <Link href="/complaints/create">
                      <Button className={`${COLORS.primary.bg} hover:opacity-90 text-white transition-all duration-300 rounded-2xl px-6 py-3 shadow-lg hover:scale-105`}>
                        <Plus className="h-5 w-5 mr-2" />
                        New Complaint
                      </Button>
                    </Link>
                  )}
                  {pathname === "/reports" && (
                    <Button variant="outline" className="transition-all duration-300 rounded-2xl px-6 py-3 border-2 hover:scale-105">
                      <Download className="h-5 w-5 mr-2" />
                      Export Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            <div className="py-8">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}