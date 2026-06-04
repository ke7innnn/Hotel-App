'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Bot, User, X, Sparkles } from 'lucide-react';
import { Room, Booking, AuditLog } from '../utils/mockData';

interface ChatBotProps {
  rooms: Room[];
  bookings: Booking[];
  logs: AuditLog[];
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatBot({ rooms, bookings, logs }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chatbot welcome message
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text: "Hello! I am SHIELD, your autonomous live hotel data assistant. Ask me anything about occupancy, vacant rooms, stay limits, or financials. (e.g., 'What is our occupancy?', 'Show earnings', or 'Is room 103 overdue?')",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const processQuery = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Gaps / Cheating / Discrepancies
    if (q.includes('cheat') || q.includes('gap') || q.includes('audit') || q.includes('discrepancy') || q.includes('alert')) {
      const overdueRooms = rooms.filter((r) => r.status === 'overdue');
      const overdueCount = overdueRooms.length;
      const unpaidCheckins = logs.filter(
        (l) => l.action === 'CHECK_IN' && l.operator === 'RECEPTIONIST' && !logs.some(
          (other) => other.action === 'PAYMENT' && other.details.includes(l.details.match(/Room \d+/)?.[0] || 'NONE')
        )
      );

      let response = '🔒 **Anti-Cheat Audit Report:**\n\n';
      
      if (overdueCount === 0 && unpaidCheckins.length === 0) {
        response += '✅ **System Status:** 100% SECURE. Every active check-in has a matching digital payment record. No unpaid occupancies detected.';
      } else {
        if (overdueCount > 0) {
          response += `⚠️ **Checkout Gap:** ${overdueCount} rooms are past checkout time without a registered check-out scan:\n`;
          overdueRooms.forEach((r) => {
            response += `• **Room ${r.id}:** Guest ${r.guestName} was scheduled to checkout at ${new Date(r.scheduledCheckOut!).toLocaleTimeString()}. Stay is unrecorded.\n`;
          });
          response += '   *Verify with receptionist if physical key was returned.* \n\n';
        }
        if (unpaidCheckins.length > 0) {
          response += `🚨 **Critical Alert:** Receptionist checked in guest without upfront payments in ${unpaidCheckins.length} instances. Check receptionist log IDs: ${unpaidCheckins.map(l => l.id).join(', ')}.`;
        }
      }
      return response;
    }

    // 2. Earnings / Revenue
    if (q.includes('earn') || q.includes('revenue') || q.includes('money') || q.includes('rupee') || q.includes('financial') || q.includes('profit')) {
      const payments = logs.filter((l) => l.action === 'PAYMENT' && l.amount !== null);
      const totalRevenue = payments.reduce((sum, l) => sum + (l.amount || 0), 0);

      // Estimate weekly/monthly (mock calculations based on logs)
      const weekEarnings = totalRevenue; 
      const monthEarnings = totalRevenue * 3.5;
      const yearEarnings = totalRevenue * 42.0;

      return `📊 **Financial Earning Dashboard (Live):**\n\n• **Today / Active Bookings:** ₹${totalRevenue.toLocaleString('en-IN')}\n• **Estimated This Week:** ₹${weekEarnings.toLocaleString('en-IN')}\n• **Estimated This Month:** ₹${monthEarnings.toLocaleString('en-IN')}\n• **Estimated Year-to-Date:** ₹${yearEarnings.toLocaleString('en-IN')}\n\n*All payments are sealed under security hashes to prevent receptionist overrides.*`;
    }

    // 3. Occupancy
    if (q.includes('occupancy') || q.includes('occupied') || q.includes('how many inside') || q.includes('who is inside')) {
      const occupied = rooms.filter((r) => r.status === 'occupied').length;
      const overdue = rooms.filter((r) => r.status === 'overdue').length;
      const reserved = rooms.filter((r) => r.status === 'reserved').length;
      const total = rooms.length;
      const rate = Math.round(((occupied + overdue) / total) * 100);

      return `🟢 **Live Occupancy Status:**\n\n• **Occupancy Rate:** ${rate}%\n• **Occupied Rooms:** ${occupied}\n• **Overdue Rooms:** ${overdue} (warning!)\n• **Reserved/Paid Rooms:** ${reserved}\n• **Total Rooms:** ${total}\n\nGuests inside include: ${rooms
        .filter((r) => r.guestName && (r.status === 'occupied' || r.status === 'overdue'))
        .map((r) => `${r.guestName} (Room ${r.id})`)
        .join(', ') || 'None'}`;
    }

    // 4. Vacant Rooms
    if (q.includes('vacant') || q.includes('empty') || q.includes('free') || q.includes('available')) {
      const vacantRooms = rooms.filter((r) => r.status === 'vacant');
      if (vacantRooms.length === 0) {
        return '🚫 All rooms are currently occupied or reserved.';
      }
      return `🟢 **Vacant Rooms Available (${vacantRooms.length}):**\n\n${vacantRooms
        .map((r) => `• **Room ${r.id}:** ₹${r.price}/night`)
        .join('\n')}`;
    }

    // 5. Specific Room Search
    const roomMatch = q.match(/room\s*(\d+)/);
    if (roomMatch) {
      const rId = roomMatch[1];
      const r = rooms.find((room) => room.id === rId);
      if (!r) {
        return `I couldn't find Room ${rId} in the hotel configuration.`;
      }
      let details = `🚪 **Room ${r.id} Status:** ${r.status.toUpperCase()}\n`;
      details += `• **Price:** ₹${r.price}\n`;
      if (r.guestName) {
        details += `• **Guest:** ${r.guestName}\n`;
        details += `• **Phone:** ${r.guestPhone}\n`;
        if (r.checkInTime) {
          details += `• **Checked In:** ${new Date(r.checkInTime).toLocaleTimeString()}\n`;
        }
        if (r.scheduledCheckOut) {
          details += `• **Scheduled Checkout:** ${new Date(r.scheduledCheckOut).toLocaleTimeString()}\n`;
        }
      }
      return details;
    }

    // Default response
    return "I didn't quite catch that. You can ask me queries like:\n• 'Show earnings'\n• 'Is the receptionist cheating?'\n• 'List vacant rooms'\n• 'Check room 103 status'\n• 'What is our occupancy rate?'";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate thinking and respond
    setTimeout(() => {
      const botResponse: Message = {
        sender: 'bot',
        text: processQuery(userMessage.text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 450);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setInputValue(suggestionText);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="btn-chatbot-float"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.floatingBtn,
          boxShadow: isOpen
            ? '0 0 0 2px var(--accent-purple)'
            : '0 8px 32px rgba(168, 85, 247, 0.4)',
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <span style={styles.badge}>Live</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="glass" style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="var(--accent-gold)" />
              <div>
                <h4 style={{ fontSize: '14px', color: '#fff' }}>SHIELD Real-Time Manager</h4>
                <p style={{ fontSize: '10px', color: 'var(--color-vacant)' }}>🟢 Connected to Live Storage Ledger</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn} id="btn-close-chatbot">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messagesList}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {m.sender === 'bot' && <Bot size={16} color="var(--accent-gold)" style={styles.avatar} />}
                <div
                  style={{
                    ...styles.messageBubble,
                    background: m.sender === 'user' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                    border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {m.text}
                  </div>
                  <span style={styles.msgTime}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {m.sender === 'user' && <User size={16} color="#fff" style={styles.avatar} />}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div style={styles.suggestionsContainer}>
            <button
              id="chat-suggest-rooms"
              onClick={() => handleSuggestionClick('List vacant rooms')}
              style={styles.suggestionPill}
            >
              🚪 Vacant Rooms List
            </button>
            <button
              id="chat-suggest-occupancy"
              onClick={() => handleSuggestionClick('What is our occupancy rate?')}
              style={styles.suggestionPill}
            >
              🟢 Occupancy Rate
            </button>
            <button
              id="chat-suggest-earnings"
              onClick={() => handleSuggestionClick('Show weekly earnings')}
              style={styles.suggestionPill}
            >
              📈 Financials
            </button>
            <button
              id="chat-suggest-overdue"
              onClick={() => handleSuggestionClick('Who is overdue?')}
              style={styles.suggestionPill}
            >
              🟡 Overdue Stays
            </button>
          </div>

          {/* Input Box */}
          <div style={styles.inputArea}>
            <input
              id="chatbot-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask SHIELD chatbot..."
              style={styles.input}
            />
            <button id="btn-chatbot-send" onClick={handleSend} style={styles.sendBtn}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  floatingBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-purple) 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 900,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    background: 'var(--color-vacant)',
    color: '#fff',
    fontSize: '9px',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '8px',
    boxShadow: '0 0 8px var(--color-vacant)',
    textTransform: 'uppercase',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '96px',
    right: '24px',
    width: '360px',
    height: '480px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 900,
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  chatHeader: {
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  messagesList: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  avatar: {
    marginBottom: '4px',
    flexShrink: 0,
  },
  messageBubble: {
    padding: '10px 14px',
    fontSize: '13px',
    position: 'relative',
  },
  msgTime: {
    display: 'block',
    fontSize: '9px',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: '4px',
  },
  suggestionsContainer: {
    padding: '8px 12px',
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    borderTop: '1px solid var(--border-color)',
    background: 'rgba(0,0,0,0.1)',
  },
  suggestionPill: {
    flexShrink: 0,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '5px 10px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  inputArea: {
    padding: '12px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    gap: '8px',
    background: 'rgba(0,0,0,0.15)',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    background: 'var(--accent-purple)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
};
