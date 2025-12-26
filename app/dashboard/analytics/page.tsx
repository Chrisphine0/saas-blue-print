import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Supplier } from "@/lib/types"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()

  if (!supplier) {
    redirect("/onboarding")
  }

  // Get all orders for analytics
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  // Get all products
  const { data: products } = await supabase.from("products").select("*").eq("supplier_id", supplier.id)

  // Calculate key metrics
  const totalOrders = orders?.length || 0
  const completedOrders = orders?.filter((o: any) => o.status === "delivered").length || 0
  const pendingOrders = orders?.filter((o: any) => o.status === "pending").length || 0
  const cancelledOrders = orders?.filter((o: any) => o.status === "cancelled").length || 0

  const totalRevenue =
    orders
      ?.filter((o: any) => ["confirmed", "processing", "shipped", "delivered"].includes(o.status))
      .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  const paidRevenue =
    orders
      ?.filter((o: any) => o.payment_status === "paid")
      .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  const pendingRevenue =
    orders
      ?.filter((o: any) => o.payment_status === "pending")
      .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get order trends by month
  const ordersByMonth: { [key: string]: number } = {}
  const revenueByMonth: { [key: string]: number } = {}

  orders?.forEach((order: any) => {
    const date = new Date(order.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1
    if (["confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(order.total_amount)
    }
  })

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }).reverse()

  const monthlyOrderData = last6Months.map((month) => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    orders: ordersByMonth[month] || 0,
    revenue: revenueByMonth[month] || 0,
  }))

  // Top products by revenue
  const productRevenue: { [key: string]: { name: string; revenue: number; units: number } } = {}

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      products (
        name
      ),
      orders!inner (
        status,
        supplier_id
      )
    `,
    )
    .eq("orders.supplier_id", supplier.id)
    .in("orders.status", ["confirmed", "processing", "shipped", "delivered"])

  orderItems?.forEach((item: any) => {
    const productId = item.product_id
    if (!productRevenue[productId]) {
      productRevenue[productId] = {
        name: item.products.name,
        revenue: 0,
        units: 0,
      }
    }
    productRevenue[productId].revenue += Number(item.subtotal)
    productRevenue[productId].units += item.quantity
  })

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }))

  // Order status distribution
  const statusDistribution = [
    { status: "Pending", count: pendingOrders, color: "bg-yellow-500" },
    {
      status: "Confirmed",
      count: orders?.filter((o: any) => o.status === "confirmed").length || 0,
      color: "bg-blue-500",
    },
    {
      status: "Processing",
      count: orders?.filter((o: any) => o.status === "processing").length || 0,
      color: "bg-purple-500",
    },
    {
      status: "Shipped",
      count: orders?.filter((o: any) => o.status === "shipped").length || 0,
      color: "bg-indigo-500",
    },
    { status: "Delivered", count: completedOrders, color: "bg-green-500" },
    { status: "Cancelled", count: cancelledOrders, color: "bg-red-500" },
  ]

  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0
  const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground">Track your business performance and insights</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Paid: KES {paidRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {averageOrderValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Per order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {completedOrders} of {totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.filter((p: any) => p.status === "active").length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total: {products?.length || 0} products</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Orders and revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyOrderData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{data.month}</span>
                      <div className="flex gap-6">
                        <span className="text-muted-foreground">{data.orders} orders</span>
                        <span className="font-medium">KES {data.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.max(5, (data.revenue / Math.max(...monthlyOrderData.map((d) => d.revenue), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Breakdown of orders by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusDistribution.map((item, index) => {
                  const percentage = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : 0
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.status}</span>
                        <div className="flex gap-4">
                          <span className="text-muted-foreground">{item.count} orders</span>
                          <span className="font-medium w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${item.color} transition-all`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Best performing products based on sales</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => {
                    const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1)
                    const percentage = ((product.revenue / maxRevenue) * 100).toFixed(1)

                    return (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                              {index + 1}
                            </span>
                            <span className="font-medium">{product.name}</span>
                          </div>
                          <div className="flex gap-6">
                            <span className="text-muted-foreground">{product.units} units</span>
                            <span className="font-medium">KES {product.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No product sales data available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.filter((p: any) => p.status === "active").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products?.filter((p: any) => p.status === "out_of_stock").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
                <p className="text-xs text-muted-foreground">{completionRate}% completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{cancelledOrders}</div>
                <p className="text-xs text-muted-foreground">{cancellationRate}% cancellation rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status Overview</CardTitle>
              <CardDescription>Revenue breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Paid Orders</p>
                    <p className="text-sm text-muted-foreground">
                      {orders?.filter((o: any) => o.payment_status === "paid").length || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">KES {paidRevenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Pending Payment</p>
                    <p className="text-sm text-muted-foreground">
                      {orders?.filter((o: any) => o.payment_status === "pending").length || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-yellow-600">KES {pendingRevenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Partial Payment</p>
                    <p className="text-sm text-muted-foreground">
                      {orders?.filter((o: any) => o.payment_status === "partial").length || 0} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      KES{" "}
                      {(
                        orders
                          ?.filter((o: any) => o.payment_status === "partial")
                          .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
