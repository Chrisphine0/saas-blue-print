import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { Supplier } from "@/lib/types"
import { Calendar, MapPin, Phone, User, ChevronRight } from "lucide-react"

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

  if (supplierError && supplierStatus === 406) {
    redirect("/auth/login")
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  const { data: allOrders } = await supabase
    .from("orders")
    .select(`
      *,
      buyers (
        business_name,
        contact_person,
        phone,
        email
      )
    `)
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  const pendingOrders = allOrders?.filter((o: any) => o.status === "pending") || []
  const confirmedOrders = allOrders?.filter((o: any) => o.status === "confirmed") || []
  const processingOrders = allOrders?.filter((o: any) => o.status === "processing") || []
  const shippedOrders = allOrders?.filter((o: any) => o.status === "shipped") || []
  const deliveredOrders = allOrders?.filter((o: any) => o.status === "delivered") || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200"
      case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        {/* Header: ID and Statuses */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base sm:text-lg">{order.order_number}</h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={`${getStatusColor(order.status)} capitalize text-[10px] px-2 py-0`} variant="outline">
              {order.status}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              {order.payment_status}
            </Badge>
          </div>
        </div>

        {/* Client Name */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Client</p>
          <p className="font-bold text-slate-900">{order.buyers?.business_name}</p>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-y-3 mb-5 border-y border-slate-50 py-3">
          <div className="space-y-0.5">
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="mr-1 h-3 w-3" /> Contact
            </div>
            <p className="text-sm font-medium line-clamp-1">{order.buyers?.contact_person}</p>
          </div>
          <div className="space-y-0.5 pl-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="mr-1 h-3 w-3" /> Phone
            </div>
            <p className="text-sm font-medium">{order.buyers?.phone}</p>
          </div>
          <div className="col-span-2 space-y-0.5">
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" /> Location
            </div>
            <p className="text-sm font-medium line-clamp-1">{order.delivery_city}</p>
          </div>
        </div>

        {/* Footer: Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Grand Total</p>
            <p className="text-lg font-black text-primary">KES {Number(order.total_amount).toLocaleString()}</p>
          </div>
          <Button size="sm" asChild className="rounded-full px-4">
            <Link href={`/dashboard/orders/${order.id}`}>
              Details <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Section */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">Manage and track your B2B supply chain</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        {/* Mobile-friendly scrollable tabs */}
        <div className="px-4 sm:px-0 mb-4">
          <TabsList className="w-full h-auto flex flex-nowrap overflow-x-auto justify-start bg-slate-100/50 p-1 border scrollbar-hide">
            {[
              { id: "all", label: "All", count: allOrders?.length },
              { id: "pending", label: "Pending", count: pendingOrders.length },
              { id: "confirmed", label: "Confirmed", count: confirmedOrders.length },
              { id: "processing", label: "Processing", count: processingOrders.length },
              { id: "shipped", label: "Shipped", count: shippedOrders.length },
              { id: "delivered", label: "Delivered", count: deliveredOrders.length },
            ].map((t) => (
              <TabsTrigger 
                key={t.id} 
                value={t.id} 
                className="whitespace-nowrap px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {t.label} <span className="ml-1 opacity-50">({t.count || 0})</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Grid Contents */}
        <div className="px-4 sm:px-0">
          {[
            { value: "all", orders: allOrders, emptyMsg: "No orders found." },
            { value: "pending", orders: pendingOrders, emptyMsg: "No pending orders." },
            { value: "confirmed", orders: confirmedOrders, emptyMsg: "No confirmed orders." },
            { value: "processing", orders: processingOrders, emptyMsg: "No orders in processing." },
            { value: "shipped", orders: shippedOrders, emptyMsg: "No shipped orders." },
            { value: "delivered", orders: deliveredOrders, emptyMsg: "No delivered orders." },
          ].map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              {tab.orders && tab.orders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {tab.orders.map((order: any) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed shadow-none">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-muted-foreground font-medium">{tab.emptyMsg}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}