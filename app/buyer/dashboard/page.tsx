// app/buyer/dashboard/page.tsx - Fixed buyer dashboard page

import { createClient } from "@/lib/supabase/server"
import { ShoppingCart, Heart, Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrderItem } from "@/components/order-item"

export default async function BuyerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null // Layout handles redirect
  }

  // Get buyer profile
  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return null // Layout handles redirect
  }

  // Get buyer stats
  const { data: cartItems } = await supabase.from("cart_items").select("*").eq("buyer_id", buyer.id)

  const { data: favorites } = await supabase.from("buyer_favorites").select("*").eq("buyer_id", buyer.id)

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })

  const pendingOrders = orders?.filter((o) => o.status === "pending" || o.status === "confirmed") || []
  const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {buyer.contact_person}!</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Ready to checkout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favorites?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Saved products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <OrderItem key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/buyer/dashboard/catalog">Browse Products</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="/buyer/dashboard/catalog">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Product Catalog
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/buyer/dashboard/orders">
                <Package className="mr-2 h-4 w-4" />
                View All Orders
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/buyer/dashboard/favorites">
                <Heart className="mr-2 h-4 w-4" />
                View Favorites
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/buyer/dashboard/reorder-alerts">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Manage Reorder Alerts
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/buyer/dashboard/marketplace">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Browse Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}