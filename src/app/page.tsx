'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Building, UserCheck, KeyRound, ArrowRight } from 'lucide-react';
import styles from './login.module.css';

export default function EntryPage() {
  return (
    <div className={styles.container}>
      {/* Decorative Blur Blobs */}
      <div className={styles.glowBlob} />
      <div className={styles.glowBlob2} />

      <div className={styles.brand}>
        <div className={styles.badge}>
          <Shield size={12} style={{ marginRight: '4px' }} />
          🔒 Anti-Fraud Protection Enabled
        </div>
        <h1 className={styles.logoTitle}>SHIELD PMS</h1>
        <p className={styles.logoSub}>
          Autonomous Property Management System & Guest App. Track vacancies in real-time, seal financial logs, and prevent front-desk leakage automatically.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className={styles.roleGrid}>
        
        {/* Card 1: Owner */}
        <div className={`${styles.roleCard} ${styles.cardOwner} glass`}>
          <div className={`${styles.iconBox} ${styles.ownerIcon}`}>
            <Building size={24} color="#ca8a04" />
          </div>
          <h3 className={styles.roleTitle}>Owner / Admin</h3>
          <p className={styles.roleDesc}>
            Watch rooms, earnings, and security audits update live. Zero receptionist leak loopholes — sit back anywhere in the world.
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#ca8a04" /> Live occupancy grid & gap alerts
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#ca8a04" /> Real-time rupee earnings tracking
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#ca8a04" /> AI chatbot natural data reporter
            </li>
          </ul>
          <Link href="/admin" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <button className={`${styles.loginBtn} ${styles.btnOwner}`} id="btn-login-admin">
              Launch Control Panel <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        {/* Card 2: Receptionist */}
        <div className={`${styles.roleCard} ${styles.cardReceptionist} glass`}>
          <div className={`${styles.iconBox} ${styles.receptionistIcon}`}>
            <UserCheck size={24} color="var(--bg-accent)" />
          </div>
          <h3 className={styles.roleTitle}>Receptionist</h3>
          <p className={styles.roleDesc}>
            Zero power to override prices or checkout statuses without scanning. Validates secure guest QR codes automatically.
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="var(--bg-accent)" /> Camera scanning check-in/out console
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="var(--bg-accent)" /> Automated payment verification check
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="var(--bg-accent)" /> Signed operational audit ledger logs
            </li>
          </ul>
          <Link href="/receptionist" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <button className={`${styles.loginBtn} ${styles.btnReceptionist}`} id="btn-login-receptionist">
              Open Front Desk <ArrowRight size={14} />
            </button>
          </Link>
        </div>

        {/* Card 3: Guest */}
        <div className={`${styles.roleCard} ${styles.cardGuest} glass`}>
          <div className={`${styles.iconBox} ${styles.guestIcon}`}>
            <KeyRound size={24} color="#457b9d" />
          </div>
          <h3 className={styles.roleTitle}>Guest Portal</h3>
          <p className={styles.roleDesc}>
            Premium guest booking experience. Select a room, pay upfront via dummy Stripe gateway, and generate scan codes.
          </p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#457b9d" /> Interactive room selection & images
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#457b9d" /> Instant dummy credit card payments
            </li>
            <li className={styles.bulletItem}>
              <Sparkles size={12} color="#457b9d" /> Live stay timer & QR pass generation
            </li>
          </ul>
          <Link href="/guest" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <button className={`${styles.loginBtn} ${styles.btnGuest}`} id="btn-login-guest">
              Launch Guest View <ArrowRight size={14} />
            </button>
          </Link>
        </div>

      </div>

      <div className={styles.pitchBanner}>
        <span>💡 <strong>Pitch Tip:</strong> Open the <strong>Owner</strong> console in one tab, and the <strong>Guest</strong> or <strong>Receptionist</strong> views in others. Observe updates sync in real time under tamper-proof cryptographic logs.</span>
      </div>
    </div>
  );
}
