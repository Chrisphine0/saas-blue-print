import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Package, CreditCard, Truck, MessageSquare, Star, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { NotificationActions } from "@/components/notification-actions"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardNav } from "@/components/dashboard-nav"
import type { Supplier, Notification } from "@/lib/types"

const typeIcons = {
  order: Package,
  payment: CreditCard,
  delivery: Truck,
  message: MessageSquare,
  review: Star,
  system: Bell,
  inventory: AlertTriangle,
}

export default async function SupplierNotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data
  const supplierError = (supplierRes as any).error
  const supplierStatus = (supplierRes as any).status

  if (supplierError) {
    if (supplierStatus === 406) {
      redirect("/auth/login")
    }
  }

  if (!supplier) {
    redirect("/onboarding")
  }

  const userIds = [supplier.id, supplier.user_id].filter(Boolean) as string[]
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_type", "supplier")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="font-semibold">B2B Platform</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-4 px-3">
            <DashboardNav />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader supplier={supplier} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {notifications && notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification: Notification) => {
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
                                notification.action_url.startsWith("/") ? (
                                  <Link href={notification.action_url} className="inline-block">
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                                      View Details
                                    </Badge>
                                  </Link>
                                ) : (
                                  <a href={notification.action_url} className="inline-block">
                                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                                      View Details
                                    </Badge>
                                  </a>
                                )
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
        </main>
      </div>
    </div>
  )
}
