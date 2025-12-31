import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Bell } from "lucide-react"
import { ReorderAlertsList } from "@/components/reorder-alerts-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ReorderAlertsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/buyer/auth/login")
  }

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) {
    redirect("/buyer/auth/login")
  }

  // Get reorder alerts with product details
  const { data: alerts } = await supabase
    .from("reorder_alerts")
    .select(
      `
      *,
      product:products(
        *,
        supplier:suppliers(*),
        inventory(*)
      )
    `,
    )
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Reorder Alerts
            </h1>
            <Button asChild>
              <Link href="/buyer/dashboard/catalog">Browse Products to Add Alerts</Link>
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Set up alerts to remind you when it's time to reorder frequently purchased products
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <ReorderAlertsList alerts={alerts || []} buyerId={buyer.id} />
      </div>
    </div>
  )
}
