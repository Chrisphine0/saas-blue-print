"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function BusinessForm({ initialData }: any) {
  const router = useRouter()
  const [business_name, setBusinessName] = useState(initialData.business_name || "")
  const [address, setAddress] = useState(initialData.address || "")
  const [city, setCity] = useState(initialData.city || "")
  const [country, setCountry] = useState(initialData.country || "")
  const [logo_url, setLogoUrl] = useState(initialData.logo_url || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/settings/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_name, address, city, country, logo_url }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body?.error || "Failed to save")
      return
    }
    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Business Name</label>
        <input value={business_name} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">City</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Country</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Logo URL</label>
        <input value={logo_url} onChange={(e) => setLogoUrl(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <button type="submit" disabled={loading} className="rounded bg-slate-800 px-4 py-2 text-white">
          {loading ? "Saving..." : "Save Business"}
        </button>
      </div>
    </form>
  )
}