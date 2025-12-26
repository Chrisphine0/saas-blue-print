"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MessageInputProps {
  conversationId: string
  senderId: string
  senderType: "buyer" | "supplier"
}

export function MessageInput({ conversationId, senderId, senderType }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSend = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        message: message.trim(),
      })

      if (error) throw error

      setMessage("")
      toast.success("Message sent")
      router.refresh()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px]"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !message.trim()} size="icon" className="h-[80px] w-12">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
