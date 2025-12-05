import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "bootstrap/dist/css/bootstrap.min.css"
import "../estilos/Tienda.css"
import PayUCheckoutForm from "../components/PayUCheckoutForm"
import { StoreService } from "../services/StoreService"
import type { Gift, CoinPack } from "../services/StoreService"
import { API_URL } from "../config"
import { generateReferenceCode } from "../utils/payuSignature"
import { getUser, setUser } from "../utils/storage"

interface UserData {
  id: string
  name: string
  email: string
  monedas: number
  puntos: number
}

const TiendaPage = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [payuCheckout, setPayuCheckout] = useState<{ amount: number; description: string; referenceCode: string } | null>(null)

  // Dynamic Data State
  // const [coinPacks, setCoinPacks] = useState<CoinPack[]>([]) // Replaced by hardcoded list
  const [regalosCatalogo, setRegalosCatalogo] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)

  // Hardcoded Coin Packs as requested
  const coinPacks: CoinPack[] = [
    { id: 1, amount: 100, price: "S/ 5.00", pointsAwarded: 10 },
    { id: 2, amount: 550, price: "S/ 25.00", pointsAwarded: 60 },
    { id: 3, amount: 1200, price: "S/ 50.00", pointsAwarded: 150 },
  ];

  useEffect(() => {
    setCurrentUser(getUser());

    // Fetch Data
    const fetchData = async () => {
      try {
        const [gifts] = await Promise.all([
          // StoreService.getCoinPacks(), // Using hardcoded packs
          StoreService.getGifts()
        ])
        // setCoinPacks(packs)
        setRegalosCatalogo(gifts)
      } catch (error) {
        console.error("Error loading store data", error)
        toast.error("Error cargando catálogo")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- LÓGICA DE COMPRA (Backend) ---
  const comprarMonedas = async (pack: CoinPack) => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para comprar.")
      return
    }

    // Toast de carga
    const loadingToast = toast.loading("Iniciando transacción...");

    try {
      // 1. Generar Reference Code en Frontend para asegurar coincidencia
      const myReferenceCode = generateReferenceCode();

      const response = await fetch(`${API_URL}/api/pagos/crear-transaccion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          pack: pack,
          referenceCode: myReferenceCode // Enviamos el código al backend
        }),
      });

      const data = await response.json()

      toast.dismiss(loadingToast); // Quitar carga

      if (!response.ok) {
        toast.error(data.error || "Error al iniciar pago.");
        return
      }

      // Éxito: Guardar ID y mostrar PayU
      localStorage.setItem("pendingTransactionId", data.transactionId)
      const amountNumber = parseFloat(pack.price.replace("S/", "").trim())

      setPayuCheckout({
        amount: amountNumber,
        description: `Paquete de ${pack.amount} monedas`,
        referenceCode: myReferenceCode // Guardamos para pasarlo al form
      })

    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error:", error)
      toast.error("Error de conexión con el servidor.");
    }
  }

  // --- LÓGICA DE CANJE (Backend) ---
  const canjearPuntos = async () => {
    if (!currentUser) return toast.error("Inicia sesión para canjear.")

    const loadingToast = toast.loading("Procesando canje...");

    try {
      const response = await fetch(`${API_URL}/api/store/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      })

      const data = await response.json()
      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(data.error);
      } else {
        toast.success("¡Canje exitoso! +10 Monedas", { icon: '🪙' });
        setCurrentUser(data)
        setUser(data) // Use centralized storage
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Error de conexión.");
    }
  }

  if (loading) {
    return <div className="text-center mt-5 text-white">Cargando tienda...</div>
  }

  return (
    <div className="tienda-container">
      {/* CONDICIONAL: Formulario de Pago o Tienda Normal */}
      {payuCheckout && currentUser ? (
        <div className="payu-overlay-wrapper">
          <div className="payu-modal-content">
            <PayUCheckoutForm
              amount={payuCheckout.amount}
              description={payuCheckout.description}
              buyerEmail={currentUser.email}
              referenceCode={payuCheckout.referenceCode}
              onSubmit={() => {
                // Simulación: Redirigir a éxito tras "pagar"
                navigate('/recarga-exitosa');
              }}
            />
            <button
              onClick={() => setPayuCheckout(null)}
              className="btn-close-payu"
              style={{ marginTop: '15px' }}
            >
              Cancelar Operación
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* HEADER DE TIENDA */}
          <div className="header-tienda">
            <h1 className="text-warning">Tienda de Monedas</h1>
            <div className="balance-info">
              <span className="balance-item">
                Tienes: <strong style={{ color: '#ffc107' }}>{currentUser?.monedas ?? 0}</strong> 🪙
              </span>
              <span className="balance-item">
                Puntos: <strong style={{ color: '#1f69ff' }}>{currentUser?.puntos ?? 0}</strong> ⭐
              </span>
            </div>
          </div>

          {/* SECCIÓN 1: COMPRAR */}
          <section className="seccion-comprar">
            <h2>💎 Recargar Saldo</h2>
            <div className="packs-grid">
              {coinPacks.map((pack, idx) => (
                <div key={idx} className="pack-card">
                  <h4>{pack.amount} 🪙</h4>
                  <p className="price-tag">{pack.price}</p>
                  <div className="points-bonus">
                    <span>🎁 Ganas:</span> {pack.pointsAwarded} XP
                  </div>
                  <button className="btn-comprar" onClick={() => comprarMonedas(pack)}>
                    Comprar Ahora
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN 2: CATÁLOGO (Visual) */}
          <section className="seccion-catalogo">
            <h2>🎁 Catálogo de Regalos</h2>
            <p className="subtitle">Estos son los regalos que podrás enviar en los streams.</p>
            <div className="gifts-grid">
              {regalosCatalogo.map((regalo) => (
                <div key={regalo.id} className="gift-card">
                  <span className="emoji">{regalo.emoji}</span>
                  <span className="nombre">{regalo.name}</span>
                  <span className="costo">{regalo.costo} 🪙</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN 3: CANJE */}
          <section className="seccion-canjear">
            <h2>⭐ Recompensas de Lealtad</h2>
            <div className="canje-card">
              <p>Convierte tus puntos de experiencia en monedas para seguir apoyando.</p>
              <div className="conversion-info">
                <span>100 XP</span>
                <span className="arrow">➜</span>
                <span>10 🪙</span>
              </div>
              <button className="btn-canjear" onClick={canjearPuntos}>
                Canjear Puntos
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default TiendaPage