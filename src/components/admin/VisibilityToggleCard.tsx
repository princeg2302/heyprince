'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export function VisibilityToggleCard() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/visibility');
      const data = await res.json();
      if (res.ok && data.success && data.settings) {
        setEnabled(data.settings.services_and_contact_enabled);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (nextState: boolean) => {
    setUpdating(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEnabled(nextState);
        setMsg({
          text: nextState
            ? 'Services cards, /services, and /contact are now LIVE & VISIBLE.'
            : 'Services cards, /services, and /contact are now HIDDEN.',
          type: 'success',
        });
        setTimeout(() => setMsg(null), 5000);
      } else {
        setMsg({ text: data.error || 'Failed to update visibility.', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Network error updating visibility.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: enabled
          ? 'linear-gradient(145deg, rgba(0, 245, 160, 0.05) 0%, rgba(13, 13, 20, 0.95) 100%)'
          : 'linear-gradient(145deg, rgba(255, 51, 102, 0.05) 0%, rgba(13, 13, 20, 0.95) 100%)',
        border: enabled
          ? '1px solid rgba(0, 245, 160, 0.25)'
          : '1px solid rgba(255, 51, 102, 0.35)',
        borderRadius: '14px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: enabled
          ? '0 10px 30px rgba(0, 245, 160, 0.04)'
          : '0 10px 30px rgba(255, 51, 102, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: enabled ? 'rgba(0, 245, 160, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                color: enabled ? '#00f5a0' : '#ff3366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {enabled ? <Eye size={18} /> : <EyeOff size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Services &amp; Contact Page Visibility
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Master toggle for services cards, /services listing, and /contact page
              </div>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.86rem',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.5,
              margin: '12px 0 16px',
            }}
          >
            {enabled ? (
              <span>
                🟢 <strong>Currently VISIBLE:</strong> Visitors can see the stacked services cards in the footer, browse the <code style={{ color: '#00f5a0' }}>/services</code> directory, and access the <code style={{ color: '#00f5a0' }}>/contact</code> inquiry page.
              </span>
            ) : (
              <span>
                🔴 <strong>Currently HIDDEN:</strong> The stacked services cards, the <code style={{ color: '#ff3366' }}>/services</code> page, and the <code style={{ color: '#ff3366' }}>/contact</code> page are concealed from public visitors.
              </span>
            )}
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: enabled ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 51, 102, 0.12)',
                color: enabled ? '#00f5a0' : '#ff3366',
                border: enabled ? '1px solid rgba(0, 245, 160, 0.3)' : '1px solid rgba(255, 51, 102, 0.3)',
              }}
            >
              {enabled ? '● PUBLIC VISIBILITY ACTIVE' : '○ PUBLICLY HIDDEN'}
            </span>

            <a
              href="/services"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Test /services <ExternalLink size={12} />
            </a>

            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Test /contact <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Big Switch Button */}
        <div>
          <button
            type="button"
            disabled={loading || updating}
            onClick={() => handleToggle(!enabled)}
            style={{
              background: enabled
                ? 'linear-gradient(135deg, #00f5a0 0%, #00d084 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: enabled
                ? '1px solid #00f5a0'
                : '1px solid rgba(255, 255, 255, 0.2)',
              color: enabled ? '#041f16' : '#ffffff',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: loading || updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: enabled
                ? '0 6px 20px rgba(0, 245, 160, 0.3)'
                : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {updating ? (
              <>
                <Loader2 size={16} className="hpa-spin" />
                <span>Updating...</span>
              </>
            ) : enabled ? (
              <>
                <Eye size={16} />
                <span>ACTIVE (Click to Hide)</span>
              </>
            ) : (
              <>
                <EyeOff size={16} style={{ color: '#ff3366' }} />
                <span>HIDDEN (Click to Show)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: msg.type === 'success' ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 51, 102, 0.12)',
            color: msg.type === 'success' ? '#00f5a0' : '#ff3366',
            border: msg.type === 'success' ? '1px solid rgba(0, 245, 160, 0.3)' : '1px solid rgba(255, 51, 102, 0.3)',
          }}
        >
          {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
}

