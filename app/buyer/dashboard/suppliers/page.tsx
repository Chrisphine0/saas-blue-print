// import { createClient } from "@/lib/supabase/server"
// import { redirect } from "next/navigation"
// import { SupplierCard } from "@/components/supplier-card"
// import { SearchBar } from "@/components/search-bar"
// import { SupplierSortDropdown } from "@/components/supplier-sort-dropdown"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Building2 } from "lucide-react"
// import type { SupplierWithRating } from "@/lib/types"

// interface PageProps {
//   searchParams: Promise<{
//     search?: string
//     sort?: string
//   }>
// }

// export default async function SuppliersPage({ searchParams }: PageProps) {
//   const supabase = await createClient()
//   const params = await searchParams

//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   if (!user) {
//     redirect("/buyer/auth/login")
//   }

//   const buyerRes = await supabase.from("buyers").select("*").eq("user_id", user.id).single()
//   const buyer = (buyerRes as any).data

//   if (!buyer) {
//     redirect("/buyer/auth/login")
//   }

//   // Build query for suppliers
//   let query = supabase
//     .from("suppliers")
//     .select(
//       `
//       *,
//       rating:supplier_ratings(*),
//       followers:supplier_follows!supplier_id(count)
//     `
//     )
//     .eq("verified", true)
//     .eq("status", "active")

//   // Apply search filter
//   if (params.search) {
//     query = query.or(`business_name.ilike.%${params.search}%,city.ilike.%${params.search}%,country.ilike.%${params.search}%`)
//   }

//   // Apply sorting
//   switch (params.sort) {
//     case "name_asc":
//       query = query.order("business_name", { ascending: true })
//       break
//     case "name_desc":
//       query = query.order("business_name", { ascending: false })
//       break
//     case "newest":
//       query = query.order("created_at", { ascending: false })
//       break
//     default:
//       query = query.order("business_name", { ascending: true })
//   }

//   const { data: suppliers, error: suppliersError } = await query

//   if (suppliersError) {
//     console.error("Error fetching suppliers:", suppliersError)
//   }

//   // Get buyer's followed suppliers
//   const { data: followedSuppliers, error: followsError } = await supabase
//     .from("supplier_follows")
//     .select("supplier_id")
//     .eq("buyer_id", buyer.id)

//   if (followsError) {
//     console.error("Error fetching follows:", followsError)
//   }

//   const followedIds = new Set(followedSuppliers?.map((f) => f.supplier_id) || [])

//   // Get product counts for each supplier
//   const { data: productCounts, error: productsError } = await supabase
//     .from("products")
//     .select("supplier_id")
//     .eq("status", "active")

//   if (productsError) {
//     console.error("Error fetching product counts:", productsError)
//   }

//   const countMap = new Map<string, number>()
//   productCounts?.forEach((p) => {
//     countMap.set(p.supplier_id, (countMap.get(p.supplier_id) || 0) + 1)
//   })

//   // Enrich suppliers with additional data
//   const enrichedSuppliers: SupplierWithRating[] = (suppliers || []).map((supplier) => ({
//     ...supplier,
//     rating: Array.isArray(supplier.rating) && supplier.rating.length > 0 ? supplier.rating[0] : undefined,
//     is_following: followedIds.has(supplier.id),
//     product_count: countMap.get(supplier.id) || 0,
//     follower_count: supplier.followers?.[0]?.count || 0,
//   }))

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">Suppliers Directory</h1>
//         <p className="text-muted-foreground mt-2">Browse and connect with verified suppliers</p>
//       </div>

//       {/* Search and Filter Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Building2 className="h-5 w-5" />
//             Find Suppliers
//           </CardTitle>
//           <CardDescription>Search by business name, city, or country</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <SearchBar placeholder="Search suppliers..." />
//         </CardContent>
//       </Card>

//       {/* Stats */}
//       <div className="flex items-center justify-between">
//         <p className="text-sm text-muted-foreground">
//           {enrichedSuppliers.length} {enrichedSuppliers.length === 1 ? "supplier" : "suppliers"} found
//         </p>
//         <SupplierSortDropdown />
//       </div>

//       {/* Suppliers Grid */}
//       {enrichedSuppliers.length > 0 ? (
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {enrichedSuppliers.map((supplier) => (
//             <SupplierCard key={supplier.id} supplier={supplier} buyerId={buyer.id} />
//           ))}
//         </div>
//       ) : (
//         <Card>
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
//             <p className="text-sm text-muted-foreground text-center">
//               {params.search
//                 ? "Try adjusting your search criteria"
//                 : "No verified suppliers are available at the moment"}
//             </p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }