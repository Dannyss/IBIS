// Login.jsx
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../db/Auth';
import '../../css/formularios/Login.css';

const Login = () => {
  const { signIn, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      console.log(error);
    }
  };

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
      </form>
      <div>
        ¿No tienes una cuenta? <Link to="/signup">Regístrate aquí</Link>
      </div>
    </div>
  );
};

export default Login;