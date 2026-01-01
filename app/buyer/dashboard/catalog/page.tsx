import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductGrid } from "@/components/product-grid"
import { CatalogFilters } from "@/components/catalog-filters"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShoppingCart, Heart, Package, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const supabase = await createServerClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  const buyerRes = await supabase.from("buyers").select("*").eq("user_id", user.id).single()
  const buyer = (buyerRes as any).data
  const buyerError = (buyerRes as any).error
  const buyerStatus = (buyerRes as any).status

  if (buyerError) {
    if (buyerStatus === 406) {
      redirect("/buyer/auth/login")
    }
    // treat other errors as missing buyer
  }

  if (!buyer) {
    redirect("/buyer/auth/login")
  }

  // Build query
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

  // Apply filters
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  if (params.category) {
    query = query.eq("category_id", params.category)
  }

  if (params.supplier) {
    query = query.eq("supplier_id", params.supplier)
  }

  if (params.min_price) {
    query = query.gte("price_per_unit", Number(params.min_price))
  }

  if (params.max_price) {
    query = query.lte("price_per_unit", Number(params.max_price))
  }

  // Apply sorting
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

    const { data: cartItems } = await supabase.from("cart_items").select("*").eq("buyer_id", buyer.id)


  const { data: products } = await query

  // Get categories for filter
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Get verified suppliers for filter
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .eq("verified", true)
    .eq("status", "active")
    .order("business_name")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{buyer.business_name}</h1>
              <p className="text-sm text-gray-500">{buyer.contact_person}</p>
            </div>
             <nav className="mt-2">
            <div className="flex items-center space-x-4 text-sm">
              <Link href="/buyer/dashboard" className="text-gray-700 hover:text-gray-900">
                Overview
              </Link>
              <Link href="/buyer/dashboard/catalog" className="text-gray-700 hover:text-gray-900">
                Catalog
              </Link>
              <Link href="/buyer/dashboard/orders" className="text-gray-700 hover:text-gray-900">
                Orders
              </Link>
              <Link href="/buyer/dashboard/favorites" className="text-gray-700 hover:text-gray-900">
                Favorites
              </Link>
              <Link href="/buyer/dashboard/reorder-alerts" className="text-gray-700 hover:text-gray-900">
                Reorder Alerts
              </Link>
            </div>
          </nav>
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/buyer/dashboard/catalog">Browse Products</Link>
              </Button>
              <Button asChild>
                <Link href="/buyer/dashboard/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cart ({cartItems?.length || 0})
                </Link>
              </Button>
            </div>
          </div>

          {/* Top navigation for buyer dashboard */}
         
        </div>
      </div>
      
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Catalog</h1>
          <Suspense fallback={<div className="h-10 bg-gray-200 rounded animate-pulse" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <Suspense fallback={<div className="h-96 bg-gray-200 rounded animate-pulse" />}>
              <CatalogFilters categories={categories || []} suppliers={suppliers || []} />
            </Suspense>
          </aside>

          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">{products?.length || 0} products found</p>
            </div>

            <ProductGrid products={products || []} buyerId={buyer.id} />
          </main>
        </div>
      </div>
    </div>
  )
}
