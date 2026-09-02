import React, { useState, useEffect } from 'react';
import firebase from "firebase/compat/app";
import {collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../db/Config';
import LinkRutas from '../rutas/LinkRutas';
// Configura la conexión con Firebase
//initializeApp(firebaseConfig);


const NewCollectionForm = () => {
  const [collectionName, setCollectionName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('String');
  const [fields, setFields] = useState([]);
  const [referenceCollection, setReferenceCollection] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [collectionOptions, setCollectionOptions] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        // Obtén la referencia al documento _meta_data_
        const metaDataDocRef = doc(collection(db, 'MetaData'), '_meta_data_');

        // Obtén los datos del documento _meta_data_
        const metaDataDocSnapshot = await getDoc(metaDataDocRef);
        if (metaDataDocSnapshot.exists()) {
          const metaDataData = metaDataDocSnapshot.data();

          // Verifica si el campo meta_data existe y es un mapa
          if (metaDataData && metaDataData.meta_data && typeof metaDataData.meta_data === 'object') {
            const metaDataCollections = metaDataData.meta_data.collections;

            // metaDataCollections es un mapa que contiene colecciones como un array
            // Puedes obtener las colecciones como un array utilizando Object.values()
            const collectionsArray = Object.keys(metaDataCollections);
            console.log(collectionsArray);
            // Actualiza el estado con las opciones de colección
            setCollectionOptions(collectionsArray);
          } else {
            console.error('El campo meta_data no existe o no es un mapa.');
          }
        } else {
          console.error('El documento _meta_data_ no existe.');
        }
      } catch (error) {
        console.error('Error al obtener las colecciones:', error);
      }
    };

    // Llama a la función para obtener las colecciones al cargar el componente
    fetchCollections();
  }, []);

  const handleAddField = () => {
    const newField = { name: fieldName, type: fieldType };
    setFields([...fields, newField]);
    setFieldName('');
    setFieldType('String');
  };

  const getDocumentReference = (collectionName, documentId) => {
    const documentRef = doc(db, collectionName, documentId);
    return documentRef;
  };

  const getInitialValue = (fieldType) => {
    switch (fieldType) {
      case 'String':
        return '';
      case 'Number':
        return 0;
      case 'Boolean':
        return false;
      case 'Map':
        return {};
      case 'Array':
        return [];
      case 'Null':
        return null;
      case 'Timestamp':
        return firebase.firestore.Timestamp.now();
      case 'GeoPoint':
        return new firebase.firestore.GeoPoint(0, 0);
      case 'Reference':
        if (referenceCollection && referenceId) {
          const documentRef = getDocumentReference(referenceCollection, referenceId);
          return documentRef;
        } else {
          return null;
        }
      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const collectionRef = collection(db, collectionName);
    const initialData = {};

    fields.forEach((field) => {
      initialData[field.name] = getInitialValue(field.type);
    });

    setDoc(doc(collectionRef), initialData)
      .then(() => {
        console.log('Nueva colección creada en Firestore');
        // Realizar cualquier acción adicional después de crear la colección
      })
      .catch((error) => {
        console.error('Error al crear la colección:', error);
      });
  };

  return (
    <div>
      <LinkRutas/>
      <h2>Formulario de nueva colección</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre de la colección:
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
          />
        </label>
        <br />
        <label>
          Nombre del campo:
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
          />
        </label>
        <label>
          Tipo del campo:
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
          >
            <option value="String">String</option>
            <option value="Number">Number</option>
            <option value="Boolean">Boolean</option>
            <option value="Map">Map</option>
            <option value="Array">Array</option>
            <option value="Null">Null</option>
            <option value="Timestamp">Timestamp</option>
            <option value="GeoPoint">GeoPoint</option>
            <option value="Reference">Reference</option>
          </select>
        </label>
        {fieldType === 'Reference' && (
          <div>
            <label>
              Colección de referencia:
              {
                <select
                  value={referenceCollection}
                  onChange={(e) => setReferenceCollection(e.target.value)}
                >
                  <option value="">Seleccionar colección</option>
                  {

                    collectionOptions.map((collection) => (
                      <option key={collection} value={collection}>
                        {collection}
                      </option>
                    ))}
                </select>}
            </label>
            <label>
              ID del documento de referencia:
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
              />
            </label>
          </div>
        )}
        <button type="button" onClick={handleAddField}>
          Agregar campo
        </button>
        <br />

        <ul>
          {fields.map((field, index) => (
            <li key={index}>
              {field.name} ({field.type})
            </li>
          ))}
        </ul>

        <button type="submit">Crear colección</button>
      </form>
    </div>
  );
};
export default NewCollectionForm;