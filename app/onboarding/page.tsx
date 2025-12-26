"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    address: "",
    city: "",
    taxId: "",
    businessRegistration: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Pre-fill data from user metadata if available
    const loadUserData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.user_metadata) {
        setFormData((prev) => ({
          ...prev,
          businessName: user.user_metadata.business_name || "",
          phone: user.user_metadata.phone || "",
        }))
      }
    }

    loadUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Create supplier profile
      const { error: insertError } = await supabase.from("suppliers").insert({
        user_id: user.id,
        business_name: formData.businessName,
        email: user.email!,
        phone: formData.phone,
        address: formData.address || null,
        city: formData.city || null,
        tax_id: formData.taxId || null,
        business_registration: formData.businessRegistration || null,
        country: "Kenya",
        status: "active",
      })

      if (insertError) throw insertError

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Supplier Profile</CardTitle>
            <CardDescription>Provide your business details to start selling on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taxId">Tax ID / PIN</Label>
                  <Input
                    id="taxId"
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="businessRegistration">Business Registration Number</Label>
                  <Input
                    id="businessRegistration"
                    type="text"
                    value={formData.businessRegistration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessRegistration: e.target.value,
                      })
                    }
                  />
                </div>

                {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating profile..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}