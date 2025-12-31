import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ConversationsList } from "@/components/conversations-list"
import Link from "next/link"

export default async function BuyerMessagesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get buyer profile
  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return null
  }

  // Get conversations with last message and unread count
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      supplier:suppliers(*),
      order:orders(order_number, total_amount, status)
    `)
    .eq("buyer_id", buyer.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with your suppliers</p>
        </div>
        <Button asChild>
          <Link href="/buyer/dashboard/catalog">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading messages...</div>}>
        <ConversationsList conversations={conversations || []} userType="buyer" userId={buyer.id} />
      </Suspense>
    </div>
  )
}