/**
 * 布料试穿 API：接收布料图 + 模特图，调用 Gemini (NANO BANANA) 生成试穿效果
 * 部署时请在 Vercel 环境变量中设置 GEMINI_API_KEY
 */

// 使用 Gemini 图像模型 (NANO BANANA)。若不可用可改为 gemini-2.0-flash-preview-image-generation
const GEMINI_MODEL = "gemini-2.5-flash-preview-image-generation";

const TRYON_PROMPT = `你是一个专业的虚拟试穿 AI。我将提供两张图片：
- 第一张：布料/面料（纹理、颜色、材质）
- 第二张：一位模特的全身照（人物姿势、背景、光线）

请将第一张图中的布料做成衣服，穿在第二张图中的模特身上。要求：
1. 保持模特的姿势、背景、光线和人物相貌完全一致；
2. 只替换人物身上的服装，用第一张布料的纹理、颜色和质感；
3. 布料自然贴合身体，褶皱、光影真实，像真实穿着该面料制成的衣服；
4. 输出一张合成后的照片，不要添加任何文字、水印或说明。`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "服务未配置 GEMINI_API_KEY，请在 Vercel 环境变量中设置",
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "请求体必须是 JSON" });
  }

  const fabric = body.fabric;
  const model = body.model;
  if (!fabric || !fabric.data || !model || !model.data) {
    return res.status(400).json({
      error: "请提供 fabric 和 model 对象，且均包含 data（base64）",
    });
  }

  const parts = [
    {
      inlineData: {
        mimeType: fabric.mimeType || "image/jpeg",
        data: fabric.data,
      },
    },
    {
      inlineData: {
        mimeType: model.mimeType || "image/jpeg",
        data: model.data,
      },
    },
    { text: TRYON_PROMPT },
  ];

  const payload = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      responseMimeType: "image/png",
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg =
        data.error?.message ||
        data.error?.status ||
        JSON.stringify(data.error) ||
        "Gemini 请求失败";
      return res.status(response.status >= 500 ? 502 : 400).json({
        error: msg,
      });
    }

    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts?.length) {
      return res.status(502).json({
        error: "模型未返回图片，可能被安全策略拦截或生成失败",
      });
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return res.status(200).json({
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        });
      }
    }

    return res.status(502).json({
      error: "响应中未包含图片",
    });
  } catch (e) {
    console.error("tryon api error", e);
    return res.status(500).json({
      error: e.message || "服务器错误",
    });
  }
}
