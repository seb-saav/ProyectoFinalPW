interface Props {
    level: number;
    onClose: () => void;
}

export const LevelUpModal = ({ level, onClose }: Props) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', // Fondo oscuro semitransparente
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, // Encima de todo
            animation: 'fadeIn 0.3s'
        }}>
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
            </style>
            <div style={{
                background: 'linear-gradient(135deg, #ff9900 0%, #ff5500 100%)',
                padding: '40px',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(255, 153, 0, 0.6)',
                border: '4px solid white',
                maxWidth: '400px'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>🏆</div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '32px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                    ¡Felicidades!
                </h2>
                <p style={{ color: 'white', fontSize: '18px', marginTop: '10px', fontFamily: 'sans-serif' }}>
                    Has alcanzado el
                </p>
                <div style={{
                    fontSize: '80px', fontWeight: 'bold', color: '#fff',
                    textShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    fontFamily: 'sans-serif'
                }}>
                    NIVEL {level}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '20px', padding: '10px 30px', fontSize: '18px',
                        borderRadius: '50px', border: 'none', cursor: 'pointer',
                        backgroundColor: 'white', color: '#ff5500', fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s',
                        fontFamily: 'sans-serif'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    ¡A CELEBRAR! 🎉
                </button>
            </div>
        </div>
    );
};
