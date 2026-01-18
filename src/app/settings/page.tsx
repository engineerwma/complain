"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import { 
  User, 
  Lock, 
  Bell, 
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Download,
  Trash2,
  Mail,
  AlertTriangle,
  FileText
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "react-hot-toast"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must contain uppercase, lowercase, and number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session } = useSession()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("security")
  const [notifications, setNotifications] = useState({
    email: true,
    newComplaint: true,
    slaAlerts: true,
    weeklyReports: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const newPassword = watch("newPassword")

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"]
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500", "bg-emerald-600"]
    
    return {
      strength: (strength / 5) * 100,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || ""
    }
  }

  const passwordStrength = getPasswordStrength(newPassword || "")

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In real implementation:
      // const response = await fetch("/api/user/change-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     currentPassword: data.currentPassword,
      //     newPassword: data.newPassword,
      //   }),
      // })

      toast.success("Password changed successfully")
      reset()
    } catch (error) {
      toast.error("An error occurred while changing password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success("Notification preference updated")
  }

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.success("Account deletion request submitted")
    }
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <User className="h-6 w-6 mr-3 text-blue-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-gray-900 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Role</div>
                    <Badge 
                      variant={session.user.role === "ADMIN" ? "destructive" : "secondary"}
                      className="text-sm px-3 py-1"
                    >
                      {session.user.role}
                    </Badge>
                  </div>
                  
                  {session.user.branch && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Branch</div>
                      <div className="text-lg font-semibold text-gray-900">{session.user.branch.name}</div>
                    </div>
                  )}
                  
                  {session.user.lineOfBusiness && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Line of Business</div>
                      <div className="text-lg font-semibold text-gray-900">{session.user.lineOfBusiness.name}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-100/50">
                <TabsTrigger 
                  value="security" 
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex items-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>
              
              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Change Password</CardTitle>
                    <CardDescription className="text-base">
                      Update your password to keep your account secure. Use a strong, unique password.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword" className="text-sm font-medium">
                            Current Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              {...register("currentPassword")}
                              className="pr-10 h-11"
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {errors.currentPassword && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {errors.currentPassword.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="newPassword" className="text-sm font-medium">
                            New Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              {...register("newPassword")}
                              className="pr-10 h-11"
                              placeholder="Create a new password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                          
                          {/* Password Strength Meter */}
                          {newPassword && (
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Password strength</span>
                                <span className={`font-medium ${
                                  passwordStrength.strength >= 80 ? "text-green-600" :
                                  passwordStrength.strength >= 60 ? "text-blue-600" :
                                  passwordStrength.strength >= 40 ? "text-yellow-600" :
                                  "text-red-600"
                                }`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                  style={{ width: `${passwordStrength.strength}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {errors.newPassword && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {errors.newPassword.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirm New Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              {...register("confirmPassword")}
                              className="pr-10 h-11"
                              placeholder="Confirm your new password"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit" 
                          disabled={isLoading || !isDirty}
                          className="min-w-[160px] h-11"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Changing Password...
                            </>
                          ) : (
                            <>
                              Change Password
                              <Save className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                    <CardDescription className="text-base">
                      Choose how and when you want to be notified about important updates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      {
                        key: "email" as const,
                        title: "Email Notifications",
                        description: "Receive important updates and announcements via email",
                        icon: Mail
                      },
                      {
                        key: "newComplaint" as const,
                        title: "New Complaint Assigned",
                        description: "Notify when a new complaint is assigned to you",
                        icon: Bell
                      },
                      {
                        key: "slaAlerts" as const,
                        title: "SLA Breach Alerts",
                        description: "Notify when a complaint is about to breach SLA",
                        icon: AlertTriangle
                      },
                      {
                        key: "weeklyReports" as const,
                        title: "Weekly Reports",
                        description: "Receive weekly summary reports every Monday",
                        icon: FileText
                      }
                    ].map(({ key, title, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {description}
                            </div>
                          </div>
                        </div>
                    
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-4 border-t">
                      <Button className="min-w-[120px]">
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6 animate-in fade-in duration-300">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Privacy Settings</CardTitle>
                    <CardDescription className="text-base">
                      Manage your privacy and data settings according to your preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="font-semibold text-gray-900 mb-2">Data Usage</div>
                        <div className="text-sm text-gray-600">
                          We use your data to provide and improve our service. Your data is never shared with third parties without your consent.
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="font-semibold text-gray-900 mb-2">Data Retention</div>
                        <div className="text-sm text-gray-600">
                          Your data is retained for as long as your account is active. You can request deletion at any time.
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="font-semibold text-gray-900 mb-2">Cookies & Tracking</div>
                      <div className="text-sm text-gray-600">
                        We use cookies to enhance your experience and for analytics. You can manage your cookie preferences in your browser settings.
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1 sm:flex-none">
                          <Download className="h-4 w-4 mr-2" />
                          Download My Data
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 sm:flex-none"
                          onClick={handleDeleteAccount}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete My Account
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 text-center sm:text-left">
                        Account deletion is permanent and cannot be undone. All your data will be removed from our systems.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}