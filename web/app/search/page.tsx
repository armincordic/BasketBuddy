"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { RiShoppingCart2Fill } from "react-icons/ri";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL!;

type Product = {
  name: string;
  brand: string;
  source: string;
  externalID: string;
  price: number;
  image_url: string;
};

type SavedItem = {
  external_id: string;
  quantity: number;
};

export default function Search() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [session, setSession] = useState<Session | null>(null);

  const router = useRouter();

  /* ---------- AUTH ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---------- CART HYDRATION ---------- */
  useEffect(() => {
    if (!session) {
      const saved = Cookies.get("cart");
      if (saved) setQuantities(JSON.parse(saved));
      return;
    }

    fetch(`${API}/api/saved-items`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
      .then(res => res.json())
      .then((items: SavedItem[]) => {
        const map: Record<string, number> = {};
        items.forEach(i => {
          map[i.external_id] = i.quantity;
        });
        setQuantities(map);
      });
  }, [session]);

  /* ---------- COOKIE PERSISTENCE (LOGGED OUT ONLY) ---------- */
  useEffect(() => {
    if (session) return;
    Cookies.set("cart", JSON.stringify(quantities), { path: "/" });
  }, [quantities, session]);

  /* ---------- SEARCH ---------- */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API}/api/search?term=${encodeURIComponent(term)}`
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResults(data);
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- OPTIMISTIC UI HELPERS ---------- */
  function optimisticIncrement(id: string) {
    setQuantities(q => ({
      ...q,
      [id]: (q[id] ?? 0) + 1
    }));
  }

  function optimisticDecrement(id: string) {
    setQuantities(q => {
      const n = { ...q };
      n[id]--;
      if (n[id] <= 0) delete n[id];
      return n;
    });
  }

  /* ---------- CART ACTIONS ---------- */
  function handleAdd(product: Product) {
    optimisticIncrement(product.externalID);

    if (!session) return;

    fetch(`${API}/api/saved-items`, {
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
    }).catch(() => {
      optimisticDecrement(product.externalID);
    });
  }

  function handleIncrement(product: Product) {
    handleAdd(product);
  }

  function handleDecrement(id: string) {
    optimisticDecrement(id);

    if (!session) return;

    fetch(`${API}/api/saved-items/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
  }

  /* ---------- CART COUNT (UNIQUE ITEMS) ---------- */
  const cartItemCount = Object.keys(quantities).length;

  /* ---------- UI ---------- */
  return (
  <div className="min-h-screen bg-[var(--parchment)] px-6 py-8">
    {/* Cart button */}
    <div
      onClick={() => router.push("/basket")}
      className="fixed top-6 right-6 flex items-center gap-2 cursor-pointer z-50"
    >
      <RiShoppingCart2Fill
        size={28}
        className="text-[var(--charcoal)]"
      />
      <span className="bg-[var(--teal)] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
        {cartItemCount}
      </span>
    </div>

    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-center text-[var(--charcoal)]">
        Search
      </h1>

      <form
        onSubmit={handleSearch}
        className="flex gap-3 justify-center"
      >
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search products"
          className="w-full max-w-md px-4 py-2 rounded border border-[var(--dust)] bg-white
                     text-[var(--charcoal)] placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-[var(--slateblue)] text-white
                     hover:bg-[var(--teal)] transition disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="text-center text-red-600">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {results.map(item => {
          const qty = quantities[item.externalID] ?? 0;

          return (
            <li
              key={item.externalID}
              className="bg-white border border-[var(--dust)] rounded p-4 flex flex-col gap-3"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-40 object-contain"
              />

              <p className="font-medium text-[var(--charcoal)]">
                {item.name}
              </p>

              <p className="text-sm text-[var(--slateblue)]">
                ${item.price.toFixed(2)}
              </p>

              {qty === 0 ? (
                <button
                  onClick={() => handleAdd(item)}
                  className="mt-auto px-3 py-2 rounded bg-[var(--slateblue)] text-white
                             hover:bg-[var(--teal)] transition"
                >
                  + Add
                </button>
              ) : (
                <div className="mt-auto flex items-center justify-between">
                  <button
                    onClick={() => handleDecrement(item.externalID)}
                    className="px-3 py-1 rounded border border-[var(--dust)] text-[var(--charcoal)]"
                  >
                    −
                  </button>

                  <span className="text-[var(--charcoal)]">
                    {qty}
                  </span>

                  <button
                    onClick={() => handleIncrement(item)}
                    className="px-3 py-1 rounded border border-[var(--dust)] text-[var(--charcoal)]"
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/auth/login");
        }}
        className="self-center mt-6 text-sm text-[var(--slateblue)] hover:underline"
      >
        Sign Out
      </button>
    </div>
  </div>
);

}
