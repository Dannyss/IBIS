import React from 'react';
import '../css/BloqueFormativo.css';
import ListaTareasCurso from './ListaTareasCurso';
import { AiOutlineCaretUp } from 'react-icons/ai';
import { AiFillCaretRight } from 'react-icons/ai';

const Curso = ({ id, title, completed, isActive, onAccordionClick }) => {

  return (
    <div className='info-curso'>
      <div onClick={onAccordionClick}>
        <div
          id={id}
          className={completed ? 'tarea-texto completada' : 'tarea-contenedor'}
        >
         <span>{title}</span> 
         <span className='icono-curso'>
          {isActive ? (
            <AiOutlineCaretUp />
          ) : (
            <AiFillCaretRight className="tarea-icono oculto" />
          )}
          {!isActive ? (
            <AiFillCaretRight />
          ) : (
            <AiOutlineCaretUp className="tarea-icono oculto" />
          )}
          </span>
        </div>
      </div>
      <div className="contenedor-lista-tareas">
        {isActive && <ListaTareasCurso cursoId={id} />}
      </div>
    </div>
  );
};

export default Curso;