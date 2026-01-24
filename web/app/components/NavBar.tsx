"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { RiShoppingCart2Fill, RiMapPin2Fill } from "react-icons/ri"
import type { Session } from "@supabase/supabase-js"
import Cookies from "js-cookie"

type Props = {
  zip: string | null
  setZip: (z: string) => void
  cartItemCount: number
  session: Session | null
}

export default function NavBar({
  zip,
  setZip,
  cartItemCount,
  session
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [zipInput, setZipInput] = useState(zip ?? "")

  const zipValid = /^\d{5}$/.test(zipInput)

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-(--dust)">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* ZIP */}
        <div className="relative">
          {zip && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-sm text-(--slateblue)"
            >
              <RiMapPin2Fill className="text-(--teal)" />
              {zip}
            </button>
          )}

          {open && (
            <div className="absolute mt-2 w-56 bg-white border border-(--dust) rounded shadow-lg p-3">
              <input
                value={zipInput}
                onChange={e =>
                  setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                placeholder="Enter ZIP"
                className="w-full px-3 py-2 border border-(--dust) rounded mb-2 bg-white"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOpen(false)
                    setZipInput(zip ?? "")
                  }}
                  className="text-sm text-gray-500"
                >
                  Cancel
                </button>

                <button
                  disabled={!zipValid}
                  onClick={() => {
                    setZip(zipInput)
                    Cookies.set("zip", zipInput, { expires: 30 })
                    setOpen(false)
                    router.replace(`/search?zip=${zipInput}`)
                  }}
                  className={`text-sm ${
                    zipValid
                      ? "text-(--slateblue)"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-6">
          {!session && (
            <button
              onClick={() => router.push("/auth/login")}
              className="text-sm text-(--slateblue)"
            >
              Log In
            </button>
          )}

          {session && (
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push("/auth/login")
              }}
              className="text-sm text-(--slateblue)"
            >
              Sign Out
            </button>
          )}

          <button onClick={() => router.push("/basket")} className="relative">
            <RiShoppingCart2Fill size={26} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-(--teal) text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
