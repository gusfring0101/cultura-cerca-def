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
      console.log('📥 Respuesta completa:', data)
      console.log('📥 Tipo de data:', typeof data, 'Es array:', Array.isArray(data))

      // Extraer los resultados de la estructura de n8n
      let finalResults = []

      try {
        if (Array.isArray(data) && data.length > 0) {
          // Caso: [{ results: [...], fallback: false, debug: {...} }]
          const firstItem = data[0]
          console.log('📦 Primer elemento:', firstItem)

          if (firstItem && Array.isArray(firstItem.results)) {
            finalResults = firstItem.results
            console.log('✅ Extraído data[0].results:', finalResults.length, 'elementos')
          } else {
            console.log('❌ data[0].results no es un array válido')
            finalResults = []
          }
        } else if (data && Array.isArray(data.results)) {
          // Caso: { results: [...] }
          finalResults = data.results
          console.log('✅ Extraído data.results:', finalResults.length, 'elementos')
        } else {
          console.log('❌ Estructura no reconocida, usando array vacío')
          finalResults = []
        }
      } catch (error) {
        console.error('❌ Error parseando resultados:', error)
        finalResults = []
      }

      console.log('🎯 Resultados finales a mostrar:', finalResults)
      console.log('🎯 Primer resultado de ejemplo:', finalResults[0])

      setResults(finalResults)
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
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', textAlign: 'center' }}>
              🎉 {Array.isArray(results) ? results.length : 0} experiencias culturales encontradas
            </h3>

            {/* Carousel Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: '15px'
            }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                paddingBottom: '10px',
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory'
              }}>
                {(Array.isArray(results) ? results : []).map((place, index) => (
                  <div key={place.id || index} style={{
                    flex: '0 0 350px',
                    background: 'white',
                    borderRadius: '15px',
                    padding: '25px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #e9ecef',
                    scrollSnapAlign: 'start',
                    position: 'relative',
                    minHeight: '400px'
                  }}>
                    {/* Score Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}>
                      ⭐ {place.score ? place.score.toFixed(2) : 'N/A'}
                    </div>

                    {/* Nombre del lugar */}
                    <h4 style={{
                      margin: '0 0 15px 0',
                      color: '#2c3e50',
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      paddingRight: '90px',
                      lineHeight: '1.3'
                    }}>
                      {place.name || 'Lugar cultural'}
                    </h4>

                    {/* Tipo */}
                    <div style={{
                      background: '#e9ecef',
                      color: '#495057',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'inline-block',
                      marginBottom: '20px'
                    }}>
                      {place.type || 'Cultural'}
                    </div>

                    {/* Información principal */}
                    <div style={{ marginBottom: '20px' }}>
                      {/* Distancia */}
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{
                          color: '#666',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>📍 Distancia:</span>
                        <div style={{
                          color: '#2c3e50',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginTop: '4px'
                        }}>
                          {place.distanceKm ? `${place.distanceKm.toFixed(2)} km` : 'N/A'}
                        </div>
                      </div>

                      {/* Precio */}
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{
                          color: '#666',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>💰 Precio:</span>
                        <div style={{
                          color: place.price === 0 ? '#28a745' : '#2c3e50',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          marginTop: '4px'
                        }}>
                          {place.price === 0 ? 'Gratis' : place.price ? `${place.price}€` : 'N/A'}
                        </div>
                      </div>

                      {/* Dirección */}
                      {place.address && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{
                            color: '#666',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}>🏠 Dirección:</span>
                          <div style={{
                            color: '#2c3e50',
                            fontSize: '0.95rem',
                            marginTop: '4px',
                            lineHeight: '1.4'
                          }}>
                            {place.address}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botón para más información */}
                    {place.url && (
                      <a
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          color: 'white',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontSize: '1rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          marginTop: 'auto',
                          position: 'absolute',
                          bottom: '25px',
                          left: '25px',
                          right: '25px',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)'
                          e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = 'none'
                        }}
                      >
                        🔗 Más información
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Indicador de deslizar */}
            <div style={{
              textAlign: 'center',
              marginTop: '15px',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              👈 Desliza para ver más experiencias 👉
            </div>
          </div>
        )}
      </div>
    </div>
  )
}