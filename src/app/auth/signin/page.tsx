// app/auth/signin/page.tsx
"use client"

import { SignInForm } from "@/components/auth/signin-form"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Users, TrendingUp, MessageCircle, CheckCircle } from "lucide-react"
import Image from "next/image"
export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [mounted, setMounted] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Shield,
      title: "Secure Access",
      description: "Enterprise-grade security with end-to-end encryption",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time collaboration with your entire team",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Live insights and performance metrics",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: MessageCircle,
      title: "Quick Resolution",
      description: "AI-powered complaint categorization and routing",
      color: "from-orange-500 to-red-500"
    }
  ]

  const demoCredentials = [
    { role: "Admin", email: "admin@company.com", password: "admin123" },
    { role: "Agent", email: "agent@company.com", password: "agent123" },
    { role: "Manager", email: "manager@company.com", password: "manager123" }
  ]

  // Get the current active feature
  const currentFeature = features[activeFeature]
  const CurrentFeatureIcon = currentFeature.icon

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 font-medium"
          >
            Loading ComplaintPro...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white flex-col lg:flex-row">
      {/* Left Side - Login Form (Now on left) */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 lg:flex-none bg-white relative order-2 lg:order-1">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-indigo-50 opacity-50" />
        
        <div className="relative z-10 mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
               
                <span className="text-2xl font-bold text-gray-900">ComplaintPro</span>
              </motion.div>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left mb-8">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900"
              >
                  <Image 
                  src="/main-logo.png" 
                  alt="GIG Egypt Life Takaful" 
                  width={60} 
                  height={60}
                  className="object-contain"
                />
                Welcome back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-gray-600"
              >
                Sign in to your account to continue
              </motion.p>
            </div>

            {/* Sign In Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
            >
              <SignInForm callbackUrl={callbackUrl} />
            </motion.div>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 transition-colors py-2"
              >
                {showDemo ? 'Hide' : 'Show'} Demo Credentials
              </button>
              
              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                  >
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Demo Credentials
                    </h4>
                    <div className="space-y-2">
                      {demoCredentials.map((cred, index) => (
                        <motion.div
                          key={cred.role}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="text-xs text-blue-700 p-2 bg-white/50 rounded-lg"
                        >
                          <div className="font-medium">{cred.role}</div>
                          <div>Email: {cred.email}</div>
                          <div>Password: {cred.password}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex items-start space-x-2 text-xs text-gray-500"
            >
              <Shield className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <p>
                Your authentication is secured with industry-standard encryption protocols
              </p>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center lg:text-left"
            >
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Brand/Features (Now on right) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:px-12 lg:py-12 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden order-1 lg:order-2">
        {/* Animated Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-1/4 -right-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg mx-auto w-full"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-16"
          >
            <div className="flex items-center space-x-3 group cursor-pointer">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/30"
              >
                <Shield className="h-6 w-6" />
              </motion.div>
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
                
              >
                
               GIG ComplaintPro
              </motion.span>
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Streamline Your{" "}
              <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Complaint Management
              </span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Efficiently track, manage, and resolve customer complaints with our AI-powered management system.
            </p>
          </motion.div>

          {/* Features Carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${currentFeature.color} backdrop-blur-sm border border-white/20`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <CurrentFeatureIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {currentFeature.title}
                    </h3>
                    <p className="text-blue-50 leading-relaxed">
                      {currentFeature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Feature Indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeFeature ? 'bg-white w-6' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="pt-8 border-t border-white/20"
          >
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { value: "50K+", label: "Complaints Resolved" },
                { value: "99%", label: "Satisfaction Rate" },
                { value: "24/7", label: "Support" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <div className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}