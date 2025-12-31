import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReviewForm } from "@/components/review-form"

export default async function OrderReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return notFound()
  }

  // Get order
  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single()

  if (!order || order.status !== "delivered") {
    return redirect("/buyer/dashboard/orders")
  }

  // Get order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(*)
    `)
    .eq("order_id", id)

  // Check if already reviewed
  const { data: existingSupplierReview } = await supabase
    .from("supplier_reviews")
    .select("id")
    .eq("buyer_id", buyer.id)
    .eq("order_id", id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/buyer/dashboard/orders/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Leave a Review</h1>
          <p className="text-sm text-muted-foreground">Order #{order.order_number}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {!existingSupplierReview && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Supplier: {order.supplier.business_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                type="supplier"
                supplierId={order.supplier_id}
                buyerId={buyer.id}
                orderId={order.id}
                orderNumber={order.order_number}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Rate Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderItems?.map((item) => (
              <div key={item.id} className="border-b last:border-0 pb-6 last:pb-0">
                <h3 className="font-semibold mb-4">{item.product.name}</h3>
                <ReviewForm
                  type="product"
                  productId={item.product_id}
                  buyerId={buyer.id}
                  orderId={order.id}
                  orderNumber={order.order_number}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
