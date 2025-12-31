import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Users, Package, TrendingUp, Award } from "lucide-react"

export default async function MarketplacePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/buyer/auth/login")

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) redirect("/buyer/auth/login")

  // Get top-rated suppliers
  const { data: topSuppliers } = await supabase
    .from("suppliers")
    .select(`
      *,
      supplier_ratings (
        average_rating,
        total_reviews,
        communication_rating,
        delivery_rating,
        quality_rating
      )
    `)
    .eq("status", "active")
    .eq("verified", true)
    .order("supplier_ratings(average_rating)", { ascending: false })
    .limit(6)

  // Get trending products (most viewed in last 7 days)
  const { data: trendingProducts } = await supabase
    .from("products")
    .select(`
      *,
      suppliers!inner (
        id,
        business_name,
        verified
      ),
      product_views!inner (
        viewed_at
      )
    `)
    .eq("status", "active")
    .gte("product_views.viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(8)

  // Get followed suppliers
  const { data: followedSuppliers } = await supabase
    .from("supplier_follows")
    .select(`
      suppliers (
        *,
        supplier_ratings (
          average_rating,
          total_reviews
        )
      )
    `)
    .eq("buyer_id", buyer.id)
    .limit(4)

  // Get new suppliers (joined in last 30 days)
  const { data: newSuppliers } = await supabase
    .from("suppliers")
    .select(`
      *,
      supplier_ratings (
        average_rating,
        total_reviews
      )
    `)
    .eq("status", "active")
    .eq("verified", true)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(4)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Discover trusted suppliers and trending products</p>
      </div>

      {/* Followed Suppliers */}
      {followedSuppliers && followedSuppliers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Suppliers You Follow
            </h2>
            <Button variant="link" asChild>
              <Link href="/buyer/dashboard/marketplace/following">View All</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {followedSuppliers.map((follow: any) => {
              const supplier = follow.suppliers
              const rating = supplier.supplier_ratings?.[0]
              return (
                <Card key={supplier.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                    {rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({rating.total_reviews})</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                      <Link href={`/buyer/dashboard/marketplace/suppliers/${supplier.id}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Top Rated Suppliers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Rated Suppliers
          </h2>
          <Button variant="link" asChild>
            <Link href="/buyer/dashboard/marketplace/suppliers">View All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topSuppliers?.map((supplier: any) => {
            const rating = supplier.supplier_ratings?.[0]
            return (
              <Card key={supplier.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {supplier.city}, {supplier.country}
                      </p>
                    </div>
                    {supplier.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <Award className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {rating && (
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.average_rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({rating.total_reviews} reviews)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Quality</div>
                          <div className="font-medium">{rating.quality_rating.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Delivery</div>
                          <div className="font-medium">{rating.delivery_rating.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Comms</div>
                          <div className="font-medium">{rating.communication_rating.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                    <Link href={`/buyer/dashboard/marketplace/suppliers/${supplier.id}`}>View Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Trending Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Products
          </h2>
          <Button variant="link" asChild>
            <Link href="/buyer/dashboard/catalog">Browse Catalog</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {trendingProducts?.slice(0, 8).map((product: any) => (
            <Card key={product.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.suppliers?.business_name}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">KES {product.price_per_unit.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/{product.unit_of_measure}</span>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                  <Link href={`/buyer/dashboard/catalog?product=${product.id}`}>View Product</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* New Suppliers */}
      {newSuppliers && newSuppliers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              New to Marketplace
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {newSuppliers.map((supplier: any) => {
              const rating = supplier.supplier_ratings?.[0]
              return (
                <Card key={supplier.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      New
                    </Badge>
                    <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{supplier.city}</p>
                    {rating && rating.total_reviews > 0 && (
                      <div className="flex items-center gap-1 text-sm pt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({rating.total_reviews})</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                      <Link href={`/buyer/dashboard/marketplace/suppliers/${supplier.id}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
