"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import type { Message } from "@/lib/types"

interface MessageThreadProps {
  messages: Message[]
  currentUserId: string
  currentUserType: "buyer" | "supplier"
}

export function MessageThread({ messages, currentUserId, currentUserType }: MessageThreadProps) {
  return (
    <div className="flex flex-col gap-4 p-6 h-[500px] overflow-y-auto">
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserId && message.sender_type === currentUserType

        return (
          <div key={message.id} className={cn("flex gap-3", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {message.sender_type === "buyer" ? "B" : message.sender_type === "supplier" ? "S" : "A"}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
              <div
                className={cn("rounded-lg px-4 py-2", isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted")}
              >
                <p className="text-sm">{message.message}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
