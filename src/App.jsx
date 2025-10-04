import { useState } from 'react'

export default function App() {
  const [location, setLocation] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [km, setKm] = useState(15)
  const [budget, setBudget] = useState(50)
  const [prefs, setPrefs] = useState([])
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  // Preferencias en español con mapeo a inglés para n8n
  const prefOptions = [
    { id: 'museums', label: 'Museos' },
    { id: 'galleries', label: 'Galerías' },
    { id: 'theaters', label: 'Teatros' },
    { id: 'concerts', label: 'Conciertos' },
    { id: 'monuments', label: 'Monumentos' },
    { id: 'festivals', label: 'Festivales' }
  ]

  const togglePref = (prefId) => {
    setPrefs(prev => prev.includes(prefId) ? prev.filter(p => p !== prefId) : [...prev, prefId])
  }

  const getLocation = () => {
    setGeoLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocalización no es compatible con este navegador')
      setGeoLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setCoordinates({ lat, lng })
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        setGeoLoading(false)
      },
      (error) => {
        let errorMsg = 'Error obteniendo ubicación'
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado'
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Ubicación no disponible'
            break
          case error.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado'
            break
        }
        setError(errorMsg)
        setGeoLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!location.trim()) {
      setError('Por favor, introduce una ubicación o usa tu ubicación actual')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const url = 'https://cultura-cerca.duckdns.org/webhook/cc-search'

      // Preparar payload según lo que necesita n8n
      const payload = {
        location: coordinates ? {
          lat: coordinates.lat,
          lng: coordinates.lng
        } : location.trim(),
        maxKm: km,
        maxBudget: budget,
        prefs: prefs // Los IDs están en inglés como necesita n8n
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Madrid, Barcelona... o usa tu ubicación"
                style={{
                  flex: 1,
                  padding: '15px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading}
                style={{
                  padding: '15px 20px',
                  backgroundColor: geoLoading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: geoLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  minWidth: '120px'
                }}
              >
                {geoLoading ? '📍...' : '📍 Mi ubicación'}
              </button>
            </div>
            {coordinates && (
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                Coordenadas: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </small>
            )}
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
                  key={pref.id}
                  type="button"
                  onClick={() => togglePref(pref.id)}
                  style={{
                    padding: '10px',
                    border: '2px solid #ecf0f1',
                    borderRadius: '20px',
                    background: prefs.includes(pref.id) ? '#667eea' : 'white',
                    color: prefs.includes(pref.id) ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s'
                  }}
                >
                  {pref.label}
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
            ❌ {error}
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