import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check if the path starts with /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Check for "admin_logged_in" cookie 
        const isLoggedIn = request.cookies.get('admin_logged_in')

        if (!isLoggedIn) {
            // Redirect to login if not logged in
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/admin/:path*',
}
