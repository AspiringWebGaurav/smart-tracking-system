import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID parameter is required" },
        { status: 400 }
      );
    }

    const visitorDoc = await db.collection("visitors").doc(uuid).get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found", status: "unknown" },
        { status: 404 }
      );
    }

    const visitorData = visitorDoc.data();
    const status = visitorData?.status || 'active';

    return NextResponse.json(
      { 
        status,
        uuid,
        banReason: visitorData?.banReason,
        banTimestamp: visitorData?.banTimestamp
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("🔥 Error checking visitor status:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to check visitor status",
        status: "unknown"
      },
      { status: 500 }
    );
  }
}

// Update visitor status (for admin use)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, status, banReason, adminId } = body;

    if (!uuid || !status) {
      return NextResponse.json(
        { error: "UUID and status are required" },
        { status: 400 }
      );
    }

    if (!['active', 'banned'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'active' or 'banned'" },
        { status: 400 }
      );
    }

    const visitorRef = db.collection("visitors").doc(uuid);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      adminId: adminId || 'system'
    };

    if (status === 'banned') {
      updateData.banTimestamp = new Date().toISOString();
      updateData.banReason = banReason || 'Violation of terms';
      updateData.unbanTimestamp = null;
    } else if (status === 'active') {
      updateData.unbanTimestamp = new Date().toISOString();
      updateData.banReason = null;
      updateData.banTimestamp = null;
    }

    await visitorRef.update(updateData);

    console.log(`✅ Visitor ${uuid} status updated to: ${status}`);

    return NextResponse.json(
      { 
        message: `Visitor status updated to ${status}`,
        uuid,
        status,
        timestamp: updateData.lastStatusChange
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("🔥 Error updating visitor status:", error);
    
    return NextResponse.json(
      { error: "Failed to update visitor status" },
      { status: 500 }
    );
  }
}