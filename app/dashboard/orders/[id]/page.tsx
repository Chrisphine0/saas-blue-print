import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrderStatusUpdate } from "@/components/order-status-update"
import type { Supplier } from "@/lib/types"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const supabase = await createClient()
  const resolvedParams = await params
  const id = resolvedParams.id

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

  // Get order with buyer details
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      buyers (
        business_name,
        contact_person,
        phone,
        email,
        address,
        city
      )
    `,
    )
    .eq("id", id)
    .eq("supplier_id", supplier.id)
    .single()

  if (!order) {
    notFound()
  }

  // Get order items with product details
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      products (
        name,
        sku,
        unit_of_measure
      )
    `,
    )
    .eq("order_id", id)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{order.order_number}</h1>
          <p className="text-muted-foreground">Order placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(order.status)} variant="outline">
            {order.status}
          </Badge>
          <Badge className={getPaymentStatusColor(order.payment_status)} variant="secondary">
            {order.payment_status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{order.buyers?.business_name ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{order.buyers?.contact_person ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.buyers?.phone ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.buyers?.email ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">
                {order.delivery_address}
                <br />
                {order.delivery_city}
              </p>
            </div>
            {order.expected_delivery_date && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Delivery</p>
                <p className="font-medium">{new Date(order.expected_delivery_date).toLocaleDateString()}</p>
              </div>
            )}
            {order.actual_delivery_date && (
              <div>
                <p className="text-sm text-muted-foreground">Actual Delivery</p>
                <p className="font-medium">{new Date(order.actual_delivery_date).toLocaleDateString()}</p>
              </div>
            )}
            {order.payment_method && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{order.payment_method}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.products.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {item.products.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {item.quantity} {item.products.unit_of_measure} × KES {Number(item.unit_price).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Subtotal: KES {Number(item.subtotal).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span>KES {Number(order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <OrderStatusUpdate order={order} />
    </div>
  )
}
