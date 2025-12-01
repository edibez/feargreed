import { useEffect, useState } from 'react';

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
    if (value <= 25) return '#dc4433';
    if (value <= 45) return '#f5a89c';
    if (value <= 55) return '#d1d1d1';
    if (value <= 75) return '#a8d5a8';
    return '#4caf50';
  };

  return (
    <main style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', 
      padding: '40px 24px', 
      maxWidth: 1200, 
      margin: '0 auto',
      backgroundColor: '#fff'
    }}>
      <h1 style={{ 
        fontSize: 48, 
        fontWeight: 700, 
        margin: 0, 
        marginBottom: 8,
        color: '#000'
      }}>
        Fear & Greed Index
      </h1>
      
      <p style={{ 
        fontSize: 18, 
        color: '#000', 
        margin: 0,
        marginBottom: 32 
      }}>
        What emotion is driving the market now?
      </p>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
          Loading latest index…
        </div>
      )}

      {error && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: 8,
          color: '#c33' 
        }}>
          Failed to load latest index: {error}
        </div>
      )}

      {payload && (
        <div>
          {/* Main gauge display */}
          <div style={{ 
            position: 'relative',
            width: '100%',
            maxWidth: 500,
            margin: '0 auto 32px',
            padding: '20px 0'
          }}>
            <svg viewBox="0 0 200 130" style={{ width: '100%', height: 'auto' }}>
              {/* Outer arc background */}
              <path 
                d="M 30 100 A 70 70 0 0 1 170 100" 
                fill="none" 
                stroke="#e5e5e5" 
                strokeWidth="28"
                strokeLinecap="round"
              />
              
              {/* Colored arc segments */}
              {/* Extreme Fear - Red */}
              <path 
                d="M 30 100 A 70 70 0 0 1 61.8 41.8" 
                fill="none" 
                stroke="#ea4b40" 
                strokeWidth="26"
                strokeLinecap="round"
                opacity="0.9"
              />
              
              {/* Fear - Light Red/Orange */}
              <path 
                d="M 62 42 A 70 70 0 0 1 100 30" 
                fill="none" 
                stroke="#f5a89c" 
                strokeWidth="26"
                strokeLinecap="round"
                opacity="0.9"
              />
              
              {/* Neutral - Gray */}
              <path 
                d="M 100 30 A 70 70 0 0 1 138 42" 
                fill="none" 
                stroke="#d0d0d0" 
                strokeWidth="26"
                strokeLinecap="round"
              />
              
              {/* Greed - Light Green */}
              <path 
                d="M 138.2 41.8 A 70 70 0 0 1 170 100" 
                fill="none" 
                stroke="#c5c5c5" 
                strokeWidth="26"
                strokeLinecap="round"
                opacity="0.7"
              />
              
              {/* Scale dots */}
              <circle cx="30" cy="100" r="2" fill="#999" />
              <circle cx="61.8" cy="41.8" r="2" fill="#999" />
              <circle cx="100" cy="30" r="2" fill="#999" />
              <circle cx="138.2" cy="41.8" r="2" fill="#999" />
              <circle cx="170" cy="100" r="2" fill="#999" />
              
              {/* Scale numbers */}
              <text x="30" y="120" fontSize="9" fill="#999" fontWeight="400" textAnchor="middle">0</text>
              <text x="65" y="120" fontSize="9" fill="#999" fontWeight="400" textAnchor="middle">25</text>
              <text x="100" y="120" fontSize="9" fill="#999" fontWeight="400" textAnchor="middle">50</text>
              <text x="135" y="120" fontSize="9" fill="#999" fontWeight="400" textAnchor="middle">75</text>
              <text x="170" y="120" fontSize="9" fill="#999" fontWeight="400" textAnchor="middle">100</text>
              
              {/* Needle with shadow */}
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              <line 
                x1="100" 
                y1="100" 
                x2={100 + 55 * Math.cos((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)} 
                y2={100 - 55 * Math.sin((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)}
                stroke="#2c2c2c" 
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#shadow)"
              />
              <circle cx="100" cy="100" r="6" fill="#2c2c2c" filter="url(#shadow)" />
              <circle cx="100" cy="100" r="3" fill="#fff" />
            </svg>
            
            {/* Center value display */}
            <div style={{ 
              position: 'absolute',
              bottom: 'calc(5% + 110px)',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 72, 
                fontWeight: 700,
                color: getColor(payload.body.aggregate_value),
                lineHeight: 1,
                marginBottom: 4
              }}>
                {payload.body.aggregate_value}
              </div>
              <div style={{ 
                fontSize: 13,
                color: '#666',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {getLabel(payload.body.aggregate_value)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            marginBottom: 48,
            flexWrap: 'wrap',
            padding: '0 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#ea4b40', 
                borderRadius: 2 
              }} />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Extreme Fear</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#f5a89c', 
                borderRadius: 2 
              }} />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Fear</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#d0d0d0', 
                borderRadius: 2 
              }} />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Neutral</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#c5c5c5', 
                borderRadius: 2 
              }} />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Greed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 16, 
                height: 16, 
                backgroundColor: '#a8d5a8', 
                borderRadius: 2 
              }} />
              <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>Extreme Greed</span>
            </div>
          </div>

          {/* Individual source values */}
          {payload.body.sources && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                marginBottom: 24,
                color: '#000'
              }}>
                Individual Sources
              </h2>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 20
              }}>
                {payload.body.sources.map((source, idx) => (
                  <div key={idx} style={{ 
                    padding: 20,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: 13, 
                      color: '#666', 
                      marginBottom: 12,
                      textTransform: 'capitalize',
                      fontWeight: 500
                    }}>
                      {source.name}
                    </div>
                    <div style={{ 
                      fontSize: 48, 
                      fontWeight: 700,
                      color: getColor(source.value)
                    }}>
                      {source.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta information */}
          <div style={{ 
            marginTop: 32,
            padding: 20,
            backgroundColor: '#f9f9f9',
            borderRadius: 8,
            fontSize: 13,
            color: '#666'
          }}>
            <div style={{ marginBottom: 8 }}>
              Aggregate of {payload.body.source_count} sources
            </div>
            <div style={{ marginBottom: 8 }}>
              {payload.body.cached ? 'Served from server cache' : 'Fresh aggregation'}
            </div>
            <div>
              Includes Alternative.me + additional sources (with attribution shown where applicable).
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
