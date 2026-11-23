import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userRole = request.cookies.get("userRole")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;

  const isPatientRoute = pathname.startsWith("/patient");
  const isHospitalRoute = pathname.startsWith("/hospital");
  const isInsurerRoute = pathname.startsWith("/insurance") || pathname.startsWith("/insurer");

  if (isPatientRoute || isHospitalRoute || isInsurerRoute) {
    if (!accessToken && !userRole) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isPatientRoute && userRole && userRole !== "PATIENT" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (isHospitalRoute && userRole && userRole !== "HOSPITAL" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (isInsurerRoute && userRole && userRole !== "INSURER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/hospital/:path*", "/insurance/:path*", "/insurer/:path*"],
};
