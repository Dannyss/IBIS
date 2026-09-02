import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const ListarPreguntas = ({ idCurso }) => {
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    const obtenerPreguntas = async () => {
      try {
        const db = getFirestore();
        const preguntasRef = collection(db, `Cursos/${idCurso}/Preguntas`);
        const q = query(preguntasRef);
        const querySnapshot = await getDocs(q);

        const preguntasArray = [];
        querySnapshot.forEach((doc) => {
          preguntasArray.push({ id: doc.id, ...doc.data() });
        });
        setPreguntas(preguntasArray);
      } catch (error) {
        console.error('Error al obtener las preguntas:', error);
      }
    };

    if (idCurso) {
      obtenerPreguntas();
    }
  }, [idCurso]);

  return (
    <div>
      <h3>Preguntas del Curso</h3>
      {preguntas.length > 0 ? (
        <ul>
          {preguntas.map((pregunta) => (
            <li key={pregunta.id}>
              <p>{pregunta.pregunta}</p>
              <ul>
                {pregunta.opciones.map((opcion, index) => (
                  <li key={index}>{opcion}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay preguntas disponibles para este curso.</p>
      )}
    </div>
  );
};

export default ListarPreguntas;
