"use client"

import { useState } from "react"
import Image from "next/image"
import type { ProductWithDetails } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Package } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ProductGridProps {
  products: ProductWithDetails[]
  buyerId: string
}

export function ProductGrid({ products, buyerId }: ProductGridProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const addToCart = async (productId: string, minQty: number) => {
    setLoading(productId)

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("cart_items").upsert(
        {
          buyer_id: buyerId,
          product_id: productId,
          quantity: minQty,
        },
        {
          onConflict: "buyer_id,product_id",
        }
      )

      if (error) throw error

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const toggleFavorite = async (productId: string, isFavorite: boolean) => {
    try {
      const supabase = createBrowserClient()

      if (isFavorite) {
        await supabase
          .from("buyer_favorites")
          .delete()
          .eq("buyer_id", buyerId)
          .eq("product_id", productId)
      } else {
        await supabase.from("buyer_favorites").insert({
          buyer_id: buyerId,
          product_id: productId,
        })
      }

      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-500">
          Try adjusting your filters or search query
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const inventory = product.inventory

        // ✅ Correct stock calculation
        const availableForSale =
          inventory
            ? inventory.quantity_available - inventory.quantity_reserved
            : 0

        const isOutOfStock = availableForSale <= 0
        // console.log("Product:", product.name, "Available for sale:", availableForSale);

        const isLowStock =
          inventory &&
          availableForSale > 0 &&
          availableForSale <= inventory.reorder_level

        return (
          <Card key={product.id} className="overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-12 w-12 text-gray-300" />
                </div>
              )}

              <button
                onClick={() => toggleFavorite(product.id, false)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              >
                <Heart className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <CardContent className="p-4">
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {product.category?.name || "Uncategorized"}
                </Badge>

                {isLowStock && !isOutOfStock && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Low Stock
                  </Badge>
                )}

                {isOutOfStock && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                {product.name}
              </h3>

              <p className="text-sm text-gray-600 mb-2">
                by {product.supplier?.business_name}
              </p>

              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {product.description}
              </p>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  KES {product.price_per_unit.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  /{product.unit_of_measure}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Min. Order: {product.min_order_quantity}{" "}
                {product.unit_of_measure}
              </p>

              {inventory && (
                <p className="text-xs text-gray-500">
                  Available: {availableForSale}
                </p>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button
                onClick={() =>
                  addToCart(product.id, product.min_order_quantity)
                }
                disabled={isOutOfStock || loading === product.id}
                className="w-full"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {loading === product.id ? "Adding..." : "Add to Cart"}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
