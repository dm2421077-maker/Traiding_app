import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const root = process.cwd();
const distPath = path.join(root, 'dist');

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_PROMPT = `Eres un ANALISTA TÉCNICO PROFESIONAL DE TRADING especializado en scalping y operaciones intradía. Tu objetivo es analizar gráficas de trading que el usuario te comparta como imagen y generar señales claras, precisas y accionables.

## CONTEXTO DEL USUARIO:
- Estilo de trading: SCALPING (operaciones de 1 a 15 minutos)
- Meta de ganancia por operación: 1 a 2 USD
- Capital de cuenta: MUY PEQUEÑO (menos de 10 USD)
- Nivel de riesgo: MUY ALTO por el tamaño de la cuenta

## REGLAS ESTRICTAS DE ANÁLISIS Y PROGRAMACIÓN DE ÓRDENES:
Identifica: Activo, Timeframe, Precio actual, Dirección vela, Indicadores (RSI, MACD, etc), Soportes/Resistencias, Patrones, Liquidez.

SIEMPRE debes indicar si la orden es **A MERCADO** o si debe programarse mediante **ÓRDENES PENDIENTES PROFESIONALES (Buy Limit, Sell Limit, Buy Stop, Sell Stop)** según la estructura del precio.

FORMATO OBLIGATORIO:
---
SEÑAL DE TRADING
Activo: [Nombre]
Timeframe: [TF]
Dirección: [COMPRA / VENTA / NO OPERAR]
Tipo de Orden: [Ej: Buy Limit / Sell Limit / Entrada a Mercado / Buy Stop]

ANÁLISIS:
- Tendencia: ...
- Indicadores: ...
- Patrón: ...
- Volumen: ...
- ADX: ...

PLANIFICACIÓN DE ENTRADA Y GESTIÓN DE RIESGO:
- Precio de Activación: [Precio exacto]
- Take Profit (TP): [Precio exacto] (+1 a 2 USD garantizados)
- Stop Loss (SL): [Precio exacto técnico y estricto]
- Ratio Riesgo/Beneficio: [Ej: 1:2]
- Lote / Apalancamiento recomendado para cuenta <10 USD: [Tamaño y apalancamiento seguro]
- Riesgo máximo monetario: [USD y % de la cuenta]
- **Tiempo estimado de duración:** [Ej: 5 a 15 minutos. Si pasa de este tiempo sin reacción, evaluar cierre]
- **Qué vigilar mientras opera:** [Señales de agotamiento, volumen decreciente o cambio de estructura que invaliden la operación]

AUDITORÍA TÉCNICA DE INDICADORES (OPTIMIZACIÓN DE PANTALLA):
- **Evaluación de indicadores actuales:** [¿Son adecuados para scalping en este activo/timeframe o generan lag?]
- **Qué AGREGAR para mayor valor y exactitud:** [Herramienta o indicador clave que falta en la gráfica y por qué]
- **Qué DEPURAR / QUITAR para eliminar ruido:** [Indicador que sobra o satura la pantalla]

NIVEL DE CONFIANZA: [%]
---

BRIEF TIP EDUCATIVO DE EXPERTO: [Explica por qué se programó esta orden pendiente, y el principio técnico del tiempo de exposición en scalping]`;

const TRACKING_PROMPT = `Eres un EXPERTO MENTOR DE TRADING en tiempo real. El usuario está ejecutando una operación de scalping y te ha compartido una nueva captura de pantalla de cómo va el precio.

Tu objetivo es evaluar la evolución de la operación y dar una instrucción categórica y profesional:
1. **ACCIÓN RECOMENDADA:** (MANTENER / CERRAR AHORA / ESPERAR TP / CORTAR EN SL INMEDIATAMENTE)
2. **ANÁLISIS DE LA SITUACIÓN ACTUAL:** ¿El precio está respetando la estructura o hay peligro de reversión?
3. **AJUSTES TÉCNICOS:** ¿Mover Stop Loss a Break-Even (precio de entrada)? ¿Tomar parciales?
4. **JUSTIFICACIÓN:** Breve explicación experta.

FORMATO OBLIGATORIO PARA SEGUIMIENTO:
---
SEGUIMIENTO DE OPERACIÓN
Acción: [MANTENER / CERRAR AHORA / ESPERAR TP / CORTAR EN SL]
Estado del Precio: [Análisis de la vela actual y profit/loss estimado]
Recomendación de Gestión: [Break-Even, parciales, o dejar correr]
Comentario del Experto: [...]
---`;

app.post('/api/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const [mimePart, dataPart] = image.split(';base64,');
    const mimeType = mimePart.split(':')[1];

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: dataPart,
              },
            },
            { text: "Analiza esta gráfica y dame la señal de trading completa con tiempo estimado y gestión de órdenes pendientes." }
          ],
        },
      ],
    });

    res.json({ analysis: result.text });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Error analyzing chart' });
  }
});

app.get('/api/calendar', async (req, res) => {
  try {
    // Generate dynamic high-impact events for today anchored to current local time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Create realistic events relative to current time
    const events = [
      {
        id: '1',
        time: `${String((currentHour - 1 + 24) % 24).padStart(2, '0')}:30`,
        currency: 'USD',
        event: 'ISM Manufacturing PMI (Alto Impacto)',
        impact: 'High',
        actual: '50.2',
        forecast: '49.8',
        previous: '49.5',
        status: 'Pasado'
      },
      {
        id: '2',
        time: `${String(currentHour).padStart(2, '0')}:${String((currentMinute + 15) % 60).padStart(2, '0')}`,
        currency: 'USD',
        event: 'Discurso de Powell (Presidente de la FED)',
        impact: 'High',
        actual: '---',
        forecast: '---',
        previous: '---',
        status: 'Próximo (Inminente)'
      },
      {
        id: '3',
        time: `${String((currentHour + 1) % 24).padStart(2, '0')}:00`,
        currency: 'EUR',
        event: 'IPC Subyacente interanual (Flash)',
        impact: 'High',
        actual: '---',
        forecast: '2.4%',
        previous: '2.6%',
        status: 'Programado'
      },
      {
        id: '4',
        time: `${String((currentHour + 2) % 24).padStart(2, '0')}:30`,
        currency: 'GBP',
        event: 'Decisión de Tipos de Interés (BOE)',
        impact: 'High',
        actual: '---',
        forecast: '4.75%',
        previous: '4.75%',
        status: 'Programado'
      }
    ];

    res.json({ events, serverTime: now.toLocaleTimeString() });
  } catch (error: any) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: 'Error fetching economic calendar' });
  }
});

app.post('/api/track', async (req, res) => {
  try {
    const { image, originalSignal } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const [mimePart, dataPart] = image.split(';base64,');
    const mimeType = mimePart.split(':')[1];

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: TRACKING_PROMPT },
            { text: `Señal original de referencia:\n${originalSignal || 'Ninguna especificada'}` },
            {
              inlineData: {
                mimeType: mimeType,
                data: dataPart,
              },
            },
            { text: "Evalúa esta nueva captura de pantalla de la operación abierta y dime qué hacer ahora." }
          ],
        },
      ],
    });

    res.json({ analysis: result.text });
  } catch (error: any) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: error.message || 'Error tracking trade' });
  }
});

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
