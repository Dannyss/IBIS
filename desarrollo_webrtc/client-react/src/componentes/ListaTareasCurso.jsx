import React, { useState, useEffect } from 'react';

const ListaTareasCurso = ({ cursoId, porcentajeCompletado: initialPorcentajeCompletado = 0 }) => {
  const [tareas, setTareas] = useState([]);
  const [porcentajeCompletado, setPorcentajeCompletado] = useState(initialPorcentajeCompletado);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/');
        const data = await response.json();
        const limitedData = data.slice(0, 5);
        setTareas(limitedData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [cursoId]); // Dependencia cursoId para ejecutar la solicitud de la API solo cuando cambie

  const handleCheckboxClick = (taskId) => {
    const updatedTareas = tareas.map((tarea) =>
      tarea.id === taskId ? { ...tarea, completed: !tarea.completed } : tarea
    );
    setTareas(updatedTareas);
  };

  useEffect(() => {
    const completedTasks = tareas.filter((tarea) => tarea.completed);
    const completedPercentage = (completedTasks.length / tareas.length) * 100;
    setPorcentajeCompletado(completedPercentage.toFixed(2));
  }, [tareas]);

  const listaCheckbox = tareas.map((tarea) => (
    <div className="contenedorTarea" id={cursoId} key={tarea.id}>
      <input
        id={tarea.id}
        type="checkbox"
        checked={tarea.completed}
        onChange={() => handleCheckboxClick(tarea.id)}
      />
      <label>{tarea.title}</label>
    </div>
  ));

  return (
    <div className="contenedorCurso">
      <h2>Tareas del curso</h2>
      {listaCheckbox}
      <p>Porcentaje completado: {porcentajeCompletado}%</p>
    </div>
  );
};

export default ListaTareasCurso;
