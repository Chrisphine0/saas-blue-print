import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // support both form submit and JSON
    const contentType = req.headers.get("content-type") || ""
    let body: any = {}
    if (contentType.includes("application/json")) {
      body = await req.json()
    } else {
      const form = await req.formData()
      body.id = form.get("id")
    }

    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", body.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.redirect(new URL("/notifications", req.url))
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 })
  }
}