import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Heart } from "lucide-react"
import { FavoritesList } from "@/components/favorites-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function FavoritesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    redirect("/buyer/auth/login")
  }

  // Get favorites with product details
  const { data: favorites } = await supabase
    .from("buyer_favorites")
    .select(
      `
      *,
      product:products(
        *,
        supplier:suppliers(*),
        inventory(*)
      )
    `,
    )
    .eq("buyer_id", buyer.id)
    .order("added_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="h-8 w-8" />
              My Favorites
            </h1>
            <Button asChild>
              <Link href="/buyer/dashboard/catalog">Browse More Products</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <FavoritesList favorites={favorites || []} buyerId={buyer.id} />
      </div>
    </div>
  )
}