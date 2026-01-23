"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      router.push("/search");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-[var(--parchment)]">
    <div className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-center text-[var(--charcoal)]">
        Sign In
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
        {loading ? "Signing in..." : "Sign In"}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      <p className="text-sm text-center text-[var(--charcoal)]">
        Don’t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-[var(--slateblue)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  </div>
);

}

export default SignIn;
