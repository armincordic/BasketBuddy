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
    <div>
      <div
        onClick={() => router.push("/basket")}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          zIndex: 1000
        }}
      >
        <RiShoppingCart2Fill size={28} />
        <span
          style={{
            background: "red",
            color: "white",
            borderRadius: "50%",
            width: 20,
            height: 20,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {cartItemCount}
        </span>
      </div>

      <h1>Search</h1>

      <form onSubmit={handleSearch}>
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search products"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p>{error}</p>}

      <ul>
        {results.map(item => {
          const qty = quantities[item.externalID] ?? 0;

          return (
            <li key={item.externalID}>
              <img src={item.image_url} width={120} />
              <p>{item.name}</p>
              <p>${item.price}</p>

              {qty === 0 ? (
                <button onClick={() => handleAdd(item)}>+ Add</button>
              ) : (
                <div>
                  <button onClick={() => handleDecrement(item.externalID)}>
                    -
                  </button>
                  <span style={{ margin: "0 8px" }}>{qty}</span>
                  <button onClick={() => handleIncrement(item)}>+</button>
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
      >
        Sign Out
      </button>
    </div>
  );
}
