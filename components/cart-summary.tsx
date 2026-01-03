"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CartItem, Buyer } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
// Import Dialog components for the invoice preview
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DialogDescription } from "@radix-ui/react-dialog"

interface CartSummaryProps {
  items: (CartItem & { product: any })[]
  buyer: Buyer
}

export function CartSummary({ items, buyer }: CartSummaryProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false) // New state for Modal
  const [paymentMethod, setPaymentMethod] = useState("mpesa")
  const [deliveryAddress, setDeliveryAddress] = useState(buyer.address || "")
  const [deliveryCity, setDeliveryCity] = useState(buyer.city || "")
  const [notes, setNotes] = useState("")

  const subtotal = items.reduce((sum, item) => sum + item.product.price_per_unit * item.quantity, 0)

  // 1. Validation before showing preview
  const handleOpenPreview = () => {
    if (!deliveryAddress || !deliveryCity) {
      toast({
        title: "Missing information",
        description: "Please provide delivery address and city",
        variant: "destructive",
      })
      return
    }
    setShowPreview(true)
  }

  // 2. Final Checkout Logic
  const handleCheckout = async () => {
    setLoading(true)
    setShowPreview(false)
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

      const { invoice } = data

      if (invoice) {
        await fetch("/api/send-invoice-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoice.id,
            buyerEmail: buyer.email,
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
    <>
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
              <span className="font-medium text-green-600">Calculated at Checkout</span>
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
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="font-normal">M-Pesa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="font-normal">Bank Transfer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit" id="credit" />
                <Label htmlFor="credit" className="font-normal">Credit (Net 30)</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleOpenPreview} disabled={loading} className="w-full">
            Review Invoice & Order
          </Button>
        </CardContent>
      </Card>

      {/* --- INVOICE PREVIEW MODAL --- */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Order Preview</DialogTitle>
            <DialogDescription className="text-center">
        Please review your order items and delivery details before confirming.
      </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="pr-4 mt-4 h-full max-h-[60vh]">
            <div className="space-y-6 text-sm">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider">Bill To:</h4>
                  <p className="font-semibold text-lg">{buyer.business_name || "Customer"}</p>
                  <p>{deliveryAddress}</p>
                  <p>{deliveryCity}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider">Payment Method:</h4>
                  <p className="capitalize font-medium text-primary">{paymentMethod.replace('_', ' ')}</p>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 font-bold text-gray-600 border-b pb-2">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Price</div>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 py-1 items-center">
                    <div className="col-span-6">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.supplier?.business_name}</p>
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-4 text-right font-medium">
                      KES {(item.product.price_per_unit * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 flex flex-col items-end">
                <div className="flex justify-between w-48 text-gray-600">
                  <span>Subtotal:</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between w-48 font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>KES {subtotal.toLocaleString()}</span>
                </div>
              </div>

              {notes && (
                <div className="bg-gray-50 p-3 rounded-md italic text-gray-600">
                  <span className="font-bold not-italic">Notes:</span> {notes}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
              Edit Details
            </Button>
            <Button onClick={handleCheckout} disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Confirm & Send to Suppliers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}