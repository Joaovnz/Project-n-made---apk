import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({ apiKey });
}

// 1. Health & Nomad Server Telemetry Bridge
app.get('/api/system/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    version: '1.35.1-nomad-mobile',
    services: {
      ollama: { running: true, port: 11434, memory: '1.2 GB' },
      kiwix: { running: true, port: 8081, zimsLoaded: 4 },
      meshtastic: { running: true, port: 8405, activeNodes: 6 },
      flatnotes: { running: true, port: 8083, notesCount: 12 },
      cyberchef: { running: true, port: 8082 },
      qdrant: { running: true, port: 6333, vectorsCount: 1420 }
    },
    batteryPercent: 88,
    isOffgrid: true,
    storage: {
      totalBytes: 512000000000,
      usedBytes: 148000000000,
      availableBytes: 364000000000
    }
  });
});

// 2. AI Chat Proxy Route (Offline Knowledge Base + Online Gemini Hybrid)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, knowledgeBase = 'survival' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemInstruction = `Você é o Assistente Tático e de Sobrevivência do Projeto NOMAD (Node for Offline Media, Archives, and Data), concebido pela Crosstalk Solutions.
Sua missão é fornecer respostas imediatas, altamente precisas, técnicas, sem enrolação e práticas para situações de emergência, desastres, operações off-grid e ambiente tático.
Base de Conhecimento Ativa: ${knowledgeBase}.
Diretrizes:
- Use formatação clara em Markdown (títulos concisos, listas passo a passo em negrito).
- Em questões médicas ou de primeiros socorros, priorize estabilização e triagem (START, controle de hemorragias, vias aéreas).
- Em questões de telecomunicação, indique frequências exatas em MHz, canais simplex e regras de tráfego.
- Responda em Português claro e amigável.`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\nHistórico prévio:\n${JSON.stringify(history || [])}\n\nPergunta do operador:\n${message}` }] }
          ]
        });

        const replyText = response.text || 'Sem resposta disponível do módulo de inferência.';
        return res.json({ reply: replyText, source: 'gemini-flash' });
      } catch (geminiError: any) {
        console.warn('Gemini online API unavailable or off-grid. Falling back to local offline tactical engine:', geminiError?.message);
        // Seamlessly continue to offline engine below
      }
    }

    // Fallback offline tactical answer engine
      const queryLower = message.toLowerCase();
      let offlineReply = '';

      if (queryLower.includes('agua') || queryLower.includes('água') || queryLower.includes('purificar') || queryLower.includes('filtro')) {
        offlineReply = `### [MODO OFFLINE LOCAL] Protocolo de Purificação de Água NOMAD

1. **Filtragem Mecânica Prévia**:
   - Elimine sólidos suspensos passando por algodão dobrado, filtro de café ou camadas improvisadas (areia, cascalho, carvão moído).
2. **Ebulição (Fervura)**:
   - Ferva vigorosamente por **1 minuto** (ou **3 minutos** em altitudes elevadas).
3. **Desinfecção Química de Emergência**:
   - Use água sanitária comum a 2-2,5% (sem perfume/aditivos): **2 a 4 gotas por litro** de água límpida, ou **8 gotas por litro** de água turva.
   - Aguarde **30 minutos** antes de ingerir. Deve restar leve cheiro de cloro.`;
      } else if (queryLower.includes('triagem') || queryLower.includes('socorro') || queryLower.includes('sangue') || queryLower.includes('ferido') || queryLower.includes('start')) {
        offlineReply = `### [MODO OFFLINE LOCAL] Protocolo de Triagem START (Simple Triage and Rapid Treatment)

- **Passo 1 (Ambulatório)**: Ordene "Quem consegue andar, venha até mim". Classifique como **VERDE (Leve)**.
- **Passo 2 (Respiração)**:
  - Não respira? Abra vias aéreas. Se continuar sem respirar: **PRETO (Óbito)**. Se voltar a respirar: **VERMELHO (Imediato)**.
  - Frequência respiratória > 30 rpm ou < 10 rpm: **VERMELHO**.
- **Passo 3 (Perfusão)**:
  - Pulso radial ausente ou enchimento capilar > 2 segundos: aplique torniquete/pressão e classifique como **VERMELHO**.
- **Passo 4 (Estado Mental)**:
  - Não atende a comandos simples ("aperte a mão"): **VERMELHO**.
  - Atende comandos simples: **AMARELO (Urgente / Aguarda)**.`;
      } else if (queryLower.includes('radio') || queryLower.includes('rádio') || queryLower.includes('frequencia') || queryLower.includes('frequência') || queryLower.includes('meshtastic')) {
        offlineReply = `### [MODO OFFLINE LOCAL] Frequências de Emergência e Comunicação NOMAD

- **VHF Simplex Nacional**: 146.520 MHz FM (chamada de socorro)
- **UHF Simplex**: 446.000 MHz FM
- **Rádio Cidadão (PX/CB)**: Canal 9 (27.065 MHz AM)
- **Meshtastic LoRa**: 915 MHz (Brasil/Américas) / 868 MHz (Europa) no preset **LongFast** (Canal padrão #0)
- **Protocolo de Chamada**: Emitir 'MAYDAY' 3 vezes, seguido de indicativo, coordenadas GPS e quantidade de feridos.`;
      } else {
        offlineReply = `### [BASE TÁTICA NOMAD OFFLINE] Resumo Operacional

O nó de processamento local registrou sua solicitação: "${message}".

- **Recomendação**: Para consultas detalhadas de sobrevivência, você pode alternar para a aba **Médico & Remédios** para consultar 36 condições e remédios naturais catalogados, ou **Mapas** para plotar pontos de água e abrigo.
- **Comunicação**: O rádio LoRa Meshtastic está escutando na frequência configurada.`;
      }

      return res.json({ reply: offlineReply, source: 'nomad-offline-kb' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ error: error?.message || 'Internal server error in AI proxy' });
  }
});

// 3. Direct APK Download & Telemetry Routes
app.get(['/download/ProjectNOMAD-Mobile.apk', '/api/download/apk', '/ProjectNOMAD-Mobile.apk'], (req, res) => {
  const apkPath = path.resolve(process.cwd(), 'public/downloads/ProjectNOMAD-Mobile.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="ProjectNOMAD-Mobile.apk"');
    return res.sendFile(apkPath);
  }
  res.status(404).json({ error: 'APK package not found' });
});

app.get('/api/download/info', (req, res) => {
  const apkPath = path.resolve(process.cwd(), 'public/downloads/ProjectNOMAD-Mobile.apk');
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    return res.json({
      filename: 'ProjectNOMAD-Mobile.apk',
      version: '1.35.1',
      sizeBytes: stats.size,
      sizeMb: Math.round(stats.size / (1024 * 1024) * 10) / 10,
      downloadUrl: '/download/ProjectNOMAD-Mobile.apk',
      minAndroidVersion: '7.0 (Nougat, API 24)',
      targetAndroidVersion: '15.0 (API 35)',
      permissionsRequired: ['GPS/Localização', 'Armazenamento Offline', 'Áudio Web/Bip']
    });
  }
  res.status(404).json({ error: 'APK file not found' });
});

// Mount Vite in dev mode
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Project NOMAD Mobile Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
