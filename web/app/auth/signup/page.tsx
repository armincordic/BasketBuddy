"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)]">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-center text-[var(--charcoal)]">
          Sign Up
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="px-4 py-2 rounded border border-[var(--dust)] bg-white
                     text-[var(--charcoal)] placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="px-4 py-2 rounded border border-[var(--dust)] bg-white
                     text-[var(--charcoal)] placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 px-4 py-2 rounded bg-[var(--slateblue)] text-white
                     hover:bg-[var(--teal)] transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <p className="text-sm text-center text-[var(--charcoal)]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--slateblue)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
