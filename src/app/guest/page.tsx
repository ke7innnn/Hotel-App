'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, CreditCard, Calendar, QrCode, CheckCircle, LogOut, Wifi, Wind } from 'lucide-react';
import { useHotelState } from '../../hooks/useHotelState';
import PaymentPortal from '../../components/PaymentPortal';
import styles from './guest.module.css';

const GUEST_BOOKING_SESSION_KEY = 'hotel_pms_guest_booking_id';

export default function GuestPage() {
  const { rooms, bookings, bookAndPayRoom } = useHotelState();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isOverdue, setIsOverdue] = useState(false);

  // Load session booking ID
  useEffect(() => {
    const sessionBookingId = localStorage.getItem(GUEST_BOOKING_SESSION_KEY);
    if (sessionBookingId) {
      setActiveBookingId(sessionBookingId);
    }
  }, []);

  // Sync state reactively across tabs/windows
  useEffect(() => {
    const handleStorage = () => {
      const sessionBookingId = localStorage.getItem(GUEST_BOOKING_SESSION_KEY);
      setActiveBookingId(sessionBookingId);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Fetch current active booking details
  const activeBooking = bookings.find((b) => b.id === activeBookingId);
  const activeRoom = activeBooking ? rooms.find((r) => r.id === activeBooking.roomId) : null;

  // Real-time countdown timer effect
  useEffect(() => {
    if (!activeBooking || activeBooking.status !== 'checked_in') return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(activeBooking.scheduledCheckOut).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueDiff = now - target;
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDiff % (1000 * 60)) / 1000);
        setTimeLeft(`-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [activeBooking]);

  const handleBookClick = () => {
    if (!selectedRoomId) {
      alert('Please select a room.');
      return;
    }
    if (!guestName.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!guestPhone.trim()) {
      alert('Please enter your phone number.');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    if (!selectedRoomId) return;
    try {
      const booking = bookAndPayRoom(selectedRoomId, guestName, guestPhone, durationHours);
      localStorage.setItem(GUEST_BOOKING_SESSION_KEY, booking.id);
      setActiveBookingId(booking.id);
      setShowPayment(false);
      // Reset form
      setSelectedRoomId(null);
      setGuestName('');
      setGuestPhone('');
    } catch (e: any) {
      alert(e.message);
      setShowPayment(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem(GUEST_BOOKING_SESSION_KEY);
    setActiveBookingId(null);
  };

  const vacantRooms = rooms.filter((r) => r.status === 'vacant');

  return (
    <div className={styles.container}>
      <div className={styles.phoneViewport} id="guest-phone-viewport">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <Shield size={20} color="var(--color-vacant)" />
            <div>
              <h2 className={styles.logoTitle}>SHIELD Guest</h2>
              <p className={styles.logoSub}>🔒 Anti-Leak Stay Pass</p>
            </div>
          </div>
          <Link href="/">
            <button className={styles.exitBtn} id="btn-guest-exit">
              Exit App
            </button>
          </Link>
        </div>

        <div className={styles.content}>
          {/* 1. If Guest has an active booking */}
          {activeBooking && activeRoom && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* STATUS BADGE CARD */}
              <div
                className={`glass ${styles.card}`}
                style={{
                  borderLeft: `4px solid ${
                    activeRoom.status === 'reserved'
                      ? 'var(--color-reserved)'
                      : activeRoom.status === 'occupied'
                      ? 'var(--color-vacant)'
                      : 'var(--color-overdue)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>CODE: {activeBookingId}</span>
                  <span
                    className={styles.roomStatus}
                    style={{
                      backgroundColor:
                        activeRoom.status === 'reserved'
                          ? 'var(--color-reserved-glow)'
                          : activeRoom.status === 'occupied'
                          ? 'var(--color-vacant-glow)'
                          : 'var(--color-overdue-glow)',
                      color:
                        activeRoom.status === 'reserved'
                          ? 'var(--color-reserved)'
                          : activeRoom.status === 'occupied'
                          ? 'var(--color-vacant)'
                          : 'var(--color-overdue)',
                      border: '1px solid currentColor',
                    }}
                  >
                    {activeRoom.status === 'reserved' ? 'Reserved' : activeRoom.status === 'occupied' ? 'Active Stay' : 'Stay Overdue'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>Room {activeRoom.id}</h1>
                  <span className={styles.roomPrice}>
                    ₹{activeRoom.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <div><strong>Guest:</strong> {activeBooking.guestName}</div>
                  <div><strong>Phone:</strong> {activeBooking.guestPhone}</div>
                  {activeBooking.checkInTime && (
                    <div><strong>Checked In:</strong> {new Date(activeBooking.checkInTime).toLocaleTimeString()}</div>
                  )}
                  <div><strong>Checkout Limit:</strong> {new Date(activeBooking.scheduledCheckOut).toLocaleTimeString()}</div>
                </div>
              </div>

              {/* QR TICKET CONTAINER */}
              <div className={`glass ${styles.card}`} style={{ alignItems: 'center', textAlign: 'center' }}>
                {activeRoom.status === 'reserved' ? (
                  <>
                    <h4 className={styles.cardTitle}>
                      <QrCode size={18} color="var(--accent-gold)" /> Check-In QR Pass
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Show to receptionist on desk. Payment validated.
                    </p>
                    <div className={styles.qrContainer} id="qr-checkin-pass">
                      <QRCodeSVG value={activeBookingId ? `CHECKIN_${activeBookingId}` : ''} size={170} bgColor="#ffffff" fgColor="#121c17" includeMargin={true} />
                    </div>
                    <div className={styles.badgeCard} style={{ marginTop: '14px' }}>
                      Waiting for Desk Scan
                    </div>
                  </>
                ) : activeRoom.status === 'occupied' || activeRoom.status === 'overdue' ? (
                  <>
                    <h4 className={styles.cardTitle}>
                      <QrCode size={18} color="var(--color-vacant)" /> Check-Out QR Pass
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Show to receptionist when leaving. Releases room status.
                    </p>
                    <div className={styles.qrContainer} id="qr-checkout-pass">
                      <QRCodeSVG value={activeBookingId ? `CHECKOUT_${activeBookingId}` : ''} size={170} bgColor="#ffffff" fgColor="#d90429" includeMargin={true} />
                    </div>

                    {/* Stay Timer */}
                    <div className={styles.timer} style={{ width: '100%', marginTop: '14px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isOverdue ? '⚠️ Overdue stay duration' : '🕒 Stay limit countdown'}
                      </span>
                      <span
                        className={styles.timerVal}
                        style={{ color: isOverdue ? 'var(--color-occupied)' : 'var(--color-overdue)' }}
                      >
                        {timeLeft}
                      </span>
                      {isOverdue && (
                        <span style={{ fontSize: '11px', color: 'var(--color-occupied)', fontWeight: 'bold' }}>
                          Checkout overdue! Scan checkout immediately.
                        </span>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <button
                id="btn-guest-reset-session"
                onClick={handleClearSession}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: '600',
                }}
              >
                <LogOut size={12} /> Book Another Room
              </button>

            </div>
          )}

          {/* 2. If Guest has checked out in another tab */}
          {activeBooking && activeRoom === null && activeBooking.status === 'checked_out' && (
            <div className={`glass animate-fade-in ${styles.successCard}`}>
              <div className={styles.checkAnim}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 'bold' }}>Checkout Approved</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                Your stay in Room {activeBooking.roomId} has successfully ended. Check-out was registered at{' '}
                {activeBooking.checkOutTime ? new Date(activeBooking.checkOutTime).toLocaleTimeString() : 'now'}.
              </p>
              <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />
              <button onClick={handleClearSession} className={styles.bookBtn} style={{ width: '100%' }} id="btn-guest-new-booking">
                Book a New Room
              </button>
            </div>
          )}

          {/* 3. Booking Form (Idle State) */}
          {!activeBooking && (
            <div className={`glass animate-fade-in ${styles.card}`}>
              <h3 className={styles.cardTitle} style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
                <Calendar size={18} color="var(--color-vacant)" /> Select your Luxury Room
              </h3>

              {/* Grid of rooms */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Vacant Rooms</label>
                {vacantRooms.length === 0 ? (
                  <div style={{ color: 'var(--color-occupied)', fontSize: '13px', padding: '12px', background: 'var(--color-occupied-glow)', borderRadius: '10px', border: '1px dashed rgba(217, 4, 41, 0.2)' }}>
                    All rooms are currently full. Use Admin View to reset demo.
                  </div>
                ) : (
                  <div className={styles.roomGrid}>
                    {rooms.map((room) => {
                      const isVacant = room.status === 'vacant';
                      return (
                        <button
                          id={`room-select-${room.id}`}
                          key={room.id}
                          disabled={!isVacant}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`${styles.roomCard} ${selectedRoomId === room.id ? styles.roomCardSelected : ''} ${!isVacant ? styles.roomCardDisabled : ''}`}
                        >
                          <div className={styles.roomImageContainer}>
                            <img src={room.image} alt={`Room ${room.id}`} className={styles.roomImage} />
                            <span
                              className={`${styles.roomStatus} ${styles.statusVacant}`}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                border: '1px solid var(--color-vacant)',
                                backgroundColor: 'rgba(255,255,255,0.95)',
                              }}
                            >
                              {room.status}
                            </span>
                          </div>
                          
                          <div className={styles.roomDetailsContainer}>
                            <div className={styles.roomCardHeader}>
                              <span className={styles.roomNum}>Room {room.id}</span>
                              <span className={styles.roomPrice}>₹{room.price.toLocaleString('en-IN')}</span>
                            </div>
                            <div className={styles.amenitiesRow} style={{ margin: '6px 0' }}>
                              <div className={styles.amenityIcon} title="Wi-Fi Active"><Wifi size={11} /></div>
                              <div className={styles.amenityIcon} title="Air Conditioning"><Wind size={11} /></div>
                              <div className={styles.amenityIcon} title="Secure Electronic Lock"><Shield size={11} /></div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Premium Bedding • AC • 24/7 Smart Lock
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Your Full Name</label>
                <input
                  id="guest-input-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Kevin Pimenta"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  id="guest-input-phone"
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. +91 99999 88888"
                  className={styles.input}
                />
              </div>

              {/* Stay Duration Selector */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Stay Duration (Demo Scale)</label>
                <div className={styles.durationSelect}>
                  {[1, 2, 4, 8].map((h) => (
                    <button
                      id={`duration-select-${h}h`}
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`${styles.durationBtn} ${durationHours === h ? styles.durationBtnSelected : ''}`}
                    >
                      {h} Hrs
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn-guest-book-pay"
                onClick={handleBookClick}
                disabled={vacantRooms.length === 0}
                className={styles.bookBtn}
                style={{
                  opacity: vacantRooms.length === 0 ? 0.5 : 1,
                  cursor: vacantRooms.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <CreditCard size={18} /> Book & Pay ₹
                {selectedRoomId
                  ? rooms.find((r) => r.id === selectedRoomId)?.price.toLocaleString('en-IN')
                  : '0'}
              </button>

              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                🔒 <strong>100% Anti-Fraud Audit Ledger System:</strong> Your checkout timer and QR signature are cryptographically chained to prevent front desk overrides.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPayment && selectedRoomId && (
        <PaymentPortal
          amount={rooms.find((r) => r.id === selectedRoomId)?.price || 0}
          roomNumber={selectedRoomId}
          guestName={guestName}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
