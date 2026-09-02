import './css/App.css';
// 1. Corregimos las extensiones explícitas de los componentes que eran .js
import Cabecera from './componentes/Cabecera.jsx';
import CursoLista from './componentes/CursoLista.jsx';
import RutasPrivadas from './componentes/rutas/PrivateRoute.jsx';
import React, { useEffect, useState } from 'react';
import { db } from './componentes/db/db.jsx'; // Tu archivo de configuración de Firebase
import { AuthProvider, useAuth } from './componentes/db/Auth.jsx';
import { BrowserRouter as Router } from 'react-router-dom';

// 2. Importaciones modulares nativas de Firestore para la Web
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';

const Inicializador = () => {
  const { currentUser, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!currentUser?.email) return;

    async function cargarDatosUsuario() {
  try {
    const promises = [];
    
    // 1. Apuntamos a la colección usando la sintaxis modular de Vite
    const usuariosRef = collection(db, 'Usuarios');
    const q = query(usuariosRef, where('email', '==', currentUser.email));
    const querySnapshotUsuario = await getDocs(q);

    querySnapshotUsuario.forEach((docSnap) => {
      const cursoRefs = docSnap.data().curso || [];
      
      cursoRefs.forEach((cursoRef) => {
        // 2. CORRECCIÓN CRÍTICA: Forzamos a que getDoc reciba la referencia de forma limpia
        // Si cursoRef ya es una referencia válida, getDoc(cursoRef) funcionará directamente en el nuevo SDK
        const promise = getDoc(cursoRef)
          .then((cursoDoc) => {
            if (cursoDoc.exists()) {
              return { id: cursoDoc.id, ...cursoDoc.data() }; // Retornamos los datos con su ID
            }
            return null;
          })
          .catch(err => {
            console.warn(`No se pudo cargar un curso individual:`, err);
            return null;
          });
          
        promises.push(promise);
      });
    });

    // 3. Esperamos a que se resuelvan todas las consultas de tus cursos
    const resultados = await Promise.all(promises);
    
    // Filtrar posibles cursos nulos por si alguno fue borrado en la base de datos
    const cursosValidos = resultados.filter(curso => curso !== null);
    
    console.log("📊 Cursos cargados con éxito en Vite:", cursosValidos);
    setTasks(cursosValidos);
    
  } catch (error) {
    console.error('❌ Error crítico al obtener los documentos de Firestore:', error);
  }
}


    cargarDatosUsuario();
  }, [currentUser]);
  

  const getPercentComplete = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((task) => task.completed);
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  return (
    <>
      <Cabecera percentComplete={getPercentComplete()} />
      <CursoLista tasks={tasks} setTasks={setTasks} />
      <footer>
        <span>Información Footer</span>
      </footer>
    </>
  );
};

const App = () => {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <RutasPrivadas Inicializador={Inicializador} />
        </AuthProvider>
      </Router>
    </div>
  );
};

export default App;
