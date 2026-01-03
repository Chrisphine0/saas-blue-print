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
    if (update.status === "shipped" || update.status === "processing") {
      const trackingNumber = `TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${orderId.slice(0, 4)}`.toUpperCase()
      
      const { error: deliveryError } = await supabase
        .from("deliveries")
        .upsert(
          { 
            order_id: orderId, 
            status: update.status === "shipped" ? "in_transit" : "preparing",
            tracking_number: trackingNumber,
            updated_at: new Date().toISOString()
          }, 
          { onConflict: 'order_id' } // This prevents the 23505 error
        )

      if (deliveryError) {
        console.error("Delivery upsert error:", deliveryError)
        // We don't necessarily want to fail the whole request if delivery log fails, 
        // but it helps to know if it's still crashing
      }
    }

    // 3. Inventory Adjustment Logic (Delivered / Cancelled)
    if (update.status && (update.status === "delivered" || update.status === "cancelled")) {
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)

      if (itemsError) return NextResponse.json({ error: itemsError }, { status: 500 })

      for (const item of orderItems || []) {
        const productId = item.product_id
        const qty = Number(item.quantity) || 0

        const { data: inventory, error: invError } = await supabase
          .from("inventory")
          .select("*")
          .eq("product_id", productId)
          .single()

        if (invError || !inventory) continue

        const currentAvailable = Number(inventory.quantity_available) || 0
        const currentReserved = Number(inventory.quantity_reserved) || 0

        let newAvailable = currentAvailable
        let newReserved = Math.max(0, currentReserved - qty)

        if (update.status === "cancelled") {
          newAvailable = currentAvailable + qty
        }

        await supabase
          .from("inventory")
          .update({ quantity_available: newAvailable, quantity_reserved: newReserved })
          .eq("id", inventory.id)
      }
    }

    if (update.status === "confirmed" || update.status === "shipped" || update.status === "processing") {
  // Generate a tracking number, but append a timestamp or use a unique ID to avoid clashes
  const trackingNumber = `TRK-${new Date().getTime()}-${orderId.slice(0, 4)}`.toUpperCase();
  
  const { error: deliveryError } = await supabase
    .from("deliveries")
    .upsert(
      { 
        order_id: orderId, 
        // Only set status if it's a new record, otherwise keep existing
        status: update.status === "shipped" ? "in_transit" : "preparing",
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString()
      }, 
      { 
        onConflict: 'order_id',
        ignoreDuplicates: false // This ensures it updates instead of failing
      }
    );

  if (deliveryError) {
    console.error("Delivery upsert error:", deliveryError);
    // DO NOT return an error here. Let the order update finish 
    // even if the delivery log has a minor conflict.
  }
}

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("update-order route error", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}