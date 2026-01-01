import { createClient } from "@/lib/supabase/server"
import type { Notification, Supplier } from "@/lib/types"
import { redirect } from "next/navigation"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const supplierRes = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (supplierRes as any).data

  if (!supplier) redirect("/onboarding")

  const userIds = [supplier.id, supplier.user_id].filter(Boolean)
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_type", "supplier")
    .in("user_id", userIds as string[])
    .order("created_at", { ascending: false })
    .limit(50)

  const notifications = (data as Notification[]) || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-muted-foreground">No notifications</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`p-3 rounded border ${n.is_read ? "bg-white" : "bg-yellow-50"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  {n.action_url && (
                    <a href={n.action_url} className="text-sm text-blue-600 underline" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
                {!n.is_read && (
                  <form action="/api/notifications/read" method="post">
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="ml-4 rounded bg-slate-800 px-3 py-1 text-white text-sm">
                      Mark read
                    </button>
                  </form>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}