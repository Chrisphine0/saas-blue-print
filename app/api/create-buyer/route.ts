import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/buyers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    })

    const data = await res.text()

    let parsed: any = data
    try {
      parsed = JSON.parse(data)
    } catch {
      // leave as text
    }

    if (!res.ok) {
      console.error("create-buyer fetch failed:", res.status, parsed)
      return NextResponse.json({ error: parsed }, { status: res.status })
    }

    // return parsed representation
    return NextResponse.json(parsed, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
