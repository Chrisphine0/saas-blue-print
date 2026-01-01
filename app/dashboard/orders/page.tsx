import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { Supplier } from "@/lib/types"

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  // Get all orders
  const { data: allOrders } = await supabase
    .from("orders")
    .select(
      `
      *,
      buyers (
        business_name,
        contact_person,
        phone,
        email
      )
    `,
    )
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  // Filter orders by status
  const pendingOrders = allOrders?.filter((o: any) => o.status === "pending") || []
  const confirmedOrders = allOrders?.filter((o: any) => o.status === "confirmed") || []
  const processingOrders = allOrders?.filter((o: any) => o.status === "processing") || []
  const shippedOrders = allOrders?.filter((o: any) => o.status === "shipped") || []
  const deliveredOrders = allOrders?.filter((o: any) => o.status === "delivered") || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const OrderCard = ({ order }: { order: any }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{order.order_number}</h3>
            <p className="text-sm text-muted-foreground">{order.buyers?.business_name}</p>
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getStatusColor(order.status)} variant="outline">
              {order.status}
            </Badge>
            <Badge className={getPaymentStatusColor(order.payment_status)} variant="secondary">
              {order.payment_status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Contact Person</p>
            <p className="font-medium">{order.buyers?.contact_person}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{order.buyers?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Delivery Address</p>
            <p className="font-medium">
              {order.delivery_address}, {order.delivery_city}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold">KES {Number(order.total_amount).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm" asChild>
            <Link href={`/dashboard/orders/${order.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and process customer orders</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({allOrders?.length || 0})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedOrders.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({processingOrders.length})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allOrders && allOrders.length > 0 ? (
            allOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <svg
                  className="h-12 w-12 text-muted-foreground mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-sm text-muted-foreground">Orders from buyers will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.length > 0 ? (
            pendingOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No pending orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedOrders.length > 0 ? (
            confirmedOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No confirmed orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingOrders.length > 0 ? (
            processingOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No orders in processing</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shipped" className="space-y-4">
          {shippedOrders.length > 0 ? (
            shippedOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No shipped orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          {deliveredOrders.length > 0 ? (
            deliveredOrders.map((order: any) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No delivered orders</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}