import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MessageThread } from "@/components/message-thread"
import { MessageInput } from "@/components/message-input"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Get buyer profile
  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return notFound()
  }

  // Get conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      *,
      supplier:suppliers(*),
      order:orders(order_number, total_amount, status)
    `)
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single()

  if (!conversation) {
    return notFound()
  }

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  // Mark messages as read
  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("is_read", false)
    .neq("sender_id", buyer.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/buyer/dashboard/messages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{conversation.supplier.business_name}</h1>
            {conversation.subject && <p className="text-sm text-muted-foreground">{conversation.subject}</p>}
            {conversation.order && (
              <Badge variant="outline" className="mt-1">
                Order #{conversation.order.order_number}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={conversation.status === "active" ? "default" : "secondary"}>{conversation.status}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <MessageThread messages={messages || []} currentUserId={buyer.id} currentUserType="buyer" />
          <MessageInput conversationId={id} senderId={buyer.id} senderType="buyer" />
        </CardContent>
      </Card>
    </div>
  )
}
