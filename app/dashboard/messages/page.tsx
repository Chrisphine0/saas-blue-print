import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { ConversationsList } from "@/components/conversations-list"
import { redirect } from "next/navigation"

export default async function SupplierMessagesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get supplier profile
  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) {
    return null
  }

  // Get conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      buyer:buyers(*),
      order:orders(order_number, total_amount, status)
    `)
    .eq("supplier_id", supplier.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with your buyers</p>
        </div>
      </div>

      <Suspense fallback={<div>Loading messages...</div>}>
        <ConversationsList conversations={conversations || []} userType="supplier" userId={supplier.id} />
      </Suspense>
    </div>
  )
}
