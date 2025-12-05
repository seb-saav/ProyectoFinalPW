import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PERFILES_BOTS } from '../data/botsData';

interface Props {
    userId: string;
    username: string;
    children: React.ReactNode;
    xpThreshold?: number; // Prop opcional para la dificultad del canal
}

import { getPublicProfile } from '../services/userService';

export const UserHoverCard = ({ userId, username, children, xpThreshold }: Props) => {
    const [showCard, setShowCard] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'top' });
    const triggerRef = useRef<HTMLDivElement>(null);

    // Calcular nivel dinámico si hay un threshold personalizado
    const dynamicLevel = (profile: any) => {
        if (!profile) return 1;
        if (xpThreshold && profile.puntos !== undefined) {
            return Math.floor(profile.puntos / xpThreshold) + 1;
        }
        return profile.nivel;
    };

    const handleMouseEnter = async () => {
        // --- DEBUGGING (Agrega esto temporalmente) ---
        console.log("🔍 Intentando cargar perfil para ID:", userId);
        console.log("👤 Nombre de usuario:", username);
        // ---------------------------------------------

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const cardHeightEstimate = 250; // Altura aproximada de la tarjeta

            // Si hay menos espacio arriba que la altura de la tarjeta, mostrar abajo
            const placement = spaceAbove < cardHeightEstimate ? 'bottom' : 'top';

            setCoords({
                top: placement === 'top' ? rect.top : rect.bottom,
                left: rect.left + rect.width / 2,
                placement
            });
        }
        setShowCard(true);

        // 1. CACHÉ SIMPLE: Si ya tenemos los datos cargados, no molestamos al servidor
        if (profile) return;

        // 2. DETECTOR DE BOTS (Prioridad Alta)
        // Si el nombre es BotUlima, usamos los datos falsos y terminamos.
        if (PERFILES_BOTS[username]) {
            setProfile(PERFILES_BOTS[username]);
            return;
        }

        // 3. DETECTOR DE HUMANOS (Llamada Real)
        // Si no es un bot, vamos a la base de datos
        if (!userId) return; // Seguridad por si viene vacío

        setLoading(true);
        try {
            const dataReal = await getPublicProfile(userId);
            setProfile(dataReal);
        } catch (err) {
            console.error("Error cargando perfil humano:", err);
            // Fallback visual por si falla
            setProfile({
                name: username,
                role: 'usuario',
                nivel: 1,
                puntos: 0,
                description: "Usuario misterioso"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMouseLeave = () => setShowCard(false);

    return (
        <>
            <div
                ref={triggerRef}
                className="hover-card-wrapper"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ position: 'relative', display: 'inline-block' }}
            >
                {children}
            </div>

            {showCard && createPortal(
                <div style={{
                    position: 'fixed',
                    top: coords.top,
                    left: coords.left,
                    transform: coords.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                    marginTop: coords.placement === 'top' ? '-10px' : '10px',
                    width: '220px',
                    background: '#1a1a1a',
                    border: '1px solid #444',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 9999, // High z-index to stay on top
                    color: 'white',
                    textAlign: 'center',
                    pointerEvents: 'none' // Prevent flickering when moving mouse to the tooltip
                }}>
                    {profile ? (
                        <>
                            <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{profile.avatar}</div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{profile.name}</h4>
                            <span style={{
                                background: profile.role === 'admin' ? '#dc3545' : profile.role === 'moderator' ? '#0d6efd' : '#666',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                fontWeight: 'bold'
                            }}>
                                {profile.role}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '15px 0', fontSize: '0.9rem' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#9146ff' }}>{dynamicLevel(profile)}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>Nivel</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#ffc107' }}>{profile.puntos}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>Puntos</div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#ccc', fontStyle: 'italic', margin: 0 }}>
                                "{profile.description}"
                            </p>
                        </>
                    ) : (
                        <div style={{ padding: '10px', color: '#aaa' }}>
                            {loading ? "Cargando..." : "Usuario invitado"}
                        </div>
                    )}

                    {/* Flechita del tooltip */}
                    <div style={{
                        position: 'absolute',
                        top: coords.placement === 'top' ? '100%' : 'auto',
                        bottom: coords.placement === 'bottom' ? '100%' : 'auto',
                        left: '50%',
                        marginLeft: '-5px',
                        borderWidth: '5px',
                        borderStyle: 'solid',
                        borderColor: coords.placement === 'top'
                            ? '#1a1a1a transparent transparent transparent'
                            : 'transparent transparent #1a1a1a transparent'
                    }} />
                </div>,
                document.body
            )}
        </>
    );
};
