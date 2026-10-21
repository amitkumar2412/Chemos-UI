import { NextResponse } from 'next/server';

const SHIPPING_API_URL = process.env.SHIPPING_API_URL ?? 'http://localhost:8000';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const target = `${SHIPPING_API_URL}/ship-inventory${search}`;

  try {
    const res = await fetch(target, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to reach shipping API at ${target}: ${message}` },
      { status: 502 }
    );
  }
}
