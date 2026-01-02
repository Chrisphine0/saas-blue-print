"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Buyer } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { Loader2, Mail, Phone, User as UserIcon, Shield } from "lucide-react"

interface BuyerProfileFormProps {
  initialData: Buyer
  authUser: User
}

export default function BuyerProfileForm({ initialData, authUser }: BuyerProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  const [profileData, setProfileData] = useState({
    contact_person: initialData.contact_person || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Update buyer profile
      const { error: buyerError } = await supabase
        .from("buyers")
        .update({
          contact_person: profileData.contact_person,
          phone: profileData.phone,
          email: profileData.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialData.id)

      if (buyerError) throw buyerError

      // Update auth email if changed
      if (profileData.email !== authUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        })
        
        if (emailError) {
          toast.warning("Profile updated, but email change requires verification")
        } else {
          toast.success("Profile updated! Please check your email to confirm the new address")
        }
      } else {
        toast.success("Profile updated successfully")
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setPasswordLoading(true)

    try {
      const supabase = createClient()
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast.success("Password updated successfully")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast.error(error.message || "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and account security</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_person">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={profileData.contact_person}
                    onChange={handleProfileChange}
                    required
                    placeholder="Your full name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    required
                    placeholder="+254 700 000000"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    placeholder="your.email@example.com"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Changing your email will require verification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/buyer/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-1 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter new password"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>View your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-base font-medium">{initialData.business_name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Created</p>
              <p className="text-base font-medium">
                {new Date(initialData.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
              {initialData.verified ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  Pending
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Status</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  initialData.status === "active"
                    ? "bg-green-100 text-green-800"
                    : initialData.status === "suspended"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {initialData.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}