import { NextResponse } from 'next/server';

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
