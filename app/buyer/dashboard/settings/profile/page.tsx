import { createClient } from "@/lib/supabase/server"
import BuyerProfileForm from "@/components/settings/BuyerProfileForm"
import type { Buyer } from "@/lib/types"
import { redirect } from "next/navigation"

export default async function BuyerProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/buyer/auth/login")

  const res = await supabase.from("buyers").select("*").eq("user_id", user.id).single<Buyer>()
  const buyer = (res as any).data

  if (!buyer) redirect("/buyer/onboarding")

  return <BuyerProfileForm initialData={buyer} authUser={user} />
}