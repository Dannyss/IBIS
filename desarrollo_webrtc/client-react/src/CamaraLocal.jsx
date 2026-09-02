import React, { useEffect, useRef, useState } from 'react';

export const CamaraLocal = () => {
  // useRef nos permite apuntar directamente al elemento HTML <video> sin renderizar de más
  const videoLocalRef = useRef(null);
  const [errorStream, setErrorStream] = useState(null);

  useEffect(() => {
    async function activarDispositivos() {
      try {
        // Pedimos permiso al navegador para usar cámara y audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
           audio: {
            echoCancellation: true, // Evita que tu música se filtre por el micro
            noiseSuppression: true,
            autoGainControl: false  // Impide que Windows altere el volumen general del sistema
          }
        });
        
        // Inyectamos el flujo de la cámara en nuestra etiqueta de video
        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accediendo a la cámara: ", err);
        setErrorStream("No se pudo acceder a la cámara o micrófono.");
      }
    }

    activarDispositivos();
  }, []); // El array vacío asegura que esto solo se ejecute una vez al montar el componente

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Mi Cámara Local (WebRTC Base)</h2>
      {errorStream ? (
        <p style={{ color: 'red' }}>{errorStream}</p>
      ) : (
        <video 
          ref={videoLocalRef} 
          autoPlay 
          playsInline 
          
          style={{ width: '400px', borderRadius: '10px', transform: 'scaleX(-1)' }} // Efecto espejo
        />
      )}
    </div>
  );
};
