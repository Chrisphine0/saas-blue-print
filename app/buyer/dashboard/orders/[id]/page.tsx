import { redirect, notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, MapPin, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
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

  // Get order details
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      supplier:suppliers(*)
    `,
    )
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single()

  if (!order) {
    notFound()
  }

  // Get order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      *,
      product:products(*)
    `,
    )
    .eq("order_id", order.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-indigo-100 text-indigo-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/buyer/dashboard/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-gray-600 mt-1">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <Badge className={`${getStatusColor(order.status)} text-lg px-4 py-2`}>{order.status}</Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems?.map((item) => {
                    const product = item.product
                    return (
                      <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>
                              Quantity: {item.quantity} {product.unit_of_measure}
                            </span>
                            <span>Unit Price: KES {Number(item.unit_price).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-lg">KES {Number(item.subtotal).toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">KES {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>KES {Number(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Payment</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {order.payment_method?.replace("_", " ")} - {order.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{order.supplier?.business_name}</p>
                <p className="text-sm text-gray-600">{order.supplier?.email}</p>
                <p className="text-sm text-gray-600">{order.supplier?.phone}</p>
                {order.supplier?.address && (
                  <p className="text-sm text-gray-600">
                    {order.supplier.address}, {order.supplier.city}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Delivery Address</p>
                    <p className="text-sm text-gray-600">
                      {order.delivery_address}, {order.delivery_city}
                    </p>
                  </div>
                </div>

                {order.expected_delivery_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Expected Delivery</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.expected_delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.actual_delivery_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Delivered On</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.actual_delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
