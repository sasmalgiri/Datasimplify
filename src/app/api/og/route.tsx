import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px',
          }}
        >
          {/* Logo area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <span style={{ fontSize: '56px' }}>📊</span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-1px',
              }}
            >
              CryptoReportKit
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '28px',
              color: '#10b981',
              fontWeight: 600,
              marginBottom: '24px',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            83+ Live Crypto Dashboards & Analytics
          </div>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#10b981' }}>83+</span>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>Dashboards</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6' }}>90+</span>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>Widgets</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#a855f7' }}>Free</span>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>To Start</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b' }}>BYOK</span>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>Your Keys</span>
            </div>
          </div>

          {/* URL */}
          <div
            style={{
              marginTop: '40px',
              fontSize: '18px',
              color: '#6b7280',
              display: 'flex',
            }}
          >
            cryptoreportkit.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
