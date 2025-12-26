"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CartItem, Buyer } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface CartSummaryProps {
  items: (CartItem & { product: any })[]
  buyer: Buyer
}

export function CartSummary({ items, buyer }: CartSummaryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("mpesa")
  const [deliveryAddress, setDeliveryAddress] = useState(buyer.address || "")
  const [deliveryCity, setDeliveryCity] = useState(buyer.city || "")
  const [notes, setNotes] = useState("")

  // Group items by supplier
  const itemsBySupplier = items.reduce(
    (acc, item) => {
      const supplierId = item.product.supplier_id
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: item.product.supplier,
          items: [],
        }
      }
      acc[supplierId].items.push(item)
      return acc
    },
    {} as Record<string, { supplier: any; items: any[] }>,
  )

  const subtotal = items.reduce((sum, item) => sum + item.product.price_per_unit * item.quantity, 0)

  const handleCheckout = async () => {
    if (!deliveryAddress || !deliveryCity) {
      toast({
        title: "Missing information",
        description: "Please provide delivery address and city",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserClient()

      // Create orders for each supplier
      for (const [supplierId, supplierData] of Object.entries(itemsBySupplier)) {
        const supplierTotal = supplierData.items.reduce(
          (sum, item) => sum + item.product.price_per_unit * item.quantity,
          0,
        )

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: buyer.id,
            supplier_id: supplierId,
            total_amount: supplierTotal,
            payment_method: paymentMethod,
            delivery_address: deliveryAddress,
            delivery_city: deliveryCity,
            notes: notes,
            status: "pending",
            payment_status: "pending",
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Create order items
        const orderItems = supplierData.items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price_per_unit,
          subtotal: item.product.price_per_unit * item.quantity,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

        if (itemsError) throw itemsError

        // Update inventory (reserve stock)
        for (const item of supplierData.items) {
          const inventory = item.product.inventory?.[0]
          if (inventory) {
            const { error: inventoryError } = await supabase
              .from("inventory")
              .update({
                quantity_reserved: inventory.quantity_reserved + item.quantity,
              })
              .eq("product_id", item.product_id)

            if (inventoryError) throw inventoryError
          }
        }
      }

      // Clear cart
      const { error: clearError } = await supabase.from("cart_items").delete().eq("buyer_id", buyer.id)

      if (clearError) throw clearError

      toast({
        title: "Order placed successfully!",
        description: "Your order has been submitted to the suppliers",
      })

      router.push("/buyer/dashboard/orders")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium">TBD</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Delivery Address</Label>
          <Textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter delivery address"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <input
            type="text"
            value={deliveryCity}
            onChange={(e) => setDeliveryCity(e.target.value)}
            placeholder="Enter city"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mpesa" id="mpesa" />
              <Label htmlFor="mpesa" className="font-normal">
                M-Pesa
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="font-normal">
                Bank Transfer
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="font-normal">
                Credit (Net 30)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Order Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions"
            rows={2}
          />
        </div>

        <div className="text-xs text-gray-500">
          Note: Orders from multiple suppliers will be split into separate orders
        </div>

        <Button onClick={handleCheckout} disabled={loading} className="w-full">
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </CardContent>
    </Card>
  )
}
