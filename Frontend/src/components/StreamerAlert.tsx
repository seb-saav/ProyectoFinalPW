import { useEffect } from 'react';

interface Props {
    giftName: string;
    senderName: string;
    onFinished: () => void; // Para avisar que la animación terminó
}

export const StreamerAlert = ({ giftName, senderName, onFinished }: Props) => {
    useEffect(() => {
        // Sonido de "Ka-ching!" (Opcional)
        // new Audio('/cash.mp3').play();

        // La alerta dura 4 segundos y desaparece
        const timer = setTimeout(() => {
            onFinished();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <div style={{
            position: 'absolute', // Flotando sobre el video
            top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #ff9900',
            borderRadius: '15px',
            padding: '20px 40px',
            textAlign: 'center',
            animation: 'slideInDown 0.5s', // Animación de entrada
            zIndex: 2000,
            boxShadow: '0 0 30px rgba(255, 153, 0, 0.5)'
        }}>
            {/* GIF o Animación decorativa */}
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎁</div>

            <h3 style={{ color: 'white', margin: 0, fontSize: '24px' }}>¡NUEVO REGALO!</h3>

            <p style={{ color: '#ff9900', fontSize: '20px', marginTop: '10px' }}>
                <strong style={{ color: 'white' }}>{senderName}</strong> envió:
            </p>

            <div style={{
                fontSize: '32px', fontWeight: 'bold', color: '#fff',
                textTransform: 'uppercase', marginTop: '5px'
            }}>
                ✨ {giftName} ✨
            </div>
        </div>
    );
};
