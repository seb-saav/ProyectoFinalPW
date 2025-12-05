import React from "react";
import ReactDOM from "react-dom/client";
import CambiarPantallas from "./pages/CambiarPantallas";
import "bootstrap/dist/css/bootstrap.min.css";
import { SocketProvider } from "./context/SocketContext";
import { BrowserRouter } from "react-router-dom";

// Obligamos al usuario a iniciar sesión cada vez que el programa se abre.

localStorage.removeItem("currentRole");
localStorage.removeItem("activeStream");
// --------------------------------------------

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SocketProvider>
      <BrowserRouter basename={import.meta.env.MODE === 'production' ? '/ProyectoFinalPW' : '/'}>
        <CambiarPantallas />
      </BrowserRouter>
    </SocketProvider>
  </React.StrictMode>
);