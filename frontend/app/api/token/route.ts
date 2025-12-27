import { auth } from "@/lib/auth";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a JWT token that the backend can verify
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({ token });
}
