"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function EmailConfirmed() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace("/auth/login")
        return
      }

      setReady(true)
    }

    check()
  }, [router])

  if (!ready) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--parchment)">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        
        <div className="w-20 h-20 rounded-full bg-(--teal)/20 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-(--teal) flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-(--charcoal)">
          Email verified successfully
        </h1>

        <p className="text-sm text-(--charcoal)/70">
          You’re all set. Your email has been confirmed and your account is ready to go.
        </p>

        <button
          onClick={() => router.push("/search")}
          className="w-full mt-4 px-4 py-3 rounded bg-(--slateblue) text-white
                     hover:bg-(--teal) transition"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
