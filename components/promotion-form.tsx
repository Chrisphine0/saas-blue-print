"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface PromotionFormProps {
  supplierId: string
  products: Array<{ id: string; name: string; sku: string }>
  categories: Array<{ id: string; name: string }>
  promotion?: any
}

export function PromotionForm({ supplierId, products, categories, promotion }: PromotionFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [formData, setFormData] = useState({
    code: promotion?.code || "",
    name: promotion?.name || "",
    description: promotion?.description || "",
    type: promotion?.type || "percentage",
    discount_value: promotion?.discount_value?.toString() || "",
    min_order_amount: promotion?.min_order_amount?.toString() || "",
    max_discount_amount: promotion?.max_discount_amount?.toString() || "",
    buy_quantity: promotion?.buy_quantity?.toString() || "",
    get_quantity: promotion?.get_quantity?.toString() || "",
    applies_to: promotion?.applies_to || "all_products",
    product_ids: promotion?.product_ids || [],
    category_ids: promotion?.category_ids || [],
    usage_limit: promotion?.usage_limit?.toString() || "",
    per_buyer_limit: promotion?.per_buyer_limit?.toString() || "",
    start_date: promotion?.start_date?.split("T")[0] || "",
    end_date: promotion?.end_date?.split("T")[0] || "",
    is_active: promotion?.is_active !== undefined ? promotion.is_active : true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const data = {
      supplier_id: supplierId,
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      discount_value: formData.discount_value ? Number.parseFloat(formData.discount_value) : null,
      min_order_amount: formData.min_order_amount ? Number.parseFloat(formData.min_order_amount) : null,
      max_discount_amount: formData.max_discount_amount ? Number.parseFloat(formData.max_discount_amount) : null,
      buy_quantity: formData.buy_quantity ? Number.parseInt(formData.buy_quantity) : null,
      get_quantity: formData.get_quantity ? Number.parseInt(formData.get_quantity) : null,
      applies_to: formData.applies_to,
      product_ids: formData.applies_to === "specific_products" ? formData.product_ids : null,
      category_ids: formData.applies_to === "category" ? formData.category_ids : null,
      usage_limit: formData.usage_limit ? Number.parseInt(formData.usage_limit) : null,
      per_buyer_limit: formData.per_buyer_limit ? Number.parseInt(formData.per_buyer_limit) : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
    }

    const { error } = promotion
      ? await supabase.from("promotions").update(data).eq("id", promotion.id)
      : await supabase.from("promotions").insert(data)

    setLoading(false)

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: promotion ? "Promotion updated" : "Promotion created" })
      router.push("/dashboard/promotions")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Promotion Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SUMMER2024"
                required
                className="font-mono uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Promotion Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Summer Sale"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Get 20% off on all products this summer"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discount Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Discount Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Off</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.type === "percentage" || formData.type === "fixed_amount") && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {formData.type === "percentage" ? "Discount Percentage *" : "Discount Amount (KES) *"}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  required
                />
              </div>
              {formData.type === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Max Discount Amount (KES)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {formData.type === "buy_x_get_y" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buy_quantity">Buy Quantity *</Label>
                <Input
                  id="buy_quantity"
                  type="number"
                  value={formData.buy_quantity}
                  onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="get_quantity">Get Quantity *</Label>
                <Input
                  id="get_quantity"
                  type="number"
                  value={formData.get_quantity}
                  onChange={(e) => setFormData({ ...formData, get_quantity: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="min_order_amount">Minimum Order Amount (KES)</Label>
            <Input
              id="min_order_amount"
              type="number"
              step="0.01"
              value={formData.min_order_amount}
              onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validity & Usage Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="usage_limit">Total Usage Limit</Label>
              <Input
                id="usage_limit"
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="per_buyer_limit">Per Buyer Limit</Label>
              <Input
                id="per_buyer_limit"
                type="number"
                value={formData.per_buyer_limit}
                onChange={(e) => setFormData({ ...formData, per_buyer_limit: e.target.value })}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : promotion ? "Update Promotion" : "Create Promotion"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
