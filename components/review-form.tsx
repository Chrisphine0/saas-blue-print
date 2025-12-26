"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  type: "product" | "supplier"
  productId?: string
  supplierId?: string
  buyerId: string
  orderId: string
  orderNumber: string
}

export function ReviewForm({ type, productId, supplierId, buyerId, orderId, orderNumber }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Supplier-specific ratings
  const [communicationRating, setCommunicationRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)

  const router = useRouter()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsLoading(true)

    try {
      if (type === "product" && productId) {
        const { error } = await supabase.from("product_reviews").insert({
          product_id: productId,
          buyer_id: buyerId,
          order_id: orderId,
          rating,
          review_text: reviewText || null,
          status: "published",
          verified_purchase: true,
        })

        if (error) throw error
      } else if (type === "supplier" && supplierId) {
        const { error } = await supabase.from("supplier_reviews").insert({
          supplier_id: supplierId,
          buyer_id: buyerId,
          order_id: orderId,
          rating,
          review_text: reviewText || null,
          communication_rating: communicationRating || null,
          delivery_rating: deliveryRating || null,
          quality_rating: qualityRating || null,
          status: "published",
          verified_purchase: true,
        })

        if (error) throw error
      }

      toast.success("Review submitted successfully")
      router.push(`/buyer/dashboard/orders/${orderId}`)
      router.refresh()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review")
    } finally {
      setIsLoading(false)
    }
  }

  const StarRating = ({
    value,
    setValue,
    hover,
    setHover,
  }: {
    value: number
    setValue: (val: number) => void
    hover: number
    setHover: (val: number) => void
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setValue(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              (hover || value) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Overall Rating *</Label>
        <StarRating value={rating} setValue={setRating} hover={hoverRating} setHover={setHoverRating} />
      </div>

      {type === "supplier" && (
        <>
          <div className="space-y-2">
            <Label>Communication</Label>
            <StarRating value={communicationRating} setValue={setCommunicationRating} hover={0} setHover={() => {}} />
          </div>
          <div className="space-y-2">
            <Label>Delivery</Label>
            <StarRating value={deliveryRating} setValue={setDeliveryRating} hover={0} setHover={() => {}} />
          </div>
          <div className="space-y-2">
            <Label>Product Quality</Label>
            <StarRating value={qualityRating} setValue={setQualityRating} hover={0} setHover={() => {}} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="review_text">Review (Optional)</Label>
        <Textarea
          id="review_text"
          placeholder={`Share your experience with this ${type}...`}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
