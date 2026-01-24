import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { lat, lng } = await req.json();

  if (lat == null || lng == null) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "BasketBuddy/0.1 (contact: armincordic@outlook.com)",
        Accept: "application/json",
      },
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: "reverse lookup failed" },
        { status: 500 }
      );
    }

    const data = await r.json();
    const zip = data?.address?.postcode;

    if (!zip) {
      return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
    }

    return NextResponse.json({ zip });
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return NextResponse.json(
      { error: "Reverse geocode failed" },
      { status: 500 }
    );
  }
}
