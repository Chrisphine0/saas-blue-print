"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Star, Award, MapPin, Heart, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SuppliersDirectoryProps {
  buyerId: string
  searchParams: { [key: string]: string | string[] | undefined }
}

export function SuppliersDirectory({ buyerId, searchParams }: SuppliersDirectoryProps) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState((searchParams.search as string) || "")
  const [sortBy, setSortBy] = useState((searchParams.sort as string) || "rating")
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    loadSuppliers()
    loadFollowing()
  }, [sortBy])

  async function loadSuppliers() {
    setLoading(true)
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
      .eq("verified", true)

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,city.ilike.%${search}%`)
    }

    if (sortBy === "rating") {
      query = query.order("supplier_ratings(average_rating)", { ascending: false })
    } else if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false })
    } else if (sortBy === "name") {
      query = query.order("business_name", { ascending: true })
    }

    const { data } = await query
    setSuppliers(data || [])
    setLoading(false)
  }

  async function loadFollowing() {
    const { data } = await supabase.from("supplier_follows").select("supplier_id").eq("buyer_id", buyerId)

    if (data) {
      setFollowing(new Set(data.map((f) => f.supplier_id)))
    }
  }

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
      const { error } = await supabase.from("supplier_follows").insert({ buyer_id: buyerId, supplier_id: supplierId })

      if (!error) {
        setFollowing((prev) => new Set(prev).add(supplierId))
        toast({ title: "Following supplier" })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadSuppliers}>Search</Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No suppliers found</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => {
            const rating = supplier.supplier_ratings?.[0]
            const isFollowing = following.has(supplier.id)

            return (
              <Card key={supplier.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.city}, {supplier.country}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => toggleFollow(supplier.id)}>
                      <Heart className={`h-5 w-5 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                  {supplier.verified && (
                    <Badge variant="secondary" className="w-fit gap-1">
                      <Award className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {rating && rating.total_reviews > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.average_rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({rating.total_reviews} reviews)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Quality</div>
                          <div className="font-medium">{rating.quality_rating.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Delivery</div>
                          <div className="font-medium">{rating.delivery_rating.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Communication</div>
                          <div className="font-medium">{rating.communication_rating.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                  )}
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href={`/buyer/dashboard/marketplace/suppliers/${supplier.id}`}>View Profile</Link>
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
