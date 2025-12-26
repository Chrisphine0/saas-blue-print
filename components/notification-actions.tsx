"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

interface NotificationActionsProps {
  notificationId: string
  isRead: boolean
}

export function NotificationActions({ notificationId, isRead }: NotificationActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const markAsRead = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw error

      toast.success("Marked as read")
      router.refresh()
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to update notification")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNotification = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) throw error

      toast.success("Notification deleted")
      router.refresh()
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isRead && (
        <Button variant="ghost" size="sm" onClick={markAsRead} disabled={isLoading} className="h-7 text-xs">
          <Check className="mr-1 h-3 w-3" />
          Mark read
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={deleteNotification} disabled={isLoading} className="h-7 text-xs">
        <X className="mr-1 h-3 w-3" />
        Delete
      </Button>
    </div>
  )
}
