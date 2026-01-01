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
    if (body.phone !== undefined) updatePayload.phone = body.phone
    if (body.email !== undefined) updatePayload.email = body.email
    if (body.business_registration !== undefined) updatePayload.business_registration = body.business_registration
    if (body.tax_id !== undefined) updatePayload.tax_id = body.tax_id

    const { error } = await supabase.from("suppliers").update(updatePayload).eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}