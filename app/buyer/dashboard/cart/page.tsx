import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { CartItems } from "@/components/cart-items"
import { CartSummary } from "@/components/cart-summary"
import { ShoppingCart } from "lucide-react"

export default async function CartPage() {
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

  // Get cart items with product details
  const { data: cartItems } = await supabase
    .from("cart_items")
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Shopping Cart
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {cartItems && cartItems.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CartItems items={cartItems} buyerId={buyer.id} />
            </div>
            <div>
              <CartSummary items={cartItems} buyer={buyer} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Start adding products to your cart</p>
            <a
              href="/buyer/dashboard/catalog"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Products
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
