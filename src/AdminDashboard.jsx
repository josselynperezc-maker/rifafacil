
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import AdminRaffles from './AdminRaffles'

function AdminDashboard({ onLogout }) {
  const [activeSection, setActiveSection] = useState('Resumen')

  const [stats, setStats] = useState({
    raffles: 0,
    reservations: 0,
    pending: 0,
    sold: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const [
        rafflesResult,
        reservationsResult,
        pendingResult,
        soldResult
      ] = await Promise.all([
        supabase.from('raffles').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('raffle_numbers').select('*', { count: 'exact', head: true }).eq('status', 'sold')
      ])

      setStats({
        raffles: rafflesResult.count ?? 0,
        reservations: reservationsResult.count ?? 0,
        pending: pendingResult.count ?? 0,
        sold: soldResult.count ?? 0
      })

      setLoading(false)
    }

    loadStats()
  }, [])

  if (activeSection === 'Rifas') {
    return (
      <AdminRaffles
        onBack={() => setActiveSection('Resumen')}
      />
    )
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          🎟️ Rifa<span>Fácil</span>
        </div>

        <p className="sidebar-label">MENÚ PRINCIPAL</p>

        <div
          className={`sidebar-link ${activeSection === 'Resumen' ? 'active' : ''}`}
          onClick={() => setActiveSection('Resumen')}
        >
          📊 Resumen
        </div>

        <div
          className={`sidebar-link ${activeSection === 'Rifas' ? 'active' : ''}`}
          onClick={() => setActiveSection('Rifas')}
        >
          🎟️ Rifas
        </div>

        <div className="sidebar-link">👥 Participantes</div>
        <div className="sidebar-link">📋 Reservas</div>
        <div className="sidebar-link">💰 Pagos</div>
        <div className="sidebar-link">🏆 Sorteos</div>

        <button className="logout-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Panel de administración</h1>
            <p>Bienvenido a la gestión de RifaFácil.</p>
          </div>

          <span className="admin-badge">Administrador</span>
        </header>

        <section className="admin-welcome">
          <div>
            <h2>¡Hola! 👋</h2>
            <p>Desde aquí podrás controlar tus rifas y administrar las reservas.</p>
          </div>
          <span>🎉</span>
        </section>

        <h2 className="stats-title">Resumen general</h2>

        {loading ? (
          <p>Cargando estadísticas...</p>
        ) : (
          <section className="stats-grid">
            <article className="stat-card">
              <span>🎟️</span>
              <p>Total de rifas</p>
              <strong>{stats.raffles}</strong>
            </article>

            <article className="stat-card">
              <span>📋</span>
              <p>Total de reservas</p>
              <strong>{stats.reservations}</strong>
            </article>

            <article className="stat-card">
              <span>⏳</span>
              <p>Reservas pendientes</p>
              <strong>{stats.pending}</strong>
            </article>

            <article className="stat-card">
              <span>🏆</span>
              <p>Números vendidos</p>
              <strong>{stats.sold}</strong>
            </article>
          </section>
        )}

        <section className="admin-info">
          <h2>Gestión de rifas</h2>
          <p>
            Aquí podrás crear nuevas rifas, revisar participantes,
            confirmar pagos y administrar los sorteos.
          </p>
          <p className="coming-soon">
            Estamos preparando las herramientas de gestión.
          </p>
        </section>
      </main>
    </div>
  )
}

export default AdminDashboard
