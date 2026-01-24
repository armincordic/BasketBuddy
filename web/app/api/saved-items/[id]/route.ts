import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return new NextResponse(null, { status: 401 });

  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("saved_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("external_id", id)
    .single();

  if (!row) return new NextResponse(null, { status: 200 });

  if (row.quantity > 1) {
    await supabaseAdmin
      .from("saved_items")
      .update({ quantity: row.quantity - 1 })
      .eq("user_id", user.id)
      .eq("external_id", id);
  } else {
    await supabaseAdmin
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("external_id", id);
  }

  return new NextResponse(null, { status: 200 });
}
