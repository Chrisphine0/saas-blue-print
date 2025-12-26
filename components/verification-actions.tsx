"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function VerificationActions({ verificationId, adminId }: { verificationId: string; adminId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [open, setOpen] = useState(false)

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("user_verifications")
        .update({
          status,
          verified_by: adminId,
          verification_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verificationId)

      if (error) throw error

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Verification</DialogTitle>
            <DialogDescription>Add optional notes before approving this verification request</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Verification notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAction("approved")} disabled={loading}>
              {loading ? "Processing..." : "Approve"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this verification request</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
          <div className="flex gap-2 justify-end">
            <DialogTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button onClick={() => handleAction("rejected")} disabled={loading || !notes.trim()}>
              {loading ? "Processing..." : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
