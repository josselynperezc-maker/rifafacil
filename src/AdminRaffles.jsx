
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function AdminRaffles({ onBack }) {
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingRaffle, setEditingRaffle] = useState(null)

  const [form, setForm] = useState({
    title: '',
    prize_description: '',
    ticket_price: '',
    total_numbers: '',
    number_start: '0',
    draw_at: ''
  })

  useEffect(() => {
    loadRaffles()
  }, [])

  async function loadRaffles() {
    setLoading(true)

    const { data, error } = await supabase
      .from('raffles')
      .select('id, title, prize_description, ticket_price, total_numbers, number_start, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar rifas:', error.message)
      alert('No fue posible cargar las rifas.')
    } else {
      setRaffles(data || [])
    }

    setLoading(false)
  }

  function handleEdit(raffle) {
    setEditingRaffle(raffle)

    setForm({
      title: raffle.title,
      prize_description: raffle.prize_description || '',
      ticket_price: String(raffle.ticket_price),
      total_numbers: String(raffle.total_numbers),
      number_start: String(raffle.number_start),
      draw_at: raffle.draw_at
        ? new Date(
            new Date(raffle.draw_at).getTime() -
            new Date(raffle.draw_at).getTimezoneOffset() * 60000
          ).toISOString().slice(0, 16)
        : ''
    })

    setShowForm(true)
  }

  async function changeRaffleStatus(raffleId, newStatus) {
    const action = newStatus === 'published'
      ? 'publicar'
      : newStatus === 'closed'
        ? 'cerrar'
        : 'devolver a borrador'

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas ${action} esta rifa?`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('raffles')
      .update({ status: newStatus })
      .eq('id', raffleId)

    if (error) {
      console.error('Error al cambiar el estado:', error.message)
      alert('No se pudo cambiar el estado de la rifa.')
      return
    }

    alert('El estado de la rifa se actualizó correctamente.')
    loadRaffles()
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      alert('Tu sesión ha expirado. Inicia sesión nuevamente.')
      setSaving(false)
      return
    }

    const slug = `${form.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now()}`

    
    const raffleData = {
      title: form.title.trim(),
      prize_description: form.prize_description.trim(),
      ticket_price: Number(form.ticket_price),
      draw_at: form.draw_at || null
    }

    if (!editingRaffle) {
      const slug = `${form.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${Date.now()}`

      Object.assign(raffleData, {
        slug,
        total_numbers: Number(form.total_numbers),
        number_start: Number(form.number_start),
        number_padding: Math.max(
          2,
          String(
            Number(form.number_start) +
            Number(form.total_numbers) - 1
          ).length
        ),
        status: 'draft',
        created_by: userData.user.id
      })
    }


   
    let newRaffle = null
    let error = null

    if (editingRaffle) {
      const result = await supabase
        .from('raffles')
        .update(raffleData)
        .eq('id', editingRaffle.id)
        .select('id')
        .single()

      newRaffle = result.data
      error = result.error
    } else {
      const result = await supabase
        .from('raffles')
        .insert(raffleData)
        .select('id')
        .single()

      newRaffle = result.data
      error = result.error
    }


    if (error) {
      console.error('Error al crear rifa:', error.message)
      alert('No se pudo crear la rifa. Revisa los datos e intenta nuevamente.')
      setSaving(false)
      return
    }

    if (editingRaffle) {
      alert('¡Rifa actualizada correctamente!')

      setForm({
        title: '',
        prize_description: '',
        ticket_price: '',
        total_numbers: '',
        number_start: '0',
        draw_at: ''
      })

      setEditingRaffle(null)
      setShowForm(false)
      setSaving(false)
      loadRaffles()
      return
    }

    const { data: generated, error: numbersError } = await supabase
      .rpc('generate_raffle_numbers', {
        p_raffle_id: newRaffle.id
      })

    if (numbersError) {
      console.error('Error al generar números:', numbersError.message)
      await supabase.from('raffles').delete().eq('id', newRaffle.id)
      alert('La rifa no pudo generar sus números. No se guardó el registro.')
      setSaving(false)
      return
    }

    alert(`¡Rifa creada correctamente! Se generaron ${generated} números.`)

    setForm({
      title: '',
      prize_description: '',
      ticket_price: '',
      total_numbers: '',
      number_start: '0',
      draw_at: ''
    })

    setShowForm(false)
    setSaving(false)
    loadRaffles()
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          🎟️ Rifa<span>Fácil</span>
        </div>

        <p className="sidebar-label">MENÚ PRINCIPAL</p>

        <div className="sidebar-link" onClick={onBack}>📊 Resumen</div>
        <div className="sidebar-link active">🎟️ Rifas</div>
        <div className="sidebar-link">👥 Participantes</div>
        <div className="sidebar-link">📋 Reservas</div>
        <div className="sidebar-link">💰 Pagos</div>
        <div className="sidebar-link">🏆 Sorteos</div>

        <button className="logout-button" onClick={onBack}>
          ← Volver al resumen
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Gestión de rifas</h1>
            <p>Administra y crea las rifas de RifaFácil.</p>
          </div>

          <span className="admin-badge">Administrador</span>
        </header>

        <section className="management-content">
          <div className="management-title">
            <div>
              <h2>Mis rifas</h2>
              <p>Consulta y administra tus rifas.</p>
            </div>

            <button
              className="create-raffle-button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : '+ Crear nueva rifa'}
            </button>
          </div>

          {showForm && (
            <form className="raffle-form" onSubmit={handleCreate}>
            <h2>{editingRaffle ? 'Editar rifa' : 'Nueva rifa'}</h2>

              <label>Nombre de la rifa</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej. Gran rifa de Navidad"
                required
                maxLength={100}
              />

              <label>Descripción del premio</label>
              <textarea
                name="prize_description"
                value={form.prize_description}
                onChange={handleChange}
                placeholder="Describe el premio que se sorteará"
                rows="3"
              />

              <div className="raffle-form-grid">
                <div>
                  <label>Precio por número ($)</label>
                  <input
                    type="number"
                    name="ticket_price"
                    value={form.ticket_price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label>Cantidad de números</label>
                  <input
                    type="number"
                    name="total_numbers"
                    value={form.total_numbers}
                    onChange={handleChange}
                    min="1"
                    max="100000"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label>Número inicial</label>
                  <input
                    type="number"
                    name="number_start"
                    value={form.number_start}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label>Fecha del sorteo (opcional)</label>
                  <input
                    type="datetime-local"
                    name="draw_at"
                    value={form.draw_at}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="raffle-form-note">
                <strong>Estado inicial: Borrador</strong>
                <p>La rifa no será visible para los participantes hasta que decidas publicarla.</p>
              </div>

              <button type="submit" disabled={saving}>
                {saving
  ? 'Guardando...'
  : editingRaffle
    ? 'Guardar cambios'
    : 'Guardar como borrador'}
              </button>
            </form>
          )}

          {loading ? (
            <p>Cargando rifas...</p>
          ) : raffles.length === 0 ? (
            <div className="management-empty">
              <span>🎟️</span>
              <h3>Aún no tienes rifas creadas</h3>
              <p>Selecciona "Crear nueva rifa" para comenzar.</p>
            </div>
          ) : (
            <div className="management-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Números</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {raffles.map((raffle) => (
                    <tr key={raffle.id}>
                      <td>
                        <strong>{raffle.title}</strong>
                        <small>{raffle.prize_description}</small>
                      </td>
                      <td>${Number(raffle.ticket_price).toFixed(2)}</td>
                      <td>
                        {raffle.number_start} - {raffle.number_start + raffle.total_numbers - 1}
                      </td>
                      
<td>
  <span className={`raffle-state ${raffle.status}`}>
    {raffle.status === 'published'
      ? 'Publicada'
      : raffle.status === 'closed'
        ? 'Cerrada'
        : 'Borrador'}
  </span>
</td>

<td className="raffle-actions">

  <button
    onClick={() => handleEdit(raffle)}
  >
    Editar
  </button>

  {raffle.status === 'draft' && (
    <button
      onClick={() => changeRaffleStatus(raffle.id, 'published')}
    >
      Publicar
    </button>
  )}

  {raffle.status === 'published' && (
    <button
      onClick={() => changeRaffleStatus(raffle.id, 'closed')}
    >
      Cerrar
    </button>
  )}

  {raffle.status === 'closed' && (
    <button
      onClick={() => changeRaffleStatus(raffle.id, 'draft')}
    >
      Volver a borrador
    </button>
  )}
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default AdminRaffles
