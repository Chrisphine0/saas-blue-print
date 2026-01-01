import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { StockManagement } from "@/components/stock-management"
import type { Supplier } from "@/lib/types"

export default async function ManageStockPage({ params }: { params: Promise<{ productId: string }> }) {
  const supabase = await createClient()

  const { productId } = await params

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
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  // Get product and inventory
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("supplier_id", supplier.id)
    .single()

  if (!product) {
    notFound()
  }

  const { data: inventory } = await supabase.from("inventory").select("*").eq("product_id", productId).single()

  if (!inventory) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-muted-foreground">Manage stock levels and reorder settings</p>
      </div>

      <StockManagement product={product} inventory={inventory} />
    </div>
  )
}
