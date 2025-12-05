import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaGift, FaCogs, FaInfoCircle, FaFileAlt, FaSearch, FaSignOutAlt, FaUserCircle, FaVideo } from "react-icons/fa";
import "../estilos/Layout.css";
import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { API_URL } from "../config";
import { getUser, setUser, clearUser } from "../utils/storage";

interface User { id: string; name: string; email: string; role: string; monedas: number; }

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados Globales
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Modales
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  // Inputs Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Inputs Registro
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [acceptTyC, setAcceptTyC] = useState(false);

  // Función para recargar saldo
  const recargarSaldo = () => {
    setCurrentUser(getUser());
  };

  useEffect(() => {
    recargarSaldo();
    window.addEventListener("balanceUpdated", recargarSaldo);

    const params = new URLSearchParams(location.search);
    if (params.get("login") === "true") {
      setMostrarLogin(true);
    }

    return () => {
      window.removeEventListener("balanceUpdated", recargarSaldo);
    };
  }, [location]);

  const handleLogout = () => {
    clearUser();
    setCurrentUser(null);
    navigate("/inicio");
    toast.success("Sesión cerrada");
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigate(`/inicio?q=${searchTerm}`);
  }

  const handleLogin = async () => {
    const loading = toast.loading("Iniciando...");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      toast.dismiss(loading);

      if (!res.ok) toast.error(data.error);
      else {
        toast.success(`¡Hola de nuevo, ${data.user.name}!`);
        setUser(data.user);
        setCurrentUser(data.user);
        setMostrarLogin(false);
        setLoginEmail(""); setLoginPassword("");
      }
    } catch (e) { toast.dismiss(loading); toast.error("Error de conexión"); }
  }

  const handleRegister = async () => {
    if (!acceptTyC) return toast.error("Acepta los términos para continuar");

    const loading = toast.loading("Creando cuenta...");
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      });
      const data = await res.json();
      toast.dismiss(loading);

      if (!res.ok) toast.error(data.error);
      else {
        toast.success("¡Cuenta creada! Revisa tu correo.");
        setMostrarRegistro(false);
        setRegName(""); setRegEmail(""); setRegPassword(""); setAcceptTyC(false);
        navigate("/check-email");
      }
    } catch (e) { toast.dismiss(loading); toast.error("Error de conexión"); }
  }

  return (
    <div className="app-layout">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#333', color: '#fff' } }} />

      <aside className="sidebar">
        <div className="logo-container" onClick={() => navigate("/inicio")}>
          <span className="logo-short">UP</span>
          <h2 className="logo-full">ULimeñita<span>Play</span></h2>
        </div>
        <nav>
          <ul>
            <li onClick={() => navigate("/inicio")} className={location.pathname === "/inicio" ? "active" : ""}>
              <FaHome className="nav-icon" /><span className="nav-text">Inicio</span>
            </li>
            <li onClick={() => navigate("/tienda")} className={location.pathname === "/tienda" ? "active" : ""}>
              <FaGift className="nav-icon" /><span className="nav-text">Tienda</span>
            </li>

            {currentUser && currentUser.role === 'streamer' && (
              <li onClick={() => navigate("/panel-streamer")} className={location.pathname === "/panel-streamer" ? "active" : ""}>
                <FaCogs className="nav-icon" /><span className="nav-text">Gestionar Canal</span>
              </li>
            )}

            <li onClick={() => navigate("/nosotros")} className={location.pathname === "/nosotros" ? "active" : ""}>
              <FaInfoCircle className="nav-icon" /><span className="nav-text">Nosotros</span>
            </li>

            {currentUser && (
              <div className="user-links-sidebar">
                {currentUser.role === 'streamer' && (
                  <li onClick={() => navigate(`/live/${currentUser.id}`)} style={{ color: '#9146ff' }}>
                    <FaVideo className="nav-icon" /><span className="nav-text">Mi Stream</span>
                  </li>
                )}
                <li onClick={() => navigate("/perfil")} className={`user-link-item ${location.pathname === "/perfil" ? "active" : ""}`}>
                  <FaUserCircle className="nav-icon" style={{ color: '#ff6f00' }} />
                  <span className="nav-text" style={{ color: '#ff6f00', fontWeight: 'bold' }}>{currentUser.name}</span>
                </li>
              </div>
            )}
          </ul>

          <div className="sidebar-footer">
            <li onClick={() => navigate("/terminos")} className={location.pathname === "/terminos" ? "active" : ""}>
              <FaFileAlt className="nav-icon" /><span className="nav-text">Términos</span>
            </li>
            {currentUser && (
              <li onClick={handleLogout}>
                <FaSignOutAlt className="nav-icon" /><span className="nav-text">Salir</span>
              </li>
            )}
          </div>
        </nav>
      </aside >

      <main className="main-content">
        <div className="topbar">
          <div className="search-bar-container">
            <FaSearch className="search-icon" style={{ color: '#aaa' }} />
            <input
              type="text" placeholder="Buscar..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearch}
            />
          </div>

          <div className="topbar-actions">
            {!currentUser ? (
              <div className="auth-buttons">
                <button className="btn-ulima-outline" onClick={() => setMostrarLogin(true)}>Iniciar sesión</button>
                <button className="btn-ulima" onClick={() => setMostrarRegistro(true)}>Registrarse</button>
              </div>
            ) : (
              <div className="user-info-topbar">
                <span className="role-badge" style={{ background: currentUser.role === 'streamer' ? '#9146ff' : '#333' }}>
                  {currentUser.role === 'streamer' ? 'STREAMER' : 'FAN'}
                </span>
                <div className="coin-badge" onClick={() => navigate('/tienda')} style={{ cursor: 'pointer' }}>{currentUser.monedas} 🪙</div>
                <div className="profile-pic-mini" onClick={() => navigate('/perfil')}>
                  {/^\d/.test(currentUser.name) ? <FaUserCircle /> : currentUser.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="page-content">
          {children}
        </div>
      </main>

      {/* --- MODALES GLOBALES --- */}

      {/* LOGIN */}
      {
        mostrarLogin && (
          <div className="modal-backdrop" onClick={() => setMostrarLogin(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Bienvenido de nuevo</h3>
              <input className="auth-input" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input className="auth-input" placeholder="Contraseña" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />

              {/* REMOVED ROLE SELECTOR */}

              <button className="btn-ulima w-100 mt-3" onClick={handleLogin}>Entrar</button>
              <p className="switch-auth">¿No tienes cuenta? <span onClick={() => { setMostrarLogin(false); setMostrarRegistro(true) }}>Regístrate</span></p>
            </div>
          </div>
        )
      }

      {/* REGISTRO */}
      {
        mostrarRegistro && (
          <div className="modal-backdrop" onClick={() => setMostrarRegistro(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Únete a la comunidad</h3>
              <input className="auth-input" placeholder="Nombre" value={regName} onChange={e => setRegName(e.target.value)} />
              <input className="auth-input" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <input className="auth-input" placeholder="Contraseña" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} />

              <div className="tyc-checkbox">
                <input type="checkbox" checked={acceptTyC} onChange={e => setAcceptTyC(e.target.checked)} />
                <span>Acepto los <span className="link-text" onClick={() => { setMostrarRegistro(false); navigate('/terminos') }}>Términos</span></span>
              </div>

              <button className="btn-ulima w-100 mt-3" onClick={handleRegister}>Crear Cuenta</button>
              <p className="switch-auth">¿Ya tienes cuenta? <span onClick={() => { setMostrarRegistro(false); setMostrarLogin(true) }}>Inicia Sesión</span></p>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default Layout;