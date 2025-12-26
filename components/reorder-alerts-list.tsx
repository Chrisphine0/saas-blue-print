"use client"

import { useState } from "react"
import Image from "next/image"
import type { ReorderAlert } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Package, Trash2, ShoppingCart } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReorderAlertsListProps {
  alerts: (ReorderAlert & { product: any })[]
  buyerId: string
}

export function ReorderAlertsList({ alerts, buyerId }: ReorderAlertsListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [threshold, setThreshold] = useState<number>(0)
  const [frequency, setFrequency] = useState<string>("weekly")

  const toggleAlert = async (alertId: string, currentStatus: boolean) => {
    setLoading(alertId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("reorder_alerts")
        .update({ is_active: !currentStatus })
        .eq("id", alertId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      toast({
        title: currentStatus ? "Alert disabled" : "Alert enabled",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const deleteAlert = async (alertId: string) => {
    setLoading(alertId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("reorder_alerts").delete().eq("id", alertId).eq("buyer_id", buyerId)

      if (error) throw error

      toast({
        title: "Alert deleted",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const updateAlert = async (alertId: string) => {
    setLoading(alertId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("reorder_alerts")
        .update({
          threshold_quantity: threshold,
          alert_frequency: frequency,
        })
        .eq("id", alertId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      toast({
        title: "Alert updated",
      })

      setEditingId(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const addToCart = async (productId: string, minQty: number) => {
    setLoading(productId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("cart_items").upsert(
        {
          buyer_id: buyerId,
          product_id: productId,
          quantity: minQty,
        },
        {
          onConflict: "buyer_id,product_id",
        },
      )

      if (error) throw error

      toast({
        title: "Added to cart",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reorder alerts set</h3>
        <p className="text-gray-500 mb-6">Browse the catalog to set up alerts for products you order frequently</p>
        <Button asChild>
          <a href="/buyer/dashboard/catalog">Browse Products</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const product = alert.product
        const inventory = product.inventory?.[0]
        const isEditing = editingId === alert.id

        return (
          <Card key={alert.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600">by {product.supplier?.business_name}</p>
                      <p className="text-sm font-medium mt-1">
                        KES {product.price_per_unit.toLocaleString()} / {product.unit_of_measure}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`threshold-${alert.id}`}>Threshold Quantity</Label>
                          <Input
                            id={`threshold-${alert.id}`}
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            min={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`frequency-${alert.id}`}>Alert Frequency</Label>
                          <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger id={`frequency-${alert.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => updateAlert(alert.id)} disabled={loading === alert.id} size="sm">
                          {loading === alert.id ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>
                          Alert when quantity reaches:{" "}
                          <strong>
                            {alert.threshold_quantity} {product.unit_of_measure}
                          </strong>
                        </span>
                        <span>
                          Frequency: <strong className="capitalize">{alert.alert_frequency}</strong>
                        </span>
                      </div>

                      {inventory && (
                        <p className="text-sm text-gray-600">
                          Current availability: {inventory.quantity_available} {product.unit_of_measure}
                        </p>
                      )}

                      {alert.last_alerted_at && (
                        <p className="text-sm text-gray-500">
                          Last alerted: {new Date(alert.last_alerted_at).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => addToCart(product.id, product.min_order_quantity)}
                          disabled={loading === product.id}
                          size="sm"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>

                        <Button
                          onClick={() => {
                            setEditingId(alert.id)
                            setThreshold(alert.threshold_quantity)
                            setFrequency(alert.alert_frequency)
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                        >
                          Edit Alert
                        </Button>

                        <Button
                          onClick={() => toggleAlert(alert.id, alert.is_active)}
                          disabled={loading === alert.id}
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                        >
                          {alert.is_active ? (
                            <>
                              <BellOff className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Bell className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => deleteAlert(alert.id)}
                          disabled={loading === alert.id}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
