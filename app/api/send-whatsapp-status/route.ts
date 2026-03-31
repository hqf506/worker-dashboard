import { NextResponse } from 'next/server';

const RAILWAY_WEBHOOK_URL =
  'https://n8n-production-b163.up.railway.app/webhook/order-status';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(RAILWAY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Webhook failed',
          status: response.status,
          details: text,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      details: text,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}