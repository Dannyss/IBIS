import React, { useEffect, useRef, useState } from 'react';
import '../css/LaboratorioWebRTC.css';

// ============================================================
// 🧪 LABORATORIO WEBRTC
// Panel de pruebas P2P pensado para una batería multidispositivo
// (PC de sobremesa, portátil, móvil y tablet) dentro de una red local.
//
// El servidor de señalización del proyecto es un relay por broadcast:
// reenvía cada mensaje a TODOS los dispositivos conectados. Para que
// cada llamada sea limpia, cada mensaje lleva un "idConexion" único y
// solamente se procesan las señales que coinciden con la llamada activa.
// ============================================================

// 🔗 Dirección del servidor de señalización (portátil anfitrión)
//const URL_SERVIDOR_SENALIZACION = 'ws://192.168.1.14:8080';
const URL_SERVIDOR_SENALIZACION = 'ws://172.20.10.5:8080';

// 🌐 Servidores STUN públicos de Google (NO enrutan la señal, solo atraviesan el NAT)
const CONFIG_PEER = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ⏱️ Reconexión automática del socket (backoff progresivo hasta 10 s)
const RECONEXION_INICIAL_MS = 1000;
const RECONEXION_MAXIMA_MS = 10000;

// 🆔 crypto.randomUUID() solo existe en "contextos seguros" (HTTPS o localhost).
// Al probar desde un móvil por http://192.168.1.14:5173 no está disponible,
// así que disponemos de este generador compatible con cualquier origen.
const generarIdUnico = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

// 🏷️ Etiquetas visuales para el estado del WebRTC P2P
const MAPA_ESTADO_WEBRTC = {
  colgado: { texto: '● COLGADO', clase: 'desconectado' },
  negociando: { texto: '● NEGOCIANDO', clase: 'conectando' },
  conectado: { texto: '● CONECTADO', clase: 'conectado' },
};

