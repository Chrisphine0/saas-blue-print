import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersList } from "@/components/buyer-orders-list"

export default async function BuyerOrdersPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    redirect("/buyer/auth/login")
  }

  // Get all orders
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      supplier:suppliers(*)
    `,
    )
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })

  const allOrders = orders || []
  const pendingOrders = allOrders.filter((o) => o.status === "pending")
  const confirmedOrders = allOrders.filter((o) => o.status === "confirmed" || o.status === "processing")
  const shippedOrders = allOrders.filter((o) => o.status === "shipped")
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered")
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8" />
            My Orders
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({allOrders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmedOrders.length})</TabsTrigger>
            <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <OrdersList orders={allOrders} />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <OrdersList orders={pendingOrders} />
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            <OrdersList orders={confirmedOrders} />
          </TabsContent>

          <TabsContent value="shipped" className="mt-6">
            <OrdersList orders={shippedOrders} />
          </TabsContent>

          <TabsContent value="delivered" className="mt-6">
            <OrdersList orders={deliveredOrders} />
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <OrdersList orders={cancelledOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
