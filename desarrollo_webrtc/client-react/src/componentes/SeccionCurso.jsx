import React, { useEffect, useState } from 'react';
import { getFirestore, doc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export const SeccionCurso = ({ idCurso }) => {
  const [seccionData, setSeccionData] = useState([]);

  useEffect(() => {
    const loadSeccionData = async () => {
      try {
        const db = getFirestore();
        const cursoRef = doc(db, 'Cursos', idCurso);

        // Modificamos la consulta para ordenar las secciones por su número de orden
        const seccionesQuery = query(collection(db, 'Lecciones'), 
          where('idCurso', '==', cursoRef), 
          orderBy('orden', 'asc')); // Ordenar las secciones por el campo 'orden' en orden ascendente
        const seccionesSnapshot = await getDocs(seccionesQuery);
        const seccionesData = seccionesSnapshot.docs.map((doc) => doc.data());

        setSeccionData(seccionesData);
      } catch (error) {
        console.error('Error al cargar las secciones del curso:', error);
      }
    };

    if (idCurso) {
      loadSeccionData();
    }
  }, [idCurso]);

  return (
    <>
      {seccionData.map((seccion) => (
        <div className="contenedor-seccion" key={seccion.id}>
          <header className="cabecera-seccion">
            <h1>{seccion.title}</h1>
            <h3 className="h3-seccion">
              Sección: <span className="span-seccion">{seccion.id} - {seccion.orden}</span>
            </h3>
            <h4>Descripción:</h4>
            <span dangerouslySetInnerHTML={{ __html: seccion.description }} />
          </header>
          <section className="contenedor-contenido">
            <span dangerouslySetInnerHTML={{ __html: seccion.content }} />
          </section>
        </div>
      ))}
    </>
  );
};

export default SeccionCurso;
