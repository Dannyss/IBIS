import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../db/Auth';
import '../../css/formularios/Login.css';
import { Link } from 'react-router-dom';
const Logout = () => {
  const { signOut, currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log(error);
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Link to="/logout" onClick={handleSignOut}>
      Logout
    </Link>
  );
};

export default Logout;