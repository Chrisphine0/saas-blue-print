"use client"

import { useState } from "react"
import Image from "next/image"
import type { CartItem } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Package } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CartItemsProps {
  items: (CartItem & { product: any })[]
  buyerId: string
}

export function CartItems({ items, buyerId }: CartItemsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateQuantity = async (
    itemId: string,
    productId: string,
    newQuantity: number,
    minQty: number,
  ) => {
    if (newQuantity < minQty) {
      toast({
        title: "Invalid quantity",
        description: `Minimum order quantity is ${minQty}`,
        variant: "destructive",
      })
      return
    }

    setLoading(itemId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      toast({ title: "Cart updated" })
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

  const removeItem = async (itemId: string) => {
    setLoading(itemId)
    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      toast({ title: "Item removed from cart" })
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

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const product = item.product
        const inventory = product.inventory?.[0]
        const subtotal = product.price_per_unit * item.quantity

        return (
          <Card key={item.id}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  {product.images?.length ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {product.supplier?.business_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      KES {product.price_per_unit.toLocaleString()} /{" "}
                      {product.unit_of_measure}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            product.id,
                            item.quantity - 1,
                            product.min_order_quantity,
                          )
                        }
                        disabled={
                          loading === item.id ||
                          item.quantity <= product.min_order_quantity
                        }
                      >
                        −
                      </Button>

                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.id,
                            product.id,
                            Number(e.target.value),
                            product.min_order_quantity,
                          )
                        }
                        className="w-20 text-center"
                        min={product.min_order_quantity}
                        max={inventory?.quantity_available}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            product.id,
                            item.quantity + 1,
                            product.min_order_quantity,
                          )
                        }
                        disabled={
                          loading === item.id ||
                          item.quantity >=
                            (inventory?.quantity_available || 0)
                        }
                      >
                        +
                      </Button>
                    </div>

                    {inventory && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {inventory.quantity_available}{" "}
                        {product.unit_of_measure} available
                      </p>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t sm:border-t-0">
                    <p className="font-bold text-base sm:text-lg">
                      KES {subtotal.toLocaleString()}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={loading === item.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
