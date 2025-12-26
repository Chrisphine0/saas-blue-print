"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface ConversationsListProps {
  conversations: any[]
  userType: "buyer" | "supplier"
  userId: string
}

export function ConversationsList({ conversations, userType, userId }: ConversationsListProps) {
  const [search, setSearch] = useState("")

  const filteredConversations = conversations.filter((conv) => {
    const otherParty = userType === "buyer" ? conv.supplier : conv.buyer
    return otherParty?.business_name.toLowerCase().includes(search.toLowerCase())
  })

  if (filteredConversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No conversations yet</p>
          <p className="text-sm text-muted-foreground">
            Start a conversation with {userType === "buyer" ? "a supplier" : "your buyers"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filteredConversations.map((conversation) => {
          const otherParty = userType === "buyer" ? conversation.supplier : conversation.buyer
          const baseUrl = userType === "buyer" ? "/buyer/dashboard/messages" : "/dashboard/messages"

          return (
            <Card key={conversation.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <Link href={`${baseUrl}/${conversation.id}`} className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate">{otherParty?.business_name}</h3>
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {conversation.subject && (
                      <p className="text-sm text-muted-foreground truncate mb-2">{conversation.subject}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={conversation.status === "active" ? "default" : "secondary"} className="text-xs">
                        {conversation.status}
                      </Badge>
                      {conversation.order && (
                        <Badge variant="outline" className="text-xs">
                          Order #{conversation.order.order_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
