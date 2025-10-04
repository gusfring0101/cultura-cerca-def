import { useState } from 'react'

export default function App() {
  const [location, setLocation] = useState('')
  const [km, setKm] = useState(15)
  const [budget, setBudget] = useState(50)
  const [prefs, setPrefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const prefOptions = ['museums', 'galleries', 'theaters', 'concerts', 'monuments', 'festivals']

  const togglePref = (pref) => {
    setPrefs(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref])
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!location.trim()) return

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const url = 'https://cultura-cerca.duckdns.org/webhook/cc-search'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location.trim(),
          maxKm: km,
          maxBudget: budget,
          prefs
        })
      })

      if (!response.ok) throw new Error(`Error ${response.status}`)

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#2c3e50',
          margin: '0 0 30px 0'
        }}>
          CulturaCerca
        </h1>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              📍 Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Madrid, Barcelona..."
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ecf0f1',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                📏 Distancia (km)
              </label>
              <input
                type="number"
                value={km}
                onChange={(e) => setKm(Number(e.target.value))}
                min="1"
                max="100"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                💰 Presupuesto (€)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min="0"
                max="1000"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              🎨 Preferencias
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px'
            }}>
              {prefOptions.map(pref => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => togglePref(pref)}
                  style={{
                    padding: '10px',
                    border: '2px solid #ecf0f1',
                    borderRadius: '20px',
                    background: prefs.includes(pref) ? '#667eea' : 'white',
                    color: prefs.includes(pref) ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                  }}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '18px',
              background: loading ? '#ccc' : 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? '🔍 Buscando...' : '🚀 Buscar Experiencias'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#fee',
            color: '#c53030',
            borderRadius: '10px',
            border: '1px solid #fed7d7'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {results && (
          <div style={{
            marginTop: '30px',
            padding: '25px',
            background: '#f8f9fa',
            borderRadius: '15px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
              🎉 Resultados encontrados
            </h3>
            <pre style={{
              background: 'white',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.9rem',
              maxHeight: '300px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}