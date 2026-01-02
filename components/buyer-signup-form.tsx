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

export function BuyerSignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
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
    const { valid, error } = validatePassword(formData.password)
    if (!valid) {
      toast({ title: "Signup failed", description: error, variant: "destructive" })
      return
    }
    
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/buyer/dashboard`,
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("Failed to create user")
      }

      // Create buyer profile on the server (service role) because signUp
      // may not return an authenticated session immediately (email confirmation).
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
        let errBody: any
        try {
          errBody = await createRes.json()
        } catch (e) {
          errBody = await createRes.text()
        }
        console.error("Create-buyer API error:", createRes.status, errBody)
        
        // Create a proper error object with status and code
        const apiError: any = new Error(
          errBody?.error?.message || 
          errBody?.message || 
          errBody?.error || 
          "Failed to create buyer profile"
        )
        apiError.status = createRes.status
        apiError.code = errBody?.error?.code || errBody?.code
        apiError.details = errBody?.error?.details || errBody?.details
        throw apiError
      }

      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      })

      router.push("/buyer/auth/signup-success")
    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase?.() ?? ""
      const errorCode = error?.code ?? error?.error?.code ?? null
      const errorDetails = error?.details?.toLowerCase?.() ?? ""
      const status = error?.status

      console.error("Signup error details:", { error, errorCode, status, errorMsg, errorDetails })

      // Handle foreign key constraint violations (user not verified or doesn't exist in auth.users)
      if (
        errorCode === "23503" ||
        errorMsg.includes("violates foreign key constraint") ||
        errorMsg.includes("foreign key violation") ||
        errorDetails.includes("not present in table")
      ) {
        toast({
          title: "Account verification issue",
          description: "There was an issue creating your profile. Please check your email for a verification link and try again after verifying.",
          variant: "destructive",
        })
      }
      // Handle 409 Conflict errors (duplicate email or other conflicts)
      else if (status === 409) {
        toast({
          title: "Email already in use",
          description: "An account with this email already exists. Please log in or use a different email.",
          variant: "destructive",
        })
      }
      // Handle duplicate user registration from Supabase Auth
      else if (
        errorMsg.includes("user already registered") ||
        errorMsg.includes("already registered") ||
        errorMsg.includes("duplicate key value") ||
        errorMsg.includes("already exists")
      ) {
        toast({
          title: "Email already in use",
          description: "An account with this email already exists. Please log in or use a different email.",
          variant: "destructive",
        })
      }
      // Handle weak password errors
      else if (errorMsg.includes("password") && (errorMsg.includes("weak") || errorMsg.includes("short"))) {
        toast({
          title: "Weak password",
          description: "Please choose a stronger password with at least 6 characters.",
          variant: "destructive",
        })
      }
      // Handle invalid email format
      else if (errorMsg.includes("invalid") && errorMsg.includes("email")) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
      }
      // Handle network errors
      else if (errorMsg.includes("fetch") || errorMsg.includes("network")) {
        toast({
          title: "Connection error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        })
      }
      // Generic fallback for all other errors
      else {
        toast({
          title: "Signup failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  )
}