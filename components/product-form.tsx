"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Supplier, Product, Category } from "@/lib/types"

interface ProductFormProps {
  supplier: Supplier
  categories: Category[]
  product?: Product
}

export function ProductForm({ supplier, categories, product }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    sku: product?.sku || "",
    categoryId: product?.category_id || "",
    unitOfMeasure: product?.unit_of_measure || "pcs",
    pricePerUnit: product?.price_per_unit?.toString() || "",
    minOrderQuantity: product?.min_order_quantity?.toString() || "1",
    maxOrderQuantity: product?.max_order_quantity?.toString() || "",
    leadTimeDays: product?.lead_time_days?.toString() || "1",
    status: product?.status || "active",
    initialStock: "",
    reorderLevel: "50",
    reorderQuantity: "100",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      if (product) {
        // Update existing product
        const { error: updateError } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description || null,
            category_id: formData.categoryId || null,
            unit_of_measure: formData.unitOfMeasure,
            price_per_unit: Number.parseFloat(formData.pricePerUnit),
            min_order_quantity: Number.parseInt(formData.minOrderQuantity),
            max_order_quantity: formData.maxOrderQuantity ? Number.parseInt(formData.maxOrderQuantity) : null,
            lead_time_days: Number.parseInt(formData.leadTimeDays),
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id)

        if (updateError) throw updateError

        router.push("/dashboard/products")
        router.refresh()
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            supplier_id: supplier.id,
            name: formData.name,
            description: formData.description || null,
            sku: formData.sku,
            category_id: formData.categoryId || null,
            unit_of_measure: formData.unitOfMeasure,
            price_per_unit: Number.parseFloat(formData.pricePerUnit),
            min_order_quantity: Number.parseInt(formData.minOrderQuantity),
            max_order_quantity: formData.maxOrderQuantity ? Number.parseInt(formData.maxOrderQuantity) : null,
            lead_time_days: Number.parseInt(formData.leadTimeDays),
            status: formData.status,
          })
          .select()
          .single()

        if (productError) throw productError

        // Create inventory record
        const { error: inventoryError } = await supabase.from("inventory").insert({
          product_id: newProduct.id,
          supplier_id: supplier.id,
          quantity_available: formData.initialStock ? Number.parseInt(formData.initialStock) : 0,
          quantity_reserved: 0,
          reorder_level: Number.parseInt(formData.reorderLevel),
          reorder_quantity: Number.parseInt(formData.reorderQuantity),
        })

        if (inventoryError) throw inventoryError

        router.push("/dashboard/products")
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential product details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  type="text"
                  required
                  disabled={!!product}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
                {product && <p className="text-xs text-muted-foreground">SKU cannot be changed</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Quantity</CardTitle>
            <CardDescription>Set pricing and order quantities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                <Select
                  value={formData.unitOfMeasure}
                  onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value as any })}
                >
                  <SelectTrigger id="unitOfMeasure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="ltr">Liters (ltr)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="carton">Carton</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pricePerUnit">Price per Unit (KES) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="minOrderQuantity">Min Order Qty *</Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  min="1"
                  required
                  value={formData.minOrderQuantity}
                  onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxOrderQuantity">Max Order Qty</Label>
                <Input
                  id="maxOrderQuantity"
                  type="number"
                  min="1"
                  value={formData.maxOrderQuantity}
                  onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="leadTimeDays">Lead Time (days) *</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  min="0"
                  required
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!product && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Initial stock and reorder configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="initialStock">Initial Stock</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reorderQuantity">Reorder Quantity *</Label>
                  <Input
                    id="reorderQuantity"
                    type="number"
                    min="1"
                    required
                    value={formData.reorderQuantity}
                    onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Product availability status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
