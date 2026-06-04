import { NextResponse } from 'next/server';
import { Room, Booking, AuditLog, getInitialRooms, getInitialBookings, getInitialLogs } from '../../../utils/mockData';

// Shared global in-memory state on the active server container
let sharedState: {
  rooms: Room[];
  bookings: Booking[];
  logs: AuditLog[];
  lastUpdated: number;
} | null = null;

function getOrInitializeState() {
  if (!sharedState) {
    const initialRooms = getInitialRooms();
    const initialBookings = getInitialBookings(initialRooms);
    const initialLogs = getInitialLogs();
    sharedState = {
      rooms: initialRooms,
      bookings: initialBookings,
      logs: initialLogs,
      lastUpdated: Date.now()
    };
  }
  return sharedState;
}

export async function GET() {
  const state = getOrInitializeState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const state = getOrInitializeState();

    if (body.rooms) state.rooms = body.rooms;
    if (body.bookings) state.bookings = body.bookings;
    if (body.logs) state.logs = body.logs;
    
    state.lastUpdated = Date.now();

    return NextResponse.json({ success: true, state });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
