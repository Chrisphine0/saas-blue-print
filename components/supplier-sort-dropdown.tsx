"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function SupplierSortDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "default"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === "default") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }

    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <select
        className="rounded-md border border-input bg-background px-3 py-1 text-sm"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="default">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="newest">Newest First</option>
      </select>
    </div>
  )
}