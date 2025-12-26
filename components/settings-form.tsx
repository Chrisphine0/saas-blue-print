"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PlatformSettings } from "@/lib/types"

export function SettingsForm({ settings, adminId }: { settings: PlatformSettings[]; adminId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getSettingValue = (key: string, defaultValue: any = "") => {
    const setting = settings.find((s) => s.key === key)
    return setting ? setting.value : defaultValue
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createBrowserClient()

      // Update each setting
      const updates = [
        {
          key: "commission_rate",
          value: { default: Number(formData.get("commission_rate")) },
        },
        {
          key: "order_approval_required",
          value: formData.get("order_approval_required") === "true",
        },
        {
          key: "supplier_verification_required",
          value: formData.get("supplier_verification_required") === "true",
        },
        {
          key: "buyer_verification_required",
          value: formData.get("buyer_verification_required") === "true",
        },
        {
          key: "maintenance_mode",
          value: formData.get("maintenance_mode") === "true",
        },
        {
          key: "min_order_amount",
          value: { KES: Number(formData.get("min_order_amount_kes")) },
        },
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: update.value, updated_by: adminId, updated_at: new Date().toISOString() })
          .eq("key", update.key)

        if (error) throw error
      }

      setMessage({ type: "success", text: "Settings updated successfully!" })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update settings" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="commission_rate">Platform Commission Rate (%)</Label>
          <Input
            id="commission_rate"
            name="commission_rate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={getSettingValue("commission_rate")?.default || 5}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">Percentage commission charged per order</p>
        </div>

        <div>
          <Label htmlFor="min_order_amount_kes">Minimum Order Amount (KES)</Label>
          <Input
            id="min_order_amount_kes"
            name="min_order_amount_kes"
            type="number"
            min="0"
            defaultValue={getSettingValue("min_order_amount")?.KES || 500}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">Minimum order value required for checkout</p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="order_approval_required">Require Order Approval</Label>
              <p className="text-xs text-muted-foreground">All orders must be approved by admin before processing</p>
            </div>
            <Switch
              id="order_approval_required"
              name="order_approval_required"
              defaultChecked={getSettingValue("order_approval_required", false)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="supplier_verification_required">Require Supplier Verification</Label>
              <p className="text-xs text-muted-foreground">Suppliers must be verified before listing products</p>
            </div>
            <Switch
              id="supplier_verification_required"
              name="supplier_verification_required"
              defaultChecked={getSettingValue("supplier_verification_required", true)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="buyer_verification_required">Require Buyer Verification</Label>
              <p className="text-xs text-muted-foreground">Buyers must be verified before placing orders</p>
            </div>
            <Switch
              id="buyer_verification_required"
              name="buyer_verification_required"
              defaultChecked={getSettingValue("buyer_verification_required", false)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Temporarily disable platform access for maintenance</p>
            </div>
            <Switch
              id="maintenance_mode"
              name="maintenance_mode"
              defaultChecked={getSettingValue("maintenance_mode", false)}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
