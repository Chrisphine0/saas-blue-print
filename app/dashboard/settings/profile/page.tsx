import { createClient } from "@/lib/supabase/server"
import ProfileForm from "@/components/settings/ProfileForm"
import type { Supplier } from "@/lib/types"
import { redirect } from "next/navigation"

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const res = await supabase.from("suppliers").select("*").eq("user_id", user.id).single<Supplier>()
  const supplier = (res as any).data

  if (!supplier) redirect("/onboarding")

  return <ProfileForm initialData={supplier} />
}