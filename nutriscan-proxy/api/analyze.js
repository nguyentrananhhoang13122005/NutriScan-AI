/**
 * ============================================================================
 * NUTRISCAN AI - SECURE SERVERLESS PROXY v2.3 (MULTI-ENGINE VISION FAILOVER)
 * ============================================================================
 * Hỗ trợ các siêu mô hình Vision MIỄN PHÍ & MẠNH NHẤT cho bài toán đọc bao bì:
 * 1. GITHUB_TOKEN       -> Chạy chính thức OpenAI GPT-4o / GPT-4o-mini MIỄN PHÍ qua GitHub Models!
 * 2. GROQ_API_KEY       -> Chạy Meta Llama-4 Maverick 17B (128E) Vision siêu tốc (0.8s) MIỄN PHÍ!
 * 3. OPENROUTER_API_KEY -> Chạy Qwen 2.5 VL 72B Instruct (Vua OCR chữ nhỏ châu Á) MIỄN PHÍ!
 * 4. OPENAI_API_KEY     -> OpenAI Platform trả phí truyền thống.
 * 5. GEMINI_API_KEY     -> Google Gemini dự phòng.
 */

const rateLimitMap = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 35;

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

/**
 * 1. GITHUB MODELS (Chạy chính thức OpenAI GPT-4o-mini / GPT-4o MIỄN PHÍ bằng GitHub Token)
 */
async function callGitHubModels(githubToken, promptText, base64Image) {
  const userContent = [{ type: 'text', text: promptText }];
  if (base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    });
  }

  const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubToken}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub Models GPT-4o Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('GitHub Models trả về rỗng');
  return JSON.parse(content);
}

/**
 * 2. GROQ CLOUD (Qwen 3.8 27B Vision - Siêu tốc 0.2s)
 */
async function callGroq(groqKey, promptText, base64Image) {
  const userContent = [{ type: 'text', text: promptText }];
  if (base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    });
  }

  const models = base64Image
    ? ['qwen/qwen3.8-27b']
    : ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];

  let lastErr = '';
  for (const model of models) {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.1,
      }),
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return JSON.parse(content);
    } else {
      lastErr = await groqRes.text();
    }
  }

  throw new Error(`Groq Error: ${lastErr}`);
}

/**
 * 3. OPENROUTER FREE VISION (Qwen 2.5 VL 72B Instruct - Vua đọc OCR bao bì châu Á)
 */
async function callOpenRouter(openRouterKey, promptText, base64Image) {
  const userContent = [{ type: 'text', text: promptText }];
  if (base64Image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${base64Image}` },
    });
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`,
    },
    body: JSON.stringify({
      model: 'qwen/qwen2.5-vl-72b-instruct:free',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content || '';
  content = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(content);
}

/**
 * 4. OPENAI PLATFORM TRUYỀN THỐNG
 */
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
    throw new Error(`OpenAI (${openaiRes.status}): ${errText}`);
  }

  const data = await openaiRes.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI trả về dữ liệu rỗng');
  return JSON.parse(content);
}

/**
 * 5. GOOGLE GEMINI DỰ PHÒNG
 */
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
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

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    throw new Error(`Gemini (${geminiRes.status}): ${errText}`);
  }

  const data = await geminiRes.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini trả về rỗng');
  return JSON.parse(rawText);
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-NutriScan-Client');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const githubToken = (process.env.GITHUB_TOKEN || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'NutriScan AI Secure Proxy v2.3 (Multi-Engine Vision)',
      configuredEngines: {
        githubModels_GPT4o: Boolean(githubToken),
        groq_Llama4_Vision: Boolean(groqKey),
        openRouter_Qwen25_VL: Boolean(openRouterKey),
        openai_Platform: Boolean(openaiKey && openaiKey.startsWith('sk-')),
        gemini: Boolean(geminiKey),
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

    // Ưu tiên 1: GitHub Models (Chính là OpenAI GPT-4o-mini miễn phí!)
    if (githubToken) {
      try {
        const result = await callGitHubModels(githubToken, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // Ưu tiên 2: Groq Cloud (Llama-4 Maverick 17B 128E Vision - Siêu tốc 0.8s)
    if (groqKey) {
      try {
        const result = await callGroq(groqKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // Ưu tiên 3: OpenRouter (Qwen 2.5 VL 72B Instruct - Vua OCR)
    if (openRouterKey) {
      try {
        const result = await callOpenRouter(openRouterKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // Ưu tiên 4: OpenAI Platform (nếu tài khoản còn credit)
    if (openaiKey) {
      try {
        const result = await callOpenAI(openaiKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    // Ưu tiên 5: Gemini dự phòng
    if (geminiKey) {
      try {
        const result = await callGemini(geminiKey, promptText, base64Image);
        return res.status(200).json(result);
      } catch (e) {
        errors.push(e.message);
      }
    }

    return res.status(502).json({
      error: 'Chưa có khóa AI nào hoạt động trên Vercel',
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
