import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "bootstrap/dist/css/bootstrap.min.css"
import "../estilos/LiveStreamPage.css"
import { FaGift, FaStar, FaStopCircle, FaPaperPlane, FaPlay, FaVideo } from "react-icons/fa"
import PayUCheckoutForm from "../components/PayUCheckoutForm"
import { StoreService } from "../services/StoreService"
import type { Gift } from "../services/StoreService"
import { UserHoverCard } from "../components/UserHoverCard"
import { LevelUpModal } from "../components/LevelUpModal"
import { TickerDonaciones } from "../components/TickerDonaciones"
import { getStreamerById } from "../data/streamersData"
import { getPublicProfile } from "../services/userService"
import { API_URL } from "../config"
import { useSocket } from "../context/SocketContext"

// Interfaces
interface UserData { id: string; name: string; email: string; monedas: number; puntos: number; role: string; isLive?: boolean; streamTitle?: string; lastStreamStart?: string | null; }
interface ChatMessage { id: number; user: string; text: string; level: number; role: string; userId?: string; }

const LiveStreamPage = () => {
  const { streamerId } = useParams()
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [regalosDisponibles, setRegalosDisponibles] = useState<Gift[]>([])
  const [streamerProfile, setStreamerProfile] = useState<any>(null) // Perfil real del streamer

  // Estados de Stream
  const [isSubscribed, _setIsSubscribed] = useState(false)
  const [isStreamerOwner, setIsStreamerOwner] = useState(false)
  const [isLive, setIsLive] = useState(false) // Estado local de si el canal está vivo

  // Estados Formulario Pre-Stream
  const [streamTitle, setStreamTitle] = useState("")
  const [streamCategory, setStreamCategory] = useState("just-chatting")

  // Estados Level Up
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  // Estado Alerta Streamer
  const [alertData, setAlertData] = useState<any>(null);
  // Cronómetro
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // --- CRONÓMETRO ---
  useEffect(() => {
    let interval: any;
    // Determinar fecha de inicio:
    // Si soy dueño -> currentUser.lastStreamStart
    // Si soy viewer -> streamerProfile.lastStreamStart
    const startTimeStr = isStreamerOwner ? currentUser?.lastStreamStart : streamerProfile?.lastStreamStart;

    // 🐛 DEBUG: Logs para identificar desincronización
    console.log("⏱️ CRONÓMETRO - Actualización:");
    console.log("  - Rol:", isStreamerOwner ? "STREAMER" : "VIEWER");
    console.log("  - isLive:", isLive);
    console.log("  - startTimeStr:", startTimeStr);
    console.log("  - currentUser.lastStreamStart:", currentUser?.lastStreamStart);
    console.log("  - streamerProfile.lastStreamStart:", streamerProfile?.lastStreamStart);

    if (isLive && startTimeStr) {
      const startTime = new Date(startTimeStr).getTime();
      console.log("  - startTime (timestamp):", startTime);
      console.log("  - Fecha legible:", new Date(startTime).toLocaleString());

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = now - startTime;
        if (diff < 0) { setElapsedTime("00:00:00"); return; }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      console.log("  ⚠️ Timer no iniciado - isLive o startTimeStr faltante");
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [isLive, isStreamerOwner, currentUser?.lastStreamStart, streamerProfile?.lastStreamStart]);

  // Chat y UI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, user: "BotUlima", text: "¡Bienvenidos al stream de Ingeniería de Sistemas! 💻", level: 99, role: 'admin' },
    { id: 2, user: "Oki Spooky", text: "¡Hype! 🚀 ¿Van a sortear puntos extra?", level: 25, role: 'moderator' },
    { id: 3, user: "ElTroll", text: "Hola, soy nuevo. ¿Cómo se donan bits?", level: 1, role: 'usuario' }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mensajeOverlay, setMensajeOverlay] = useState("")
  const [mostrarOverlay, setMostrarOverlay] = useState(false)
  const [showGiftMenu, setShowGiftMenu] = useState(false)
  const [payuCheckout, setPayuCheckout] = useState<{ amount: number, description: string } | null>(null)

  // Socket Context
  const { socket } = useSocket();

  // Buscar datos del streamer si no soy el dueño
  const streamerInfo = streamerId ? getStreamerById(streamerId) : null;
  const displayTitle = isStreamerOwner ? (streamTitle || "Mi Transmisión") : (streamerInfo?.title || "Viendo Stream");
  const displayName = isStreamerOwner ? currentUser?.name : (streamerInfo?.name || streamerId);
  const displayAvatar = streamerInfo?.avatarUrl || "https://static-cdn.jtvnw.net/jtv_user_pictures/default-profile-icon.jpg";


  const cargarDatosStreamer = async () => {
    try {
      // Cargar Regalos usando StoreService
      const gifts = await StoreService.getGifts()
      setRegalosDisponibles(gifts)

      // Cargar Perfil Público del Streamer (para obtener xpThreshold)
      if (streamerId) {
        try {
          const profile = await getPublicProfile(streamerId);
          setStreamerProfile(profile);
        } catch (err) {
          console.log("Usando datos mock para streamer...");
        }
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    // 1. Cargar usuario actual (Visitante o Dueño)
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      if (user.id === streamerId) {
        setIsStreamerOwner(true)
        // Si soy el dueño, mi estado isLive inicial viene de mi propio objeto
        setIsLive(user.isLive || false)
      }
    }
  }, [streamerId])

  useEffect(() => {
    // 0. Cargar datos iniciales
    cargarDatosStreamer();

    // 1. Usar socket global
    if (!socket) return;

    // UNIRSE A LA SALA
    if (streamerId) {
      console.log("🔌 Uniéndose a sala:", streamerId);
      socket.emit("client:join_room", streamerId);
    }

    // 2. Definir Handler
    const handleReceiveMessage = (data: any) => {
      console.log("📩 Mensaje recibido:", data);

      const incomingMsg: ChatMessage = {
        id: Date.now() + Math.random(),
        user: data.username || "Anónimo",
        text: data.text || data.message,
        level: 1,
        role: 'user-lime',
        userId: data.userId
      };
      setChatMessages((prev) => [...prev, incomingMsg]);
    };

    // 3. Suscribir
    socket.on("server:message", handleReceiveMessage);

    // 🐛 DEBUG: Monitorear conexión Socket.IO
    socket.on("connect", () => {
      console.log("✅ Socket.IO CONECTADO - ID:", socket.id);
      console.log("   - Timestamp:", new Date().toISOString());
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO DESCONECTADO");
      console.log("   - Razón:", reason);
      console.log("   - Timestamp:", new Date().toISOString());
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.IO ERROR DE CONEXIÓN:", error.message);
    });

    // 🐛 DEBUG: Escuchar TODOS los eventos (para debugging)
    socket.onAny((eventName, ...args) => {
      console.log(`📡 Socket.IO Evento Recibido: "${eventName}"`, args);
    });

    // ESCUCHAR INICIO DE STREAM (Para Viewers)
    socket.on("server:stream_started", (data: any) => {
      console.log("🟢 EVENTO RECIBIDO: server:stream_started", data);
      if (data && data.streamerId === streamerId) {
        setIsLive(true);
        // Actualizar perfil del streamer con la hora oficial de inicio
        setStreamerProfile((prev: any) => ({
          ...prev,
          isLive: true,
          lastStreamStart: data.lastStreamStart
        }));
        toast.success("¡El stream ha comenzado! 🔴", { icon: "📹" });
      }
    });

    // ESCUCHAR FIN DE STREAM (Instrucción Backend)
    socket.on("server:stream_ended", (data: any) => {
      console.log("🛑 EVENTO RECIBIDO: server:stream_ended", data);

      // Validar que sea el streamer que estamos viendo
      if (data && data.streamerId === streamerId) {
        console.log("✅ Stream finalizado - Actualizando UI a OFFLINE");

        // 1. Actualizar estado isLive a false
        setIsLive(false);

        // 2. Actualizar streamerProfile (para viewers)
        setStreamerProfile((prev: any) => ({
          ...prev,
          isLive: false,
          lastStreamStart: null
        }));

        // 3. Si soy el owner, también actualizar currentUser
        if (isStreamerOwner && currentUser) {
          const updated = { ...currentUser, isLive: false, lastStreamStart: null };
          localStorage.setItem("currentUser", JSON.stringify(updated));
          setCurrentUser(updated);
        }

        // 4. Mostrar toast
        toast("El streamer ha finalizado la transmisión", { icon: "🛑", duration: 3000 });

        // 5. Si NO soy el owner (soy viewer), redirigir después de 3 segundos
        if (!isStreamerOwner) {
          console.log("⏳ Viewer detectado - Redirigiendo en 3 segundos...");
          setTimeout(() => {
            console.log("🚀 Redirigiendo a la página principal");
            navigate("/");
          }, 3000);
        }
      } else {
        console.log("⚠️ Evento ignorado: ID no coincide", { received: data?.streamerId, current: streamerId });
      }
    });

    // ESCUCHAR ALERTAS DE REGALOS (Para Streamer y Viewers)
    socket.on("server:gift_alert", (data: any) => {
      console.log("🎁 Alerta de regalo recibida:", data);

      // Verificar si el regalo es para el stream que estamos viendo actualmente
      // data.streamerId debe coincidir con el streamerId de la URL
      if (data.streamerId === streamerId) {
        console.log("✅ ¡Alerta para este stream! Mostrando ticker...");
        setAlertData(data);

        // Auto-hide alert data after 15 seconds (matches CSS animation)
        setTimeout(() => setAlertData(null), 15000);
      } else {
        console.log("⛔ Alerta para otro stream, ignorando.", { received: data.streamerId, current: streamerId });
      }
    });

    // 4. CARGAR HISTORIAL
    const cargarHistorial = async () => {
      if (!streamerId) return;
      try {
        const res = await fetch(`${API_URL}/api/messages/${streamerId}`);
        if (res.ok) {
          const historial = await res.json();
          const formattedHistory = historial.map((msg: any, index: number) => ({
            id: Date.now() + index,
            user: msg.username,
            text: msg.text,
            level: 1,
            role: 'user-lime',
            userId: msg.userId
          }));
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.text + m.user));
            const newUnique = formattedHistory.filter((m: any) => !existingIds.has(m.text + m.user));
            return [...prev, ...newUnique];
          });
        }
      } catch (err) {
        console.error("Error cargando historial", err);
      }
    };
    cargarHistorial();

    // 5. VERIFICAR ESTADO DEL STREAM (Si soy viewer)
    if (!isStreamerOwner && streamerId) {
      fetch(`${API_URL}/api/streams/live`)
        .then(res => res.json())
        .then((liveStreams: any[]) => {
          const streamData = liveStreams.find(s => s.id === streamerId);
          if (streamData) {
            setIsLive(true);
            setStreamerProfile((prev: any) => ({
              ...prev,
              isLive: true,
              lastStreamStart: streamData.lastStreamStart
            }));
          } else {
            setIsLive(false);
          }
        })
        .catch(err => console.error("Error verificando estado del stream", err));
    }

    // 6. Limpieza (SOLO LISTENERS)
    return () => {
      socket.off("server:message", handleReceiveMessage);
      socket.off("server:stream_ended");
      socket.off("server:gift_alert");
      // socket.disconnect(); // NO DESCONECTAR
    };
  }, [streamerId, isStreamerOwner, socket]);

  const calculateLevel = (points: number) => {
    // Prioridad: 1. Config real del streamer, 2. Mock data, 3. Default 500
    const threshold = streamerProfile?.xpThreshold || streamerInfo?.xpThreshold || 500;
    return Math.floor(points / threshold) + 1;
  };

  // --- ACCIONES STREAMER (START/STOP) ---
  const handleStartStream = async () => {
    if (!streamTitle) return toast.error("Ponle un título a tu stream");
    const loading = toast.loading("Iniciando transmisión...");

    try {
      const res = await fetch(`${API_URL}/api/stream/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, title: streamTitle, category: streamCategory })
      });

      toast.dismiss(loading);
      if (res.ok) {
        const data = await res.json();
        toast.success("¡Estás EN VIVO!");
        setIsLive(true);

        // IMPORTANTE: Actualizar AMBOS estados con la misma hora del backend
        const backendStartTime = data.lastStreamStart || new Date().toISOString();

        // 1. Actualizar currentUser (para que el streamer vea el timer correcto)
        if (currentUser) {
          const updated = { ...currentUser, isLive: true, lastStreamStart: backendStartTime };
          localStorage.setItem("currentUser", JSON.stringify(updated));
          setCurrentUser(updated);
        }

        // 2. Actualizar streamerProfile (para que los viewers vean el timer correcto)
        setStreamerProfile((prev: any) => ({
          ...prev,
          isLive: true,
          lastStreamStart: backendStartTime
        }));
      }
    } catch (e) { toast.dismiss(loading); toast.error("Error al iniciar"); }
  }

  const handleStopStream = () => {
    toast.custom((t) => (
      <div style={{ background: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #444', color: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
        <h4 style={{ marginTop: 0, color: '#dc3545' }}>Terminar Transmisión</h4>
        <p>¿Seguro que quieres apagar el stream? Tus viewers te extrañarán.</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button onClick={() => {
            confirmStopStream();
            toast.dismiss(t.id);
          }} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sí, Apagar</button>
          <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', color: '#ccc', border: '1px solid #666', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    ), { duration: 5000 });
  }

  const confirmStopStream = async () => {
    try {
      await fetch(`${API_URL}/api/stream/stop`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      toast.success("Stream Finalizado");
      setIsLive(false);
      if (currentUser) {
        const updated = { ...currentUser, isLive: false };
        localStorage.setItem("currentUser", JSON.stringify(updated));
        setCurrentUser(updated);
      }
      navigate("/perfil");
    } catch (e) { toast.error("Error al detener"); }
  }

  // --- CHAT & REGALOS ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim()) return;

    // 1. Emitir al socket (Backend procesa XP)
    if (socket) {
      socket.emit("client:message", {
        text: newMessage,
        username: currentUser.name,
        userId: currentUser.id,
        roomId: streamerId // <--- ENVIAMOS EL ID DE LA SALA
      });
    }

    // 3. UI Optimista: Sumar XP localmente
    const updatedUser = { ...currentUser, puntos: (currentUser.puntos || 0) + 1 };
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // 4. Notificación Visual (+1 XP)
    toast.success("+1 XP 🌟", {
      icon: '🆙',
      style: { borderRadius: '10px', background: '#333', color: '#fff', border: '1px solid #9146ff' }
    });

    setNewMessage("");
  }

  const enviarRegalo = async (regalo: Gift) => {
    // 0. VALIDACIÓN ROBUSTA DE USUARIO
    let userToUse = currentUser;

    // Si no hay usuario en estado, intentar recuperar de localStorage
    if (!userToUse || !userToUse.id) {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        userToUse = JSON.parse(stored);
        setCurrentUser(userToUse); // Actualizar estado para la próxima
      }
    }

    if (!userToUse || !userToUse.id) return toast.error("Error de sesión. Por favor recarga la página.");

    // 1. VALIDACIÓN DE SALDO
    if (userToUse.monedas < Number(regalo.costo)) {
      return toast.error("Saldo insuficiente 💸");
    }

    // --- COMIENZO DE LA MAGIA OPTIMISTA ---

    // 2. Backup del estado actual
    const backupUser = { ...userToUse };

    // 3. ACTUALIZACIÓN VISUAL INMEDIATA (¡Cero espera!)
    const optimisticCoins = userToUse.monedas - Number(regalo.costo);
    const optimisticPoints = userToUse.puntos + (Number(regalo.costo) * 10);

    // --- LÓGICA DE LEVEL UP ---
    const nivelActual = calculateLevel(userToUse.puntos);
    const nivelFuturo = calculateLevel(optimisticPoints);

    if (nivelFuturo > nivelActual) {
      setNewLevel(nivelFuturo);
      setShowLevelUp(true);
    }

    const optimisticUser = {
      ...userToUse,
      monedas: optimisticCoins,
      puntos: optimisticPoints
    };

    setCurrentUser(optimisticUser);
    localStorage.setItem("currentUser", JSON.stringify(optimisticUser));

    // Notificar a otros componentes (Header)
    window.dispatchEvent(new Event("balanceUpdated"));

    // UI Feedback Inmediato
    setMensajeOverlay(`¡Enviaste ${regalo.emoji} ${regalo.name}!`)
    setMostrarOverlay(true);
    setTimeout(() => setMostrarOverlay(false), 3000);
    setShowGiftMenu(false);

    // Agregar mensaje al chat optimísticamente
    const tempId = Date.now().toString();
    const nuevoMensaje: ChatMessage = {
      id: Number(tempId), // ChatMessage id is number
      user: userToUse.name,
      text: `ha enviado: ${regalo.emoji} ${regalo.name}`,
      level: calculateLevel(optimisticPoints),
      role: 'system-gift'
    };
    setChatMessages(prev => [...prev, nuevoMensaje]);

    // 4. LLAMADA AL BACKEND (En segundo plano)
    try {
      const res = await fetch(`${API_URL}/api/gifts/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userToUse.id,
          giftId: regalo.id,
          streamerId: streamerId // Enviar ID del streamer para contexto
        })
      });
      console.log("🎁 [DEBUG] Enviando regalo:", { userId: userToUse.id, giftId: regalo.id, streamerId });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en el servidor");
      }

      // 5. NOTIFICAR AL SOCKET (Para que el Streamer vea la alerta)
      if (socket) {
        console.log("📤 Emitiendo client:gift_sent para alerta...");
        socket.emit("client:gift_sent", {
          streamerId: streamerId, // ID del dueño del canal
          giftName: regalo.name,
          senderName: userToUse.name,
          roomId: streamerId
        });
      }

      window.dispatchEvent(new Event("balanceUpdated")); // Actualizar header de nuevo

      // Eliminar el mensaje optimista del chat
      setChatMessages(prev => prev.filter(m => m.id !== Number(tempId)));
    } catch (error) {
      console.error("Error enviando regalo:", error);

      // 5. ROLLBACK (Si falla, deshacemos todo)
      toast.error("Error al enviar regalo. Devolviendo monedas...");

      setCurrentUser(backupUser);
      localStorage.setItem("currentUser", JSON.stringify(backupUser));
      window.dispatchEvent(new Event("balanceUpdated")); // Actualizar header de nuevo

      // Eliminar el mensaje optimista del chat
      setChatMessages(prev => prev.filter(m => m.id !== Number(tempId)));
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) return toast.error("Inicia sesión")
    try {
      const response = await fetch(`${API_URL}/api/pagos/crear-transaccion`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, type: "SUBSCRIPTION", streamerId: streamerId, pack: { price: "S/ 15.00", amount: 1, pointsAwarded: 50 } }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("pendingTransactionId", data.transactionId)
        localStorage.setItem("returnToStream", streamerId || "")
        setPayuCheckout({ amount: 15.00, description: `Suscripción al canal` })
      } else { toast.error(data.error) }
    } catch (error) { toast.error("Error al iniciar") }
  }

  // --- RENDERIZADO CONDICIONAL ---

  // 1. SI SOY DUEÑO Y NO ESTOY LIVE -> MOSTRAR FORMULARIO PRE-STREAM
  if (isStreamerOwner && !isLive) {
    return (
      <div className="stream-setup-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'white' }}>
        <div style={{ background: '#1c1c1c', padding: '40px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <FaVideo style={{ fontSize: '4rem', color: '#9146ff', marginBottom: '20px' }} />
          <h1 style={{ marginBottom: '10px' }}>Configura tu Stream</h1>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>Antes de salir al aire, dinos qué vas a transmitir hoy.</p>

          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título del Stream</label>
            <input type="text" value={streamTitle} onChange={e => setStreamTitle(e.target.value)} placeholder="Ej: Rankeds con subs!" style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid #444', color: 'white', outline: 'none' }} />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoría</label>
            <select value={streamCategory} onChange={e => setStreamCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#111', border: '1px solid #444', color: 'white', outline: 'none' }}>
              <option value="just-chatting">Just Chatting</option>
              <option value="valorant">Valorant</option>
              <option value="lol">League of Legends</option>
              <option value="music">Música</option>
              <option value="dev">Programación</option>
            </select>
          </div>

          <button onClick={handleStartStream} className="btn-ulima" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', background: '#e91916' }}>
            <FaPlay style={{ marginRight: '10px' }} /> INICIAR TRANSMISIÓN
          </button>
        </div>
      </div>
    )
  }

  // 2. SI ESTOY LIVE (O SOY VIEWER) -> MOSTRAR INTERFAZ DE STREAM
  return (
    <>
      {payuCheckout && (
        <div className="payu-overlay-container">
          <div className="payu-modal-content">
            <PayUCheckoutForm
              amount={payuCheckout.amount} description={payuCheckout.description} buyerEmail={currentUser?.email || ""}
              onSubmit={() => { navigate('/recarga-exitosa') }}
            />
            <button onClick={() => setPayuCheckout(null)} className="btn-close-payu">Cerrar</button>
          </div>
        </div>
      )}

      {/* RENDERIZADO CONDICIONAL DEL MODAL LEVEL UP */}
      {showLevelUp && (
        <LevelUpModal
          level={newLevel}
          onClose={() => setShowLevelUp(false)}
        />
      )}

      <div className="stream-layout" style={{ position: 'relative' }}>

        <div className="video-column">

          <div className="gif-player">
            {/* TICKER DE DONACIONES (Reemplaza al Popup) */}
            <TickerDonaciones giftData={alertData} />

            <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTY2OWQzZTM0NDEyYmMyYjU1ODNiMWRkZWM2MDI3NzMzM2YyNDM3YiZlcD1MVjFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/L1FJH5e1DpiNO/giphy.gif" alt="Live Stream" style={{ opacity: isLive ? 1 : 0.3 }} />
            {isLive ? (
              <div className="live-indicator">EN VIVO • {elapsedTime}</div>
            ) : (
              <div className="offline-indicator" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                <h2 style={{ color: '#aaa', margin: 0 }}>OFFLINE</h2>
                <p style={{ color: '#666', margin: '10px 0 0' }}>El streamer no está transmitiendo</p>
              </div>
            )}
          </div>

          <div className="stream-info-card">
            <div className="streamer-avatar-large" style={{ marginRight: '15px' }}>
              <img src={displayAvatar} alt={displayName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #9146ff' }} />
            </div>
            <div className="stream-text">
              <h3>{displayTitle}</h3>
              <p className="streamer-name">{displayName}</p>
              {!isStreamerOwner && <p className="stream-id">ID: {streamerId}</p>}
            </div>

            {isStreamerOwner ? (
              <button className="btn-action-stop" onClick={handleStopStream}>
                <FaStopCircle /> Terminar Stream
              </button>
            ) : isSubscribed ? (
              <button className="btn-action-subscribed">✅ Suscrito</button>
            ) : (
              <button className="btn-action-subscribe" onClick={handleSubscribe}>
                <FaStar /> Suscribirse (S/ 15.00)
              </button>
            )}
          </div>
        </div>

        <div className="chat-column">
          <div className="balance-header">
            <p>Monedas: <strong>{currentUser?.monedas ?? 0}</strong></p>
            <p>Nivel: <strong>{calculateLevel(currentUser?.puntos || 0)}</strong></p>
          </div>
          <div className="chat-log">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.role === 'system-gift' ? 'gift-alert-chat' : ''}`}>
                <UserHoverCard
                  userId={msg.userId || `bot-${msg.id}`}
                  username={msg.user}
                  xpThreshold={streamerProfile?.xpThreshold || streamerInfo?.xpThreshold || 500}
                >
                  <span className={`user-name ${msg.role === 'streamer' ? 'user-pro' : 'user-lime'}`} style={{ cursor: 'pointer' }}>
                    {msg.user}:
                  </span>
                </UserHoverCard>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            {showGiftMenu && (
              <div className="gift-menu-popup">
                {/* AQUÍ ESTÁ EL FILTRO MÁGICO: r.isActive */}
                {regalosDisponibles.filter(r => r.isActive !== false).map(r => (
                  <div key={r.id} className="regalo-card" onClick={() => enviarRegalo(r)}>
                    <span className="emoji">{r.emoji}</span>
                    <span className="costo">{r.costo}</span>
                    {r.isCustom && <span className="custom-tag">CUSTOM</span>}
                  </div>
                ))}
                {regalosDisponibles.filter(r => r.isActive !== false).length === 0 && (
                  <p style={{ textAlign: 'center', padding: '10px', color: '#aaa', fontSize: '0.8rem' }}>No hay regalos disponibles</p>
                )}
              </div>
            )}
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={!currentUser} placeholder="Envía un mensaje..." />
            <button type="button" className="gift-button" onClick={() => setShowGiftMenu(!showGiftMenu)}><FaGift /></button>
            <button type="submit" className="send-button"><FaPaperPlane /></button>
          </form>
        </div >
      </div >

      {mostrarOverlay && (<div className="donation-overlay"><div className="donation-alert">{mensajeOverlay}</div></div>)
      }
    </>
  )
}

export default LiveStreamPage
