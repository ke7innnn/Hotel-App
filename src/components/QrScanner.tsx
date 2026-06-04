'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Camera, AlertCircle, Keyboard } from 'lucide-react';
import { Booking } from '../utils/mockData';

interface QrScannerProps {
  activeBookings: Booking[];
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
  expectedType: 'checkin' | 'checkout';
}

export default function QrScanner({ activeBookings, onScanSuccess, onScanError, expectedType }: QrScannerProps) {
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const qrScannerRef = useRef<any>(null);

  // Filter bookings for easy simulation
  const checkinSimTargets = activeBookings.filter((b) => b.status === 'paid');
  const checkoutSimTargets = activeBookings.filter((b) => b.status === 'checked_in');

  useEffect(() => {
    if (!useCamera) {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear();
          qrScannerRef.current = null;
        } catch (e) {
          console.error('Error clearing scanner:', e);
        }
      }
      return;
    }

    // Dynamic import to prevent SSR issues
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      try {
        setCameraError(null);
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: (width, height) => {
              const min = Math.min(width, height);
              return { width: min * 0.7, height: min * 0.7 };
            },
            aspectRatio: 1.0,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            onScanSuccess(decodedText);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(200);
            }
          },
          (error) => {
            if (onScanError) {
              onScanError(error);
            }
          }
        );

        qrScannerRef.current = scanner;
      } catch (err: any) {
        console.error('HTML5 QR Code Scanner Init Error:', err);
        setCameraError(err.message || 'Could not initialize camera feed.');
        setUseCamera(false);
      }
    });

    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear();
        } catch (e) {
          console.error('Cleanup scanner error:', e);
        }
      }
    };
  }, [useCamera, onScanSuccess, onScanError]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      // Prepend prefix if not present for manual testing
      const code = manualCode.trim();
      const prefix = expectedType === 'checkin' ? 'CHECKIN_' : 'CHECKOUT_';
      const formatted = code.startsWith('CHECKIN_') || code.startsWith('CHECKOUT_') ? code : `${prefix}${code}`;
      onScanSuccess(formatted);
      setManualCode('');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button
          id="scanner-tab-sim"
          onClick={() => setUseCamera(false)}
          style={{
            ...styles.tabBtn,
            borderBottom: !useCamera ? '2px solid var(--color-vacant)' : 'none',
            color: !useCamera ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Keyboard size={16} style={{ marginRight: '6px' }} />
          Simulator HUD
        </button>
        <button
          id="scanner-tab-cam"
          onClick={() => setUseCamera(true)}
          style={{
            ...styles.tabBtn,
            borderBottom: useCamera ? '2px solid var(--color-vacant)' : 'none',
            color: useCamera ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Camera size={16} style={{ marginRight: '6px' }} />
          Live Camera Scan
        </button>
      </div>

      {!useCamera ? (
        <div style={styles.simulatorBody} className="animate-fade-in">
          <p style={styles.infoText}>
            Click a simulation target below to feed a physical QR code scanner stream:
          </p>

          {expectedType === 'checkin' ? (
            <div style={styles.simSection}>
              <h4 style={{ ...styles.sectionTitle, color: 'var(--color-reserved)' }}>
                🟢 Check-In QR Simulation Targets
              </h4>
              {checkinSimTargets.length === 0 ? (
                <div style={styles.emptySim}>No paid guests waiting to check in.</div>
              ) : (
                <div style={styles.simGrid}>
                  {checkinSimTargets.map((b) => (
                    <button
                      id={`sim-checkin-${b.id}`}
                      key={b.id}
                      onClick={() => onScanSuccess(`CHECKIN_${b.id}`)}
                      style={styles.simCard}
                    >
                      <div style={{ fontWeight: 'bold' }}>{b.guestName}</div>
                      <div style={styles.simDetails}>Room {b.roomId} • Code: {b.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.simSection}>
              <h4 style={{ ...styles.sectionTitle, color: 'var(--color-occupied)' }}>
                🔴 Check-Out QR Simulation Targets
              </h4>
              {checkoutSimTargets.length === 0 ? (
                <div style={styles.emptySim}>No active checked-in guests.</div>
              ) : (
                <div style={styles.simGrid}>
                  {checkoutSimTargets.map((b) => (
                    <button
                      id={`sim-checkout-${b.id}`}
                      key={b.id}
                      onClick={() => onScanSuccess(`CHECKOUT_${b.id}`)}
                      style={styles.simCard}
                    >
                      <div style={{ fontWeight: 'bold' }}>{b.guestName}</div>
                      <div style={styles.simDetails}>Room {b.roomId} • Code: {b.id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleManualSubmit} style={styles.manualForm}>
            <input
              id="scanner-manual-input"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={expectedType === 'checkin' ? "Booking ID (e.g. B-102-X8A2)" : "Booking ID (e.g. B-102-X8A2)"}
              style={styles.manualInput}
            />
            <button id="btn-manual-scan" type="submit" style={styles.manualBtn}>
              Inject
            </button>
          </form>
        </div>
      ) : (
        <div style={styles.cameraBody} className="animate-fade-in">
          {cameraError && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} style={{ marginRight: '8px', flexShrink: 0 }} />
              <span>{cameraError}</span>
            </div>
          )}

          <div style={styles.cameraFrame}>
            <div id="qr-reader-container" style={styles.scannerContainer}></div>
            <div style={styles.hudCornerTopLeft}></div>
            <div style={styles.hudCornerTopRight}></div>
            <div style={styles.hudCornerBottomLeft}></div>
            <div style={styles.hudCornerBottomRight}></div>
            <div style={styles.hudScanLine}></div>
          </div>

          <p style={styles.cameraInstructions}>
            Hold the Guest {expectedType === 'checkin' ? 'Check-In' : 'Check-Out'} QR code up to this camera.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tabHeader: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  tabBtn: {
    flex: 1,
    padding: '12px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  simulatorBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  simSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  emptySim: {
    padding: '12px',
    background: 'var(--bg-primary)',
    border: '1px dashed var(--border-color)',
    borderRadius: '10px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
  },
  simGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  simCard: {
    padding: '12px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '12px',
    transition: 'transform 0.1s, border-color 0.2s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
  },
  simDetails: {
    color: 'var(--text-secondary)',
    fontSize: '10px',
    marginTop: '2px',
  },
  manualForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  manualInput: {
    flex: 1,
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
  },
  manualBtn: {
    background: 'var(--color-vacant)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cameraBody: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  errorBox: {
    width: '100%',
    padding: '12px',
    background: 'var(--color-occupied-glow)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: 'var(--color-occupied)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
  },
  cameraFrame: {
    position: 'relative',
    width: '280px',
    height: '280px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '2px solid var(--border-color)',
    background: '#000',
  },
  scannerContainer: {
    width: '100%',
    height: '100%',
  },
  cameraInstructions: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    maxWidth: '240px',
  },
  hudCornerTopLeft: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    width: '16px',
    height: '16px',
    borderLeft: '3px solid var(--color-vacant)',
    borderTop: '3px solid var(--color-vacant)',
    zIndex: 10,
  },
  hudCornerTopRight: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '16px',
    height: '16px',
    borderRight: '3px solid var(--color-vacant)',
    borderTop: '3px solid var(--color-vacant)',
    zIndex: 10,
  },
  hudCornerBottomLeft: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    width: '16px',
    height: '16px',
    borderLeft: '3px solid var(--color-vacant)',
    borderBottom: '3px solid var(--color-vacant)',
    zIndex: 10,
  },
  hudCornerBottomRight: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '16px',
    height: '16px',
    borderRight: '3px solid var(--color-vacant)',
    borderBottom: '3px solid var(--color-vacant)',
    zIndex: 10,
  },
  hudScanLine: {
    position: 'absolute',
    top: '0',
    left: '10%',
    width: '80%',
    height: '2px',
    background: 'linear-gradient(to right, transparent, var(--color-vacant), transparent)',
    boxShadow: '0 0 8px var(--color-vacant)',
    animation: 'scan 2s linear infinite',
    zIndex: 10,
  },
};
