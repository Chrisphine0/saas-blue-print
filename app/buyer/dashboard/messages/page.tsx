import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ConversationsList } from "@/components/conversations-list"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { NewMessageDialog } from "@/components/message-dialog"

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
  if (!buyer) return null

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

  // Fetch all suppliers to message
  const { data: suppliers } = await supabase.from("suppliers").select(`
    id,
    user_id,
    business_name,
    phone,
    email,
    country,
    status,
    verified,
    created_at,
    updated_at
  `)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with your suppliers</p>
        </div>

        {/* Dialog with internal client-side form */}
        <NewMessageDialog suppliers={suppliers ?? []} buyerId={buyer.id} />
      </div>

      <Suspense fallback={<p>Loading messages...</p>}>
        <ConversationsList
          conversations={conversations ?? []}
          userType="buyer"
          userId={buyer.id}
        />
      </Suspense>
    </div>
  )
}