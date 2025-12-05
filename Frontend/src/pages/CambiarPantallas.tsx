import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import Layout from "../components/Layout"
import { useEffect } from "react"

// Páginas Principales
import PantallaGeneral from "./PantallaGeneral"
import TiendaPage from "./Tienda"
import Nosotros from "./Nosotros"
import TyC from "./TyC"
import PerfilPage from "./Perfil"

// Páginas de Streaming
import CategoryStreamersPage from "./CategoryStreamersPage"
import LiveStreamPage from "./LiveStreamPage"
import PanelStreamer from "./PanelStreamer"

// Páginas de Pago
import RecargaExitosa from "./RecargaExitosa"
import RecargaFallida from "./RecargaFallida"

// Página de Verificación
import VerificarCuenta from "./VerificarCuenta"
import CheckEmail from "./CheckEmail"

const CambiarPantallas = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // ---------------------------------------------------------
  // DETECTOR DE RETORNO DE PAYU (Fix para GitHub Pages)
  // ---------------------------------------------------------
  useEffect(() => {
    // PayU devuelve params como: ?merchantId=...&transactionState=4&...
    const params = new URLSearchParams(location.search)
    const merchantId = params.get("merchantId")
    const transactionState = params.get("transactionState") // 4 = Aprobada

    if (merchantId && transactionState) {
      console.log("💳 Detectado retorno de PayU. Redirigiendo...")
      
      if (transactionState === "4") {
        navigate("/recarga-exitosa")
      } else {
        navigate("/recarga-fallida")
      }
    }
  }, [location, navigate])

  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Layout><PantallaGeneral /></Layout>} />
      <Route path="/inicio" element={<Layout><PantallaGeneral /></Layout>} />
      <Route path="/nosotros" element={<Layout><Nosotros /></Layout>} />
      <Route path="/terminos" element={<Layout><TyC /></Layout>} />

      {/* Tienda y Pagos */}
      <Route path="/tienda" element={<Layout><TiendaPage /></Layout>} />

      <Route path="/recarga-exitosa" element={<Layout><RecargaExitosa /></Layout>} />
      <Route path="/recarga-fallida" element={<Layout><RecargaFallida /></Layout>} />

      {/* Streaming y Contenido */}
      <Route path="/category/:categoryId" element={<Layout><CategoryStreamersPage /></Layout>} />
      <Route path="/live/:streamerId" element={<Layout><LiveStreamPage /></Layout>} />

      {/* Usuario y Gestión */}
      <Route path="/perfil" element={<Layout><PerfilPage /></Layout>} />
      <Route path="/panel-streamer" element={<Layout><PanelStreamer /></Layout>} />
      <Route path="/verificar-cuenta" element={<Layout><VerificarCuenta /></Layout>} />
      <Route path="/check-email" element={<Layout><CheckEmail /></Layout>} />

    </Routes>
  )
}

export default CambiarPantallas
