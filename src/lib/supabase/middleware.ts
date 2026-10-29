import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware: All routes are completely open to all visitors without any login requirement.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({
    request,
  });
}
