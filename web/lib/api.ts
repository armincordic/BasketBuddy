import { supabase } from "./supabaseClient";
import { SavedItem } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User is not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function getSavedItems(): Promise<SavedItem[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/api/saved-items`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch saved items");
  }

  return res.json();
}

export async function addSavedItem(
  external_id: string,
  quantity: number = 1
) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_BASE}/api/saved-items`, {
    method: "POST",
    headers,
    body: JSON.stringify({ external_id, quantity }),
  });

  if (!res.ok) {
    throw new Error("Failed to add saved item");
  }
}

export async function deleteSavedItem(external_id: string) {
  const headers = await getAuthHeaders();

  const res = await fetch(
    `${API_BASE}/api/saved-items/${external_id}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete saved item");
  }
}
