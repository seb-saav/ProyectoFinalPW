import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "../estilos/PantallaGeneral.css";
import { API_URL } from "../config";
import { useSocket } from "../context/SocketContext";

// Datos estáticos de categorías
const allCategories = [
  { id: "asmr", name: "ASMR", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/509659-285x380.jpg", type: "popular" },
  { id: "lol", name: "League of Legends", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg", type: "popular" },
  { id: "valorant", name: "Valorant", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg", type: "popular" },
  { id: "fortnite", name: "Fortnite", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg", type: "popular" },
  { id: "fc24", name: "EA Sports FC 24", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/1745202732_IGDB-285x380.jpg", type: "popular" },
  { id: "minecraft", name: "Minecraft", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-285x380.jpg", type: "popular" },
  { id: "f1", name: "F1 2025", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/33895_IGDB-285x380.jpg", type: "other" },
  { id: "basketball", name: "NBA 2K25", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/196698144_IGDB-285x380.jpg", type: "other" },
  { id: "music", name: "Música", imageUrl: "https://static-cdn.jtvnw.net/ttv-boxart/26936-285x380.jpg", type: "other" }
];

const PantallaGeneral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const { socket } = useSocket();

  // Filtros
  const filteredCategories = allCategories.filter(c => c.name.toLowerCase().includes(query));
  const popularCats = filteredCategories.filter(c => c.type === "popular");
  const otherCats = filteredCategories.filter(c => c.type === "other");

  const [liveStreams, setLiveStreams] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveStreams = () => {
      fetch(`${API_URL}/api/streams/live`)
        .then(res => res.json())
        .then(data => setLiveStreams(data))
        .catch(err => console.error("Error loading live streams", err));
    };

    // Carga inicial
    fetchLiveStreams();

    // Conexión Socket para actualizaciones en tiempo real
    // const socket = io(SOCKET_URL); // REMOVED

    if (socket) {
      // Optimización: Agregar stream directamente sin recargar
      socket.on("server:stream_started", (newStreamer: any) => {
        console.log("🔴 Nuevo stream detectado:", newStreamer);
        setLiveStreams(prev => {
          if (prev.some(s => s.id === newStreamer.id)) return prev;
          return [...prev, newStreamer];
        });
      });

      socket.on("server:stream_ended", () => {
        console.log("🛑 Stream finalizado, actualizando lista...");
        fetchLiveStreams();
      });
    }

    return () => {
      if (socket) {
        socket.off("server:stream_started");
        socket.off("server:stream_ended");
      }
      // socket.disconnect(); // NO DESCONECTAR
    };
  }, [socket]);

  return (
    <div className="home-container">
      {!query && (
        <section className="hero text-center">
          <h1>Bienvenido a <span>ULimeñitaPlay</span></h1>
          <p>La plataforma de streaming creada por y para alumnos de la Universidad de Lima.</p>
        </section>
      )}

      {/* SECCIÓN DE STREAMS EN VIVO (DINÁMICA) */}
      {!query && liveStreams.length > 0 && (
        <section className="category-section">
          <h3 className="section-title" style={{ color: '#e91916' }}>🔴 En Vivo <span>Ahora</span></h3>
          <div className="category-grid">
            {liveStreams.map((stream) => (
              <div key={stream.id} className="category-card" onClick={() => navigate(`/live/${stream.id}`)}>
                <div style={{ position: 'relative' }}>
                  <img src="https://static-cdn.jtvnw.net/ttv-static/404_preview-320x180.jpg" alt={stream.streamTitle} style={{ height: '180px', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'red', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVE</div>
                </div>
                <div className="card-info">
                  <h5 style={{ fontSize: '1rem', marginBottom: '5px' }}>{stream.streamTitle || "Sin Título"}</h5>
                  <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{stream.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {query && <h2 className="search-title">Resultados para: "{query}"</h2>}

      {/* CATEGORÍAS POPULARES */}
      {popularCats.length > 0 && (
        <section className="category-section">
          <h3 className="section-title popular-title">Categorías <span>Populares</span></h3>
          <div className="category-grid">
            {popularCats.map((category) => (
              <div key={category.id} className="category-card" onClick={() => navigate(`/category/${category.id}`)}>
                <img src={category.imageUrl} alt={category.name} />
                <div className="card-info">
                  <h5>{category.name}</h5>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OTRAS CATEGORÍAS */}
      {otherCats.length > 0 && (
        <section className="category-section mt-50">
          <h3 className="section-title other-title">Explora <span>Más</span></h3>
          <div className="category-grid">
            {otherCats.map((category) => (
              <div key={category.id} className="category-card" onClick={() => navigate(`/category/${category.id}`)}>
                <img src={category.imageUrl} alt={category.name} />
                <div className="card-info">
                  <h5>{category.name}</h5>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredCategories.length === 0 && (
        <p className="no-results">No se encontraron resultados :(</p>
      )}
    </div>
  );
};

export default PantallaGeneral;
