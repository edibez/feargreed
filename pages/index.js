import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  async function fetchLatest() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/fng/aggregate');
      if (!resp.ok) throw new Error('Network error');
      const body = await resp.json();
      if (typeof body.aggregate_value !== 'number') throw new Error('Unexpected response');
      setPayload({ body });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(id);
  }, []);

  const getLabel = (value) => {
    if (value <= 25) return 'EXTREME FEAR';
    if (value <= 45) return 'FEAR';
    if (value <= 55) return 'NEUTRAL';
    if (value <= 75) return 'GREED';
    return 'EXTREME GREED';
  };

  const getColor = (value) => {
    if (value <= 25) return '#f93a37';
    if (value <= 45) return '#ff8c42';
    if (value <= 55) return '#ffd93d';
    if (value <= 75) return '#6bcf7f';
    return '#16c172';
  };

  const getGradient = (value) => {
    if (value <= 25) return 'linear-gradient(135deg, #f93a37 0%, #ff6b6b 100%)';
    if (value <= 45) return 'linear-gradient(135deg, #ff8c42 0%, #ffad60 100%)';
    if (value <= 55) return 'linear-gradient(135deg, #ffd93d 0%, #f9ca24 100%)';
    if (value <= 75) return 'linear-gradient(135deg, #6bcf7f 0%, #95e1a4 100%)';
    return 'linear-gradient(135deg, #16c172 0%, #38d39f 100%)';
  };

  return (
    <>
      <Head>
        <title>NOBI Crypto Fear & Greed Index</title>
        <meta name="description" content="Real-time cryptocurrency market sentiment analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #333;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main style={{ 
        minHeight: '100vh',
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            animation: 'fadeIn 0.6s ease-out',
          }}>
            <h1 style={{ 
              fontSize: 'clamp(36px, 8vw, 64px)', 
              fontWeight: 800, 
              margin: 0, 
              marginBottom: '16px',
              color: '#ffffff',
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              letterSpacing: '-1px',
            }}>
              NOBI Crypto Fear & Greed Index
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(16px, 3vw, 20px)', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              fontWeight: 400,
            }}>
              Real-time cryptocurrency market sentiment analysis
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255,255,255,0.3)',
                borderTop: '4px solid #ffffff',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'rotate 1s linear infinite',
              }}></div>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', fontWeight: 500 }}>
                Loading latest index...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{ 
              padding: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #ff6b6b',
              borderRadius: '16px',
              color: '#d63031',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              animation: 'fadeIn 0.3s ease-out',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: 600 }}>Failed to Load Data</h3>
              <p style={{ fontSize: '16px', opacity: 0.8 }}>{error}</p>
            </div>
          )}

          {/* Main Content */}
          {payload && (
            <div style={{ animation: 'fadeIn 0.6s ease-out 0.2s backwards' }}>
              {/* Hero Card with Gauge */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '24px',
                padding: 'clamp(32px, 5vw, 64px)',
                marginBottom: '32px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '48px',
                }}>
                  {/* Large value display */}
                  <div style={{
                    display: 'inline-block',
                    background: getGradient(payload.body.aggregate_value),
                    borderRadius: '24px',
                    padding: '32px 48px',
                    marginBottom: '24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  }}>
                    <div style={{
                      fontSize: 'clamp(64px, 12vw, 120px)',
                      fontWeight: 900,
                      color: '#ffffff',
                      lineHeight: 1,
                      marginBottom: '8px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}>
                      {payload.body.aggregate_value}
                    </div>
                    <div style={{
                      fontSize: 'clamp(18px, 3vw, 24px)',
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}>
                      {getLabel(payload.body.aggregate_value)}
                    </div>
                  </div>

                  {/* Gauge visualization */}
                  <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '20px 0',
                  }}>
                    <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto' }}>
                      <defs>
                        <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#f93a37', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#ff6b6b', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#ff8c42', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#ffad60', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="gradYellow" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#ffd93d', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#f9ca24', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="gradLightGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#6bcf7f', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#95e1a4', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#16c172', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#38d39f', stopOpacity: 1 }} />
                        </linearGradient>
                        <filter id="gaugeShadow">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>

                      {/* Background arc */}
                      <path 
                        d="M 20 100 A 80 80 0 0 1 180 100" 
                        fill="none" 
                        stroke="#e8e8e8" 
                        strokeWidth="20"
                        strokeLinecap="round"
                      />

                      {/* Colored segments */}
                      <path d="M 20 100 A 80 80 0 0 1 52 36" fill="none" stroke="url(#gradRed)" strokeWidth="18" strokeLinecap="round" />
                      <path d="M 52.5 36 A 80 80 0 0 1 100 20" fill="none" stroke="url(#gradOrange)" strokeWidth="18" strokeLinecap="round" />
                      <path d="M 100 20 A 80 80 0 0 1 148 36" fill="none" stroke="url(#gradYellow)" strokeWidth="18" strokeLinecap="round" />
                      <path d="M 148 36 A 80 80 0 0 1 170 70" fill="none" stroke="url(#gradLightGreen)" strokeWidth="18" strokeLinecap="round" />
                      <path d="M 170 70 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gradGreen)" strokeWidth="18" strokeLinecap="round" />

                      {/* Scale markers - only 0 and 100 */}
                      <text x="20" y="95" fontSize="12" fill="#666" fontWeight="700" textAnchor="middle">0</text>
                      <text x="180" y="95" fontSize="12" fill="#666" fontWeight="700" textAnchor="middle">100</text>

                      {/* Needle */}
                      <line 
                        x1="100" 
                        y1="100" 
                        x2={100 + 65 * Math.cos((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)} 
                        y2={100 - 65 * Math.sin((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)}
                        stroke="#2c2c2c" 
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter="url(#gaugeShadow)"
                      />
                      <circle cx="100" cy="100" r="8" fill="#2c2c2c" filter="url(#gaugeShadow)" />
                      <circle cx="100" cy="100" r="4" fill="#fff" />
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 'clamp(12px, 3vw, 24px)',
                  flexWrap: 'wrap',
                  padding: '24px 0',
                  borderTop: '1px solid #e8e8e8',
                }}>
                  {[
                    { color: '#f93a37', label: 'Extreme Fear' },
                    { color: '#ff8c42', label: 'Fear' },
                    { color: '#ffd93d', label: 'Neutral' },
                    { color: '#6bcf7f', label: 'Greed' },
                    { color: '#16c172', label: 'Extreme Greed' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: item.color, 
                        borderRadius: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }} />
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: 600 }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Sources */}
              {payload.body.sources && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ 
                    fontSize: 'clamp(24px, 4vw, 32px)', 
                    fontWeight: 700, 
                    marginBottom: '24px',
                    color: '#fff',
                    textAlign: 'center',
                  }}>
                    Data Sources
                  </h2>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                  }}>
                    {payload.body.sources.map((source, idx) => (
                      <div key={idx} style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '16px',
                        padding: '32px 24px',
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease',
                        cursor: 'default',
                        backdropFilter: 'blur(10px)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#999', 
                          marginBottom: '16px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '1px',
                        }}>
                          {source.name.replace('source', 'Source ')}
                        </div>
                        <div style={{ 
                          fontSize: '56px', 
                          fontWeight: 800,
                          background: getGradient(source.value),
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          marginBottom: '8px',
                        }}>
                          {source.value}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {getLabel(source.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '24px 32px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#666',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>📊</span>
                    <span style={{ fontWeight: 600 }}>
                      {payload.body.source_count} Data Sources
                    </span>
                  </div>
                  <div style={{ color: '#ddd' }}>•</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>
                      {payload.body.cached ? '💾' : '🔄'}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {payload.body.cached ? 'Cached' : 'Live Data'}
                    </span>
                  </div>
                  <div style={{ color: '#ddd' }}>•</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>⏱️</span>
                    <span style={{ fontWeight: 600 }}>
                      Updates every 5 min
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                textAlign: 'center',
                marginTop: '48px',
                padding: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
              }}>
                <p style={{ margin: 0 }}>
                  Data aggregated from Alternative.me, CoinMarketCap, and CoinStats
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
