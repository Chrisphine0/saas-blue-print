import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { orderId, update } = body

    if (!orderId || !update) {
      return NextResponse.json({ error: "Missing orderId or update payload" }, { status: 400 })
    }

    const { error } = await supabase.from("orders").update(update).eq("id", orderId)
    if (error) {
      console.error("server update order error", error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("update-order route error", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
