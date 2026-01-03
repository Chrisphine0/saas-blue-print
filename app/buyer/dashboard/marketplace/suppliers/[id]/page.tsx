import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProductGrid } from "@/components/product-grid" // Import your existing component

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  // 1. Get current user and buyer profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/buyer/auth/login")

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!buyer) redirect("/buyer/auth/login")

  // 2. Fetch Supplier details
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single()

  if (!supplier) notFound()

  // 3. Fetch all products for this supplier with joined details
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      supplier:suppliers(*),
      category:categories(*),
      inventory:inventory(*)
    `)
    .eq("supplier_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header section remains the same */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/buyer/dashboard/marketplace">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{supplier.business_name}</h1>
          <div className="flex items-center gap-4 mt-1 text-muted-foreground">
            <span className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" /> {supplier.city}, {supplier.country}
            </span>
            {supplier.verified && (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                Verified Supplier
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="truncate">{supplier.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Replace the manual map with ProductGrid */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products
            </h2>
          </div>

          {!products || products.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No products listed.</p>
            </div>
          ) : (
            <ProductGrid products={products} buyerId={buyer.id} />
          )}
        </div>
      </div>
    </div>
  )
}