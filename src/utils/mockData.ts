export interface Room {
  id: string;
  status: 'vacant' | 'occupied' | 'overdue' | 'reserved';
  price: number;
  image: string;
  guestName: string | null;
  guestPhone: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  scheduledCheckOut: string | null;
  bookingId: string | null;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestPhone: string;
  pricePaid: number;
  status: 'paid' | 'checked_in' | 'checked_out';
  bookedAt: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  scheduledCheckOut: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'BOOKING' | 'PAYMENT' | 'CHECK_IN' | 'CHECK_OUT' | 'OVERDUE_FLAGGED';
  operator: 'GUEST' | 'RECEPTIONIST' | 'SYSTEM';
  details: string;
  amount: number | null;
  hash: string;
}

// Generate simple cryptographic-style verification hash for tamper-proof logging
export function generateLogHash(prevHash: string, action: string, timestamp: string, amount: number | null): string {
  const content = `${prevHash}-${action}-${timestamp}-${amount || 0}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'SHIELD-' + Math.abs(hash).toString(16).toUpperCase();
}

export const getInitialRooms = (): Room[] => {
  const now = new Date();
  
  // 1. Occupied (John, check-out at 3pm today)
  const checkout102 = new Date(now);
  checkout102.setHours(15, 0, 0, 0); // 3 PM today
  const checkin102 = new Date(now);
  checkin102.setHours(now.getHours() - 4); // Checked in 4 hours ago

  // 2. Overdue (Rahul, checkout was 11:30 AM today - it's past that)
  const checkout103 = new Date(now);
  checkout103.setHours(11, 30, 0, 0); // 11:30 AM today
  const checkin103 = new Date(now);
  checkin103.setHours(now.getHours() - 6);

  // 3. Reserved (Rohan, paid but not check-in yet)
  const checkout105 = new Date(now);
  checkout105.setDate(now.getDate() + 1); // tomorrow

  return [
    {
      id: '101',
      status: 'vacant',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
      guestName: null,
      guestPhone: null,
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: null,
      bookingId: null,
    },
    {
      id: '102',
      status: 'occupied',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
      guestName: 'John Doe',
      guestPhone: '+91 98765 43210',
      checkInTime: checkin102.toISOString(),
      checkOutTime: null,
      scheduledCheckOut: checkout102.toISOString(),
      bookingId: 'B-102-X8A2',
    },
    {
      id: '103',
      status: 'overdue',
      price: 4000,
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
      guestName: 'Rahul Sharma',
      guestPhone: '+91 87654 32109',
      checkInTime: checkin103.toISOString(),
      checkOutTime: null,
      scheduledCheckOut: checkout103.toISOString(),
      bookingId: 'B-103-J9P1',
    },
    {
      id: '104',
      status: 'vacant',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=600&q=80',
      guestName: null,
      guestPhone: null,
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: null,
      bookingId: null,
    },
    {
      id: '105',
      status: 'reserved',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      guestName: 'Rohan Mehta',
      guestPhone: '+91 76543 21098',
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: checkout105.toISOString(),
      bookingId: 'B-105-K3W7',
    },
    {
      id: '201',
      status: 'vacant',
      price: 5000,
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
      guestName: null,
      guestPhone: null,
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: null,
      bookingId: null,
    },
    {
      id: '202',
      status: 'vacant',
      price: 5500,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
      guestName: null,
      guestPhone: null,
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: null,
      bookingId: null,
    },
    {
      id: '203',
      status: 'vacant',
      price: 6000,
      image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80',
      guestName: null,
      guestPhone: null,
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut: null,
      bookingId: null,
    },
  ];
};

export const getInitialBookings = (rooms: Room[]): Booking[] => {
  const now = new Date();
  const bookings: Booking[] = [];

  rooms.forEach((room) => {
    if (room.status !== 'vacant' && room.guestName && room.bookingId && room.scheduledCheckOut) {
      bookings.push({
        id: room.bookingId,
        roomId: room.id,
        guestName: room.guestName,
        guestPhone: room.guestPhone || '',
        pricePaid: room.price,
        status: room.status === 'reserved' ? 'paid' : 'checked_in',
        bookedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // booked 1 day ago
        checkInTime: room.checkInTime,
        checkOutTime: null,
        scheduledCheckOut: room.scheduledCheckOut,
      });
    }
  });

  return bookings;
};

export const getInitialLogs = (): AuditLog[] => {
  const now = new Date();
  const timeOffset = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  const logs: Omit<AuditLog, 'hash'>[] = [
    {
      id: 'L1',
      timestamp: timeOffset(24),
      action: 'PAYMENT',
      operator: 'GUEST',
      details: '🔒 ANTI-FRAUD: Verified upfront booking payment of ₹3,500 for Room 102 received from Guest John Doe.',
      amount: 3500,
    },
    {
      id: 'L2',
      timestamp: timeOffset(24),
      action: 'BOOKING',
      operator: 'GUEST',
      details: 'Room 102 reserved. Sealed Booking ID B-102-X8A2 registered.',
      amount: null,
    },
    {
      id: 'L3',
      timestamp: timeOffset(20),
      action: 'CHECK_IN',
      operator: 'RECEPTIONIST',
      details: 'Checked in John Doe to Room 102 via secure QR verification. Receptionist check-in matched paid tokens.',
      amount: null,
    },
    {
      id: 'L4',
      timestamp: timeOffset(18),
      action: 'PAYMENT',
      operator: 'GUEST',
      details: '🔒 ANTI-FRAUD: Verified upfront booking payment of ₹4,000 for Room 103 received from Guest Rahul Sharma.',
      amount: 4000,
    },
    {
      id: 'L5',
      timestamp: timeOffset(18),
      action: 'BOOKING',
      operator: 'GUEST',
      details: 'Room 103 reserved. Sealed Booking ID B-103-J9P1 registered.',
      amount: null,
    },
    {
      id: 'L6',
      timestamp: timeOffset(17),
      action: 'CHECK_IN',
      operator: 'RECEPTIONIST',
      details: 'Checked in Rahul Sharma to Room 103 via secure QR verification. Receptionist check-in matched paid tokens.',
      amount: null,
    },
    {
      id: 'L7',
      timestamp: timeOffset(6),
      action: 'PAYMENT',
      operator: 'GUEST',
      details: '🔒 ANTI-FRAUD: Verified upfront booking payment of ₹4,500 for Room 105 received from Guest Rohan Mehta.',
      amount: 4500,
    },
    {
      id: 'L8',
      timestamp: timeOffset(6),
      action: 'BOOKING',
      operator: 'GUEST',
      details: 'Room 105 reserved. Sealed Booking ID B-105-K3W7 registered.',
      amount: null,
    },
    {
      id: 'L9',
      timestamp: timeOffset(1.08),
      action: 'OVERDUE_FLAGGED',
      operator: 'SYSTEM',
      details: '🚨 ANTI-FRAUD AUDIT: Room 103 guest stay exceeded scheduled checkout (11:30 AM). No checkout QR scanned. Automatic alert triggered for verification.',
      amount: null,
    },
  ];

  let currentHash = 'ROOT_HASH_000000';
  return logs.map((log) => {
    currentHash = generateLogHash(currentHash, log.action, log.timestamp, log.amount);
    return {
      ...log,
      hash: currentHash,
    };
  });
};
