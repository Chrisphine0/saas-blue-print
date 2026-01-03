"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import type { CartItem } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Package, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CartItemsProps {
  items: (CartItem & { product: any })[]
  buyerId: string
}

export function CartItems({ items: initialItems, buyerId }: CartItemsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Local state for "Instant" feedback
  const [optimisticItems, setOptimisticItems] = useState(initialItems)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Keep local state in sync with server props
  useEffect(() => {
    setOptimisticItems(initialItems)
  }, [initialItems])

  const updateQuantity = async (
    itemId: string,
    newQuantity: number,
    minQty: number,
    maxQty: number
  ) => {
    // 1. Validation
    if (newQuantity < minQty) {
      toast({ title: "Min quantity reached", description: `Minimum is ${minQty}` })
      return
    }
    if (newQuantity > maxQty) {
      toast({ title: "Stock limit", description: `Only ${maxQty} available`, variant: "destructive" })
      return
    }

    // 2. OPTIMISTIC UPDATE: Update UI immediately
    const previousItems = [...optimisticItems]
    setOptimisticItems(prev => 
      prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
    )

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      // Trigger navbar count update event
      window.dispatchEvent(new Event("cart-updated"))
      
      // Refresh server data in background
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      // Rollback on error
      setOptimisticItems(previousItems)
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const removeItem = async (itemId: string) => {
    setLoadingId(itemId)
    // Optimistic Remove
    const previousItems = [...optimisticItems]
    setOptimisticItems(prev => prev.filter(item => item.id !== itemId))

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)
        .eq("buyer_id", buyerId)

      if (error) throw error

      window.dispatchEvent(new Event("cart-updated"))
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      setOptimisticItems(previousItems)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {optimisticItems.map((item) => {
        const product = item.product
        const inventory = product.inventory?.[0]
        const maxAvailable = inventory?.quantity_available || 999
        const subtotal = product.price_per_unit * item.quantity

        return (
          <Card key={item.id} className={isPending ? "opacity-70 transition-opacity" : ""}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  {product.images?.length ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-base">{product.name}</h3>
                      <p className="text-sm text-gray-500">KES {product.price_per_unit.toLocaleString()}</p>
                    </div>
                    <p className="font-bold text-lg">KES {subtotal.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {/* Minus Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, product.min_order_quantity, maxAvailable)}
                        disabled={item.quantity <= product.min_order_quantity}
                      >
                        −
                      </Button>

                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value), product.min_order_quantity, maxAvailable)}
                        className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      {/* Plus Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1, product.min_order_quantity, maxAvailable)}
                        disabled={item.quantity >= maxAvailable}
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={loadingId === item.id}
                    >
                      {loadingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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