import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ShoppingCart, Heart, Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function BuyerDashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  // Get buyer profile
  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    redirect("/buyer/auth/login")
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
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{buyer.business_name}</h1>
              <p className="text-sm text-gray-500">{buyer.contact_person}</p>
            </div>
           
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/buyer/dashboard/catalog">Browse Products</Link>
              </Button>
              <Button asChild>
                <Link href="/buyer/dashboard/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart ({cartItems?.length || 0})
                </Link>
              </Button>
            </div>
          </div>

          {/* Top navigation for buyer dashboard */}
         
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} • {order.status}
                        </p>
                      </div>
                      <p className="font-semibold">KES {Number(order.total_amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No orders yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/buyer/dashboard/catalog">Browse Product Catalog</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/buyer/dashboard/orders">View All Orders</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/buyer/dashboard/favorites">View Favorites</Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline">
                <Link href="/buyer/dashboard/reorder-alerts">Manage Reorder Alerts</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}