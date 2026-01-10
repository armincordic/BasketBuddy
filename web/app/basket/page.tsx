"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getSavedItems,
  addSavedItem,
  deleteSavedItem
} from "@/lib/api";

type Product = {
  externalID: string;
  name: string;
  price: number;
  image_url: string;
  source: string;
};

type SavedItem = {
  external_id: string;
  quantity: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/®|™/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function Basket() {
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);

  /* ---------- AUTH READY ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setIsReady(true);
    });
  }, []);

  /* ---------- LOAD BASKET ---------- */
  useEffect(() => {
    if (!isReady) return;

    getSavedItems().then((items: SavedItem[]) => {
      const map: Record<string, number> = {};
      items.forEach(i => {
        if (i.quantity > 0) {
          map[i.external_id] = i.quantity;
        }
      });
      setQuantities(map);
    });
  }, [isReady]);

  const ids = Object.keys(quantities);

  /* ---------- FETCH PRODUCTS ---------- */
  useEffect(() => {
    if (ids.length === 0) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?ids=${ids.join(",")}`
    )
      .then(res => res.json())
      .then(setProducts);
  }, [ids]);

  /* ---------- MUTATIONS ---------- */
  function inc(id: string) {
    setQuantities(q => ({
      ...q,
      [id]: (q[id] ?? 0) + 1
    }));
    addSavedItem(id, 1);
  }

  function dec(id: string) {
    setQuantities(q => {
      const current = q[id] ?? 0;
      if (current <= 1) {
        const n = { ...q };
        delete n[id];
        return n;
      }
      return { ...q, [id]: current - 1 };
    });
    deleteSavedItem(id);
  }

  const visibleProducts = products.filter(
    p => (quantities[p.externalID] ?? 0) > 0
  );

  const total = visibleProducts.reduce(
    (sum, p) => sum + p.price * quantities[p.externalID],
    0
  );

  /* ---------- UI ---------- */
  return (
    <div>
      <h1>Your Basket</h1>

      {visibleProducts.length === 0 ? (
        <p>Your basket is empty.</p>
      ) : (
        <ul>
          {visibleProducts.map(p => {
            const krogerUrl = `https://www.kroger.com/p/${slugify(
              p.name
            )}/${p.externalID}`;

            return (
              <li key={p.externalID}>
                <img src={p.image_url} width={120} />
                <p>{p.name}</p>
                <p>${p.price.toFixed(2)}</p>

                <button onClick={() => dec(p.externalID)}>-</button>
                <span style={{ margin: "0 8px" }}>
                  {quantities[p.externalID]}
                </span>
                <button onClick={() => inc(p.externalID)}>+</button>

                <div style={{ marginTop: 8 }}>
                  <a
                    href={krogerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button>View on Kroger</button>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2>Total: ${total.toFixed(2)}</h2>

      <button onClick={() => router.push("/search")}>
        Back to Search
      </button>
    </div>
  );
}
