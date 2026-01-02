"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Heart, MapPin, Package, Star, Users, ExternalLink } from "lucide-react"
import type { SupplierWithRating } from "@/lib/types"

interface SupplierCardProps {
  supplier: SupplierWithRating
  buyerId: string
}

export function SupplierCard({ supplier, buyerId }: SupplierCardProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(supplier.is_following || false)
  const [followerCount, setFollowerCount] = useState(supplier.follower_count || 0)
  const [loading, setLoading] = useState(false)

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)

    try {
      const supabase = createClient()

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("supplier_follows")
          .delete()
          .eq("buyer_id", buyerId)
          .eq("supplier_id", supplier.id)

        if (error) throw error

        setIsFollowing(false)
        setFollowerCount((prev) => Math.max(0, prev - 1))
        toast.success("Unfollowed supplier")
      } else {
        // Follow
        const { error } = await supabase.from("supplier_follows").insert({
          buyer_id: buyerId,
          supplier_id: supplier.id,
        })

        if (error) throw error

        setIsFollowing(true)
        setFollowerCount((prev) => prev + 1)
        toast.success("Following supplier")
      }

      router.refresh()
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast.error("Failed to update follow status")
    } finally {
      setLoading(false)
    }
  }

  const handleViewSupplier = () => {
    router.push(`/buyer/dashboard/suppliers/${supplier.id}`)
  }

  const averageRating = supplier.rating?.average_rating || 0
  const totalReviews = supplier.rating?.total_reviews || 0

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewSupplier}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={supplier.logo_url} alt={supplier.business_name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {supplier.business_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base lg:text-lg truncate">{supplier.business_name}</h3>
              <div className="flex flex-col gap-1 mt-1">
                {supplier.verified && (
                  <Badge variant="default" className="text-xs w-fit">
                    Verified
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {supplier.city}, {supplier.country}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant={isFollowing ? "default" : "outline"}
            size="icon"
            className="flex-shrink-0 h-9 w-9"
            onClick={handleFollowToggle}
            disabled={loading}
          >
            <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rating */}
        {totalReviews > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= averageRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({totalReviews})</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm gap-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{supplier.product_count || 0} products</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{followerCount} followers</span>
          </div>
        </div>

        {/* Contact Info - Hide on very small screens */}
        <div className="hidden sm:block space-y-1">
          {supplier.phone && (
            <div className="text-sm text-muted-foreground truncate">
              <span className="font-medium">Phone:</span> {supplier.phone}
            </div>
          )}

          {supplier.email && (
            <div className="text-sm text-muted-foreground truncate">
              <span className="font-medium">Email:</span> {supplier.email}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="default" className="flex-1 text-sm" onClick={handleViewSupplier}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Profile
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/buyer/dashboard/catalog?supplier=${supplier.id}`)
            }}
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}