import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "../estilos/ProcesandoPago.css" // Importa el CSS unificado
import { API_URL } from "../config"
import { setUser } from "../utils/storage"

type Status = 'processing' | 'success' | 'error'

const RecargaExitosa = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('processing')
  const [mensaje, setMensaje] = useState("Procesando tu pago...")
  const [successType, setSuccessType] = useState<'COINS' | 'SUBSCRIPTION' | null>(null)

  useEffect(() => {
    const completarPago = async () => {
      const transactionId = localStorage.getItem("pendingTransactionId")

      console.log("🔍 Completando pago con transactionId:", transactionId)

      if (!transactionId) {
        console.warn("⚠️  No hay transactionId - mostrando éxito por defecto")
        setMensaje("¡Pago verificado correctamente!")
        setStatus('success')
        setSuccessType('COINS')
        return
      }

      try {
        console.log("📡 Llamando a completar-simulado...")
        const response = await fetch(`${API_URL}/api/pagos/completar-simulado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId }),
        })

        const data = await response.json()
        console.log("📥 Respuesta del backend:", { ok: response.ok, status: response.status, data })

        if (!response.ok) {
          console.error("❌ Backend rechazó la transacción:", data.error)

          // Mensaje más específico
          setMensaje(`Error: ${data.error || 'No se pudo completar el pago.'}`)
          setStatus('error')
        } else {
          console.log("✅ Pago completado exitosamente")
          setStatus('success')
          setSuccessType(data.transactionType)

          if (data.transactionType === 'SUBSCRIPTION') {
            setMensaje("¡Bienvenido al club! Suscripción activa.")
          } else {
            setMensaje("¡Recarga exitosa! Monedas agregadas a tu cuenta.")
          }

          if (data.user) {
            console.log("👤 Usuario recibido del backend. Monedas:", data.user.monedas);
            setUser(data.user) // Use centralized storage
          } else {
            console.warn("⚠️ Backend no devolvió usuario actualizado, manteniendo sesión actual")
          }
          localStorage.removeItem("pendingTransactionId")
        }
      } catch (error) {
        console.error("❌ Error de conexión:", error)
        setMensaje("Error de conexión al verificar el pago.")
        setStatus('error')
      }
    }

    const timer = setTimeout(() => { completarPago() }, 800); // Un poco de delay para ver la animación
    return () => clearTimeout(timer);

  }, [])

  return (
    <div className="payment-page-container">
      <div className="payment-card">

        {/* ESTADO: CARGANDO */}
        {status === 'processing' && (
          <div className="spinner-wrapper">
            <div className="spinner"></div>
          </div>
        )}

        {/* ESTADO: ÉXITO (Suscripción) */}
        {status === 'success' && successType === 'SUBSCRIPTION' && (
          <div className="icon-sub-wrapper">
            <span className="icon-success-emoji">🎉</span>
          </div>
        )}

        {/* ESTADO: ÉXITO (Monedas) */}
        {status === 'success' && successType !== 'SUBSCRIPTION' && (
          <div className="icon-success-wrapper">
            <span className="icon-success-emoji">��</span>
          </div>
        )}

        {/* ESTADO: ERROR */}
        {status === 'error' && (
          <div className="icon-error-wrapper">
            <span className="icon-error-symbol">✕</span>
          </div>
        )}

        <h1 className="payment-title">
          {status === 'processing' ? 'Verificando...' : (status === 'error' ? 'Algo salió mal' : '¡Listo!')}
        </h1>
        <p className="payment-desc">{mensaje}</p>

        {status !== 'processing' && (
          <div className="payment-actions">
            <button
              className="btn-ulima"
              onClick={() => {
                const streamId = localStorage.getItem("returnToStream");
                if (successType === 'SUBSCRIPTION' && streamId) {
                  localStorage.removeItem("returnToStream");
                  navigate(`/live/${streamId}`); // Vuelve al stream
                } else {
                  navigate('/tienda'); // Vuelve a tienda si son monedas
                }
              }}
              style={{ marginTop: '30px' }}
            >
              {successType === 'SUBSCRIPTION' ? 'Volver al Stream' : 'Volver a la Tienda'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecargaExitosa
