"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [zip, setZip] = useState("");
  const router = useRouter();

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

          <input
            type="text"
            value={zip}
            onChange={e => setZip(e.target.value)}
            placeholder="Enter ZIP code"
            className="w-64 px-4 py-2 rounded border border-(--dust) bg-white
                       text-(--charcoal) placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-(--teal)"
          />
        </div>
      </div>
    </main>
  );
}
