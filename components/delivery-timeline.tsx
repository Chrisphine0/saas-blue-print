"use client"

import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Package, Truck, MapPin, CheckCircle } from "lucide-react"
import type { DeliveryUpdate } from "@/lib/types"

interface DeliveryTimelineProps {
  updates: DeliveryUpdate[]
  currentStatus: string
}

const statusIcons = {
  pending: Package,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle,
}

export function DeliveryTimeline({ updates, currentStatus }: DeliveryTimelineProps) {
  return (
    <div className="space-y-4">
      {updates.map((update, index) => {
        const Icon = statusIcons[update.status as keyof typeof statusIcons] || Package
        const isLast = index === updates.length - 1

        return (
          <div key={update.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
            </div>
            <div className={cn("flex-1", !isLast && "pb-8")}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold capitalize">{update.status.replace("_", " ")}</p>
                  {update.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {update.location}
                    </p>
                  )}
                  {update.notes && <p className="text-sm text-muted-foreground mt-1">{update.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
