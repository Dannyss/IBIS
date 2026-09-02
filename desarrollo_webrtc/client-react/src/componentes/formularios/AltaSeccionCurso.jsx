import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../../css/formularios/AltaSeccionCurso.css';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react';

const obtenerNuevoOrden = (lecciones) => {
  // Calcula el nuevo orden sumando uno al número total de lecciones
  return lecciones.length + 1;
};

const AltaSeccionCurso = ({ idCurso, lecciones, setLecciones }) => {
  const [seccionActive, setSeccionActive] = useState(true);
  const [description, setDescription] = useState('');
  const [editorActive, setEditorActive] = useState(false);
  const [editor, setEditor] = useState(null);
  const [titleSeccion, setTitleSeccion] = useState('');
  const handleEditorActivation = () => {
    setSeccionActive(true);
    setEditorActive(true);
  };

  const handleGuardar = async () => {
    const db = getFirestore();
    const data = editor.getData();

    try {
      // Transformar el contenido del editor según las necesidades
      const transformedData = data
        .replace('<figure class="media"><oembed url="', '<iframe width="420" height="345" src="')
        .replace('</oembed></figure>', '</iframe>')
        .replace('watch?v=', 'embed/');

      const idSeccion = uuidv4();
      const seccionRef = doc(db, 'Lecciones', idSeccion);
      const cursoRef = doc(db, 'Cursos', idCurso);
      const nuevoOrden = obtenerNuevoOrden(lecciones); // Obtener el nuevo orden

      await setDoc(seccionRef, {
        idCurso: cursoRef,
        title: titleSeccion,
        completed: false,
        description: transformedData,
        id: idSeccion,
        orden: nuevoOrden,
      });

      // Actualizar el estado local de las lecciones
      setLecciones([...lecciones, {
        id: idSeccion,
        idCurso: idCurso,
        title: titleSeccion,
        completed: false,
        description: transformedData,
        orden: nuevoOrden,
      }]);   
      setEditorActive(false);
    } catch (error) {
      console.error('Error al guardar la sección:', error);
    }
  };

  return (
    <>
      {seccionActive && (
        <div className="contenedor-seccion">
          <header className="cabecera-seccion">
            <h3 className="h3-seccion">
              Curso: <span className="span-seccion">{idCurso}</span>
            </h3>
          </header>
          <section className="contenedor-titulo">
            <label htmlFor={'title_' + idCurso}>
              Título:
              <input
                placeholder="Inserte un título"
                type="text"
                id={'title_' + idCurso}
                uid={idCurso}
                name="title"
                value={titleSeccion}
                onChange={(e) => {
                  setTitleSeccion(e.target.value);
                }}
                required
              />
            </label>
          </section>
          {!editorActive && (
            <section className="panel-crear-curso">
              <button type="button" onClick={handleEditorActivation}>
                + Agregar Lección
              </button>
            </section>
          )}
        </div>
      )}
      {editorActive && (
        <div className="editor">
          <label htmlFor="descripcion">
            <CKEditor
              mediaEmbed={true}
              editor={ClassicEditor}
              data={description}
              onReady={(editor) => {
                setEditor(editor);
              }}
              onChange={(event, editor) => {
                const data = editor.getData();
                setDescription(data);
              }}
            />
          </label>
        </div>
      )}

      {editorActive && (
        <button type="button" onClick={handleGuardar}>
          Guardar
        </button>
      )}
    </>
  );
};

export default AltaSeccionCurso;
