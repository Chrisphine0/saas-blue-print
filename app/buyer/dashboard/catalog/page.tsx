import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { CatalogFilters } from "@/components/catalog-filters"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    supplier?: string
    min_price?: string
    max_price?: string
    sort?: string
  }>
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/buyer/auth/login")

  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!buyer) redirect("/buyer/auth/login")

  let query = supabase
    .from("products")
    .select(
      `
      *,
      supplier:suppliers(*),
      inventory(*),
      category:categories(*)
    `,
    )
    .eq("status", "active")

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  if (params.category) query = query.eq("category_id", params.category)
  if (params.supplier) query = query.eq("supplier_id", params.supplier)
  if (params.min_price) query = query.gte("price_per_unit", Number(params.min_price))
  if (params.max_price) query = query.lte("price_per_unit", Number(params.max_price))

  switch (params.sort) {
    case "price_asc":
      query = query.order("price_per_unit", { ascending: true })
      break
    case "price_desc":
      query = query.order("price_per_unit", { ascending: false })
      break
    case "name_asc":
      query = query.order("name", { ascending: true })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: products } = await query

  const { data: categories } = await supabase.from("categories").select("*").order("name")
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("verified", true)
    .eq("status", "active")
    .order("business_name")

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Product Catalog
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
          Browse and order from verified suppliers
        </p>
      </div>

      {/* Search */}
      <Suspense fallback={<div className="h-10 bg-muted rounded animate-pulse" />}>
        <SearchBar />
      </Suspense>

      {/* Mobile Filters Toggle */}
      <details className="md:hidden rounded-lg border">
        <summary className="cursor-pointer px-4 py-2 font-medium">
          Filters
        </summary>
        <div className="p-4">
          <CatalogFilters
            categories={categories || []}
            suppliers={suppliers || []}
          />
        </div>
      </details>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <Suspense fallback={<div className="h-96 bg-muted rounded animate-pulse" />}>
            <CatalogFilters
              categories={categories || []}
              suppliers={suppliers || []}
            />
          </Suspense>
        </aside>

        {/* Products */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products?.length || 0}{" "}
              {products?.length === 1 ? "product" : "products"} found
            </p>
          </div>

          <ProductGrid products={products || []} buyerId={buyer.id} />
        </main>
      </div>
    </div>
  )
}
