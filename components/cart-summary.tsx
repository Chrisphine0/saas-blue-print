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
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        buyerId: buyer.id,
        paymentMethod,
        deliveryAddress,
        deliveryCity,
        notes,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw data

    // Assuming the response contains the order and invoice details
    const { order, invoice } = data

    // Call the API to send the invoice email
    if (invoice) {
      await fetch("/api/send-invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          buyerEmail: buyer.email, // Assuming buyer's email is available
          invoiceDetails: invoice,
        }),
      })
    }

    toast({
      title: "Order placed successfully!",
      description: "Your order has been submitted to the suppliers",
    })

    router.push("/buyer/dashboard/orders")
    router.refresh()
  } catch (error: any) {
    toast({
      title: "Checkout failed",
      description: error?.message || "An error occurred",
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
