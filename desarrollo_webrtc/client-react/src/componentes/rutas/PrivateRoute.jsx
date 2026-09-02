import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import AltaCursoFormulario from '../formularios/AltaCursoFormulario';
import NewCollectionForm from '../formularios/NewCollection';
import { useAuth } from '../db/Auth';
import Login from '../formularios/Login';
import Logout from '../formularios/Logout';
import SignUp from '../formularios/SignUp';
import LaboratorioWebRTC from '../LaboratorioWebRTC';

const RutasPrivadas = ({ Inicializador }) => {
  const { currentUser, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return <div>Cargando...</div>; // O mostrar un spinner u otra indicación de carga
  }
   console.info(location.pathname);
  if (!currentUser && location.pathname == '/signup') {
    return (
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    );
  }

  // 🧪 Ruta pública del Laboratorio WebRTC: no exige iniciar sesión,
  // es una batería de pruebas abierta para probar varias dispositivos.
  if (location.pathname === '/miriam') {
    return (
      <Routes>
        <Route path="/miriam" element={<LaboratorioWebRTC />} />
      </Routes>
    );
  }

  if (!currentUser && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  if (currentUser && location.pathname === '/login') {
    return <Navigate to="/" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Inicializador />} />
      <Route exact path="/alta-curso/:id" element={<AltaCursoFormulario/>} />
      <Route exact path="/alta-curso/*" element={<AltaCursoFormulario/>} />
      <Route path="/nueva-coleccion" element={<NewCollectionForm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/test-webrtc" element={<LaboratorioWebRTC />} />
    </Routes>
  );
};

export default RutasPrivadas;
