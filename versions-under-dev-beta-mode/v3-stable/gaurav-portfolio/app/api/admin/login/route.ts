import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

// Hardcoded admin credentials as per requirements
const ADMIN_CREDENTIALS = {
  id: "gaurav",
  password: "1234"
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, password } = body;

    // Validate input
    if (!id || !password) {
      return NextResponse.json(
        { error: "ID and password are required" },
        { status: 400 }
      );
    }

    // Check credentials
    if (id !== ADMIN_CREDENTIALS.id || password !== ADMIN_CREDENTIALS.password) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      id: ADMIN_CREDENTIALS.id,
      role: "admin",
      loginTime: new Date().toISOString()
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // Token expires in 24 hours
      .sign(JWT_SECRET);

    console.log("✅ Admin login successful:", id);

    // Set HTTP-only cookie for security
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: ADMIN_CREDENTIALS.id,
          role: "admin"
        }
      },
      { status: 200 }
    );

    // Set secure cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/"
    });

    return response;

  } catch (error) {
    console.error("❌ Admin login error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    // Clear the admin token cookie
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/"
    });

    console.log("✅ Admin logout successful");

    return response;

  } catch (error) {
    console.error("❌ Admin logout error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}