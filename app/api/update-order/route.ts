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

    // If the order status changed to delivered or cancelled, adjust inventory
    if (update.status && (update.status === "delivered" || update.status === "cancelled")) {
      // Fetch order items for this order
      const { data: orderItems, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", orderId)
      if (itemsError) {
        console.error("server fetch order_items error", itemsError)
        return NextResponse.json({ error: itemsError }, { status: 500 })
      }

      // For each order item, update inventory counts
      for (const item of orderItems || []) {
        const productId = item.product_id
        const qty = Number(item.quantity) || 0

        // Fetch current inventory row
        const { data: inventory, error: invError } = await supabase.from("inventory").select("*").eq("product_id", productId).single()
        if (invError || !inventory) {
          // If there's no inventory row, skip silently
          continue
        }

        const currentAvailable = Number(inventory.quantity_available) || 0
        const currentReserved = Number(inventory.quantity_reserved) || 0

        let newAvailable = currentAvailable
        let newReserved = Math.max(0, currentReserved - qty)

        if (update.status === "cancelled") {
          // Return reserved quantity back to available on cancellation
          newAvailable = currentAvailable + qty
        }

        const { error: updateInvError } = await supabase
          .from("inventory")
          .update({ quantity_available: newAvailable, quantity_reserved: newReserved })
          .eq("id", inventory.id)

        if (updateInvError) {
          console.error("server inventory adjust error", updateInvError)
          return NextResponse.json({ error: updateInvError }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("update-order route error", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
