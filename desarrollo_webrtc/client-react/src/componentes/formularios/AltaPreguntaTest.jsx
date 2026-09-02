import React, { useState } from 'react';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import '../../css/formularios/AltaPreguntasTest.css';

const AltaPreguntaTest = ({ idCurso }) => {
  const [pregunta, setPregunta] = useState('');
  const [opciones, setOpciones] = useState(['', '', '', '']);
  const [respuestaCorrecta, setRespuestaCorrecta] = useState(null);

  const handlePreguntaChange = (e) => setPregunta(e.target.value);
  const handleOpcionChange = (index, value) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index] = value;
    setOpciones(nuevasOpciones);
  };
  const handleRespuestaCorrectaChange = (index) => setRespuestaCorrecta(index);

  const handleGuardarPregunta = async () => {
    if (pregunta && respuestaCorrecta !== null && opciones.every(opcion => opcion)) {
      try {
        const db = getFirestore();
        // Obtén la referencia al documento del curso que quieres actualizar
        const cursoRef = doc(collection(db, 'Cursos'), idCurso); 
  
        // Crea un nuevo documento dentro de la subcolección "Preguntas" del documento del curso
        const preguntaId = doc(collection(cursoRef, 'Preguntas')).id;
  
        // Guarda la pregunta en la subcolección "Preguntas" del documento del curso
        const preguntaData = {
          pregunta,
          opciones,
          respuestaCorrecta,
        };
        console.log('Guardando pregunta con ID:', preguntaId);
        console.log('Datos de la pregunta:', preguntaData);
        await setDoc(doc(cursoRef, 'Preguntas', preguntaId), preguntaData);
        alert(`Pregunta guardada correctamente con ID: ${preguntaId}`);
        // Restablece los estados después de guardar la pregunta
        setPregunta('');
        setOpciones(['', '', '', '']);
        setRespuestaCorrecta(null);
      } catch (error) {
        console.error('Error al guardar la pregunta:', error);
        alert('Error al guardar la pregunta');
      }
    } else {
      alert('Por favor, completa todos los campos y selecciona una respuesta correcta.');
    }
  };

  return (
    <div className="form-pregunta">
      <div className="form-pregunta-titulo">
        <label htmlFor="pregunta">Pregunta:</label>
        <input
          type="text"
          id="pregunta"
          value={pregunta}
          onChange={handlePreguntaChange}
          placeholder="Inserte la pregunta"
          required
        />
      </div>
      <div className="form-opciones">
        {opciones.map((opcion, index) => (
          <div key={index} className="form-opcion">
            <label htmlFor={`opcion${index}`}>Opción {String.fromCharCode(97 + index)}:</label>
            <input
              type="text"
              id={`opcion${index}`}
              value={opcion}
              onChange={(e) => handleOpcionChange(index, e.target.value)}
              placeholder={`Opción ${String.fromCharCode(97 + index)}`}
              required
            />
            <input
              type="radio"
              name="respuestaCorrecta"
              checked={respuestaCorrecta === index}
              onChange={() => handleRespuestaCorrectaChange(index)}
            />
            Correcta
          </div>
        ))}
      </div>
      <button onClick={handleGuardarPregunta}>Guardar Pregunta</button>
    </div>
  );
};

export default AltaPreguntaTest;
