import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const updatePayload: any = {}
    if (body.business_name !== undefined) updatePayload.business_name = body.business_name
    if (body.address !== undefined) updatePayload.address = body.address
    if (body.city !== undefined) updatePayload.city = body.city
    if (body.country !== undefined) updatePayload.country = body.country
    if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url

    const { error } = await supabase.from("suppliers").update(updatePayload).eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}