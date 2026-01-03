"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Star, Award, MapPin, Heart, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SuppliersDirectoryProps {
  buyerId: string
  searchParams: { [key: string]: string | string[] | undefined }
}

export function SuppliersDirectory({ buyerId, searchParams }: SuppliersDirectoryProps) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState((searchParams?.search as string) || "")
  const [sortBy, setSortBy] = useState((searchParams?.sort as string) || "name") // Default to name if rating table is empty
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetching Suppliers. Removed .eq("verified", true) to show everyone
      let query = supabase
        .from("suppliers")
        .select(`
          *,
          supplier_ratings (
            average_rating,
            total_reviews,
            communication_rating,
            delivery_rating,
            quality_rating
          )
        `)
        .eq("status", "active")

      if (search) {
        query = query.or(`business_name.ilike.%${search}%,city.ilike.%${search}%`)
      }

      // 2. Sorting Logic
      if (sortBy === "rating") {
        // Note: Sort by foreign table only works if record exists. 
        // Better to sort 'name' as fallback if rating is null.
        query = query.order("business_name", { ascending: true })
      } else if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("business_name", { ascending: true })
      }

      const { data, error } = await query
      
      if (error) throw error

      setSuppliers(data || [])
    } catch (error: any) {
      toast({
        title: "Error loading suppliers",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [search, sortBy, supabase, toast])

  const loadFollowing = useCallback(async () => {
    const { data } = await supabase
      .from("supplier_follows")
      .select("supplier_id")
      .eq("buyer_id", buyerId)

    if (data) {
      setFollowing(new Set(data.map((f) => f.supplier_id)))
    }
  }, [buyerId, supabase])

  useEffect(() => {
    loadSuppliers()
    loadFollowing()
  }, [loadSuppliers, loadFollowing])

  async function toggleFollow(supplierId: string) {
    const isFollowing = following.has(supplierId)

    if (isFollowing) {
      const { error } = await supabase
        .from("supplier_follows")
        .delete()
        .eq("buyer_id", buyerId)
        .eq("supplier_id", supplierId)

      if (!error) {
        setFollowing((prev) => {
          const next = new Set(prev)
          next.delete(supplierId)
          return next
        })
        toast({ title: "Unfollowed supplier" })
      }
    } else {
      const { error } = await supabase
        .from("supplier_follows")
        .insert({ buyer_id: buyerId, supplier_id: supplierId })

      if (!error) {
        setFollowing((prev) => new Set(prev).add(supplierId))
        toast({ title: "Following supplier" })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadSuppliers()}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
            </Select>
            <Button onClick={loadSuppliers}>Search</Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Finding suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No suppliers found</h3>
                <p className="text-muted-foreground max-w-xs">
                    Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button variant="link" onClick={() => {setSearch(""); setSortBy("name")}}>Clear all filters</Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => {
            const rating = supplier.supplier_ratings?.[0]
            const isFollowing = following.has(supplier.id)

            return (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{supplier.business_name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.city}, {supplier.country}
                      </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleFollow(supplier.id)}
                        className="rounded-full"
                    >
                      <Heart className={`h-5 w-5 ${isFollowing ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {supplier.verified && (
                        <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                        <Award className="h-3 w-3" />
                        Verified
                        </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rating && rating.total_reviews > 0 ? (
                    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{rating.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({rating.total_reviews} reviews)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        <div className="text-center p-1 border-r">
                          <div className="text-foreground text-xs">{rating.quality_rating.toFixed(1)}</div>
                          Quality
                        </div>
                        <div className="text-center p-1 border-r">
                          <div className="text-foreground text-xs">{rating.delivery_rating.toFixed(1)}</div>
                          Delivery
                        </div>
                        <div className="text-center p-1">
                          <div className="text-foreground text-xs">{rating.communication_rating.toFixed(1)}</div>
                          Service
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">New Supplier • No reviews yet</p>
                    </div>
                  )}
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/buyer/dashboard/marketplace/suppliers/${supplier.id}`}>
                        View Products
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}