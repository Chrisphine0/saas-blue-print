import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Supplier } from "@/lib/types"

export default async function ProductsPage() {
  const supabase = await createClient()

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

  // Get all products with inventory data
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (
        name
      ),
      inventory (
        quantity_available,
        quantity_reserved,
        reorder_level
      )
    `,
    )
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </Button>
      </div>

      {products && products.length > 0 ? (
        <div className="grid gap-6">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>SKU: {product.sku}</span>
                      {product.categories && (
                        <>
                          <span>•</span>
                          <span>{product.categories.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      product.status === "active"
                        ? "default"
                        : product.status === "out_of_stock"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {product.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // inventory may come back as an array (relationship) or as an object
                  const invItem = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory
                  const available = Number(invItem?.quantity_available ?? 0)
                  const reorderLevel = Number(invItem?.reorder_level ?? 0)

                  return (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price per {product.unit_of_measure}</p>
                        <p className="text-lg font-semibold">KES {Number(product.price_per_unit).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Available</p>
                        <p className={`text-lg font-semibold ${available <= reorderLevel ? "text-destructive" : ""}`}>
                          {available} {product.unit_of_measure}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min Order Qty</p>
                        <p className="text-lg font-semibold">{product.min_order_quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lead Time</p>
                        <p className="text-lg font-semibold">{product.lead_time_days} days</p>
                      </div>
                    </div>
                  )
                })()}

                {product.description && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/inventory/${product.id}`}>Manage Stock</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first product</p>
            <Button asChild>
              <Link href="/dashboard/products/new">Add Product</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}