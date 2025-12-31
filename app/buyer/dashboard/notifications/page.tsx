import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Package, CreditCard, Truck, MessageSquare, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { NotificationActions } from "@/components/notification-actions"
import Link from "next/link"

const typeIcons = {
  order: Package,
  payment: CreditCard,
  delivery: Truck,
  message: MessageSquare,
  review: Star,
  system: Bell,
  inventory: Package,
}

export default async function BuyerNotificationsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    return null
  }

  // Get notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_type", "buyer")
    .eq("user_id", buyer.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell

            return (
              <Card key={notification.id} className={notification.is_read ? "bg-muted/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.is_read ? "bg-muted" : "bg-primary/10"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${notification.is_read ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {notification.action_url && (
                          <Link href={notification.action_url}>
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                              View Details
                            </Badge>
                          </Link>
                        )}
                        <NotificationActions notificationId={notification.id} isRead={notification.is_read} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">We'll notify you when there's something new</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}