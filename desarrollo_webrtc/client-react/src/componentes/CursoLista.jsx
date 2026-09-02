import React, { useState, useEffect } from 'react';
import '../css/Curso.css';
import Curso from './Curso';
import SeccionCurso from './SeccionCurso';

const CursoLista = ({ tasks }) => {
  
  const [activeIndex, setActiveIndex] = useState(null);
  const [cursoIdActivo, setActiveCurso] = useState(null);

  const handleAccordionClick = (index, id_curso) => {
    setActiveIndex(index === activeIndex ? null : index);
    console.info(id_curso);
    setActiveCurso(id_curso.trim());
  };

  return (
    <div className="container">
      <div className="columna-izquierda">
        <div className="curso-lista-contenedor">
          {tasks.map((task, index) => (

            <Curso
              key={task.id}
              id={task.id}
              title={task.title}
              completed={task.completed}
              isActive={activeIndex === index}
              onAccordionClick={() => handleAccordionClick(index, task.id)}
            />
          ))
          }
        </div>
      </div>
      <div className="columna-derecha">
        {<ColumnaDerecha mostrarSeccion={activeIndex !== null} idCursoQuerySeccion={cursoIdActivo} contenidoHTML={activeIndex !== null ? tasks[activeIndex].description : 'Has click en tus cursos para cargar su contenido'}/>}
      </div>
    </div>
  );
};

const ColumnaDerecha = ({ mostrarSeccion, idCursoQuerySeccion, contenidoHTML }) => {
  const [htmlEstado, setHtmlEstado] = useState('');

  useEffect(() => {
    setHtmlEstado(contenidoHTML);
  }, [contenidoHTML]);

  return (
    <>
      {mostrarSeccion ? (
        <>
          <div dangerouslySetInnerHTML={{ __html: htmlEstado }} />
          <div className='seccion-curso'>
            <SeccionCurso idCurso={idCursoQuerySeccion} />
          </div>
        </>
      ) : (
        <div>Has click en tus cursos para cargar su contenido</div>
      )}
    </>
  );
};

export default CursoLista;