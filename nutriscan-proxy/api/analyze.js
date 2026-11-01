/**
 * ============================================================================
 * NUTRISCAN AI - SECURE SERVERLESS PROXY (BẢO MẬT API KEY TUYỆT ĐỐI CHO BẢN APK)
 * ============================================================================
 * Nhiệm vụ:
 * 1. Giấu kín OPENAI_API_KEY / GEMINI_API_KEY trên Server (Vercel / Cloud).
 *    File .apk trên điện thoại người dùng hoàn toàn KHÔNG chứa khóa sk-proj-...
 * 2. Giới hạn tần suất quét (Rate Limit: tối đa 25 lượt / 10 phút / IP) chống spam đốt tiền.
 * 3. Hỗ trợ GET health-check để kiểm tra nhanh trên trình duyệt sau khi Deploy.
 */

const rateLimitMap = new Map();
const WINDOW_MS = 10 * 60 * 1000; // 10 phút
const MAX_REQUESTS_PER_WINDOW = 25;

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

async function handler(req, res) {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-NutriScan-Client');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const provider = (process.env.AI_PROVIDER || 'OPENAI').trim().toUpperCase();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Mở trên trình duyệt để kiểm tra trạng thái hoạt động (Health Check)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'NutriScan AI Secure Proxy v2.1',
      activeProvider: provider,
      openaiKeyConfigured: Boolean(openaiKey && openaiKey.startsWith('sk-')),
      geminiKeyConfigured: Boolean(geminiKey),
      endpoint: '/api/analyze',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Kiểm tra Header định danh từ App APK
  const clientHeader = req.headers['x-nutriscan-client'];
  if (clientHeader !== 'nutriscan-mobile-v2') {
    return res.status(403).json({ error: 'Forbidden: Invalid client signature' });
  }

  // Kiểm tra Rate Limit theo IP
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

    // 1. Ưu tiên gọi OpenAI GPT-4o-mini
    if (provider === 'OPENAI' && openaiKey) {
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
        return res.status(openaiRes.status).json({
          error: `OpenAI Upstream Error (${openaiRes.status})`,
          details: errText,
        });
      }

      const data = await openaiRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return res.status(502).json({ error: 'OpenAI trả về dữ liệu rỗng' });
      }

      return res.status(200).json(JSON.parse(content));
    }

    // 2. Dự phòng gọi Google Gemini 2.0 Flash
    if (geminiKey) {
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
        return res.status(geminiRes.status).json({
          error: `Gemini Upstream Error (${geminiRes.status})`,
          details: errText,
        });
      }

      const data = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return res.status(502).json({ error: 'Gemini trả về dữ liệu rỗng' });
      }

      return res.status(200).json(JSON.parse(rawText));
    }

    return res.status(500).json({
      error: 'Server Proxy chưa được cấu hình OPENAI_API_KEY hoặc GEMINI_API_KEY',
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi xử lý tại Backend Proxy',
    });
  }
}

module.exports = handler;
