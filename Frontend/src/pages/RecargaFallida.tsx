import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../estilos/ProcesandoPago.css" // Reutilizamos el CSS oscuro y elegante

const RecargaFallida = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Limpiamos cualquier intento pendiente
    localStorage.removeItem("pendingTransactionId")
  }, [])

  return (
    <div className="payment-page-container">
      <div className="payment-card" style={{ borderColor: '#dc3545' }}>
        
        {/* Ícono de Error Animado (definido en el CSS) */}
        <div className="icon-error-wrapper">
          <span className="icon-error-symbol">✕</span>
        </div>

        <h1 className="payment-title" style={{ color: '#dc3545' }}>Pago Cancelado</h1>
        <p className="payment-desc">
          La transacción no pudo completarse. No se ha realizado ningún cargo a tu cuenta.
        </p>

        <div className="payment-info-box">
          <h3>Posibles razones:</h3>
          <ul>
            <li>Cancelaste el proceso manualmente.</li>
            <li>La conexión con la pasarela se perdió.</li>
            <li>Tu banco rechazó la operación.</li>
          </ul>
        </div>

        <div className="payment-actions">
          <button 
            className="btn-action btn-primary" 
            onClick={() => navigate("/tienda")}
            style={{ backgroundColor: '#dc3545' }} // Rojo para reintentar
          >
            Intentar de Nuevo
          </button>
          
          <button 
            className="btn-action btn-secondary" 
            onClick={() => navigate("/inicio")}
          >
            Volver al Inicio
          </button>
        </div>

      </div>
    </div>
  )
}

export default RecargaFallida
