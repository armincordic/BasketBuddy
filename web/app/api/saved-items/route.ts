import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supabaseAdmin
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return new NextResponse(null, { status: 401 });

  const { externalID, source, name, image_url, price } = await req.json();

  const { data: existing } = await supabaseAdmin
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", externalID)
    .eq("source", source)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("saved_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("user_id", user.id)
      .eq("external_id", externalID)
      .eq("source", source);
  } else {
    await supabaseAdmin.from("saved_items").insert({
      user_id: user.id,
      external_id: externalID,
      source,
      name,
      image_url,
      price_snapshot: price,
      quantity: 1,
    });
  }

  return new NextResponse(null, { status: 200 });
}
