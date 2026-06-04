'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, CornerDownLeft, ClipboardList, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useHotelState } from '../../hooks/useHotelState';
import QrScanner from '../../components/QrScanner';
import styles from './receptionist.module.css';

export default function ReceptionistPage() {
  const { rooms, bookings, logs, checkInGuest, checkOutGuest } = useHotelState();
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auto-clear feedback messages after 5 seconds
  useEffect(() => {
    if (scanSuccess || scanError) {
      const timer = setTimeout(() => {
        setScanSuccess(null);
        setScanError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scanSuccess, scanError]);

  const handleScanSuccess = (decodedText: string) => {
    const booking = bookings.find((b) => b.id === decodedText);
    if (!booking) {
      setScanError(`Scan Refused: Booking code "${decodedText}" does not exist in ledger.`);
      setScanSuccess(null);
      return;
    }

    try {
      if (booking.status === 'paid') {
        checkInGuest(decodedText);
        setScanSuccess(`Check-In Approved: Room ${booking.roomId} assigned to ${booking.guestName}.`);
        setScanError(null);
      } else if (booking.status === 'checked_in') {
        checkOutGuest(decodedText);
        setScanSuccess(`Check-Out Approved: Room ${booking.roomId} released. Guest ${booking.guestName} departed.`);
        setScanError(null);
      } else if (booking.status === 'checked_out') {
        setScanError(`Scan Rejected: Guest ${booking.guestName} already checked out of Room ${booking.roomId}.`);
        setScanSuccess(null);
      }
    } catch (err: any) {
      setScanError(`Operational Fail: ${err.message || 'Database error'}`);
      setScanSuccess(null);
    }
  };

  // Filter logs associated with receptionist actions
  const deskLogs = logs
    .filter((l) => l.operator === 'RECEPTIONIST')
    .slice()
    .reverse(); // latest first

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <UserCheck size={28} color="var(--color-vacant)" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Receptionist Anti-Cheat Desk Terminal
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SHIELD PMS Autonomous Gateway • Loophole Prevention Active</p>
          </div>
          <span className={styles.deskBadge}>Active Desk 01</span>
        </div>
        <Link href="/">
          <button className={styles.exitBtn} id="btn-receptionist-exit">
            <CornerDownLeft size={16} /> Exit Desk Console
          </button>
        </Link>
      </div>

      <div className={styles.grid}>
        {/* Left Side: Scan controls */}
        <div className={`glass ${styles.panel}`}>
          <h3 className={styles.panelTitle}>
            <ShieldCheck size={18} color="var(--color-vacant)" /> Scanner Console
          </h3>

          {scanSuccess && (
            <div className={styles.scanSuccess} id="scan-feedback-success">
              <CheckCircle2 size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'text-bottom' }} />
              {scanSuccess}
            </div>
          )}

          {scanError && (
            <div className={styles.scanError} id="scan-feedback-error">
              <AlertTriangle size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'text-bottom' }} />
              {scanError}
            </div>
          )}

          {/* Render QrScanner */}
          <QrScanner
            activeBookings={bookings}
            onScanSuccess={handleScanSuccess}
            onScanError={(err) => console.log('Scanning...', err)}
          />
        </div>

        {/* Right Side: Room reference grid and action log */}
        <div className={styles.mainPanel}>
          {/* Room status board */}
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelTitle}>
              <ClipboardList size={18} color="var(--accent-gold)" /> Live Room Status Reference
            </h3>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Room</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Current Guest</th>
                    <th className={styles.th}>Contact</th>
                    <th className={styles.th}>Stay Checkout Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    return (
                      <tr key={room.id} className={styles.tr}>
                        <td style={{ fontWeight: 'bold', fontSize: '15px' }} className={styles.td}>Room {room.id}</td>
                        <td className={styles.td}>
                          <span
                            className={styles.statusTag}
                            style={{
                              backgroundColor:
                                room.status === 'vacant'
                                  ? 'var(--color-vacant-glow)'
                                  : room.status === 'occupied'
                                  ? 'var(--color-occupied-glow)'
                                  : room.status === 'reserved'
                                  ? 'var(--color-reserved-glow)'
                                  : 'var(--color-overdue-glow)',
                              color:
                                room.status === 'vacant'
                                  ? 'var(--color-vacant)'
                                  : room.status === 'occupied'
                                  ? 'var(--color-occupied)'
                                  : room.status === 'reserved'
                                  ? 'var(--color-reserved)'
                                  : 'var(--color-overdue)',
                              border: '1px solid currentColor',
                            }}
                          >
                            {room.status === 'vacant' ? '🟢 Vacant' : room.status === 'occupied' ? '🔴 Occupied' : room.status === 'reserved' ? '🟠 Reserved' : '🟡 Overdue'}
                          </span>
                        </td>
                        <td className={styles.td}>{room.guestName || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }} className={styles.td}>{room.guestPhone || '—'}</td>
                        <td style={{ color: room.status === 'overdue' ? 'var(--color-occupied)' : 'var(--text-primary)', fontWeight: room.status === 'overdue' ? 'bold' : '500' }} className={styles.td}>
                          {room.scheduledCheckOut ? new Date(room.scheduledCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {room.status === 'overdue' && ' (OVERDUE)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receptionist Audit Activity Logs */}
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelTitle}>
              <ClipboardList size={18} color="var(--text-secondary)" /> Your Scan Operations Ledger
            </h3>
            {deskLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
                No operations handled yet during this session.
              </div>
            ) : (
              <div className={styles.logList}>
                {deskLogs.map((log) => (
                  <div key={log.id} className={styles.logItem}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.details}</div>
                    <div className={styles.logMeta}>
                      <span>Action ID: {log.id}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
