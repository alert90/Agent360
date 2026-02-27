import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Increase body size limit for file upload APIs
  if (request.nextUrl.pathname.startsWith('/api/files/upload-chunk')) {
    // Allow larger body size for file uploads
    const response = NextResponse.next()

    // Set custom headers to indicate larger body size support
    response.headers.set('x-body-size-limit', '10mb')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/files/upload-chunk/:path*']
}
