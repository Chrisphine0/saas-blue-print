import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PromotionForm } from "@/components/promotion-form"

export default async function NewPromotionPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: supplier } = await supabase.from("suppliers").select("*").eq("user_id", user.id).single()

  if (!supplier) redirect("/auth/login")

  // Get products and categories
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("supplier_id", supplier.id)
    .eq("status", "active")

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Promotion</h1>
        <p className="text-muted-foreground">Set up a new promotional offer for your products</p>
      </div>

      <PromotionForm supplierId={supplier.id} products={products || []} categories={categories || []} />
    </div>
  )
}
