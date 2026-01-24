import { NextRequest, NextResponse } from "next/server";
import { getNearbySupermarkets } from "@/lib/storeLocator";

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip");
  if (!zip) {
    return NextResponse.json({ error: "zip is required" }, { status: 400 });
  }

  try {
    const stores = await getNearbySupermarkets(zip);
    return NextResponse.json(stores);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "failed to fetch stores" },
      { status: 500 }
    );
  }
}
