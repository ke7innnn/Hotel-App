'use client';

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, Loader2, Sparkles, X } from 'lucide-react';

interface PaymentPortalProps {
  amount: number;
  roomNumber: string;
  guestName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentPortal({ amount, roomNumber, guestName, onSuccess, onClose }: PaymentPortalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState(guestName);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [processStep, setProcessStep] = useState(0);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/gi, '').slice(0, 3);
    setCvv(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
      alert('Please fill in card details correctly.');
      return;
    }

    setStatus('processing');
    setProcessStep(0);

    const steps = [
      'Establishing secure SSL handshake...',
      'Verifying credit card tokens...',
      'Initiating 3D-Secure 2.0 protocol...',
      'Authorizing transaction with Bank of India...',
      'Finalizing payment ledger and recording transaction...',
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProcessStep(currentStep);
      } else {
        clearInterval(interval);
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    }, 800);
  };

  const stepsText = [
    'Establishing secure SSL handshake...',
    'Verifying credit card tokens...',
    'Initiating 3D-Secure 2.0 protocol...',
    'Authorizing transaction with Bank of India...',
    'Finalizing payment ledger and recording transaction...',
  ];

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn} id="btn-close-payment">
          <X size={20} />
        </button>

        {status === 'idle' && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.header}>
              <div style={styles.iconContainer}>
                <ShieldCheck size={28} color="var(--accent-gold)" />
              </div>
              <div>
                <h3 style={styles.title}>Secure Checkout</h3>
                <p style={styles.subtitle}>Room {roomNumber} • SHIELD Gateways</p>
              </div>
            </div>

            <div style={styles.amountBox}>
              <span style={styles.amountLabel}>Total Due</span>
              <h2 style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</h2>
            </div>

            {/* Mock Credit Card Graphics */}
            <div style={styles.cardGraphic}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CreditCard size={32} color="#fff" />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>SHIELD CARD</span>
              </div>
              <div style={{ marginTop: '20px', fontSize: '18px', letterSpacing: '3px', fontFamily: 'monospace' }}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px', textTransform: 'uppercase' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>CARDHOLDER</div>
                  <div>{name || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px' }}>EXPIRES</div>
                  <div>{expiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Cardholder Name</label>
              <input
                id="payment-cardholder"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Enter name on card"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Card Number</label>
              <input
                id="payment-cardnumber"
                type="text"
                required
                value={cardNumber}
                onChange={handleCardChange}
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>Expiration</label>
                <input
                  id="payment-expiry"
                  type="text"
                  required
                  value={expiry}
                  onChange={handleExpiryChange}
                  style={styles.input}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div style={{ ...styles.inputGroup, flex: 1 }}>
                <label style={styles.label}>CVV</label>
                <input
                  id="payment-cvv"
                  type="password"
                  required
                  value={cvv}
                  onChange={handleCvvChange}
                  style={styles.input}
                  placeholder="•••"
                  maxLength={3}
                />
              </div>
            </div>

            <button type="submit" style={styles.payBtn} id="btn-submit-payment">
              <Lock size={16} style={{ marginRight: '8px' }} />
              Pay ₹{amount.toLocaleString('en-IN')} Securely
            </button>

            <div style={styles.footerText}>
              <Lock size={12} style={{ marginRight: '4px', display: 'inline' }} />
              PCI-DSS 256-bit Encrypted Transaction
            </div>
          </form>
        )}

        {status === 'processing' && (
          <div style={styles.loadingContainer}>
            <Loader2 className="spin" size={48} color="var(--accent-purple)" style={{ animation: 'spin 1.2s linear infinite' }} />
            <h3 style={{ marginTop: '24px', fontSize: '18px', color: '#fff' }}>Processing Payment</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
              {stepsText[processStep]}
            </p>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${((processStep + 1) / stepsText.length) * 100}%` }}></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.successContainer}>
            <div style={styles.checkCircle}>
              <Sparkles size={48} color="var(--color-vacant)" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', marginTop: '20px' }}>Payment Approved!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', textAlign: 'center' }}>
              Receipt generated. Your Room {roomNumber} Check-In QR is ready.
            </p>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    padding: '28px',
    position: 'relative',
    animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    color: '#f3f4f6',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(234, 179, 8, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  amountBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  amountLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  amountValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'var(--color-vacant)',
  },
  cardGraphic: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
    marginBottom: '20px',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    aspectRatio: '1.586/1', // standard card ratio
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  payBtn: {
    background: 'linear-gradient(90deg, var(--accent-purple) 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
  },
  footerText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '16px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    marginTop: '20px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'var(--accent-purple)',
    transition: 'width 0.4s ease-out',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  checkCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid var(--color-vacant)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
  },
};
