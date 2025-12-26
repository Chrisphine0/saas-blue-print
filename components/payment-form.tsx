"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PaymentFormProps {
  invoiceId: string
  orderId: string
  buyerId: string
  supplierId: string
  amount: number
}

export function PaymentForm({ invoiceId, orderId, buyerId, supplierId, amount }: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [notes, setNotes] = useState("")
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setIsLoading(true)

    try {
      // Generate payment number
      const { data: lastPayment } = await supabase
        .from("payments")
        .select("payment_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      let paymentNumber = "PAY-000001"
      if (lastPayment?.payment_number) {
        const lastNum = Number.parseInt(lastPayment.payment_number.split("-")[1])
        paymentNumber = `PAY-${String(lastNum + 1).padStart(6, "0")}`
      }

      // Create payment
      const { error } = await supabase.from("payments").insert({
        payment_number: paymentNumber,
        invoice_id: invoiceId,
        order_id: orderId,
        buyer_id: buyerId,
        supplier_id: supplierId,
        amount,
        payment_method: paymentMethod,
        transaction_reference: transactionRef || null,
        status: paymentMethod === "mpesa" ? "completed" : "pending",
        payment_date: new Date().toISOString().split("T")[0],
        notes: notes || null,
      })

      if (error) throw error

      toast.success("Payment submitted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error submitting payment:", error)
      toast.error("Failed to submit payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="payment_method">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger id="payment_method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transaction_ref">Transaction Reference (Optional)</Label>
        <Input
          id="transaction_ref"
          placeholder="e.g., M-Pesa code"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this payment"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Processing..." : `Pay KES ${amount.toLocaleString()}`}
      </Button>
    </form>
  )
}
