import { useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";

const CheckEmail = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            color: 'white',
            textAlign: 'center'
        }}>
            <div style={{
                background: '#1c1c1c',
                padding: '40px',
                borderRadius: '20px',
                border: '1px solid #333',
                maxWidth: '500px',
                width: '90%'
            }}>
                <FaEnvelope style={{ fontSize: '4rem', color: '#9146ff', marginBottom: '20px' }} />
                <h1 style={{ marginBottom: '15px' }}>¡Revisa tu correo!</h1>
                <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>
                    Hemos enviado un enlace de verificación a tu dirección de email.
                    Por favor, haz clic en él para activar tu cuenta.
                </p>

                <button
                    onClick={() => navigate('/inicio')}
                    className="btn-ulima"
                    style={{ width: '100%', padding: '12px' }}
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
};

export default CheckEmail;
