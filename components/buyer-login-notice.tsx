"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function BuyerLoginNotice() {
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: "Supplier Login Not Supported",
      description:
        "Suppliers cannot sign in on the buyer portal. Please use the supplier login page.",
      variant: "destructive",
    })
    // Intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Toaster />
}
