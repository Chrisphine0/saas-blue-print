import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Supplier } from "@/lib/types"

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
    // treat other errors as missing supplier
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  // Get all inventory with product details
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      *,
      products (
        name,
        sku,
        unit_of_measure,
        status
      )
    `,
    )
    .eq("supplier_id", supplier.id)
    .order("updated_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">Monitor and manage your stock levels</p>
      </div>

      {inventory && inventory.length > 0 ? (
        <div className="grid gap-4">
          {inventory.map((item: any) => {
            const rawAvailable = Number(item.quantity_available) || 0
            const reserved = Number(item.quantity_reserved) || 0
            const available = Math.max(0, rawAvailable - reserved)
            const reorderLevel = Number(item.reorder_level) || 0
            const isLowStock = available <= reorderLevel
            const stockPercentage = (available / Math.max(1, reorderLevel * 2)) * 100

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{item.products?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">SKU: {item.products?.sku}</p>
                    </div>
                    {isLowStock && (
                      <Badge variant="destructive">
                        <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className={`text-2xl font-bold ${isLowStock ? "text-destructive" : ""}`}>
                        {available} {item.products?.unit_of_measure}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reserved</p>
                      <p className="text-2xl font-bold">
                        {item.quantity_reserved} {item.products?.unit_of_measure}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Level</p>
                      <p className="text-2xl font-bold">{item.reorder_level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Qty</p>
                      <p className="text-2xl font-bold">{item.reorder_quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Restocked</p>
                      <p className="text-sm font-medium">
                        {item.last_restocked_at ? new Date(item.last_restocked_at).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${isLowStock ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/inventory/${item.product_id}`}>Manage Stock</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No inventory records</h3>
            <p className="text-sm text-muted-foreground mb-4">Add products to start managing inventory</p>
            <Button asChild>
              <Link href="/dashboard/products/new">Add Product</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
