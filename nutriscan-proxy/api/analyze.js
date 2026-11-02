/**
 * ============================================================================
 * NUTRISCAN AI - SECURE SERVERLESS PROXY v2.2 (MULTI-AI AUTO-FAILOVER)
 * ============================================================================
 * Nhiệm vụ:
 * 1. Giấu kín API Key trên Server Vercel (File .apk không cần build lại khi đổi Key).
 * 2. Tự động chuyển đổi thông minh (Auto-Failover):
 *    - Hỗ trợ Google Gemini (Miễn phí 100% từ Google AI Studio - GEMINI_API_KEY)
 *    - Hỗ trợ Groq Llama-4 Vision (Miễn phí 100% từ Groq Cloud - GROQ_API_KEY)
 *    - Hỗ trợ OpenAI GPT-4o-mini (OPENAI_API_KEY)
 *    Nếu OpenAI hết tiền (429 credit_balance_exhausted), tự động chuyển sang Gemini hoặc Groq!
 */

const rateLimitMap = new Map();
const WINDOW_MS = 10 * 60 * 1000; // 10 phút
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.startTime > WINDOW_MS) {
    rateLimitMap.set(ip, { startTime: now, count: 1 });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

async function callGemini(geminiKey, promptText, base64Image) {
  const parts = [{ text: promptText }];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    });
  }

  // Thử gemini-2.0-flash trước, nếu lỗi quota thì tự động fallback sang gemini-1.5-flash
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText);
      }
    } else {
      lastError = await geminiRes.text();
    }
  }

  throw new Error(`Gemini Error: ${lastError}`);
}

async function callGroq(groqKey, promptText, base64Image) {
  const userContent = [{ type: 'text', text: promptText }];
  if (base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: base64Image
        ? 'meta-llama/llama-4-scout-17b-16e-instruct'
        : 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.1,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    throw new Error(`Groq Error (${groqRes.status}): ${errText}`);
  }

  const data = await groqRes.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq trả về dữ liệu rỗng');
  return JSON.parse(content);
}

async function callOpenAI(openaiKey, promptText, base64Image) {
  const userContent = [{ type: 'text', text: promptText }];
  if (base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    });
  }

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.1,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    const err = new Error(`OpenAI Upstream Error (${openaiRes.status})`);
    err.status = openaiRes.status;
    err.details = errText;
    throw err;
  }

  const data = await openaiRes.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI trả về dữ liệu rỗng');
  return JSON.parse(content);
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-NutriScan-Client');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const provider = (process.env.AI_PROVIDER || '').trim().toUpperCase();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  // Health Check trên trình duyệt
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'NutriScan AI Secure Proxy v2.2 (Auto-Failover)',
      configuredKeys: {
        gemini: Boolean(geminiKey),
        groq: Boolean(groqKey),
        openai: Boolean(openaiKey && openaiKey.startsWith('sk-')),
      },
      endpoint: '/api/analyze',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const clientHeader = req.headers['x-nutriscan-client'];
  if (clientHeader !== 'nutriscan-mobile-v2') {
    return res.status(403).json({ error: 'Forbidden: Invalid client signature' });
  }

  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Bạn đã quét quá nhanh. Vui lòng đợi vài phút rồi thử lại nhé!',
    });
  }

  try {
    const { promptText, base64Image } = req.body || {};
    if (!promptText) {
      return res.status(400).json({ error: 'Thiếu dữ liệu promptText' });
    }

    const errors = [];

    // 1. Nếu có GEMINI_API_KEY (Miễn phí & Nhanh) và không ép buộc dùng OPENAI trước
    if (geminiKey && provider !== 'OPENAI') {
      try {
        const result = await callGemini(geminiKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // 2. Nếu có GROQ_API_KEY (Miễn phí & Siêu nhanh)
    if (groqKey && provider !== 'OPENAI') {
      try {
        const result = await callGroq(groqKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // 3. Thử gọi OpenAI nếu có OPENAI_API_KEY
    if (openaiKey) {
      try {
        const result = await callOpenAI(openaiKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(`${e.message}: ${e.details || ''}`);
      }
    }

    // 4. Nếu OpenAI lỗi (ví dụ hết tiền 429) mà có Gemini hoặc Groq dự phòng thì tự động cứu cánh!
    if (geminiKey && provider === 'OPENAI') {
      try {
        const result = await callGemini(geminiKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    if (groqKey && provider === 'OPENAI') {
      try {
        const result = await callGroq(groqKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    return res.status(502).json({
      error: 'Không thể gọi AI từ các khóa hiện có trên Vercel',
      details: errors.join(' | '),
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi xử lý tại Backend Proxy',
    });
  }
}

module.exports = handler;
