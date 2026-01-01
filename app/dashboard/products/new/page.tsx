import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/product-form"
import type { Supplier } from "@/lib/types"

export default async function NewProductPage() {
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
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  // Get categories
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in your catalog</p>
      </div>

      <ProductForm supplier={supplier} categories={categories || []} />
    </div>
  )
}
