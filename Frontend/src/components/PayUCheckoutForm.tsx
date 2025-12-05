import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { PAYU_CONFIG } from "../config/payu.config"
import { generatePayUSignature, generateReferenceCode } from "../utils/payuSignature"
import "../estilos/PayU.css"

interface PayUCheckoutFormProps {
  amount: number
  description: string
  buyerEmail: string
  referenceCode?: string // Prop opcional
  onSubmit?: () => void
}

const PayUCheckoutForm = ({ amount, description, buyerEmail, referenceCode: externalRefCode, onSubmit }: PayUCheckoutFormProps) => {
  const navigate = useNavigate()
  // Referencia al formulario HTML invisible
  const formRef = useRef<HTMLFormElement>(null)

  // Usar la referencia externa si existe, sino generar una nueva
  const referenceCode = useRef(externalRefCode || generateReferenceCode())

  const signature = generatePayUSignature(referenceCode.current, amount)

  // --- MANEJADORES DE BOTONES ---

  const handleConfirmPayment = () => {
    // 1. Notificar al componente padre (opcional)
    if (onSubmit) onSubmit()

    // 2. ENVIAR EL FORMULARIO REAL A PAYU (Sandbox)
    // Esto redirigirá al usuario fuera de tu app a la página de PayU
    if (formRef.current) {
      formRef.current.submit();
    }
  }

  const handleSimulateFailure = () => {
    console.log("[PayU] Simulando cancelación de pago...")
    navigate("/recarga-fallida")
  }

  return (
    <div className="payu-container-wrapper">
      <div className="payu-card">
        <div className="payu-logo-text">
          Pay<span className="payu-highlight">U</span> Checkout
        </div>

        <p style={{ color: "#aaa", marginBottom: "20px" }}>
          Estás a un paso de obtener tus monedas. Por favor, confirma los detalles.
        </p>

        <div className="payu-summary">
          <div className="payu-row">
            <span>Descripción:</span>
            <span>{description}</span>
          </div>
          <div className="payu-row">
            <span>Referencia:</span>
            <span>{referenceCode.current}</span>
          </div>
          <div className="payu-row">
            <span>Email:</span>
            <span>{buyerEmail}</span>
          </div>

          <div className="payu-total">
            <span>Total a Pagar:</span>
            <span>S/ {amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="payu-actions">
          {/* Botón Verde: Redirige a PayU real */}
          <button className="btn-payu-confirm" onClick={handleConfirmPayment}>
            💳 Pagar con Tarjeta / Efectivo
          </button>

          {/* Botón Rojo: Simula fallo localmente */}
          <button className="btn-payu-cancel" onClick={handleSimulateFailure}>
            ✖ Cancelar / Simular Error
          </button>
        </div>

        {/* --- FORMULARIO OCULTO (Toda la magia ocurre aquí) --- */}
        <form ref={formRef} method="post" action={PAYU_CONFIG.paymentUrl} style={{ display: "none" }}>
          <input type="hidden" name="merchantId" value={PAYU_CONFIG.merchantId} />
          <input type="hidden" name="accountId" value={PAYU_CONFIG.accountId} />
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="referenceCode" value={referenceCode.current} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="tax" value="0" />
          <input type="hidden" name="taxReturnBase" value="0" />
          <input type="hidden" name="currency" value="PEN" />
          <input type="hidden" name="signature" value={signature} />
          <input type="hidden" name="test" value={PAYU_CONFIG.test ? "1" : "0"} />
          <input type="hidden" name="buyerEmail" value={buyerEmail} />
          <input type="hidden" name="responseUrl" value={PAYU_CONFIG.responseUrl} />
          {PAYU_CONFIG.confirmationUrl && (
            <input type="hidden" name="confirmationUrl" value={PAYU_CONFIG.confirmationUrl} />
          )}
        </form>
      </div>
    </div>
  )
}

export default PayUCheckoutForm