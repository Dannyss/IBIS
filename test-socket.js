import { WebSocket } from 'ws'; // Si estás en Node.js puro, requiere: npm install ws

// Nos conectamos explícitamente a la IP de tu portátil
const socket = new WebSocket('ws://192.168.1.14:8080');
//const socket = new WebSocket('ws://172.20.10.5:8080');

socket.on('open', () => {
  console.log('✅ Conectado con éxito al servidor del portátil desde el sobremesa.');
  
  // Enviamos un paquete de datos de prueba simulando WebRTC
  const mensajePrueba = { type: 'ping', payload: 'Probando canal de señalización' };
  socket.send(JSON.stringify(mensajePrueba));
});

socket.on('message', (data) => {
  console.log('📥 Mensaje recibido del servidor:', data.toString());
});

socket.on('close', () => {
  console.log('❌ Conexión cerrada.');
});

socket.on('error', (error) => {
  console.error('❌ Error de conexión. Revisa que el firewall del portátil no bloquee el puerto 8080:', error.message);
});
