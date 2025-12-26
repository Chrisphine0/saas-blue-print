"use client"

import { useState } from "react"
import Image from "next/image"
import type { BuyerFavorite } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Package, ShoppingCart, Bell } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface FavoritesListProps {
  favorites: (BuyerFavorite & { product: any })[]
  buyerId: string
}

export function FavoritesList({ favorites, buyerId }: FavoritesListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const removeFavorite = async (favoriteId: string) => {
    setLoading(favoriteId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("buyer_favorites").delete().eq("id", favoriteId).eq("buyer_id", buyerId)

      if (error) throw error

      toast({
        title: "Removed from favorites",
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
        },
      )

      if (error) throw error

      toast({
        title: "Added to cart",
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

  const createReorderAlert = async (productId: string) => {
    setLoading(productId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("reorder_alerts").upsert(
        {
          buyer_id: buyerId,
          product_id: productId,
          threshold_quantity: 10,
          alert_frequency: "weekly",
          is_active: true,
        },
        {
          onConflict: "buyer_id,product_id",
        },
      )

      if (error) throw error

      toast({
        title: "Reorder alert created",
        description: "You'll be notified when it's time to reorder",
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

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-gray-500 mb-6">Browse the catalog to save products you like</p>
        <Button asChild>
          <a href="/buyer/dashboard/catalog">Browse Products</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((favorite) => {
        const product = favorite.product
        const inventory = product.inventory?.[0]
        const isLowStock = inventory ? inventory.quantity_available < inventory.reorder_level : false
        const isOutOfStock = inventory ? inventory.quantity_available === 0 : true

        return (
          <Card key={favorite.id} className="overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[0] || "/placeholder.svg"}
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
                onClick={() => removeFavorite(favorite.id)}
                disabled={loading === favorite.id}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              >
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
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

              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2">by {product.supplier?.business_name}</p>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">KES {product.price_per_unit.toLocaleString()}</span>
                <span className="text-sm text-gray-500">/{product.unit_of_measure}</span>
              </div>

              <p className="text-xs text-gray-500">
                Min. Order: {product.min_order_quantity} {product.unit_of_measure}
              </p>
              {inventory && <p className="text-xs text-gray-500">Available: {inventory.quantity_available}</p>}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button
                onClick={() => addToCart(product.id, product.min_order_quantity)}
                disabled={isOutOfStock || loading === product.id}
                className="flex-1"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                onClick={() => createReorderAlert(product.id)}
                disabled={loading === `alert-${product.id}`}
                variant="outline"
                size="icon"
                className="bg-transparent"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
