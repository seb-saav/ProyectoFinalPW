import { useNavigate } from "react-router-dom";
import "../estilos/TextPages.css"; // Asegúrate de que este archivo exista con los estilos que creamos antes

const TyC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* Logo Ulima centrado y estilizado */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/e/e2/Universidad_de_Lima_logo.svg"
        alt="Logo Universidad de Lima"
        className="page-logo"
      />

      <h1 className="page-title text-warning">Términos y Condiciones</h1>

      <div className="text-content">
        <h2>1. Aceptación de los Términos</h2>
        <p>
          Al registrarte y utilizar la plataforma <strong>ULimeñitaPlay</strong>, aceptas y te comprometes a cumplir con los presentes términos y condiciones. Si no estás de acuerdo, te recomendamos no utilizar el servicio.
        </p>

        <h2>2. Cuentas de Usuario</h2>
        <p>
          Eres el único responsable de mantener la confidencialidad de tu cuenta y contraseña. Todas las actividades que ocurran bajo tu perfil son tu responsabilidad. Debes ser alumno activo o egresado para crear una cuenta.
        </p>

        <h2>3. Monedas y Puntos (Economía Virtual)</h2>
        <p>
          Las monedas virtuales ("ULI-Coins") adquiridas en la tienda no son reembolsables y no tienen valor monetario en el mundo real. Los puntos de lealtad se ganan mediante la interacción y pueden ser canjeados por beneficios dentro de la plataforma.
        </p>

        <h2>4. Contenido y Conducta</h2>
        <p>
          Fomentamos una comunidad respetuosa. No se permite el uso de lenguaje ofensivo, discriminatorio o acoso en los chats. ULimeñitaPlay se reserva el derecho de suspender cuentas que violen esta normativa sin previo aviso.
        </p>
        
        <h2>5. Propiedad Intelectual</h2>
        <p>
          Todo el contenido transmitido pertenece a sus respectivos creadores. ULimeñitaPlay actúa como medio de difusión académica y recreativa.
        </p>
      </div>
      
      <div style={{textAlign: 'center', marginTop: '40px'}}>
        <button className="btn-ulima" onClick={() => navigate("/inicio")}>
            Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default TyC;