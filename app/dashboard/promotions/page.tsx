import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Tag, TrendingUp, Users } from "lucide-react"
import { PromotionActions } from "@/components/promotion-actions"

export default async function PromotionsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) redirect("/auth/login")

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  const activePromotions = promotions?.filter(
    (p) => p.is_active && new Date(p.start_date) <= new Date() && new Date(p.end_date) >= new Date(),
  )
  const upcomingPromotions = promotions?.filter((p) => p.is_active && new Date(p.start_date) > new Date())
  const expiredPromotions = promotions?.filter((p) => new Date(p.end_date) < new Date())

  const totalUsage = promotions?.reduce((sum, p) => sum + p.usage_count, 0) || 0
  const totalDiscount =
    promotions?.reduce((sum, p) => {
      // Calculate based on promotion usage
      return sum + p.usage_count * (p.discount_value || 0)
    }, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions</h1>
          <p className="text-muted-foreground">Create and manage promotional offers</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/promotions/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePromotions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPromotions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Discounts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalDiscount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Promotions */}
      {activePromotions && activePromotions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Promotions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activePromotions.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{promo.name}</CardTitle>
                      <CardDescription className="mt-1">{promo.description}</CardDescription>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono">
                      {promo.code}
                    </Badge>
                    {promo.type === "percentage" && <Badge variant="secondary">{promo.discount_value}% Off</Badge>}
                    {promo.type === "fixed_amount" && <Badge variant="secondary">KES {promo.discount_value} Off</Badge>}
                    {promo.type === "free_shipping" && <Badge variant="secondary">Free Shipping</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">
                      {promo.usage_count}
                      {promo.usage_limit ? ` / ${promo.usage_limit}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valid Until</span>
                    <span className="font-medium">{new Date(promo.end_date).toLocaleDateString()}</span>
                  </div>
                  <PromotionActions promotionId={promo.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Promotions */}
      {upcomingPromotions && upcomingPromotions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Promotions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingPromotions.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{promo.name}</CardTitle>
                      <CardDescription className="mt-1">{promo.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono">
                      {promo.code}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="font-medium">{new Date(promo.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="font-medium">{new Date(promo.end_date).toLocaleDateString()}</span>
                  </div>
                  <PromotionActions promotionId={promo.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expired Promotions */}
      {expiredPromotions && expiredPromotions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Expired Promotions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {expiredPromotions.map((promo) => (
              <Card key={promo.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{promo.name}</CardTitle>
                    </div>
                    <Badge variant="outline">Expired</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono">
                      {promo.code}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Uses</span>
                    <span className="font-medium">{promo.usage_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expired</span>
                    <span className="font-medium">{new Date(promo.end_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {promotions && promotions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No promotions yet</h3>
            <p className="text-muted-foreground mb-4">Create your first promotion to attract more customers</p>
            <Button asChild>
              <Link href="/dashboard/promotions/new">Create Promotion</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
