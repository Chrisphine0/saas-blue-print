import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Phone, Truck, User } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DeliveryTimeline } from "@/components/delivery-timeline"

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return notFound()
  }

  // Get delivery with details
  const { data: delivery } = await supabase
    .from("deliveries")
    .select(`
      *,
      order:orders(*),
      supplier:suppliers(*)
    `)
    .eq("id", id)
    .eq("buyer_id", buyer.id)
    .single()

  if (!delivery) {
    return notFound()
  }

  // Get delivery updates
  const { data: updates } = await supabase
    .from("delivery_updates")
    .select("*")
    .eq("delivery_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/buyer/dashboard/deliveries">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{delivery.tracking_number}</h1>
            <p className="text-sm text-muted-foreground">Order #{delivery.order.order_number}</p>
          </div>
        </div>
        <Badge
          variant={
            delivery.status === "delivered" ? "default" : delivery.status === "failed" ? "destructive" : "secondary"
          }
        >
          {delivery.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryTimeline updates={updates || []} currentStatus={delivery.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </p>
                  <p className="mt-1">{delivery.delivery_address}</p>
                </div>
                {delivery.pickup_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Pickup Address
                    </p>
                    <p className="mt-1">{delivery.pickup_address}</p>
                  </div>
                )}
              </div>

              {delivery.estimated_delivery_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Delivery</p>
                  <p className="mt-1">{format(new Date(delivery.estimated_delivery_date), "PPP")}</p>
                </div>
              )}

              {delivery.actual_delivery_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actual Delivery</p>
                  <p className="mt-1">{format(new Date(delivery.actual_delivery_date), "PPP")}</p>
                </div>
              )}

              {delivery.delivery_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{delivery.delivery_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(delivery.driver_name || delivery.driver_phone || delivery.vehicle_number) && (
            <Card>
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {delivery.driver_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{delivery.driver_name}</span>
                  </div>
                )}
                {delivery.driver_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{delivery.driver_phone}</span>
                  </div>
                )}
                {delivery.vehicle_number && (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{delivery.vehicle_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{delivery.supplier.business_name}</p>
              <p className="text-sm text-muted-foreground mt-1">{delivery.supplier.email}</p>
              <p className="text-sm text-muted-foreground">{delivery.supplier.phone}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}