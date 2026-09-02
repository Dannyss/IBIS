import React, { useEffect, useRef, useState } from 'react';
import '../css/LaboratorioWebRTC.css';
// 📡 Cambiamos la IP local por tu servidor permanente en la nube
const URL_SERVIDOR_SENALIZACION = 'wss://ibis-nuh3.onrender.com';
//const URL_SERVIDOR_SENALIZACION = 'ws://192.168.1.14:8080';
//const URL_SERVIDOR_SENALIZACION = 'ws://172.20.10.5:8080';
const CONFIG_PEER = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const RECONEXION_INICIAL_MS = 1000;
const RECONEXION_MAXIMA_MS = 10000;

export const LaboratorioWebRTC = () => {
  const [estadoSocket, setEstadoSocket] = useState('DESCONECTADO');
  const [estadoWebRTC, setEstadoWebRTC] = useState('colgado');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [logs, setLogs] = useState([]);
  const [idConexionMostrada, setIdConexionMostrada] = useState('');

  const socketRef = useRef(null);
  const pcRef = useRef(null); 
  const streamLocalRef = useRef(null);
  const videoLocalRef = useRef(null);
  const videoRemotoRef = useRef(null);
  const idConexionRef = useRef(null); 
  const candidatosPendientesRef = useRef([]); 
  const remitenteRef = useRef("sala-prueba"); 
   
  const tiempoReconexionRef = useRef(RECONEXION_INICIAL_MS);
  const temporizadorReconexionRef = useRef(null);

  const registrarLog = (mensaje) => {
    setLogs((anteriores) => [
      `[${new Date().toLocaleTimeString('es-ES')}] \${mensaje}`,
      ...anteriores.slice(0, 12),
    ]);
  };

  const cerrarSocket = () => {
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const conectarSocket = () => {
    cerrarSocket();
    const socket = new WebSocket(URL_SERVIDOR_SENALIZACION);
    socketRef.current = socket;

    socket.onopen = () => {
      setEstadoSocket('CONECTADO');
      tiempoReconexionRef.current = RECONEXION_INICIAL_MS;
      registrarLog('🔌 Socket CONECTADO al servidor de señalización.');
    };

    socket.onmessage = async (evento) => {
      try {
        const datos = JSON.parse(evento.data);
        await manejarMensajeServidor(datos);
      } catch (error) {
        console.error('❌ No se pudo interpretar el JSON:', error);
      }
    };

    socket.onclose = () => {
      setEstadoSocket('DESCONECTADO');
      registrarLog('🔌 Socket DESCONECTADO, reintentando...');
      programarReconexion();
    };
  };

  const programarReconexion = () => {
    if (temporizadorReconexionRef.current) return;
    const espera = tiempoReconexionRef.current;

    temporizadorReconexionRef.current = setTimeout(() => {
      temporizadorReconexionRef.current = null;
      tiempoReconexionRef.current = Math.min(tiempoReconexionRef.current * 2, RECONEXION_MAXIMA_MS);
      conectarSocket();
    }, espera);
  };

  useEffect(() => {
    let sigueActivo = true;

    const activarDispositivos = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        });

        if (!sigueActivo) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamLocalRef.current = stream;
        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = stream;
        }
        registrarLog('🎥 Cámara y micrófono local activados con éxito.');
      } catch (error) {
        console.error('❌ Error accediendo al hardware de media:', error);
        setErrorMensaje('No se pudo acceder a la cámara o micrófono. Revisa los permisos.');
      }
    };

    activarDispositivos();
    conectarSocket();

    return () => {
      sigueActivo = false;
      if (temporizadorReconexionRef.current) clearTimeout(temporizadorReconexionRef.current);
      if (streamLocalRef.current) {
        streamLocalRef.current.getTracks().forEach((track) => track.stop());
      }
      cerrarSocket();
    };
  }, []);

  const enviarMensaje = (tipo, datos = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ tipo, remitente: remitenteRef.current, ...datos }));
    }
  };

  const crearConexionPeer = () => {
    const pc = new RTCPeerConnection(CONFIG_PEER);
    pcRef.current = pc;

    const stream = streamLocalRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && idConexionRef.current) {
        enviarMensaje('candidato', { id: idConexionRef.current, candidato: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (videoRemotoRef.current && event.streams) {
        videoRemotoRef.current.srcObject = event.streams[0];
      }
      registrarLog('📡 Pista multimedia del dispositivo remoto recibida.');
    };

    pc.onconnectionstatechange = () => {
      const estado = pc.connectionState;
      if (estado === 'connected') {
        setEstadoWebRTC('conectado');
        registrarLog('✅ ¡Conexión WebRTC establecida (Flujo P2P activo)!');
      } else if (['failed', 'disconnected', 'closed'].includes(estado)) {
        setEstadoWebRTC('colgado');
      } else {
        setEstadoWebRTC('negociando');
      }
    };

    return pc;
  };

  const manejarMensajeServidor = async (datos) => {
    switch (datos.tipo) {
      case 'oferta':
        registrarLog('📥 Oferta SDP recibida.');
        await responderAOferta(datos);
        break;
      case 'respuesta':
        registrarLog('📥 Respuesta SDP recibida.');
        await aplicarRespuesta(datos);
        break;
      case 'candidato':
        await aplicarCandidato(datos);
        break;
      default:
        console.warn('⚠️ Señal desconocida:', datos.tipo);
    }
  };

  const aplicarCandidato = async (datos) => {
    if (datos.id !== idConexionRef.current || !pcRef.current) return;
    const pc = pcRef.current;

    if (!pc.remoteDescription) {
      candidatosPendientesRef.current.push(datos.candidato);
      return;
    }
    try {
      await pc.addIceCandidate(datos.candidato);
    } catch (e) {
      console.warn('⚠️ Fallo al acoplar ICE candidate:', e);
    }
  };

  const aplicarRespuesta = async (datos) => {
    if (datos.id !== idConexionRef.current) return;
    const pc = pcRef.current;
    if (!pc || pc.signalingState !== 'have-local-offer') return;

    await pc.setRemoteDescription({ type: 'answer', sdp: datos.sdp });
    const pendientes = candidatosPendientesRef.current.splice(0);
    for (const cand of pendientes) {
      await pc.addIceCandidate(cand).catch(e => console.warn(e));
    }
  };

  const responderAOferta = async (datos) => {
    const pcActual = pcRef.current;

    if (pcActual && pcActual.signalingState === 'have-local-offer') {
      if (idConexionRef.current && String(idConexionRef.current) < String(datos.id)) {
        registrarLog('🏆 Glare resuelto: conservamos nuestra oferta (ID menor).');
        return;
      }
      registrarLog('🤝 Glare detectado: cedemos el turno al dispositivo remoto.');
      colgarConexion();
    } else if (pcActual) {
      registrarLog('⏭️ Oferta ignorada: ya hay una sesión activa.');
      return;
    }

    idConexionRef.current = datos.id;
    setIdConexionMostrada(datos.id);

    const pc = crearConexionPeer();
    setEstadoWebRTC('negociando');

    await pc.setRemoteDescription({ type: 'offer', sdp: datos.sdp });
    const pendientes = candidatosPendientesRef.current.splice(0);
    for (const cand of pendientes) {
      await pc.addIceCandidate(cand).catch(e => console.warn(e));
    }

    const respuesta = await pc.createAnswer();
    await pc.setLocalDescription(respuesta);
    enviarMensaje('respuesta', { id: datos.id, sdp: respuesta.sdp });
    registrarLog('📤 Respuesta (Answer) enviada al dispositivo remoto.');
  };

  const iniciarLlamada = async () => {
    if (pcRef.current) return;
    try {
      const idNueva = `id-\${Date.now()}-\${Math.random().toString(36).slice(2, 10)}`;
      idConexionRef.current = idNueva;
      setIdConexionMostrada(idNueva);

      const pc = crearConexionPeer();
      setEstadoWebRTC('negociando');
      registrarLog('📤 Generando oferta SDP...');

      const oferta = await pc.createOffer();
      await pc.setLocalDescription(oferta);
      enviarMensaje('oferta', { id: idNueva, sdp: oferta.sdp });
    } catch (error) {
      setErrorMensaje('Error de inicio: ' + error.message);
      setEstadoWebRTC('colgado');
    }
  };

  const colgarConexion = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    idConexionRef.current = null;
    candidatosPendientesRef.current = [];
    setIdConexionMostrada('');
    setEstadoWebRTC('colgado');
    if (videoRemotoRef.current) videoRemotoRef.current.srcObject = null;
    registrarLog('📴 Llamada colgada y recursos liberados.');
  };

  return (
    <div className="contenedor-laboratorio">
      <div className="zona-videos">
        <div className="rejilla-videos">
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>Mi Cámara (Local)</h3>
            <video ref={videoLocalRef} autoPlay playsInline muted className="reproductor-video espejo" />
          </div>
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>Dispositivo (Remoto)</h3>
            <video ref={videoRemotoRef} autoPlay playsInline className="reproductor-video" />
          </div>
        </div>

        {errorMensaje && <p style={{ color: '#ff3333', textAlign: 'center' }}>❌ {errorMensaje}</p>}

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          {estadoWebRTC === 'colgado' ? (
            <button onClick={iniciarLlamada} disabled={estadoSocket !== 'CONECTADO'} className="boton-accion boton-llamar">
              📞 Iniciar Conexión WebRTC
            </button>
          ) : (
            <button onClick={colgarConexion} className="boton-accion boton-colgar">
              📴 Colgar / Resetear
            </button>
          )}
        </div>
      </div>

      <div className="panel-monitoreo">
        <div>
          <h4 style={{ margin: '0 0 5px 0' }}>Sala Local ID:</h4>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>{remitenteRef.current}</span>
        </div>
        
        {idConexionMostrada && (
          <div>
            <h4 style={{ margin: '0 0 5px 0' }}>Llamada Activa ID:</h4>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ffb300' }}>{idConexionMostrada}</span>
          </div>
        )}

        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Señalización:</h4>
          <span className={`badge-estado \${estadoSocket === 'CONECTADO' ? 'conectado' : 'desconectado'}`}>
            {estadoSocket === 'CONECTADO' ? '● CONECTADO' : '● DESCONECTADO'}
          </span>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Estado P2P:</h4>
          <span className={`badge-estado \${estadoWebRTC === 'conectado' ? 'conectado' : estadoWebRTC === 'negociando' ? 'conectando' : 'desconectado'}`}>
            ● {estadoWebRTC.toUpperCase()}
          </span>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Logs de Control Local:</h4>
          <div className="consola-logs">
            {logs.map((log, index) => <div key={index} style={{ marginBottom: '4px' }}>{log}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratorioWebRTC;
