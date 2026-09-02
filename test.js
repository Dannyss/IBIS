import ollama from 'ollama';

async function testLocalAI() {
  console.log('🤖 Conectando con Ollama local...');
  console.log('⏳ Procesando petición en tu GPU RTX 4070 (esto puede tardar unos segundos la primera vez)...\n');

  try {
    const response = await ollama.chat({
      model: 'qwen2.5-coder:7b',
      messages: [{ 
        role: 'user', 
        content: 'Hola! Confírmame que estás ejecutándote localmente y genera una función flecha básica en React que simule una conexión WebRTC simple.' 
      }],
    });

    console.log('✅ ¡Conexión exitosa! Respuesta de tu IA local:\n');
    console.log(response.message.content);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n👉 Asegúrate de tener Ollama ejecutándose en segundo plano y de haber descargado el modelo con: "ollama run qwen2.5-coder:7b"');
  }
}

testLocalAI();