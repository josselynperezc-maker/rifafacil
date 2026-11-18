
import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabase'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import PublicRaffle from './PublicRaffle'

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarRifas() {
      const { data, error } = await supabase
        .from('raffles')
        .select('id, title, slug, prize_description, ticket_price, total_numbers, draw_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error al cargar rifas:', error.message)
        setError('No fue posible cargar las rifas. Intenta nuevamente.')
        setLoading(false)
        return
      }

      const rifasConDisponibilidad = await Promise.all(
        data.map(async (raffle) => {
          const { data: numbers, error: numbersError } = await supabase
            .rpc('get_available_numbers', {
              p_raffle_id: raffle.id
            })

          return {
            ...raffle,
            availableNumbers: numbersError ? null : numbers?.length ?? 0
          }
        })
      )

      setRaffles(rifasConDisponibilidad)
      setLoading(false)
    }

    cargarRifas()
  }, [])

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
const raffleSlug = window.location.pathname.startsWith('/rifa/')
  ? window.location.pathname.split('/')[2]
  : null

if (raffleSlug) {
  return <PublicRaffle slug={raffleSlug} />
}
  if (showDashboard) {
    return (
      <AdminDashboard
        onLogout={async () => {
          await supabase.auth.signOut()
          setShowDashboard(false)
          setShowAdminLogin(false)
        }}
      />
    )
  }

  if (showAdminLogin) {
    return (
      <AdminLogin
        onBack={() => setShowAdminLogin(false)}
        onLoginSuccess={() => {
          setShowAdminLogin(false)
          setShowDashboard(true)
        }}
      />
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">🎟️</span>
          <span>Rifa<span className="logo-highlight">Fácil</span></span>
        </div>

        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#rifas">Rifas</a>
          <a href="#como-funciona">¿Cómo funciona?</a>
        </nav>

        <button
          className="admin-button"
          onClick={() => setShowAdminLogin(true)}
        >
          Acceso administrador
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <span className="eyebrow">
              🎉 ¡La suerte puede estar de tu lado!
            </span>

            <h1>
              Participa, elige tu número y
              <span> gana grandes premios.</span>
            </h1>

            <p>
              Encuentra rifas increíbles, selecciona tus números favoritos
              y participa de manera fácil y segura.
            </p>

            <a href="#rifas" className="main-button">
              Ver rifas disponibles →
            </a>
          </div>

          <div className="hero-card">
            <div className="ticket-decoration">🎁</div>
            <span>BIENVENIDO A</span>
            <h2>RifaFácil</h2>
            <p>Tu próximo premio podría estar aquí.</p>

            <div className="ticket-numbers">
              <span>08</span>
              <span>15</span>
              <span>27</span>
              <span>36</span>
            </div>

            <small>¡Elige tu número de la suerte!</small>
          </div>
        </section>

        <section className="features" id="como-funciona">
          <div>
            <span>🎯</span>
            <h3>Elige tus números</h3>
            <p>Selecciona los números que deseas reservar.</p>
          </div>

          <div>
            <span>📱</span>
            <h3>Registra tus datos</h3>
            <p>Completa tus datos para realizar tu reserva.</p>
          </div>

          <div>
            <span>🏆</span>
            <h3>Participa y gana</h3>
            <p>Espera el sorteo y descubre al ganador.</p>
          </div>
        </section>

        <section className="raffles" id="rifas">
          <span className="eyebrow">NUESTRAS OPORTUNIDADES</span>

          <h2>Rifas disponibles</h2>

          <p>Descubre nuestros premios y participa.</p>

          {loading && (
            <div className="empty-state">
              <p>Cargando rifas...</p>
            </div>
          )}

          {!loading && error && (
            <div className="empty-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && raffles.length === 0 && (
            <div className="empty-state">
              <span>🎟️</span>
              <h3>Estamos preparando nuestras rifas</h3>
              <p>Muy pronto podrás elegir tus números favoritos.</p>
            </div>
          )}

          {!loading && !error && raffles.length > 0 && (
            <div className="raffle-grid">
              {raffles.map((raffle) => (
                <article className="raffle-card" key={raffle.id}>
                  <div className="raffle-image">🎁</div>

                  <div className="raffle-info">
                    <span className="raffle-status">RIFA DISPONIBLE</span>

                    <h3>{raffle.title}</h3>

                    <p>
                      {raffle.prize_description ||
                        'Participa y gana este increíble premio.'}
                    </p>

                    <div className="raffle-details">
                      <div>
                        <small>Valor por número</small>
                        <strong>{formatPrice(raffle.ticket_price)}</strong>
                      </div>

                      <div>
                        <small>Números disponibles</small>
                        <strong>
                          {raffle.availableNumbers === null
                            ? 'Consultar'
                            : raffle.availableNumbers}
                        </strong>
                      </div>
                    </div>

                    <button
  className="main-button raffle-button"
  onClick={() => window.location.href = `/rifa/${raffle.slug}`}
>
  Ver números y participar
</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <div className="logo">
          🎟️ Rifa<span className="logo-highlight">Fácil</span>
        </div>

        <p>Una forma fácil de participar y ganar.</p>

        <small>© 2026 RifaFácil. Todos los derechos reservados.</small>
      </footer>
    </div>
  )
}

export default App
