import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SuppliersDirectory } from "@/components/suppliers-directory"

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/buyer/auth/login")

  const { data: buyer } = await supabase.from("buyers").select("*").eq("user_id", user.id).single()

  if (!buyer) redirect("/buyer/auth/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Directory</h1>
        <p className="text-muted-foreground">Browse and connect with verified suppliers</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SuppliersDirectory buyerId={buyer.id} searchParams={params} />
      </Suspense>
    </div>
  )
}
