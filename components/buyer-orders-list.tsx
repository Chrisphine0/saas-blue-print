import Link from "next/link"
import type { Order } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ChevronRight } from "lucide-react"

interface OrdersListProps {
  orders: (Order & { supplier?: any })[]
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500">Orders will appear here once you place them</p>
      </div>
    )
  }

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{order.order_number}</h3>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Supplier</p>
                    <p>{order.supplier?.business_name}</p>
                  </div>

                  <div>
                    <p className="font-medium">Order Date</p>
                    <p>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">KES {Number(order.total_amount).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p>
                      {order.delivery_address}, {order.delivery_city}
                    </p>
                  </div>

                  {order.expected_delivery_date && (
                    <div>
                      <p className="font-medium">Expected Delivery</p>
                      <p>{new Date(order.expected_delivery_date).toLocaleDateString()}</p>
                    </div>
                  )}

                  {order.payment_method && (
                    <div>
                      <p className="font-medium">Payment Method</p>
                      <p className="capitalize">{order.payment_method.replace("_", " ")}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button asChild variant="outline">
                <Link href={`/buyer/dashboard/orders/${order.id}`}>
                  View Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
