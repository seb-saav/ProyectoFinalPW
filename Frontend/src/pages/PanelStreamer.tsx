import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "../estilos/PanelStreamer.css"
import { getPublicProfile } from "../services/userService"
import { API_URL } from "../config"

interface Gift {
  id: number; name: string; costo: number; emoji: string; isActive: boolean; isCustom?: boolean;
}

const PanelStreamer = () => {
  const navigate = useNavigate()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)

  // Estados formulario
  const [newEmoji, setNewEmoji] = useState("🚀")
  const [newName, setNewName] = useState("")
  const [newCost, setNewCost] = useState(50)
  const [goodbyeMsg, setGoodbyeMsg] = useState("")
  const [xpThreshold, setXpThreshold] = useState(500) // Nuevo estado para dificultad

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null")

  useEffect(() => {
    if (!currentUser) { navigate("/inicio"); return; }
    cargarRegalos()
  }, [])

  const cargarRegalos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/streamer/${currentUser.id}/regalos`)
      const data = await res.json()
      setGifts(data)

      // Cargar configuración de dificultad usando el servicio existente
      try {
        const profile = await getPublicProfile(currentUser.id)
        if (profile && profile.xpThreshold) {
          setXpThreshold(profile.xpThreshold)
        }
      } catch (err) {
        console.log("No se pudo cargar config de dificultad (posiblemente falta migración)")
      }

      setLoading(false)
    } catch (error) { toast.error("Error al cargar datos") }
  }

  const toggleGift = async (giftId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/streamer/toggle-gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, giftId }),
      })
      const data = await res.json()
      // Actualizamos estado visual
      setGifts(prev => prev.map(g => g.id === giftId ? { ...g, isActive: data.isActive } : g))
    } catch (error) { toast.error("Error al cambiar estado"); }
  }

  // --- BORRAR SIN WINDOW.CONFIRM (USANDO TOAST) ---
  const requestDeleteGift = (e: React.MouseEvent, giftId: number) => {
    e.stopPropagation(); // Evita activar el toggle

    toast.custom((t) => (
      <div style={{ background: '#222', padding: '15px', borderRadius: '10px', border: '1px solid #444', color: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>¿Eliminar este regalo permanentemente?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { toast.dismiss(t.id); deleteGift(giftId); }}
            style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sí, borrar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{ background: 'transparent', color: '#ccc', border: '1px solid #666', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  }

  const deleteGift = async (giftId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/streamer/regalo/${giftId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Regalo eliminado");
        setGifts(prev => prev.filter(g => g.id !== giftId));
      } else { toast.error("No se pudo eliminar"); }
    } catch (e) { toast.error("Error de conexión"); }
  }
  // ------------------------------------------------

  const crearRegaloPersonalizado = async () => {
    if (!newName) return toast.error("Ponle nombre a tu regalo")
    try {
      const res = await fetch(`${API_URL}/api/streamer/crear-regalo`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, name: newName, costo: newCost, emoji: newEmoji }),
      })
      if (res.ok) {
        toast.success("¡Regalo Creado!"); setNewName(""); cargarRegalos();
      }
    } catch (error) { toast.error("Error al crear") }
  }

  const guardarMensajeDespedida = async () => {
    if (!goodbyeMsg) return toast.error("Escribe un mensaje")
    try {
      await fetch(`${API_URL}/api/streamer/config`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, message: goodbyeMsg })
      });
      toast.success("Mensaje guardado"); setGoodbyeMsg("");
    } catch (e) { toast.error("Error al guardar") }
  }

  const guardarDificultad = async () => {
    if (xpThreshold < 50) return toast.error("Mínimo 50 puntos");
    try {
      const res = await fetch(`${API_URL}/api/streamer/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, newThreshold: xpThreshold })
      });

      if (res.ok) {
        toast.success("Dificultad actualizada");
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Error backend:", errData);
        toast.error(`Error: ${errData.error || "No se pudo actualizar"}`);
      }
    } catch (e) {
      console.error("Error de conexión:", e);
      toast.error("Error de conexión (¿Backend caído?)");
    }
  }

  if (loading) return <div className="text-center mt-5" style={{ color: 'white' }}>Cargando panel...</div>

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h1>Gestionar Canal</h1>
        <p>Personaliza la experiencia de tus suscriptores.</p>
      </div>

      <div className="create-gift-section">
        <h3 className="create-title">✨ Crear Regalo Personalizado</h3>
        <div className="create-form">
          <input className="input-emoji" type="text" placeholder="🌮" value={newEmoji} onChange={e => setNewEmoji(e.target.value)} />
          <input className="input-name" type="text" placeholder="Nombre del regalo" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="input-cost" type="number" placeholder="Costo" value={newCost} onChange={e => setNewCost(Number(e.target.value))} />
          <button className="btn-ulima" onClick={crearRegaloPersonalizado}>Crear</button>
        </div>
      </div>

      <h3 style={{ color: 'white', marginBottom: '20px' }}>Tus Regalos Activos</h3>
      <div className="gifts-manager-grid">
        {gifts.map((gift) => (
          <div key={gift.id} className={`gift-toggle-card ${gift.isActive ? "active" : ""}`} onClick={() => toggleGift(gift.id)}>
            {gift.isCustom && <span className="custom-label">CUSTOM</span>}
            {gift.isCustom && (
              <button
                onClick={(e) => requestDeleteGift(e, gift.id)} // USAMOS LA NUEVA FUNCIÓN
                style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#dc3545', border: 'none', color: 'white', borderRadius: '5px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', zIndex: 10, fontWeight: 'bold' }}
              >
                Borrar
              </button>
            )}
            <div className="status-badge"></div>
            <span className="gift-emoji">{gift.emoji}</span>
            <span className="gift-name">{gift.name}</span>
            <span className="gift-cost">{gift.costo} 🪙</span>
            <div className="gift-status-text" style={{ color: gift.isActive ? '#00ff00' : '#666' }}>
              {gift.isActive ? "DISPONIBLE" : "OCULTO"}
            </div>
          </div>
        ))}
      </div>

      <div className="goodbye-section">
        <h3 className="create-title" style={{ color: '#9146ff' }}>📢 Mensaje de Despedida</h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>Este mensaje lo verán tus suscriptores si deciden cancelar.</p>
        <div className="create-form">
          <input className="input-name" type="text" placeholder="Ej: ¡Espero que vuelvas pronto!" value={goodbyeMsg} onChange={e => setGoodbyeMsg(e.target.value)} />
          <button className="btn-ulima" onClick={guardarMensajeDespedida}>Guardar</button>
        </div>
      </div>

      <div className="goodbye-section" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <h3 className="create-title" style={{ color: '#ffc107' }}>⚙️ Dificultad de la Comunidad</h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>Define cuántos XP se necesitan para subir de nivel.</p>
        <div className="create-form">
          <input
            className="input-cost"
            type="number"
            value={xpThreshold}
            onChange={e => setXpThreshold(Number(e.target.value))}
            style={{ width: '150px' }}
          />
          <span style={{ color: 'white', alignSelf: 'center', marginLeft: '10px' }}>XP por Nivel</span>
          <button className="btn-ulima" onClick={guardarDificultad} style={{ marginLeft: 'auto' }}>Actualizar</button>
        </div>
      </div>
    </div>
  )
}
export default PanelStreamer