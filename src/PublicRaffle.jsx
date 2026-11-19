
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function PublicRaffle({ slug }) {
  const [raffle, setRaffle] = useState(null)
  const [numbers, setNumbers] = useState([])
  const [selectedNumbers, setSelectedNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadRaffle()
  }, [slug])
const totalToPay = selectedNumbers.reduce(
  (total, number) => total + Number(raffle?.ticket_price || 0),
  0
)
  function toggleNumber(number) {
  setSelectedNumbers((previous) => {
    let updatedNumbers

    if (previous.includes(number)) {
      updatedNumbers = previous.filter((item) => item !== number)
    } else {
      updatedNumbers = [...previous, number]
    }

    console.log('Números seleccionados:', updatedNumbers)

    return updatedNumbers
  })
}
  async function loadRaffle() {
    setLoading(true)
    setErrorMessage('')

    const { data: raffleData, error: raffleError } = await supabase
      .from('raffles')
      .select('id, title, prize_description, ticket_price, total_numbers, draw_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (raffleError || !raffleData) {
      setErrorMessage('No encontramos esta rifa o ya no está disponible.')
      setLoading(false)
      return
    }

    setRaffle(raffleData)

    const { data: availableNumbers, error: numbersError } = await supabase
      .rpc('get_available_numbers', {
        p_raffle_id: raffleData.id
      })

    if (numbersError) {
      console.error('Error al cargar números:', numbersError.message)
      setErrorMessage('No fue posible cargar los números disponibles.')
    } else {
      setNumbers(availableNumbers || [])
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="public-raffle-page">Cargando rifa...</div>
  }

  if (errorMessage) {
    return <div className="public-raffle-page">{errorMessage}</div>
  }

  return (
    <main className="public-raffle-page">
      <button
        className="back-button"
        onClick={() => window.location.href = '/'}
      >
        ← Volver al inicio
      </button>

      <section className="public-raffle-card">
        <span className="raffle-label">🎁 RIFA DISPONIBLE</span>

        <h1>{raffle.title}</h1>

        <p>{raffle.prize_description}</p>

        <div className="public-raffle-price">
          Valor por número: <strong>${Number(raffle.ticket_price).toFixed(2)}</strong>
        </div>

        <h2>Números disponibles ({numbers.length})</h2>
{selectedNumbers.length > 0 && (
  <div className="selection-summary">
    <p>
      Números seleccionados: <strong>{selectedNumbers.length}</strong>
    </p>

    

  
  </div>
)}
        <div className="raffle-numbers-grid">
          {numbers.map((item) => (
           <button
  key={item.number_value}
  className={`raffle-number ${
    selectedNumbers.includes(item.number_value) ? 'selected' : ''
  }`}
  onClick={() => toggleNumber(item.number_value)}
>
  {String(item.number_value).padStart(2, '0')}
</button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default PublicRaffle
