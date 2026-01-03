"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Supplier } from "@/lib/types" // Ensure correct import path

interface NewMessageDialogProps {
  suppliers: Supplier[]
  buyerId: string
  orderId?: string // New optional prop
}

// FIX: Added orderId to the destructured props below
export function NewMessageDialog({ suppliers, buyerId, orderId }: NewMessageDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedSupplier, setSelectedSupplier] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const router = useRouter()

  // Submit handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!selectedSupplier || !message.trim()) {
      setError("Please select a supplier and enter a message.")
      return
    }

    setLoading(true)
    
    try {
      // Ensure the endpoint URL is correct (e.g., /api/messages/new)
      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: buyerId,
          supplier_id: selectedSupplier,
          message,
          order_id: orderId || null, // Now 'orderId' is correctly recognized
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.message || "Could not send message.")
        return
      }

      // Success cleanup
      setOpen(false)
      setMessage("")
      setSelectedSupplier("")
      router.refresh() // reload page/conversations
    } catch (err: any) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Start a New Conversation</DialogTitle>
            <DialogDescription>Select a supplier and send your message.</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-3">
            <label className="block">
              <div className="mb-1 font-semibold text-sm text-gray-700">Supplier</div>
              <select
                className="w-full border px-3 py-2 rounded-md bg-background"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.business_name} ({s.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 font-semibold text-sm text-gray-700">Message</div>
              <textarea
                className="w-full border px-3 py-2 rounded-md bg-background"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                required
                disabled={loading}
              />
            </label>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}