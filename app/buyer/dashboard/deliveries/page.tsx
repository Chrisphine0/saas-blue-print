import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Truck, CheckCircle, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function BuyerDeliveriesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return null
  }

  // Get deliveries
  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(`
      *,
      order:orders(order_number, total_amount),
      supplier:suppliers(business_name)
    `)
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })

  // Calculate stats
  const activeDeliveries =
    deliveries?.filter((d) => d.status !== "delivered" && d.status !== "failed" && d.status !== "returned").length || 0
  const completedDeliveries = deliveries?.filter((d) => d.status === "delivered").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deliveries</h1>
        <p className="text-muted-foreground">Track your order deliveries</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeliveries}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedDeliveries}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveries?.map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{delivery.tracking_number}</h3>
                    <Badge
                      variant={
                        delivery.status === "delivered"
                          ? "default"
                          : delivery.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {delivery.supplier.business_name} • Order #{delivery.order.order_number}
                  </p>
                  {delivery.estimated_delivery_date && (
                    <p className="text-sm text-muted-foreground">
                      ETA: {format(new Date(delivery.estimated_delivery_date), "PPP")}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild className="bg-transparent">
                  <Link href={`/buyer/dashboard/deliveries/${delivery.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Track
                  </Link>
                </Button>
              </div>
            ))}
            {(!deliveries || deliveries.length === 0) && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No deliveries yet</p>
                <p className="text-sm text-muted-foreground">
                  Deliveries will appear here once your orders are shipped
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
