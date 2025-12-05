import { useState, useEffect } from "react"
import { getCommunityProgress, updateUserRole } from "../services/userService"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import "../estilos/Perfil.css"
import { FaUserCircle, FaTrophy, FaVideo, FaCoins, FaTrash, FaEdit, FaSave, FaExchangeAlt, FaPlayCircle, FaTimes } from "react-icons/fa"
import { API_URL } from "../config"

const PerfilPage = () => {
    const navigate = useNavigate()
    const [userState, setUserState] = useState<any>(null);

    // Estados de UI
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Campos editables
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");

    // Estado para RF-30: Progreso por Comunidades
    const [communityProgress, setCommunityProgress] = useState<any[]>([]);

    // Estado para el cronómetro
    const [elapsedTime, setElapsedTime] = useState("00:00:00");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");
        if (!storedUser) {
            navigate("/inicio")
        } else {
            // 1. Cargar estado inicial de localStorage
            setUserState(storedUser);
            setEditName(storedUser.name);
            setEditDesc(storedUser.description || "");

            // 2. REFRESCAR DATOS DEL BACKEND (Importante para RF-05)
            // Obtenemos la data fresca de la BD (horas reales, estado live, etc.)
            fetch(`${API_URL}/api/users/public/${storedUser.id}`)
                .then(res => res.json())
                .then(freshData => {
                    console.log("🔄 Datos frescos del usuario:", freshData);
                    setUserState((prev: any) => ({
                        ...prev,
                        ...freshData // Sobreescribimos con lo más reciente de la BD
                    }));
                })
                .catch(err => console.error("Error refrescando usuario:", err));

            // 3. Cargar Progreso de Comunidades
            getCommunityProgress(storedUser.id)
                .then(data => {
                    setCommunityProgress(data);
                })
                .catch(err => console.error("Error cargando progreso", err));
        }
    }, [])

    // --- CRONÓMETRO (RF-05) ---
    useEffect(() => {
        let interval: any;
        if (userState?.isLive && userState?.lastStreamStart) {
            const startTime = new Date(userState.lastStreamStart).getTime();

            // Función para actualizar el tiempo
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = now - startTime;

                if (diff < 0) {
                    setElapsedTime("00:00:00");
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            };

            updateTimer(); // Actualizar inmediatamente
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime("00:00:00");
        }
        return () => clearInterval(interval);
    }, [userState?.isLive, userState?.lastStreamStart]);

    // --- LÓGICA DE NIVELES ---
    const calcularNivel = (valor: number, divisor: number) => {
        const nivel = Math.floor(valor / divisor) + 1
        const siguienteNivel = nivel * divisor
        const progreso = ((valor % divisor) / divisor) * 100
        const falta = siguienteNivel - valor
        return { nivel, siguienteNivel, progreso, falta }
    }

    if (!userState) return null

    const statsFan = calcularNivel(userState.puntos, 500); // Nivel cada 500 pts

    // --- ACCIONES ---

    const handleSaveProfile = async () => {
        const loading = toast.loading("Guardando...");
        try {
            const res = await fetch(`${API_URL}/api/user/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userState.id,
                    name: editName,
                    description: editDesc,
                    role: userState.role
                })
            })

            toast.dismiss(loading);
            if (res.ok) {
                const updatedUser = await res.json()
                setUserState(updatedUser)
                localStorage.setItem("currentUser", JSON.stringify(updatedUser))
                setIsEditing(false)
                toast.success("Perfil actualizado correctamente")
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Error al guardar cambios");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.dismiss(loading);
            toast.error("Error de conexión");
        }
    }

    const handleSwitchRole = async () => {
        const newRole = userState.role === 'streamer' ? 'usuario' : 'streamer';

        // Usamos un toast custom para confirmar en lugar de window.confirm
        toast.custom((t) => (
            <div style={{ background: '#222', padding: '15px', borderRadius: '10px', border: '1px solid #555', color: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                <p style={{ marginBottom: '10px' }}>¿Cambiar rol a <strong>{newRole.toUpperCase()}</strong>?</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => {
                        toast.dismiss(t.id);
                        ejecutarCambioRol(newRole);
                    }} style={{ background: '#ff6f00', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer' }}>Sí, cambiar</button>
                    <button onClick={() => toast.dismiss(t.id)} style={{ background: 'transparent', border: '1px solid #aaa', color: '#ccc', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                </div>
            </div>
        ), { duration: 5000 });
    }

    const ejecutarCambioRol = async (newRole: string) => {
        try {
            const updatedUser = await updateUserRole(userState.id, newRole);

            setUserState(updatedUser)
            localStorage.setItem("currentUser", JSON.stringify(updatedUser))
            toast.success(`¡Ahora eres ${newRole === 'streamer' ? 'Streamer' : 'Espectador'}!`)
            setTimeout(() => window.location.reload(), 1000)

        } catch (error: any) {
            console.error("Error UI cambio rol:", error);
            toast.error(error.message || "Error al cambiar rol (Conexión)");
        }
    }

    const handleDeleteAccount = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/delete/${userState.id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Cuenta eliminada. Hasta pronto.")
                localStorage.clear()
                navigate("/")
                window.location.reload()
            } else { toast.error("Error al eliminar") }
        } catch (error) { toast.error("Error de conexión") }
    }

    // --- LÓGICA DE STREAM (RF-05) ---
    const cambiarEstadoStream = async (action: "START" | "END") => {
        const loading = toast.loading(action === "START" ? "Iniciando..." : "Finalizando...");
        try {
            const res = await fetch(`${API_URL}/api/streams/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userState.id, action })
            });

            const data = await res.json();
            toast.dismiss(loading);

            if (res.ok) {
                // Actualizar estado local
                const updatedUser = { ...userState };

                if (action === "START") {
                    updatedUser.isLive = true;
                    // Optimistic update para el cronómetro (Usando hora del backend)
                    updatedUser.lastStreamStart = data.lastStreamStart || new Date().toISOString();
                    toast.success("🔴 ¡Estás en vivo! (El tiempo corre seguro)");
                    navigate(`/live/${userState.id}`);
                } else {
                    updatedUser.isLive = false;
                    updatedUser.lastStreamStart = null;
                    updatedUser.totalStreamHours = data.totalHoras; // Actualizar horas reales
                    toast.success(`⏹ Stream finalizado. +${data.horasSumadas} horas.`);
                }

                setUserState(updatedUser);
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            } else {
                toast.error(data.error || "Error cambiando estado");
            }
        } catch (error) {
            toast.dismiss(loading);
            toast.error("Error de conexión con el servidor");
        }
    };

    return (
        <div className="perfil-container">

            {/* --- HEADER --- */}
            <div className="perfil-header">
                <div className="avatar-wrapper">
                    <FaUserCircle />
                </div>

                <div className="perfil-info">
                    {isEditing ? (
                        <div className="edit-mode-container">
                            <input className="input-edit" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Tu nombre" />
                            <textarea className="input-edit textarea-edit" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Escribe algo sobre ti..." />
                            <div className="edit-actions">
                                <button className="btn-ulima" onClick={handleSaveProfile}><FaSave /> Guardar</button>
                                <button className="btn-icon" onClick={() => setIsEditing(false)}><FaTimes /> Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1>{userState.name}</h1>
                            <p className="bio-text">"{userState.description || 'Sin descripción'}"</p>
                            <p>{userState.email}</p>

                            <div className="action-bar">
                                <span className="rol-badge" style={{ background: userState.role === 'streamer' ? '#9146ff' : '#1f69ff' }}>
                                    {userState.role.toUpperCase()}
                                </span>

                                <button className="btn-icon" onClick={() => setIsEditing(true)} style={{ color: '#ff6f00', borderColor: '#ff6f00' }}>
                                    <FaEdit /> Editar Perfil
                                </button>

                                <button className="btn-icon" onClick={handleSwitchRole}>
                                    <FaExchangeAlt /> Cambiar Rol
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="stats-grid">

                {/* NIVEL FAN */}
                <div className="stat-card card-fan">
                    <div className="stat-header text-fan"><FaTrophy /> Nivel Fan</div>
                    <div className="stat-value">{statsFan.nivel}</div>
                    <div className="stat-subtitle">{userState.puntos} XP Totales</div>
                    <div className="progress-track"><div className="progress-fill bg-fan" style={{ width: `${statsFan.progreso}%` }}></div></div>
                    <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>Faltan <strong>{statsFan.falta} pts</strong> para subir.</p>
                </div>

                {/* NIVEL STREAMER (RF-05: Tolerancia a Fallos) */}
                {userState.role === 'streamer' && (
                    <div className="stat-card card-streamer">
                        <div className="stat-header text-streamer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span><FaVideo /> Nivel Streamer</span>
                            <span style={{ background: '#9146ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: 'white' }}>
                                Lvl {Math.floor((userState.totalStreamHours || 0) / 10) + 1}
                            </span>
                        </div>

                        {/* Barra de Progreso (1 Nivel = 10 Horas) */}
                        <div style={{ margin: '15px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>
                                <span>Progreso Nivel Actual</span>
                                <span>{(userState.totalStreamHours || 0).toFixed(2)} / {Math.ceil((userState.totalStreamHours || 0) / 10) * 10} hrs</span>
                            </div>
                            <div className="progress-track" style={{ height: '12px', background: '#333' }}>
                                <div
                                    className="progress-fill bg-streamer"
                                    style={{
                                        width: `${((userState.totalStreamHours || 0) % 10) * 10}%`,
                                        background: 'linear-gradient(90deg, #9146ff, #ff0055)'
                                    }}
                                ></div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                                Faltan <strong>{(10 - ((userState.totalStreamHours || 0) % 10)).toFixed(2)} hrs</strong> para subir.
                            </p>
                        </div>

                        {/* CRONÓMETRO Y CONTROLES */}
                        {userState.isLive && (
                            <div style={{ textAlign: 'center', margin: '15px 0', background: '#222', padding: '15px', borderRadius: '12px', border: '1px solid #e91916', boxShadow: '0 0 15px rgba(233, 25, 22, 0.2)' }}>
                                <div style={{ color: '#e91916', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }} className="animate-pulse">
                                    🔴 En Vivo
                                </div>
                                <div style={{ fontSize: '2.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                                    {elapsedTime}
                                </div>
                            </div>
                        )}

                        {/* BOTÓN DE STREAM CON TOLERANCIA A FALLOS */}
                        {!userState.isLive ? (
                            <button
                                onClick={() => cambiarEstadoStream("START")}
                                className="btn-ulima"
                                style={{ width: '100%', marginTop: '10px', background: '#2ea44f', padding: '12px', fontSize: '1.1rem' }}
                            >
                                <FaPlayCircle /> Iniciar Stream
                            </button>
                        ) : (
                            <button
                                onClick={() => cambiarEstadoStream("END")}
                                className="btn-ulima"
                                style={{ width: '100%', marginTop: '10px', background: '#dc3545', padding: '12px', fontSize: '1.1rem' }}
                            >
                                <FaTimes /> Terminar Stream
                            </button>
                        )}
                    </div>
                )}

                {/* BILLETERA */}
                <div className="stat-card card-money">
                    <div className="stat-header text-money"><FaCoins /> Billetera</div>
                    <div className="stat-value text-money">{userState.monedas}</div>
                    <div className="stat-subtitle">Monedas Disponibles</div>
                    <button onClick={() => navigate('/tienda')} className="btn-ulima" style={{ width: '100%', marginTop: '10px' }}>
                        Recargar Saldo
                    </button>
                </div>

            </div>

            {/* --- RF-30: TABLERO DE PROGRESO POR COMUNIDADES --- */}
            <div className="community-progress-section" style={{ marginTop: '30px', background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                    <FaTrophy style={{ color: '#ffc107' }} /> Mis Comunidades
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Tu progreso en cada canal que sigues. ¡Cada streamer pone sus propias reglas!
                </p>

                {communityProgress.length > 0 ? (
                    <div className="community-table-wrapper" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', color: '#9146ff' }}>Streamer</th>
                                    <th style={{ padding: '10px' }}>Nivel Local</th>
                                    <th style={{ padding: '10px' }}>XP / Meta</th>
                                    <th style={{ padding: '10px' }}>Progreso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {communityProgress.map((cp, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{cp.streamerName}</td>
                                        <td style={{ padding: '15px 10px' }}>
                                            <span style={{ background: '#9146ff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                                Lvl {cp.currentLevel}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 10px', color: '#ccc' }}>
                                            {cp.xpLocal} / <span style={{ color: '#ffc107' }}>{cp.nextLevelAt}</span>
                                        </td>
                                        <td style={{ padding: '15px 10px', width: '30%' }}>
                                            <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(100, (cp.xpThreshold - cp.pointsToNextLevel) / cp.xpThreshold * 100)}%`,
                                                    background: 'linear-gradient(90deg, #9146ff, #ff0055)',
                                                    height: '100%'
                                                }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                                Faltan {cp.pointsToNextLevel} XP
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#666', fontStyle: 'italic', background: '#111', borderRadius: '8px' }}>
                        No tienes progreso en ninguna comunidad aún. ¡Ve a ver streams y envía regalos!
                    </div>
                )}
            </div>

            {/* --- ZONA DE PELIGRO --- */}
            <div className="danger-zone">
                {!showDeleteConfirm ? (
                    <div>
                        <h3 className="danger-title"><FaTrash /> Zona de Peligro</h3>
                        <p className="danger-desc">Eliminar tu cuenta es irreversible. Perderás acceso, monedas y suscripciones.</p>
                        <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>ELIMINAR CUENTA</button>
                    </div>
                ) : (
                    <div className="delete-confirm-box">
                        <h3 style={{ color: '#dc3545', marginTop: 0 }}>¿Confirmar Eliminación?</h3>
                        <p>Escribe <strong>ELIMINAR</strong> en tu mente y despídete de todo.</p>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={handleDeleteAccount} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>SÍ, BORRAR AHORA</button>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ background: 'transparent', color: 'white', border: '1px solid #aaa', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

export default PerfilPage
