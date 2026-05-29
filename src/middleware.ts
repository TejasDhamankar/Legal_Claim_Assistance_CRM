import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, getAuthTokenEdge } from '@/lib/edge-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect API routes (allow only auth endpoints without token)
  if (pathname.startsWith('/api/')) {
    const publicApiRoutes = ['/api/auth/login', '/api/auth/register'];
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
    if (isPublicApiRoute) {
      return NextResponse.next();
    }

    const token = getAuthTokenEdge(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = await verifyTokenEdge(token);
      if (!decoded) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const protectedRoutes = ['/dashboard', '/admin', '/leads'];
  const adminOnlyRoutes = ['/admin'];
  const superAdminOnlyRoutes = ['/admin/sessions'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
  const isSuperAdminRoute = superAdminOnlyRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  const token = getAuthTokenEdge(request);

  if (isAuthRoute && token) {
    try {
      const decoded = await verifyTokenEdge(token);
      if (decoded) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  if (isProtectedRoute) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const decoded = await verifyTokenEdge(token);
      if (!decoded) {
        const url = new URL('/login', request.url);
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
      }

      if (isAdminRoute && !['admin', 'super_admin'].includes(decoded.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (isSuperAdminRoute && decoded.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return NextResponse.next();
    } catch {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
