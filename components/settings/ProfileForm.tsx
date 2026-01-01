"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ProfileForm({ initialData }: any) {
  const router = useRouter()
  const [phone, setPhone] = useState(initialData.phone || "")
  const [email, setEmail] = useState(initialData.email || "")
  const [business_registration, setBusinessRegistration] = useState(initialData.business_registration || "")
  const [tax_id, setTaxId] = useState(initialData.tax_id || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, email, business_registration, tax_id }),
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
        <label className="block text-sm font-medium">Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Business Registration</label>
        <input value={business_registration} onChange={(e) => setBusinessRegistration(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Tax ID</label>
        <input value={tax_id} onChange={(e) => setTaxId(e.target.value)} className="mt-1 block w-full rounded-md border px-3 py-2" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <button type="submit" disabled={loading} className="rounded bg-slate-800 px-4 py-2 text-white">
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  )
}