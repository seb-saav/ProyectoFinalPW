import { useNavigate } from "react-router-dom";
import "../estilos/TextPages.css"; // Reutilizamos el CSS unificado que creamos antes

// Importa tus imágenes locales
import raelAvatar from "../imagenes/Gemini_Generated_Image_s58wgbs58wgbs58w.png";
import royAvatar from "../imagenes/WhatsApp Image 2025-10-16 at 12.39.32 AM.jpeg";
import fatimaAvatar from "../imagenes/WhatsApp Image 2025-10-16 at 12.47.32 AM.jpeg";

const equipo = [
  {
    nombre: "Rael Chang",
    rol: "Frontend Developer",
    descripcion: "Especialista en interfaces y experiencia de usuario.",
    avatar: raelAvatar,
    fondoTematico: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070" 
  },
  {
    nombre: "Roy Saavedra",
    rol: "Diseñador de Backups 404",
    descripcion: "Experto en diseñar 'páginas no encontradas' con estilo.",
    avatar: royAvatar,
    fondoTematico: "https://images.unsplash.com/photo-1623018035782-b269248df916?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1170"
  },
  {
    nombre: "Fatima Abregu",
    rol: "Backend Developer",
    descripcion: "Construyendo la lógica y la base de datos de la plataforma.",
    avatar: fatimaAvatar,
    fondoTematico: "https://media.istockphoto.com/id/2198621098/es/foto/advertencia-del-sistema-alerta-de-pirateo-ciberataque-a-la-red-inform%C3%A1tica-vulnerabilidad-de.webp?a=1&b=1&s=612x612&w=0&k=20&c=-ZiILeQanXtm7T_jyg-8Pz8ekwtf241Co1ww_Me8Xx8="
  },
];

const NosotrosPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h1 className="page-title text-warning">Nuestro Equipo</h1>

      <div className="equipo-grid">
        {equipo.map((miembro, index) => (
          <div key={index} className="miembro-card" style={{ backgroundImage: `url(${miembro.fondoTematico})` }}>
            <div className="card-overlay">
              <img src={miembro.avatar} alt={miembro.nombre} className="miembro-avatar" />
              <h3 className="miembro-nombre">{miembro.nombre}</h3>
              <p className="miembro-rol">{miembro.rol}</p>
              <p className="miembro-descripcion">{miembro.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{textAlign: 'center', marginTop: '50px'}}>
        <button className="btn-ulima" onClick={() => navigate("/inicio")}>
            Regresar al Inicio
        </button>
      </div>
    </div>
  );
};

export default NosotrosPage;