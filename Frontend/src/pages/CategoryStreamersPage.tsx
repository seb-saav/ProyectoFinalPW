import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../estilos/CategoryStreamersPage.css";
import { streamersData } from "../data/streamersData";

const CategoryStreamersPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const streamers = streamersData[categoryId || ""] || [];
  const sortedStreamers = streamers.sort((a, b) => b.viewers - a.viewers);

  return (
    <div className="streamers-page-container">
      <h1 className="text-warning">Viendo: {categoryId?.toUpperCase()}</h1>
      <p>Selecciona un streamer para unirte a la transmisión.</p>
      <div className="streamer-list">
        {sortedStreamers.length > 0 ? (
          sortedStreamers.map((streamer) => (
            <div key={streamer.id} className="streamer-card" onClick={() => navigate(`/live/${streamer.id}`)}>
              <div className="streamer-avatar">
                <img src={streamer.avatarUrl} alt={streamer.name} />
              </div>
              <div className="streamer-info">
                <h5>{streamer.name}</h5>
                <p>{streamer.title}</p>
              </div>
              <div className="streamer-viewers">🔴 {streamer.viewers.toLocaleString()}</div>
            </div>
          ))
        ) : (
          <p className="mt-4">No hay streamers en vivo para esta categoría.</p>
        )}
      </div>
      <button className="btn btn-outline-light mt-4" onClick={() => navigate(-1)}>
        Volver a Categorías
      </button>
    </div>
  );
};
export default CategoryStreamersPage;