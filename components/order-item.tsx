"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Order } from "@/lib/types"

interface OrderItemProps {
  order: Order
}

export function OrderItem({ order }: OrderItemProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0">
      <div>
        <p className="font-medium">{order.order_number}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Status: <span className="font-medium capitalize">{order.status}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">KES {Number(order.total_amount).toLocaleString()}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1"
          onClick={() => router.push(`/buyer/dashboard/orders/${order.id}`)}
        >
          View
        </Button>
      </div>
    </div>
  )
}