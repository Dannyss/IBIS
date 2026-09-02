import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import '../../css/formularios/AltaCursoFormulario.css';
import LinkRutas from '../rutas/LinkRutas';
import { v4 as uuidv4 } from 'uuid';
import AltaSeccionCurso from './AltaSeccionCurso';
import SeccionCurso from '../SeccionCurso';
import AltaPreguntaTest from './AltaPreguntaTest';
import ListarPreguntas from '../ListarPreguntas'; // Importamos el nuevo componente

const AltaCursoFormulario = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [idCurso, setIdCursoUrl] = useState('');
  const [idCursoActivo, setIdCursoActivo] = useState(false);
  const [cursoData, setCursoData] = useState(null);
  const [lecciones, setLecciones] = useState([]);
  const [textoPlano, setTextoPlano] = useState('');

  useEffect(() => {
    const loadCursoData = async () => {
      try {
        const db = getFirestore();
        const cursoRef = doc(db, 'Cursos', id);
        const cursoDoc = await getDoc(cursoRef);

        if (cursoDoc.exists()) {
          setCursoData(cursoDoc.data());
          setIdCursoUrl(id);
          setIdCursoActivo(true);
        } else {
          setIdCursoActivo(false);
          navigate('/alta-curso');
        }
      } catch (error) {
        console.error('Error al cargar los datos del curso:', error);
      }
    };

    if (id) {
      loadCursoData();
    }
  }, [id, navigate]);

  const handleButtonClicked = async () => {
    const idCurso = uuidv4();
    setIdCursoUrl(idCurso);
    setIdCursoActivo(true);

    try {
      const db = getFirestore();
      const cursoRef = doc(db, 'Cursos', idCurso);
      await setDoc(cursoRef, {
        id: idCurso,
        title: document.querySelector("#titulo").value,
        description: document.querySelector("#descripcion").value,
      });
      navigate(`/alta-curso/${idCurso}`);
    } catch (error) {
      console.error('Error al guardar el ID en la base de datos:', error);
    }
  };

  const handleTextoPlanoChange = (e) => setTextoPlano(e.target.value);

  const procesarTextoPlano = async () => {
    const preguntas = [];
    const lineas = textoPlano.split('\n');
    let preguntaActual = null;

    lineas.forEach((linea) => {
      if (/^\d+\.\s/.test(linea)) {
        if (preguntaActual) {
          preguntas.push(preguntaActual);
        }
        preguntaActual = {
          pregunta: linea.slice(3).trim(),
          opciones: []
        };
      } else if (/^[a-d]\)\s/.test(linea)) {
        if (preguntaActual) {
          preguntaActual.opciones.push(linea.slice(3).trim());
        }
      }
    });

    if (preguntaActual) {
      preguntas.push(preguntaActual);
    }

    try {
      const db = getFirestore();
      const batch = writeBatch(db);

      preguntas.forEach((pregunta) => {
        const preguntaId = uuidv4();
        const preguntaRef = doc(db, `Cursos/${idCurso}/Preguntas`, preguntaId);
        batch.set(preguntaRef, pregunta);
      });

      await batch.commit();
      alert('Preguntas guardadas correctamente');
      setTextoPlano('');
    } catch (error) {
      console.error('Error al guardar las preguntas:', error);
      alert('Error al guardar las preguntas');
    }
  };

  return (
    <>
      <LinkRutas />
      {!idCursoActivo && !cursoData && (
        <form className="form-curso">
          <div className="form-curso-titulo">
            <label htmlFor="titulo">Título del Curso:</label>
            <input type="text" id="titulo" name="titulo" placeholder="Inserte el título del curso" required />
          </div>
          <div className="form-curso-descripcion">
            <label htmlFor="descripcion">Descripción del Curso:</label>
            <textarea id="descripcion" name="descripcion" placeholder="Inserte la descripción del curso" required></textarea>
          </div>
          <div className="contenedor-seccion">
            <button type="button" onClick={handleButtonClicked}>Genera Curso</button>
          </div>
        </form>
      )}

      {idCursoActivo && (
        <>
          <div className="contenedor-crear-pregunta">
            <AltaPreguntaTest idCurso={idCurso} />
          </div>
          <div className="contenedor-crear-seccion">
            <AltaSeccionCurso idCurso={idCurso} lecciones={lecciones} setLecciones={setLecciones} />
          </div>
          <div className="form-texto-plano">
            <label htmlFor="textoPlano">Pegar Texto Plano:</label>
            <textarea
              id="textoPlano"
              value={textoPlano}
              onChange={handleTextoPlanoChange}
              placeholder="Inserte el texto plano"
              required
            />
            <button onClick={procesarTextoPlano}>Procesar Texto</button>
          </div>
          <div className="listar-preguntas">
            <ListarPreguntas idCurso={idCurso} /> {/* Agregamos el componente para listar preguntas */}
          </div>
        </>
      )}

      {cursoData && (
        <>
          <div className="tarjeta-curso">
            <h2>{cursoData.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: cursoData.description }} />
          </div>
          <div>
            <SeccionCurso idCurso={id} />
          </div>
        </>
      )}
    </>
  );
};

export default AltaCursoFormulario;
