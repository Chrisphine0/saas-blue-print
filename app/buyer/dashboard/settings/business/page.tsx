import { createClient } from "@/lib/supabase/server"
import BuyerBusinessForm from "@/components/settings/BuyerBusinessForm"
import type { Buyer } from "@/lib/types"
import { redirect } from "next/navigation"

export default async function BuyerBusinessSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/buyer/auth/login")

  const res = await supabase.from("buyers").select("*").eq("user_id", user.id).single<Buyer>()
  const buyer = (res as any).data
  const error = (res as any).error

  // Handle errors or missing buyer
  if (error || !buyer) {
    console.error("Error fetching buyer:", error)
    redirect("/buyer/onboarding")
  }

  return <BuyerBusinessForm initialData={buyer} />
}