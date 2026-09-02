import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// 1. Creamos un servidor HTTP nativo de Node.js
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor de Señalización WebRTC Operativo\n');
});

// 2. Montamos el servidor de WebSockets encima del servidor HTTP
const wss = new WebSocketServer({ server });

console.log('🚀 Servidor de señalización WebRTC corriendo en http://localhost:8080');

// 3. Escuchamos las conexiones de tus dispositivos (móvil, tablet, pc)
wss.on('connection', (ws) => {
  console.log('📱 ¡Un nuevo dispositivo se ha conectado al servidor!');

  // Escuchamos los mensajes de señalización que envían los dispositivos
  ws.on('message', (message) => {
    try {
      // Parseamos los datos que nos llegan (ofertas SDP o candidatos ICE)
      const data = JSON.parse(message);
      
      // REENVIAR CONCEPTO: Enviamos los datos a TODOS los demás dispositivos conectados,
      // excepto al dispositivo que envió el mensaje originalmente.
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('Error procesando el mensaje de señalización:', error);
    }
  });

  // Gestionamos cuando cierras la pestaña del navegador en tu móvil o tablet
  ws.on('close', () => {
    console.log('❌ Dispositivo desconectado del servidor.');
  });
});

// Detecta el puerto de la nube o usa el 8080 si estás en local
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Servidor de señalización WebRTC activo en el puerto ${PORT}`);
});