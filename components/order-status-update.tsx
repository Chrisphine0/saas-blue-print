"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface OrderStatusUpdateProps {
  order: any
}

export function OrderStatusUpdate({ order }: OrderStatusUpdateProps) {
  const [formData, setFormData] = useState({
    status: order.status,
    paymentStatus: order.payment_status,
    expectedDeliveryDate: order.expected_delivery_date || "",
    actualDeliveryDate: order.actual_delivery_date || "",
    notes: order.notes || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const updateData: any = {
        status: formData.status,
        payment_status: formData.paymentStatus,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (formData.expectedDeliveryDate) {
        updateData.expected_delivery_date = formData.expectedDeliveryDate
      }

      if (formData.actualDeliveryDate && formData.status === "delivered") {
        updateData.actual_delivery_date = formData.actualDeliveryDate
      }

      const res = await fetch("/api/update-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, update: updateData }),
      })

      const data = await res.json()
      if (!res.ok) throw data

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : JSON.stringify(error))
    } finally {
      setIsLoading(false)
    }
  }

  const canCancelOrder = order.status === "pending" || order.status === "confirmed"

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/update-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, update: { status: "cancelled", updated_at: new Date().toISOString() } }),
      })

      const data = await res.json()
      if (!res.ok) throw data

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : JSON.stringify(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order Status</CardTitle>
        <CardDescription>Manage order progress and delivery details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="status">Order Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={order.status === "cancelled"}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDeliveryDate: e.target.value,
                  })
                }
              />
            </div>

            {formData.status === "delivered" && (
              <div className="grid gap-2">
                <Label htmlFor="actualDeliveryDate">Actual Delivery Date</Label>
                <Input
                  id="actualDeliveryDate"
                  type="date"
                  value={formData.actualDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actualDeliveryDate: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || order.status === "cancelled"}>
              {isLoading ? "Updating..." : "Update Order"}
            </Button>
            {canCancelOrder && (
              <Button type="button" variant="destructive" onClick={handleCancelOrder} disabled={isLoading}>
                Cancel Order
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
