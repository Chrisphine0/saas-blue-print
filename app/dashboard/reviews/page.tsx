import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { redirect } from "next/navigation"

export default async function SupplierReviewsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) {
    return null
  }

  // Get supplier reviews
  const { data: supplierReviews } = await supabase
    .from("supplier_reviews")
    .select(`
      *,
      buyer:buyers(business_name, contact_person),
      order:orders(order_number)
    `)
    .eq("supplier_id", supplier.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  // Get product reviews
  const { data: productReviews } = await supabase
    .from("product_reviews")
    .select(`
      *,
      buyer:buyers(business_name, contact_person),
      product:products(name)
    `)
    .in(
      "product_id",
      await supabase
        .from("products")
        .select("id")
        .eq("supplier_id", supplier.id)
        .then((res) => res.data?.map((p) => p.id) || []),
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })

  // Calculate stats
  const avgSupplierRating = supplierReviews?.reduce((sum, r) => sum + r.rating, 0) / (supplierReviews?.length || 1) || 0
  const avgProductRating = productReviews?.reduce((sum, r) => sum + r.rating, 0) / (productReviews?.length || 1) || 0
  const totalReviews = (supplierReviews?.length || 0) + (productReviews?.length || 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
        <p className="text-muted-foreground">Customer feedback on your business and products</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSupplierRating.toFixed(1)} / 5.0</div>
            <p className="text-xs text-muted-foreground">{supplierReviews?.length || 0} reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProductRating.toFixed(1)} / 5.0</div>
            <p className="text-xs text-muted-foreground">{productReviews?.length || 0} reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierReviews && supplierReviews.length > 0 ? (
                supplierReviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.buyer.business_name}</p>
                        <p className="text-sm text-muted-foreground">Order #{review.order.order_number}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {review.rating.toFixed(1)}
                      </Badge>
                    </div>
                    {review.review_text && <p className="text-sm mb-2">{review.review_text}</p>}
                    {(review.communication_rating || review.delivery_rating || review.quality_rating) && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {review.communication_rating && <span>Communication: {review.communication_rating}/5</span>}
                        {review.delivery_rating && <span>Delivery: {review.delivery_rating}/5</span>}
                        {review.quality_rating && <span>Quality: {review.quality_rating}/5</span>}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(review.created_at), "PPP")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No supplier reviews yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productReviews && productReviews.length > 0 ? (
                productReviews.map((review) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.product.name}</p>
                        <p className="text-sm text-muted-foreground">by {review.buyer.business_name}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {review.rating.toFixed(1)}
                      </Badge>
                    </div>
                    {review.review_text && <p className="text-sm mb-2">{review.review_text}</p>}
                    {review.verified_purchase && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(review.created_at), "PPP")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No product reviews yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