const LaboratorioWebRTC = () => {
  // ---------- 🖥️ Estados de la interfaz ----------
  const [estadoSocket, setEstadoSocket] = useState('DESCONECTADO');
  const [estadoWebRTC, setEstadoWebRTC] = useState('colgado');
  const [errorMensaje, setErrorMensaje] = useState('');
  const [registroEventos, setRegistroEventos] = useState([]);
  const [idConexionMostrada, setIdConexionMostrada] = useState('');

  // ---------- 🔗 Referencias (no provocan renders) ----------
  const socketRef = useRef(null);
  const pcRef = useRef(null); // RTCPeerConnection de la llamada activa
  const streamLocalRef = useRef(null);
  const videoLocalRef = useRef(null);
  const videoRemotoRef = useRef(null);
  const idConexionRef = useRef(null); // Identificador de la llamada actual
  const candidatosPendientesRef = useRef([]); // Candidatos ICE "trickle" en espera
  const remitenteRef = useRef(generarIdUnico()); // Identidad de este dispositivo
   
  const tiempoReconexionRef = useRef(RECONEXION_INICIAL_MS);
  const temporizadorReconexionRef = useRef(null);

  // ---------- 🗒️ Registro de eventos (nivel de depuración) ----------
  const agregarLog = (mensaje) => {
    setRegistroEventos((anteriores) => [
      { hora: new Date().toLocaleTimeString('es-ES'), mensaje },
      ...anteriores.slice(0, 11),
    ]);
  };

  // ============================================================
  // 🕸️ SECCIÓN 1: SOCKET DE SEÑALIZACIÓN
  // ============================================================

  const cerrarSocket = () => {
    if (socketRef.current) {
      // Anulamos las callbacks antes de cerrar para que el 'close'
      // no dispare una reconexión no deseada
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
      // 🟢 Verde: servidor de señalización alcanzado
      setEstadoSocket('CONECTADO');
      tiempoReconexionRef.current = RECONEXION_INICIAL_MS;
      agregarLog('🔌 Socket CONECTADO al servidor de señalización');
    };

    // Los mensajes se procesan en orden; async/await evita solapamientos
    socket.onmessage = async (evento) => {
      try {
        const datos = JSON.parse(evento.data);
        await manejarMensajeServidor(datos);
      } catch (error) {
        console.error('❌ No se pudo interpretar el mensaje del servidor:', error);
      }
    };

    socket.onclose = () => {
      // 🔴 Rojo: servidor inalcanzable o pestaña en segundo plano
      setEstadoSocket('DESCONECTADO');
      agregarLog('🔌 Socket DESCONECTADO, reintentando...');
      programarReconexion();
    };

    socket.onerror = (error) => {
      console.error('⚠️ Error del socket WebSocket:', error);
    };
  };

  const programarReconexion = () => {
    // Evitamos lanzar dos temporizadores a la vez
    if (temporizadorReconexionRef.current) return;

    const espera = tiempoReconexionRef.current;
    agregarLog(`⏳ Reintentando socket en ${(espera / 1000).toFixed(1)} s...`);

    temporizadorReconexionRef.current = setTimeout(() => {
      temporizadorReconexionRef.current = null;
      // Backoff: duplicamos la espera hasta el tope de 10 s
      tiempoReconexionRef.current = Math.min(
        tiempoReconexionRef.current * 2,
        RECONEXION_MAXIMA_MS
      );
      conectarSocket();
    }, espera);
  };

  // ============================================================
  // 📡 SECCIÓN 2: CAPTURA LOCAL DE CÁMARA Y MICRÓFONO
  // ============================================================

  useEffect(() => {
    let sigueActivo = true;

    const activarDispositivos = async () => {
      // 🔒 Los navegadores exigen un "contexto seguro" (HTTPS o localhost)
      // para abrir la cámara y el micrófono dentro de una red local.
      if (!window.isSecureContext) {
        setErrorMensaje(
          '🔒 HTTPS es obligatorio para la cámara/micrófono. ' +
            'Accede vía https:// o localhost, o levanta Vite con ' +
            '--unsafely-treat-insecure-origin-as-secure.'
        );
        return;
      }

      try {
        // Filtros de audio pensados para que la música de los Shokz
        // OpenRun no se cuele en la señal del micrófono.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true, // Evita que el sonido del altavoz vuelva al micrófono
            noiseSuppression: true, // Limpia el ruido de fondo de la red local
            autoGainControl: false, // Impide que el sistema suba el volumen global por tu música
          },
        });

        // StrictMode desmonta y vuelve a montar: si esta llamada resolvió
        // después de la limpieza, la descartamos y liberamos las pistas.
        if (!sigueActivo) {
          stream.getTracks().forEach((pista) => pista.stop());
          return;
        }

        streamLocalRef.current = stream;
        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = stream;
        }
        agregarLog('🎥 Cámara y micrófono activados');
      } catch (error) {
        console.error('❌ Error accediendo a la cámara/micrófono:', error);
        setErrorMensaje(
          'No se pudo acceder a la cámara o micrófono. Revisa los permisos del navegador.'
        );
      }
    };

    activarDispositivos();

    // Limpieza: soltamos cámara y micrófono al desmontar el componente
    return () => {
      sigueActivo = false;
      if (streamLocalRef.current) {
        streamLocalRef.current.getTracks().forEach((pista) => pista.stop());
        streamLocalRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // 🤝 SECCIÓN 3: LÓGICA WEBRTC (señalización P2P)
  // ============================================================

  const enviarMensaje = (tipo, datos = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ tipo, remitente: remitenteRef.current, ...datos })
      );
    } else {
      agregarLog('⚠️ Socket cerrado: no se pudo enviar la señal');
    }
  };

  // Crea y configura el RTCPeerConnection de la llamada actual
  const crearConexionPeer = () => {
    const pc = new RTCPeerConnection(CONFIG_PEER);
    pcRef.current = pc;

    // Añadimos nuestra cámara y micrófono a la llamada
    const stream = streamLocalRef.current;
    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach((pista) => pc.addTrack(pista, stream));
    } else {
      agregarLog('⚠️ Sin cámara local: la llamada será solo receptora');
    }

    // 📤 Trickle ICE: cada candidato se envía en cuanto se descubre
    pc.onicecandidate = (evento) => {
      if (evento.candidate && idConexionRef.current) {
        enviarMensaje('candidato', {
          id: idConexionRef.current,
          candidato: evento.candidate,
        });
      }
    };

    // 📥 Cuando llega la señal de vídeo/audio del otro dispositivo
    pc.ontrack = (evento) => {
      if (videoRemotoRef.current && evento.streams[0]) {
        videoRemotoRef.current.srcObject = evento.streams[0];
      }
      agregarLog('📡 Pista multimedia del dispositivo remoto recibida');
    };

    // 🟢 Estado global de la conexión P2P
    pc.onconnectionstatechange = () => {
      const estado = pc.connectionState;
      if (estado === 'connected') {
        setEstadoWebRTC('conectado');
        agregarLog('✅ ¡Conexión WebRTC establecida (media P2P)!');
      } else if (['failed', 'disconnected', 'closed'].includes(estado)) {
        setEstadoWebRTC('colgado');
      } else {
        setEstadoWebRTC('negociando');
      }
    };

    return pc;
  };

  // Añade los candidatos ICE que llegaron "por delante" del SDP remoto
  const vaciarCandidatosPendientes = async () => {
    const pc = pcRef.current;
    if (!pc) {
      candidatosPendientesRef.current = [];
      return;
    }
    const pendientes = candidatosPendientesRef.current.splice(0);
    for (const candidato of pendientes) {
      try {
        await pc.addIceCandidate(candidato);
      } catch (error) {
        console.warn('⚠️ No se pudo aplicar un candidato pendiente:', error);
      }
    }
  };

  // Recibe un candidato ICE del otro dispositivo
  const aplicarCandidato = async (datos) => {
    if (datos.id !== idConexionRef.current || !pcRef.current) return;
    const pc = pcRef.current;

    if (!pc.remoteDescription) {
      // El candidato ha llegado antes que el SDP remoto: lo encolamos
      candidatosPendientesRef.current.push(datos.candidato);
      return;
    }

    try {
      await pc.addIceCandidate(datos.candidato);
    } catch (error) {
      console.warn('⚠️ No se pudo añadir el candidato ICE:', error);
    }
  };

  // Recibe la respuesta SDP (Answer) del dispositivo remoto
  const aplicarRespuesta = async (datos) => {
    if (datos.id !== idConexionRef.current) return;
    const pc = pcRef.current;
    // Solo tiene sentido si nosotros fuimos quienes creamos la oferta
    if (!pc || pc.signalingState !== 'have-local-offer') return;

    await pc.setRemoteDescription({ type: 'answer', sdp: datos.sdp });
    await vaciarCandidatosPendientes();
  };

  // Recibe una oferta: el "Iniciador" espera su Answer y este dispositivo responde
  const responderAOferta = async (datos) => {
    const pcActual = pcRef.current;

    // 👥 Glare: dos dispositivos pulsaron «Iniciar» a la vez. Resolución
    // sencilla y determinista: gana la oferta con id menor; el perdedor
    // cierra su intento y responde como dispositivo remoto.
    if (pcActual && pcActual.signalingState === 'have-local-offer') {
      const idPropio = idConexionRef.current;
      if (idPropio && String(idPropio) < String(datos.id)) {
        agregarLog('🏆 Glare resuelto: conservamos nuestra oferta (id menor)');
        return;
      }
      agregarLog('🤝 Glare detectado: cedemos y respondemos a la oferta entrante');
      pcActual.ontrack = null;
      pcActual.onicecandidate = null;
      pcActual.onconnectionstatechange = null;
      pcActual.close();
      pcRef.current = null;
    } else if (pcActual) {
      // Ya hay un diálogo en curso: ignoramos las ofertas duplicadas
      agregarLog('⏭️ Oferta ignorada: ya hay una negociación en curso');
      return;
    }

    // Adoptamos el id de la llamada entrante para filtrar señales
    idConexionRef.current = datos.id;
    setIdConexionMostrada(datos.id);

    const pc = crearConexionPeer();
    setEstadoWebRTC('negociando');

    await pc.setRemoteDescription({ type: 'offer', sdp: datos.sdp });
    await vaciarCandidatosPendientes();

    const respuesta = await pc.createAnswer();
    await pc.setLocalDescription(respuesta);
    enviarMensaje('respuesta', { id: datos.id, sdp: respuesta.sdp });
    agregarLog('📤 Respuesta (Answer) enviada al dispositivo remoto');
  };

  // Enrutador de los mensajes que llegan desde el servidor de señalización
  const manejarMensajeServidor = async (datos) => {
    switch (datos.tipo) {
      case 'oferta':
        agregarLog('📥 Oferta SDP recibida');
        await responderAOferta(datos);
        break;
      case 'respuesta':
        agregarLog('📥 Respuesta SDP recibida');
        await aplicarRespuesta(datos);
        break;
      case 'candidato':
        await aplicarCandidato(datos);
        break;
      default:
        console.warn('⚠️ Tipo de señal desconocido:', datos.tipo);
    }
  };

  // ============================================================
  // 🎛️ SECCIÓN 4: ACCIONES DE LOS BOTONES
  // ============================================================

  // 📞 Acción del botón «Iniciar Conexión WebRTC»
  const iniciarConexion = async () => {
    // Pulsa este botón SOLO en uno de los dos dispositivos: aquí se
    // genera la Oferta y el otro responderá automáticamente con su Answer.
    if (pcRef.current) {
      agregarLog('🔁 Ya existe una llamada activa. Usa «Colgar» primero.');
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setErrorMensaje('El servidor de señalización no está conectado.');
      return;
    }

    try {
      // 1. Identificador único de esta llamada (filtra señales ajenas)
      const idNueva = generarIdUnico();
      idConexionRef.current = idNueva;
      setIdConexionMostrada(idNueva);

      // 2. Creamos el PeerConnection con STUN de Google
      crearConexionPeer();
      setEstadoWebRTC('negociando');
      agregarLog('📤 Generando oferta SDP...');

      // 3. Creamos la oferta y la enviamos al resto de dispositivos
      const oferta = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(oferta);
      enviarMensaje('oferta', { id: idNueva, sdp: oferta.sdp });
    } catch (error) {
      console.error('❌ Error iniciando la conexión WebRTC:', error);
      setErrorMensaje('Error iniciando la conexión WebRTC: ' + error.message);
      setEstadoWebRTC('colgado');
    }
  };

  // 📴 Acción del botón «Colgar / Resetear»
  const colgarConexion = () => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
    }
    pcRef.current = null;
    idConexionRef.current = null;
    candidatosPendientesRef.current = [];
    setIdConexionMostrada('');
    setEstadoWebRTC('colgado');
    setErrorMensaje('');

    // Liberamos la ventana de vídeo remota
    if (videoRemotoRef.current) {
      const streamRemoto = videoRemotoRef.current.srcObject;
      if (streamRemoto) {
        streamRemoto.getTracks().forEach((pista) => pista.stop());
      }
      videoRemotoRef.current.srcObject = null;
    }

    agregarLog('📴 Llamada colgada y reseteada');
  };

  // ============================================================
  // ⚙️ EFECTOS GLOBALES
  // ============================================================

  // 🕸️ Efecto del socket: conexión inicial + reconexión automática
  useEffect(() => {
    conectarSocket();
    return () => {
      if (temporizadorReconexionRef.current) {
        clearTimeout(temporizadorReconexionRef.current);
        temporizadorReconexionRef.current = null;
      }
      cerrarSocket();
    };
  }, []);

  // 🧹 Al desmontar, cerramos también el PeerConnection
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // 🖼️ INTERFAZ DE USUARIO
  // ============================================================

  return (
    <div className="laboratorio-webrtc">
      <h2>🧪 Laboratorio WebRTC</h2>

      {/* 1️⃣ Estado de la señalización y de la llamada */}
      <div className="panel-estados">
        <div className="indicador">
          <span
            className={`badge ${estadoSocket === 'CONECTADO' ? 'conectado' : 'desconectado'}`}
          >
            {estadoSocket === 'CONECTADO' ? '● CONECTADO' : '● DESCONECTADO'}
          </span>
          <span className="etiqueta">Señalización ws://192.168.1.14:8080</span>
        </div>
        <div className="indicador">
          <span className={`badge ${MAPA_ESTADO_WEBRTC[estadoWebRTC].clase}`}>
            {MAPA_ESTADO_WEBRTC[estadoWebRTC].texto}
          </span>
          <span className="etiqueta">WebRTC P2P</span>
        </div>
      </div>

      {idConexionMostrada && (
        <p className="id-sesion">🆔 Sesión: {idConexionMostrada}</p>
      )}

      <p className="pista">
        💡 Pulsa «Iniciar» en UN solo dispositivo y abre esta página en otro
        (móvil o tablet) para que responda con su Answer.
      </p>

      {errorMensaje && <p className="mensaje-error">❌ {errorMensaje}</p>}

      {/* 2️⃣ Ventanas de vídeo: local (espejo) y remota */}
      <div className="ventanas-video">
        <div className="panel-video">
          <span className="panel-video-titulo">📹 Tú (local)</span>
          <video
            ref={videoLocalRef}
            autoPlay
            playsInline
            muted
            className="video-local"
          />
        </div>
        <div className="panel-video">
          <span className="panel-video-titulo">🖥️ Dispositivo remoto</span>
          <video
            ref={videoRemotoRef}
            autoPlay
            playsInline
            className="video-remoto"
          />
        </div>
      </div>

      {/* 3️⃣ Controles */}
      <div className="controles">
        <button
          type="button"
          className="boton boton-iniciar"
          onClick={iniciarConexion}
          disabled={estadoWebRTC === 'negociando' || estadoWebRTC === 'conectado'}
        >
          📞 Iniciar Conexión WebRTC
        </button>
        <button
          type="button"
          className="boton boton-colgar"
          onClick={colgarConexion}
        >
          📴 Colgar / Resetear
        </button>
      </div>

      {/* 4️⃣ Registro de eventos (útil para depurar la batería de pruebas) */}
      <div className="registro">
        <h3>🗒️ Registro de eventos</h3>
        <ul>
          {registroEventos.length === 0 && (
            <li>Conecta el socket para ver aquí la actividad…</li>
          )}
          {registroEventos.map((registro, indice) => (
            <li key={`${registro.hora}-${indice}`}>
              <span className="hora">{registro.hora}</span>
              {registro.mensaje}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LaboratorioWebRTC;