"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Buyer } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface BuyerBusinessFormProps {
  initialData: Buyer
}

export default function BuyerBusinessForm({ initialData }: BuyerBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Safety check
  if (!initialData) {
    router.push("/buyer/dashboard")
    return null
  }
  
  const [formData, setFormData] = useState({
    business_name: initialData.business_name || "",
    contact_person: initialData.contact_person || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    address: initialData.address || "",
    city: initialData.city || "",
    country: initialData.country || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("buyers")
        .update({
          business_name: formData.business_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialData.id)

      if (error) throw error

      toast.success("Business details updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating business details:", error)
      toast.error("Failed to update business details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Details</h1>
        <p className="text-muted-foreground mt-2">Manage your business information and contact details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business profile and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">
                  Contact Person <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="business@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+254 700 000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nairobi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  placeholder="Kenya"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full business address"
                rows={3}
              />
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

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your current account verification and status information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Verification Status</p>
              <p className="text-sm text-muted-foreground">
                {initialData.verified ? "Your account is verified" : "Your account is pending verification"}
              </p>
            </div>
            <div>
              {initialData.verified ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                  Pending
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">Your current account access status</p>
            </div>
            <div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${
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

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Credit Limit</p>
              <p className="text-sm text-muted-foreground">Your available credit for purchases</p>
            </div>
            <div>
              <span className="text-lg font-semibold">
                KES {Number(initialData.credit_limit).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}