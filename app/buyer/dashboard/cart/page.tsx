import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { CartItems } from "@/components/cart-items"
import { CartSummary } from "@/components/cart-summary"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"

export default async function CartPage() {
  const supabase = await createServerClient()

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
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="flex items-center gap-2 sm:gap-3 text-xl sm:text-3xl font-bold text-gray-900">
            <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
            Shopping Cart
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {cartItems && cartItems.length > 0 ? (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2">
              <CartItems items={cartItems} buyerId={buyer.id} />
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-6 h-fit">
              <CartSummary items={cartItems} buyer={buyer} />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-white rounded-lg px-4">
            <ShoppingCart className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Start adding products to your cart
            </p>
            <Link
              href="/buyer/dashboard/catalog"
              className="inline-flex w-full sm:w-auto justify-center items-center px-5 py-2.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
