import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../config";

const VerificarCuenta = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [mensaje, setMensaje] = useState("Verificando tu cuenta...");

    // ESTO ES LA CLAVE: Una bandera para saber si ya llamamos al backend
    const yaSeLlamo = useRef(false);

    useEffect(() => {
        // 1. Si ya se llamó, DETENER TODO. Evita el doble disparo.
        if (yaSeLlamo.current === true) return;

        const token = searchParams.get("token");

        if (!token) {
            setMensaje("Error: Enlace inválido.");
            return;
        }

        // 2. Marcamos inmediatamente que ya estamos procesando
        yaSeLlamo.current = true;

        // 3. Hacemos la llamada ÚNICA
        console.log("Enviando token al backend:", token); // Para depurar

        // NOTA: Cambiamos a /api/auth/verify porque /api/verificar daba 404
        fetch(`${API_URL}/api/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                // Primero verificamos si es JSON para evitar el SyntaxError
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await res.text();
                    throw new Error(`Respuesta no válida del servidor (${res.status}): ${text.substring(0, 50)}...`);
                }

                const data = await res.json();

                if (res.ok) {
                    setMensaje("¡Éxito! Cuenta verificada ✅");
                    toast.success("¡Bienvenido! Redirigiendo...");
                    // Redirigimos al inicio con el parámetro login=true para abrir el modal
                    setTimeout(() => navigate("/inicio?login=true"), 2000);
                } else {
                    setMensaje(`Error: ${data.error || "El token ya no sirve."}`);
                }
            })
            .catch((err) => {
                console.error(err);
                setMensaje(`Error de conexión: ${err.message}`);
            });
    }, [searchParams, navigate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
            <h1>🔐 Verificación</h1>
            <h3 style={{ color: mensaje.includes("Éxito") ? "green" : "red" }}>
                {mensaje}
            </h3>
            {mensaje.includes("Error") && (
                <button onClick={() => navigate("/login")} className="btn btn-primary mt-3">
                    Ir al Login de todas formas
                </button>
            )}
        </div>
    );
};

export default VerificarCuenta;
