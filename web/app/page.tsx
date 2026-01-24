"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export default function Home() {
  const router = useRouter()

  const geoAttempted = useRef(false)
  const hasUserZip = useRef(false)

  const [zip, setZip] = useState("")
  const [loading, setLoading] = useState(false)

  const isValidZip = /^\d{5}$/.test(zip)

  /* ---------- LOAD ZIP FROM COOKIE (ONCE) ---------- */
  useEffect(() => {
    const savedZip = Cookies.get("zip")
    if (savedZip) {
      setZip(savedZip)
      hasUserZip.current = true
    }
  }, [])

  /* ---------- GEOLOCATION (ONLY IF USER NEVER TOUCHED INPUT) ---------- */
  async function fetchZipFromLocation() {
    if (!navigator.geolocation || geoAttempted.current) return
    geoAttempted.current = true

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          // ❗ Do NOT overwrite if user started typing
          if (hasUserZip.current) return

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
          }
        } catch {}
      },
      () => {},
      { timeout: 8000 }
    )
  }

  /* ---------- RUN GEO ONLY ON FIRST LOAD ---------- */
  useEffect(() => {
    if (!hasUserZip.current && !geoAttempted.current) {
      fetchZipFromLocation()
    }
  }, [])

  /* ---------- INPUT CHANGE (USER INTENT) ---------- */
  function handleZipChange(value: string) {
    hasUserZip.current = true
    setZip(value)
  }

  /* ---------- START ---------- */
  async function handleStart() {
    if (!isValidZip || loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/stores?zip=${zip}`)
      if (!res.ok) throw new Error()

      Cookies.set("zip", zip, { expires: 30 })
      router.push(`/search?zip=${zip}`)
    } catch {
      alert("Could not load stores for this ZIP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative bg-(--parchment)">
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/auth/login")}
          className="text-sm text-(--slateblue) hover:underline"
        >
          Sign In
        </button>
        <button
          onClick={() => router.push("/auth/signup")}
          className="px-4 py-2 text-sm rounded bg-(--slateblue) text-white hover:bg-(--teal) transition"
        >
          Register
        </button>
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold text-(--charcoal)">
            Build your basket and start saving
          </h1>

          <div className="flex items-center w-[360px] bg-white border border-(--dust) rounded-xl overflow-hidden shadow-sm">
            <input
              type="text"
              value={zip}
              onChange={e =>
                handleZipChange(e.target.value.replace(/\D/g, ""))
              }
              placeholder="ZIP code"
              maxLength={5}
              className="flex-1 px-4 py-3 text-(--charcoal) placeholder-gray-400 focus:outline-none"
            />

            <button
              onClick={handleStart}
              disabled={!isValidZip || loading}
              className={`px-5 py-3 font-medium transition
                ${
                  isValidZip && !loading
                    ? "bg-(--slateblue) text-white hover:bg-(--teal)"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              {loading ? "Loading…" : "Start Saving"}
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Compare nearby grocery stores in seconds
          </p>
        </div>
      </div>
    </main>
  )
}
