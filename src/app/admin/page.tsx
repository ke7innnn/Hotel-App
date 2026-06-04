'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  IndianRupee, 
  Percent, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Smartphone,
  ShieldCheck,
  LayoutDashboard,
  Bed,
  Wifi,
  Wind,
  Shield
} from 'lucide-react';
import { useHotelState } from '../../hooks/useHotelState';
import ChatBot from '../../components/ChatBot';
import styles from './admin.module.css';

export default function AdminPage() {
  const { rooms, bookings, logs, resetSimulation } = useHotelState();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms'>('dashboard');
  const [liveTimers, setLiveTimers] = useState<Record<string, { time: string; overdue: boolean }>>({});

  // Live timer countdowns for occupied/overdue rooms
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date().getTime();
      const updated: Record<string, { time: string; overdue: boolean }> = {};

      rooms.forEach((room) => {
        if (room.scheduledCheckOut && (room.status === 'occupied' || room.status === 'overdue')) {
          const target = new Date(room.scheduledCheckOut).getTime();
          const diff = target - now;

          if (diff <= 0) {
            const overdueDiff = now - target;
            const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
            const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((overdueDiff % (1000 * 60)) / 1000);
            updated[room.id] = {
              time: `-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
              overdue: true,
            };
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            updated[room.id] = {
              time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
              overdue: false,
            };
          }
        }
      });
      setLiveTimers(updated);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [rooms]);

  // Calculate live statistics
  const paymentLogs = logs.filter((l) => l.action === 'PAYMENT' && l.amount !== null);
  const totalRupees = paymentLogs.reduce((sum, log) => sum + (log.amount || 0), 0);

  const totalRooms = rooms.length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === 'occupied').length;
  const overdueRoomsCount = rooms.filter((r) => r.status === 'overdue').length;
  const occupancyPercentage = totalRooms > 0 ? Math.round(((occupiedRoomsCount + overdueRoomsCount) / totalRooms) * 100) : 0;

  const reservedRoomsCount = rooms.filter((r) => r.status === 'reserved').length;
  const vacantRoomsCount = rooms.filter((r) => r.status === 'vacant').length;

  // Render responsive SVG area chart based on chosen tab (Purple Theme matching Reference 3)
  const getChartData = () => {
    switch (chartPeriod) {
      case 'week':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          points: [2500, 6000, 9500, totalRupees, totalRupees, totalRupees, totalRupees],
          max: 18000,
        };
      case 'month':
        return {
          labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
          points: [15000, 24000, 31000, totalRupees * 3.2],
          max: 50000,
        };
      case 'year':
        return {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          points: [120000, 180000, 290000, totalRupees * 38.5],
          max: 600000,
        };
    }
  };

  const chart = getChartData();
  const pointsCount = chart.points.length;
  const svgWidth = 500;
  const svgHeight = 150;
  
  // Calculate SVG line coordinates
  const svgPoints = chart.points.map((val, idx) => {
    const x = (idx / (pointsCount - 1)) * (svgWidth - 60) + 30;
    const y = svgHeight - 20 - (val / chart.max) * (svgHeight - 40);
    return { x, y, value: val };
  });

  // Calculate premium smooth cubic bezier curves (horizontal S-curve interpolations)
  const getBezierPath = (pointsArray: typeof svgPoints) => {
    if (pointsArray.length === 0) return '';
    let path = `M ${pointsArray[0].x} ${pointsArray[0].y}`;
    for (let i = 0; i < pointsArray.length - 1; i++) {
      const p0 = pointsArray[i];
      const p1 = pointsArray[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = getBezierPath(svgPoints);
  const areaPath = linePath ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${svgHeight - 20} L ${svgPoints[0].x} ${svgHeight - 20} Z` : '';

  // SVG Donut Circumference (r=30, C=2*pi*r ≈ 188.5)
  const donutCircumference = 188.5;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <ShieldCheck size={24} color="var(--color-vacant)" />
          <span className={styles.sidebarLogoText}>SHIELD PMS</span>
        </div>
        
        <ul className={styles.sidebarMenu}>
          <li 
            className={`${styles.sidebarItem} ${activeTab === 'dashboard' ? styles.sidebarItemActive : ''}`}
            onClick={() => setActiveTab('dashboard')}
            id="sidebar-tab-dashboard"
          >
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li 
            className={`${styles.sidebarItem} ${activeTab === 'rooms' ? styles.sidebarItemActive : ''}`}
            onClick={() => setActiveTab('rooms')}
            id="sidebar-tab-rooms"
          >
            <Bed size={18} /> Room Grid
          </li>
        </ul>

        {/* Sidebar user profile box */}
        <div className={styles.sidebarProfile}>
          <div className={styles.avatar}>KP</div>
          <div>
            <div className={styles.profileName}>Kevin Pimenta</div>
            <div className={styles.profileRole}>System Owner</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.contentArea}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <Building size={24} color="var(--color-vacant)" />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '850', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Owner Control Tower
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live Hotel Performance & Vacancy Analytics</p>
            </div>
            <span className={styles.ownerBadge}>
              <Smartphone size={12} style={{ marginRight: '4px' }} /> Live Sync Active
            </span>
          </div>
          <div className={styles.actions}>
            <button
              id="btn-admin-reset-demo"
              onClick={resetSimulation}
              className={`${styles.btnAction} ${styles.btnReset}`}
              title="Restore default mock statuses (Rahul overdue, John in room)"
            >
              <RefreshCw size={14} /> Restore Demo Data
            </button>
            <Link href="/">
              <button className={styles.btnAction} id="btn-admin-logout">
                Logout Terminal
              </button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Views */}
        {activeTab === 'dashboard' ? (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* KPI Stats Grid */}
            <div className={styles.statsGrid}>
              
              {/* KPI 1: Rupee Earnings */}
              <div className={`${styles.statCard} ${styles.statGold}`}>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Rupees Earned</span>
                  <span className={styles.statValue}>₹{totalRupees.toLocaleString('en-IN')}</span>
                  <span className={styles.statSub}>Upfront secured</span>
                </div>
                <div className={styles.statIcon}>
                  <IndianRupee size={20} color="#ca8a04" />
                </div>
              </div>

              {/* KPI 2: Occupancy Rate */}
              <div className={`${styles.statCard} ${styles.statPurple}`}>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Occupancy Rate</span>
                  <span className={styles.statValue}>{occupancyPercentage}%</span>
                  <span className={styles.statSub}>
                    {occupiedRoomsCount + overdueRoomsCount} of {totalRooms} rooms active
                  </span>
                </div>
                <div className={styles.statIcon}>
                  <Percent size={18} color="var(--accent-purple)" />
                </div>
              </div>

              {/* KPI 3: Guests in House */}
              <div className={`${styles.statCard} ${styles.statBlue}`}>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Active Guests</span>
                  <span className={styles.statValue}>{occupiedRoomsCount}</span>
                  <span className={styles.statSub} style={{ color: 'var(--color-reserved)' }}>
                    {reservedRoomsCount} pending check-in
                  </span>
                </div>
                <div className={styles.statIcon}>
                  <Users size={20} color="#2a6f97" />
                </div>
              </div>

              {/* KPI 4: Available Rooms */}
              <div className={`${styles.statCard} ${styles.statGray}`}>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>Available Rooms</span>
                  <span className={styles.statValue} style={{ color: 'var(--color-vacant)' }}>{vacantRoomsCount}</span>
                  <span className={styles.statSub}>Ready for check-in</span>
                </div>
                <div className={styles.statIcon}>
                  <Bed size={20} color="var(--color-vacant)" />
                </div>
              </div>

            </div>

            {/* Split Analytics Chart view */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  <TrendingUp size={18} color="var(--accent-purple)" /> Weekly Analytics
                </h3>
                <div className={styles.chartTabs}>
                  {(['week', 'month', 'year'] as const).map((period) => (
                    <button
                      id={`chart-tab-${period}`}
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`${styles.chartTabBtn} ${chartPeriod === period ? styles.chartTabBtnActive : ''}`}
                    >
                      {period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Yearly'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.analyticsContainer}>
                {/* SVG Bezier Chart */}
                <div className={styles.chartContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <span>Upfront Room Payments</span>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>Max limit: ₹{chart.max.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* SVG Area Line Chart */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="lavenderGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = svgHeight - 20 - ratio * (svgHeight - 40);
                        return (
                          <line
                            key={i}
                            x1="30"
                            y1={y}
                            x2={svgWidth - 30}
                            y2={y}
                            stroke="rgba(0,0,0,0.03)"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Shaded Area under the curve */}
                      {areaPath && <path d={areaPath} fill="url(#lavenderGlow)" />}

                      {/* SVG Line curve */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--accent-purple)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data Points and Value Tags */}
                      {svgPoints.map((pt, idx) => (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4"
                            fill="#fff"
                            stroke="var(--accent-purple)"
                            strokeWidth="2"
                          />
                          {(idx === 3 || idx === pointsCount - 1) && (
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              fill="var(--text-primary)"
                              fontSize="9"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              ₹{Math.round(pt.value).toLocaleString('en-IN')}
                            </text>
                          )}
                        </g>
                      ))}

                      {/* X Axis labels */}
                      {chart.labels.map((lbl, idx) => {
                        const x = (idx / (pointsCount - 1)) * (svgWidth - 60) + 30;
                        return (
                          <text
                            key={idx}
                            x={x}
                            y={svgHeight - 4}
                            fill="var(--text-muted)"
                            fontSize="9"
                            textAnchor="middle"
                            fontWeight="600"
                          >
                            {lbl}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* SVG Donut Progress Chart */}
                <div className={styles.donutCard}>
                  <span className={styles.donutTitle}>Occupied Ratio</span>
                  
                  <div className={styles.donutSvgContainer}>
                    <svg viewBox="0 0 80 80" width="100%" height="100%">
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="var(--bg-tertiary)"
                        strokeWidth="7"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="var(--bg-accent)"
                        strokeWidth="7"
                        strokeDasharray={donutCircumference}
                        strokeDashoffset={donutCircumference * (1 - occupancyPercentage / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <span className={styles.donutPercentage}>{occupancyPercentage}%</span>
                  </div>

                  <div className={styles.donutLegend}>
                    <div className={styles.donutLegendItem}>
                      <span><span className={styles.donutDot} style={{ backgroundColor: 'var(--color-vacant)' }}></span>Vacant</span>
                      <strong>{vacantRoomsCount}</strong>
                    </div>
                    <div className={styles.donutLegendItem}>
                      <span><span className={styles.donutDot} style={{ backgroundColor: 'var(--color-occupied)' }}></span>Occupied</span>
                      <strong>{occupiedRoomsCount + overdueRoomsCount}</strong>
                    </div>
                    <div className={styles.donutLegendItem}>
                      <span><span className={styles.donutDot} style={{ backgroundColor: 'var(--color-reserved)' }}></span>Reserved</span>
                      <strong>{reservedRoomsCount}</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Rooms list card matrix */}
            <div className={`glass ${styles.panel}`}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  <Building size={18} color="var(--color-vacant)" /> Rooms Board Grid
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '750' }}>
                  <span>🟢 Vacant</span>
                  <span>🟠 Reserved</span>
                  <span>🔴 Occupied</span>
                  <span>🟡 Overdue Stay</span>
                </div>
              </div>

              <div className={styles.roomGrid}>
                {rooms.map((room) => {
                  const timer = liveTimers[room.id];
                  
                  return (
                    <div
                      id={`admin-room-card-${room.id}`}
                      key={room.id}
                      className={styles.roomCard}
                    >
                      <div className={styles.cardImageWrapper}>
                        <img src={room.image} alt={`Room ${room.id}`} className={styles.cardImg} />
                        
                        <div className={styles.cardHeader}>
                          <span className={styles.roomNumber}>Room {room.id}</span>
                          <span
                            className={`${styles.statusIndicator} ${
                              room.status === 'vacant'
                                ? styles.statusVacant
                                : room.status === 'reserved'
                                ? styles.statusReserved
                                : room.status === 'occupied'
                                ? styles.statusOccupied
                                : styles.statusOverdue
                            }`}
                          >
                            {room.status === 'vacant' ? 'Vacant' : room.status === 'occupied' ? 'Occupied' : room.status === 'reserved' ? 'Reserved' : 'Overdue'}
                          </span>
                        </div>
                      </div>

                      <div className={styles.roomBody}>
                        {room.guestName ? (
                          <div className={styles.guestSection}>
                            <div style={{ fontWeight: '750', color: 'var(--text-primary)', fontSize: '14px' }}>{room.guestName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{room.guestPhone}</div>
                            
                            {/* Amenities Row */}
                            <div className={styles.amenitiesRow}>
                              <div className={styles.amenityIcon} title="Wi-Fi Active"><Wifi size={12} /></div>
                              <div className={styles.amenityIcon} title="Air Conditioning"><Wind size={12} /></div>
                              <div className={styles.amenityIcon} title="Secure Lock"><Shield size={12} /></div>
                            </div>

                            {/* Stay Timer */}
                            {timer && (
                              <div className={styles.timer} style={{ marginTop: '8px' }}>
                                <span className={styles.timerLabel}>
                                  {timer.overdue ? '⚠️ Overdue' : 'Checkout in'}
                                </span>
                                <span 
                                  className={styles.timerVal}
                                  style={{ color: timer.overdue ? 'var(--color-occupied)' : 'var(--color-overdue)', fontSize: '12px' }}
                                >
                                  {timer.time}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.guestSection}>
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0 2px 0' }}>
                              Vacant • ₹{room.price.toLocaleString('en-IN')}/night
                            </span>
                            {/* Amenities Row */}
                            <div className={styles.amenitiesRow}>
                              <div className={styles.amenityIcon} title="Wi-Fi"><Wifi size={12} /></div>
                              <div className={styles.amenityIcon} title="Air Conditioning"><Wind size={12} /></div>
                              <div className={styles.amenityIcon} title="Secure Lock"><Shield size={12} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Embedded Live ChatBot Manager */}
      <ChatBot rooms={rooms} bookings={bookings} logs={logs} />
    </div>
  );
}
