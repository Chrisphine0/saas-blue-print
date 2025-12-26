"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Product, Inventory } from "@/lib/types"

interface StockManagementProps {
  product: Product
  inventory: Inventory
}

export function StockManagement({ product, inventory }: StockManagementProps) {
  const [stockAdjustment, setStockAdjustment] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")
  const [reorderSettings, setReorderSettings] = useState({
    reorderLevel: inventory.reorder_level.toString(),
    reorderQuantity: inventory.reorder_quantity.toString(),
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const adjustment = Number.parseInt(stockAdjustment)
      const newQuantity =
        adjustmentType === "add" ? inventory.quantity_available + adjustment : inventory.quantity_available - adjustment

      if (newQuantity < 0) {
        throw new Error("Cannot reduce stock below 0")
      }

      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          quantity_available: newQuantity,
          last_restocked_at: adjustmentType === "add" ? new Date().toISOString() : inventory.last_restocked_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventory.id)

      if (updateError) throw updateError

      setStockAdjustment("")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReorderSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("inventory")
        .update({
          reorder_level: Number.parseInt(reorderSettings.reorderLevel),
          reorder_quantity: Number.parseInt(reorderSettings.reorderQuantity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventory.id)

      if (updateError) throw updateError

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>View current inventory status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Available Stock</p>
              <p className="text-3xl font-bold">
                {inventory.quantity_available} {product.unit_of_measure}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Reserved Stock</p>
              <p className="text-3xl font-bold">
                {inventory.quantity_reserved} {product.unit_of_measure}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Stock</p>
              <p className="text-3xl font-bold">
                {inventory.quantity_available + inventory.quantity_reserved} {product.unit_of_measure}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjust Stock</CardTitle>
          <CardDescription>Add or remove stock quantities</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStockAdjustment} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustmentType === "add" ? "default" : "outline"}
                onClick={() => setAdjustmentType("add")}
              >
                Add Stock
              </Button>
              <Button
                type="button"
                variant={adjustmentType === "remove" ? "default" : "outline"}
                onClick={() => setAdjustmentType("remove")}
              >
                Remove Stock
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockAdjustment">Quantity to {adjustmentType === "add" ? "Add" : "Remove"}</Label>
              <Input
                id="stockAdjustment"
                type="number"
                min="1"
                required
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : `${adjustmentType === "add" ? "Add" : "Remove"} Stock`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reorder Settings</CardTitle>
          <CardDescription>Configure automatic reorder alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReorderSettings} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  required
                  value={reorderSettings.reorderLevel}
                  onChange={(e) =>
                    setReorderSettings({
                      ...reorderSettings,
                      reorderLevel: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                <Input
                  id="reorderQuantity"
                  type="number"
                  min="1"
                  required
                  value={reorderSettings.reorderQuantity}
                  onChange={(e) =>
                    setReorderSettings({
                      ...reorderSettings,
                      reorderQuantity: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Suggested restock quantity</p>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Update Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}
    </div>
  )
}
