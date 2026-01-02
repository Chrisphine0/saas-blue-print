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

  if (!user) return null

  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!buyer) return null

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_type", "buyer")
    .eq("user_id", buyer.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  return (
    <div className="space-y-4 px-1 sm:px-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-3xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "All caught up!"}
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon =
              typeIcons[notification.type as keyof typeof typeIcons] || Bell

            return (
              <Card
                key={notification.id}
                className={notification.is_read ? "bg-muted/30" : ""}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.is_read
                          ? "bg-muted"
                          : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          notification.is_read
                            ? "text-muted-foreground"
                            : "text-primary"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <Badge className="text-xs">New</Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Meta + actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {notification.action_url && (
                            <Link href={notification.action_url}>
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-accent"
                              >
                                View details
                              </Badge>
                            </Link>
                          )}
                          <NotificationActions
                            notificationId={notification.id}
                            isRead={notification.is_read}
                          />
                        </div>
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
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              We'll notify you when there's something new
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
