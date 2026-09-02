import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../db/Auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import '../../css/formularios/SignUp.css';
// Función para generar un usuario en la colección de Firestore
const altaUsuarioFirestore = async (email, nombre, uid) => {
  try {
    const db = getFirestore();
    const usuariosCollectionRef = collection(db, 'Usuarios');
    const usuarioRef = doc(usuariosCollectionRef);
    await setDoc(usuarioRef, {
      email: email,
      uid: uid,
      nombre: nombre,
      tipo: 1, // por defecto como alumno
      curso: [],
    });
  } catch (error) {
    console.error('Error al guardar el USUARIO en la base de datos:', error);
  }
};
const SignUp = () => {
  const { signUp, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Agregado el estado para el campo de nombre
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signUp(email, password);
      const uid = userCredential.user.uid;
      altaUsuarioFirestore(email, nombre, uid ); // Llamada a la función de generación de usuario en Firestore
    } catch (error) {
      console.log(error);
    }
  };

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form className="signup-form" onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Sign Up</button>
      </form>
      <div>
        ¿Tienes una cuenta? <Link to="/login">Entra aquí</Link>
      </div>
    </div>
  );
};

export default SignUp;
