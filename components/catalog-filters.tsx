"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import type { Category, Supplier } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CatalogFiltersProps {
  categories: Category[]
  suppliers: Supplier[]
}

export function CatalogFilters({ categories, suppliers }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      router.push(`/buyer/dashboard/catalog?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.push("/buyer/dashboard/catalog")
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Sort By</Label>
            <RadioGroup value={searchParams.get("sort") || ""} onValueChange={(value) => updateFilter("sort", value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="sort-newest" />
                <Label htmlFor="sort-newest" className="font-normal">
                  Newest
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_asc" id="sort-price-asc" />
                <Label htmlFor="sort-price-asc" className="font-normal">
                  Price: Low to High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price_desc" id="sort-price-desc" />
                <Label htmlFor="sort-price-desc" className="font-normal">
                  Price: High to Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name_asc" id="sort-name" />
                <Label htmlFor="sort-name" className="font-normal">
                  Name (A-Z)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Category</Label>
            <RadioGroup
              value={searchParams.get("category") || ""}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="cat-all" />
                <Label htmlFor="cat-all" className="font-normal">
                  All Categories
                </Label>
              </div>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.id} id={`cat-${category.id}`} />
                  <Label htmlFor={`cat-${category.id}`} className="font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Supplier</Label>
            <RadioGroup
              value={searchParams.get("supplier") || ""}
              onValueChange={(value) => updateFilter("supplier", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="sup-all" />
                <Label htmlFor="sup-all" className="font-normal">
                  All Suppliers
                </Label>
              </div>
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={supplier.id} id={`sup-${supplier.id}`} />
                  <Label htmlFor={`sup-${supplier.id}`} className="font-normal">
                    {supplier.business_name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Price Range</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min price"
                defaultValue={searchParams.get("min_price") || ""}
                onChange={(e) => updateFilter("min_price", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max price"
                defaultValue={searchParams.get("max_price") || ""}
                onChange={(e) => updateFilter("max_price", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent" disabled={isPending}>
            Clear Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
