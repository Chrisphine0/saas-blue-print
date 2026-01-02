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

  if (!user) redirect("/buyer/auth/login")

  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!buyer) redirect("/buyer/auth/login")

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
  const confirmedOrders = allOrders.filter(
    (o) => o.status === "confirmed" || o.status === "processing",
  )
  const shippedOrders = allOrders.filter((o) => o.status === "shipped")
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered")
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="flex items-center gap-2 sm:gap-3 text-xl sm:text-3xl font-bold text-gray-900">
            <Package className="h-6 w-6 sm:h-8 sm:w-8" />
            My Orders
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs defaultValue="all" className="w-full">
          {/* Mobile-friendly Tabs */}
          <TabsList
            className="
              w-full
              flex
              overflow-x-auto
              gap-2
              justify-start
              sm:grid sm:grid-cols-6
              scrollbar-hide
            "
          >
            <TabsTrigger value="all" className="whitespace-nowrap">
              All ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="whitespace-nowrap">
              Confirmed ({confirmedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="shipped" className="whitespace-nowrap">
              Shipped ({shippedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="whitespace-nowrap">
              Delivered ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">
              Cancelled ({cancelledOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Panels */}
          <TabsContent value="all" className="mt-4 sm:mt-6">
            <OrdersList orders={allOrders} />
          </TabsContent>

          <TabsContent value="pending" className="mt-4 sm:mt-6">
            <OrdersList orders={pendingOrders} />
          </TabsContent>

          <TabsContent value="confirmed" className="mt-4 sm:mt-6">
            <OrdersList orders={confirmedOrders} />
          </TabsContent>

          <TabsContent value="shipped" className="mt-4 sm:mt-6">
            <OrdersList orders={shippedOrders} />
          </TabsContent>

          <TabsContent value="delivered" className="mt-4 sm:mt-6">
            <OrdersList orders={deliveredOrders} />
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4 sm:mt-6">
            <OrdersList orders={cancelledOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
