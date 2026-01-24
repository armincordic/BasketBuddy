"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Session } from "@supabase/supabase-js"
import Cookies from "js-cookie"

import NavBar from "@/app/components/NavBar"

type Product = {
  name: string
  brand: string
  source: string
  externalID: string
  price: number
  image_url: string
}

type SavedItem = {
  external_id: string
  quantity: number
}

export default function Search() {
  const geoAttempted = useRef(false)
  const hasUserZip = useRef(false)
  const cartHydrated = useRef(false)

  const [zip, setZip] = useState<string | null>(null)
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [session, setSession] = useState<Session | null>(null)

  /* ---------- LOAD ZIP FROM COOKIE (AUTHORITATIVE) ---------- */
  useEffect(() => {
    const storedZip = Cookies.get("zip")
    if (storedZip) {
      setZip(storedZip)
      hasUserZip.current = true
    }
  }, [])

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  /* ---------- GEO ZIP (FALLBACK ONLY) ---------- */
  async function fetchZipFromLocation() {
    if (!navigator.geolocation || geoAttempted.current) return
    geoAttempted.current = true

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const res = await fetch(`/api/reverse-geocode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          })

          if (!res.ok) return

          const data = await res.json()
          if (/^\d{5}$/.test(data.zip)) {
            setZip(data.zip)
            Cookies.set("zip", data.zip, { expires: 30 })
          }
        } catch {}
      },
      () => {},
      { timeout: 8000 }
    )
  }

  /* ---------- DECIDE IF GEO SHOULD RUN ---------- */
  useEffect(() => {
    if (!hasUserZip.current && !zip) {
      fetchZipFromLocation()
    }
  }, [zip])

  /* ---------- CART HYDRATION ---------- */
  useEffect(() => {
    if (!session) {
      const saved = Cookies.get("cart")
      if (saved) setQuantities(JSON.parse(saved))
      cartHydrated.current = true
      return
    }

    fetch(`/api/saved-items`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
      .then(res => res.json())
      .then((items: SavedItem[]) => {
        const map: Record<string, number> = {}
        items.forEach(i => {
          map[i.external_id] = i.quantity
        })
        setQuantities(map)
      })
  }, [session])

  useEffect(() => {
    if (!cartHydrated.current || session) return
    Cookies.set("cart", JSON.stringify(quantities), { path: "/" })
  }, [quantities, session])

  /* ---------- SEARCH ---------- */
  async function handleSearch(e: React.FormEvent) {
  e.preventDefault()

  if (!zip) {
    setError("ZIP code is required")
    return
  }

  try {
    setLoading(true)
    setError(null)

    const res = await fetch(
      `/api/search?zip=${zip}&term=${encodeURIComponent(term)}`
    )

    if (!res.ok) throw new Error()

    const data = await res.json()
    setResults(data)
  } catch {
    setError("Search failed")
  } finally {
    setLoading(false)
  }
}


  /* ---------- CART HELPERS ---------- */
  function optimisticIncrement(id: string) {
    setQuantities(q => ({ ...q, [id]: (q[id] ?? 0) + 1 }))
  }

  function optimisticDecrement(id: string) {
    setQuantities(q => {
      const n = { ...q }
      n[id]--
      if (n[id] <= 0) delete n[id]
      return n
    })
  }

  function handleAdd(product: Product) {
    optimisticIncrement(product.externalID)
    if (!session) return

    fetch(`/api/saved-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        externalID: product.externalID,
        source: product.source,
        name: product.name,
        image_url: product.image_url,
        price: product.price
      })
    }).catch(() => optimisticDecrement(product.externalID))
  }

  function handleDecrement(id: string) {
    optimisticDecrement(id)
    if (!session) return

    fetch(`/api/saved-items/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
  }

  const cartItemCount = Object.keys(quantities).length

  return (
    <div className="min-h-screen bg-(--parchment)">
      <NavBar
        zip={zip}
        setZip={z => {
          setZip(z)
          Cookies.set("zip", z, { expires: 30 })
          hasUserZip.current = true
        }}
        cartItemCount={cartItemCount}
        session={session}
      />

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
        <form onSubmit={handleSearch} className="flex gap-3 justify-center">
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Search products"
            className="w-full max-w-md px-4 py-2 rounded border border-(--dust) bg-white
                       focus:outline-none focus:ring-2 focus:ring-(--teal)"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-(--slateblue) text-white"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="text-center text-red-600">{error}</p>}

        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {results.map(item => {
            const qty = quantities[item.externalID] ?? 0

            return (
              <li
                key={item.externalID}
                className="bg-white border border-(--dust) rounded p-4 flex flex-col gap-3"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-40 object-contain"
                />

                <p className="font-medium">{item.name}</p>
                <p className="text-sm">${item.price.toFixed(2)}</p>

                {qty === 0 ? (
                  <button
                    onClick={() => handleAdd(item)}
                    className="mt-auto px-3 py-2 rounded bg-(--slateblue) text-white"
                  >
                    + Add
                  </button>
                ) : (
                  <div className="mt-auto flex items-center justify-between">
                    <button onClick={() => handleDecrement(item.externalID)}>
                      −
                    </button>
                    <span>{qty}</span>
                    <button onClick={() => handleAdd(item)}>+</button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
