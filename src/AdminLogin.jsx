
import { useState } from 'react'
import { supabase } from './supabase'

function AdminLogin({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    if (loginError) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (adminError || !admin) {
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene permisos de administrador.')
      setLoading(false)
      return
    }

    setLoading(false)
    onLoginSuccess()
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="login-icon">🔐</div>

        <h2>Acceso administrador</h2>
        <p>Ingresa tus datos para administrar RifaFácil.</p>

        <form onSubmit={handleLogin}>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo"
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        <button className="back-button" onClick={onBack}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  )
}

export default AdminLogin
