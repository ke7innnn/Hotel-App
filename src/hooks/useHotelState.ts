'use client';

import { useState, useEffect } from 'react';
import { Room, Booking, AuditLog, getInitialRooms, getInitialBookings, getInitialLogs, generateLogHash } from '../utils/mockData';

const ROOMS_KEY = 'hotel_pms_rooms';
const BOOKINGS_KEY = 'hotel_pms_bookings';
const LOGS_KEY = 'hotel_pms_logs';

export function useHotelState() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedRooms = localStorage.getItem(ROOMS_KEY);
    const storedBookings = localStorage.getItem(BOOKINGS_KEY);
    const storedLogs = localStorage.getItem(LOGS_KEY);

    let initialRoomsList = getInitialRooms();
    let initialBookingsList = getInitialBookings(initialRoomsList);
    let initialLogsList = getInitialLogs();

    if (storedRooms) {
      initialRoomsList = JSON.parse(storedRooms);
    } else {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(initialRoomsList));
    }

    if (storedBookings) {
      initialBookingsList = JSON.parse(storedBookings);
    } else {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(initialBookingsList));
    }

    if (storedLogs) {
      initialLogsList = JSON.parse(storedLogs);
    } else {
      localStorage.setItem(LOGS_KEY, JSON.stringify(initialLogsList));
    }

    setRooms(initialRoomsList);
    setBookings(initialBookingsList);
    setLogs(initialLogsList);
  }, []);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ROOMS_KEY && e.newValue) {
        setRooms(JSON.parse(e.newValue));
      }
      if (e.key === BOOKINGS_KEY && e.newValue) {
        setBookings(JSON.parse(e.newValue));
      }
      if (e.key === LOGS_KEY && e.newValue) {
        setLogs(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save utility functions
  const saveState = (updatedRooms: Room[], updatedBookings: Booking[], updatedLogs: AuditLog[]) => {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(updatedRooms));
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updatedBookings));
    localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    setRooms(updatedRooms);
    setBookings(updatedBookings);
    setLogs(updatedLogs);
  };

  // Helper to add audit log
  const addLog = (
    currentLogs: AuditLog[],
    action: AuditLog['action'],
    operator: AuditLog['operator'],
    details: string,
    amount: number | null = null
  ): AuditLog[] => {
    const lastLog = currentLogs[currentLogs.length - 1];
    const prevHash = lastLog ? lastLog.hash : 'ROOT_HASH_000000';
    const timestamp = new Date().toISOString();
    const hash = generateLogHash(prevHash, action, timestamp, amount);

    const newLog: AuditLog = {
      id: `L-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      action,
      operator,
      details,
      amount,
      hash,
    };

    return [...currentLogs, newLog];
  };

  // 1. Guest Books & Pays
  const bookAndPayRoom = (
    roomId: string,
    guestName: string,
    guestPhone: string,
    durationHours: number
  ): Booking => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.status !== 'vacant') {
      throw new Error('Room is not available for booking.');
    }

    const bookingId = `B-${roomId}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const now = new Date();
    
    // Scheduled check-out is calculated from when they check-in, but we save duration logic or preset checkout from booking time
    const scheduledCheckOut = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();

    const newBooking: Booking = {
      id: bookingId,
      roomId,
      guestName,
      guestPhone,
      pricePaid: room.price,
      status: 'paid',
      bookedAt: now.toISOString(),
      checkInTime: null,
      checkOutTime: null,
      scheduledCheckOut,
    };

    const updatedRooms = rooms.map((r) =>
      r.id === roomId
        ? {
            ...r,
            status: 'reserved' as const,
            guestName,
            guestPhone,
            bookingId,
            scheduledCheckOut,
          }
        : r
    );

    const updatedBookings = [...bookings, newBooking];
    
    // 2 logs: Payment and Booking
    let updatedLogs = addLog(
      logs,
      'PAYMENT',
      'GUEST',
      `Guest ${guestName} paid ₹${room.price.toLocaleString('en-IN')} for Room ${roomId}.`,
      room.price
    );
    updatedLogs = addLog(
      updatedLogs,
      'BOOKING',
      'GUEST',
      `Room ${roomId} reserved. Booking ID: ${bookingId} created. Duration: ${durationHours}h.`,
      null
    );

    saveState(updatedRooms, updatedBookings, updatedLogs);
    return newBooking;
  };

  // 2. Receptionist Checks In Guest
  const checkInGuest = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error('Invalid QR code: Booking not found.');
    }
    if (booking.status !== 'paid') {
      throw new Error(`Invalid status: Booking status is ${booking.status}.`);
    }

    const now = new Date().toISOString();
    
    // Update booking
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'checked_in' as const, checkInTime: now } : b
    );

    // Update room status
    const updatedRooms = rooms.map((r) =>
      r.id === booking.roomId
        ? {
            ...r,
            status: 'occupied' as const,
            checkInTime: now,
          }
        : r
    );

    const updatedLogs = addLog(
      logs,
      'CHECK_IN',
      'RECEPTIONIST',
      `Checked in ${booking.guestName} to Room ${booking.roomId} via QR Scan.`,
      null
    );

    saveState(updatedRooms, updatedBookings, updatedLogs);
  };

  // 3. Receptionist Checks Out Guest
  const checkOutGuest = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      throw new Error('Invalid QR code: Booking not found.');
    }
    if (booking.status !== 'checked_in') {
      throw new Error('Invalid status: Guest is not checked in.');
    }

    const now = new Date().toISOString();

    // Update booking
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'checked_out' as const, checkOutTime: now } : b
    );

    // Reset room
    const updatedRooms = rooms.map((r) =>
      r.id === booking.roomId
        ? {
            ...r,
            status: 'vacant' as const,
            guestName: null,
            guestPhone: null,
            checkInTime: null,
            checkOutTime: null,
            scheduledCheckOut: null,
            bookingId: null,
          }
        : r
    );

    const updatedLogs = addLog(
      logs,
      'CHECK_OUT',
      'RECEPTIONIST',
      `Checked out ${booking.guestName} from Room ${booking.roomId} via QR Scan.`,
      null
    );

    saveState(updatedRooms, updatedBookings, updatedLogs);
  };

  // 4. Overdue Scanner (Check dates and flag rooms)
  useEffect(() => {
    if (rooms.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      let hasChanges = false;
      const updatedRooms = rooms.map((room) => {
        if (room.status === 'occupied' && room.scheduledCheckOut) {
          const checkoutTime = new Date(room.scheduledCheckOut);
          if (now > checkoutTime) {
            hasChanges = true;
            return {
              ...room,
              status: 'overdue' as const,
            };
          }
        }
        return room;
      });

      if (hasChanges) {
        // Find newly overdue rooms to create audit logs
        let newLogs = [...logs];
        updatedRooms.forEach((r) => {
          const oldRoom = rooms.find((old) => old.id === r.id);
          if (oldRoom && oldRoom.status === 'occupied' && r.status === 'overdue') {
            newLogs = addLog(
              newLogs,
              'OVERDUE_FLAGGED',
              'SYSTEM',
              `WARNING: Room ${r.id} stay exceeded scheduled checkout (${new Date(r.scheduledCheckOut!).toLocaleTimeString()}). No checkout QR scan received.`,
              null
            );
          }
        });

        saveState(updatedRooms, bookings, newLogs);
      }
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, [rooms, bookings, logs]);

  // Reset entire simulation to initial mock state (convenience feature)
  const resetSimulation = () => {
    const initialRoomsList = getInitialRooms();
    const initialBookingsList = getInitialBookings(initialRoomsList);
    const initialLogsList = getInitialLogs();

    saveState(initialRoomsList, initialBookingsList, initialLogsList);
  };

  return {
    rooms,
    bookings,
    logs,
    bookAndPayRoom,
    checkInGuest,
    checkOutGuest,
    resetSimulation,
  };
}
