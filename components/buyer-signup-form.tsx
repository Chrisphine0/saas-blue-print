"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { validatePassword } from "@/lib/validatePassword"
import { Eye, EyeOff, Building2, User, Mail, Phone, MapPin } from "lucide-react"

export function BuyerSignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    contactPerson: "",
    phone: "",
    address: "",
    city: "",
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Password Validation
    const { valid, error: pwError } = validatePassword(formData.password)
    if (!valid) {
      toast({ title: "Signup failed", description: pwError, variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // 2. 🛡️ Manual Pre-check: Prevent Cross-Role Registration
      // This checks if the email is already used in either table before calling Auth
      const [{ data: existingBuyer }, { data: existingSupplier }] = await Promise.all([
        supabase.from("buyers").select("email").eq("email", formData.email).maybeSingle(),
        supabase.from("suppliers").select("email").eq("email", formData.email).maybeSingle()
      ])

      if (existingBuyer || existingSupplier) {
        toast({
          title: "Account Conflict",
          description: existingSupplier 
            ? "This email is already registered as a Supplier. Please use a different email." 
            : "An account with this email already exists.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // 3. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/buyer/dashboard`,
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user")

      // 4. Create Buyer Profile via API
      const createRes = await fetch("/api/create-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authData.user.id,
          business_name: formData.businessName,
          contact_person: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          status: "pending",
        }),
      })

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}))
        const apiError: any = new Error(errData.error?.message || errData.message || "Failed to create profile")
        apiError.code = errData.error?.code || errData.code
        throw apiError
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      })

      router.push("/buyer/auth/signup-success")

    } catch (error: any) {
      console.error("Signup error:", error)
      const errorMsg = error?.message?.toLowerCase?.() ?? ""
      const errorCode = error?.code ?? null;

      // Handling Trigger Exceptions (P0001 is custom PostgreSQL code)
      if (errorCode === "P0001" || errorMsg.includes("supplier table")) {
        toast({
          title: "Account Role Conflict",
          description: "This email is registered to a Supplier account. Please use a different email.",
          variant: "destructive",
        })
      } else if (errorMsg.includes("already registered") || errorMsg.includes("already exists")) {
        toast({
          title: "Email in use",
          description: "An account with this email already exists. Try logging in.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signup failed",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {/* Business & Contact Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="businessName"
              className="pl-10"
              placeholder="Company Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="contactPerson"
              className="pl-10"
              placeholder="John Doe"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            className="pl-10"
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            className="pl-10"
            placeholder="+254..."
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Password Field with Toggle */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="pr-10"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Location Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            {/* <City className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /> */}
            <Input 
              id="city" 
              className="pl-10"
              placeholder="City"
              value={formData.city} 
              onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              className="pl-10"
              placeholder="Physical Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Account..." : "Create Buyer Account"}
      </Button>
    </form>
  )
}