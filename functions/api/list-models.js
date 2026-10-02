// Cloudflare Pages Function：拉取上游 AI 接口的可用模型列表。
// 路由：/api/list-models?provider=xxx&key=xxx&appid=xxx&appkey=xxx&apiurl=xxx
// 返回：{ success, provider, source: "upstream" | "builtin", models: [...], recommended: [...], note? }
import { json, corsHeaders, getErrorDetail } from "./translate.js";

// 各 provider 的模型列表端点（OpenAI 兼容的 /models）
const MODELS_ENDPOINT = {
  openai: "https://api.openai.com/v1/models",
  deepseek: "https://api.deepseek.com/models",
  kimi: "https://api.moonshot.cn/v1/models",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
  glm: "https://open.bigmodel.cn/api/paas/v4/models",
  spark: "https://spark-api-open.xf-yun.com/v1/models",
  yi: "https://api.lingyiwanwu.com/v1/models",
  hunyuan: "https://tokenhub.tencentmaas.com/v1/models",
};

// 推荐模型白名单（与前端 RECOMMENDED_MODELS 保持一致）
const RECOMMENDED = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  doubao: ["doubao-pro-32k", "doubao-pro-128k", "doubao-lite-32k"],
  kimi: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  qwen: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"],
  glm: ["glm-4.7-flash", "glm-4-flash", "glm-4-plus", "glm-4-air"],
  spark: ["lite", "generalv3.5", "max-32k", "4.0Ultra"],
  yi: ["yi-lightning", "yi-large", "yi-medium"],
  hunyuan: ["hunyuan-turbo", "hunyuan-lite", "hunyuan-pro"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  baiduai: ["ernie-speed-128k", "ernie-4.0-8k", "ernie-3.5-8k"],
  customai: [],
};

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// 内置回退列表：上游不支持 /models 或拉取失败时使用
function builtinModels(provider) {
  return [...(RECOMMENDED[provider] || [])];
}

function sortModels(list) {
  return [...new Set(list.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true })
  );
}

// OpenAI 兼容：GET /models -> { data: [{ id }] }
async function fetchOpenAICompatModels(endpoint, key) {
  const t = withTimeout(8000);
  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: t.signal,
    });
    if (!response.ok) throw new Error(await getErrorDetail(response));
    const data = await response.json();
    const list = Array.isArray(data?.data)
      ? data.data.map((m) => m?.id)
      : Array.isArray(data?.models)
        ? data.models.map((m) => m?.id || m?.name)
        : [];
    if (!list.length) throw new Error("上游未返回任何模型");
    return list;
  } finally {
    t.clear();
  }
}

// Gemini：GET /v1beta/models?key=xxx -> { models: [{ name, supportedGenerationMethods }] }
async function fetchGeminiModels(key) {
  const t = withTimeout(8000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { signal: t.signal },
    );
    if (!response.ok) throw new Error(await getErrorDetail(response));
    const data = await response.json();
    const list = (data?.models || [])
      .filter((m) => (m?.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => (m?.name || "").replace(/^models\//, ""));
    if (!list.length) throw new Error("上游未返回任何模型");
    return list;
  } finally {
    t.clear();
  }
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "").toLowerCase();
  const key = url.searchParams.get("key") || "";
  const appid = url.searchParams.get("appid") || "";
  const appkey = url.searchParams.get("appkey") || "";
  const apiurl = url.searchParams.get("apiurl") || "";
  const turnstileToken = url.searchParams.get("cf-turnstile-response") || "";
  if (!provider) {
    return json({ success: false, error: "缺少 provider 参数" }, 400);
  }
  // Turnstile 验证（与 /api/translate 保持一致）
  const TURNSTILE_SECRET = context.env?.TURNSTILE_SECRET || "";
  if (TURNSTILE_SECRET && turnstileToken) {
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      const isDuplicate = verifyData["error-codes"]?.includes("timeout-or-duplicate");
      if (!isDuplicate) {
        return json({ success: false, error: "Turnstile 验证失败", codes: verifyData["error-codes"] }, 403);
      }
    }
  } else if (TURNSTILE_SECRET && !turnstileToken) {
    return json({ success: false, error: "请先完成人机验证" }, 403);
  }

  const recommended = RECOMMENDED[provider] || [];
  const fallback = (note) => {
    const list = sortModels(builtinModels(provider));
    return json({
      success: true,
      provider,
      source: "builtin",
      models: list,
      recommended: list.filter((m) => recommended.includes(m)),
      note,
    });
  };

  // 凭证缺失时直接回退到内置列表
  const needKey = !["baiduai", "baidullm"].includes(provider);
  if (needKey && !key && !apiurl) {
    return fallback("未提供 API Key，展示内置推荐模型");
  }

  let ids = null;
  let note = "";
  try {
    if (provider === "gemini") {
      ids = await fetchGeminiModels(key);
    } else if (provider === "customai") {
      if (!apiurl) return fallback("未提供 API URL，展示内置推荐模型");
      ids = await fetchOpenAICompatModels(
        `${apiurl.replace(/\/+$/, "").replace(/\/chat\/completions$/, "")}/models`,
        key,
      );
    } else if (MODELS_ENDPOINT[provider]) {
      ids = await fetchOpenAICompatModels(MODELS_ENDPOINT[provider], key);
    } else {
      // 豆包 / 百度千帆 / 百度LLM 等无标准 models 端点
      return fallback("该接口不支持在线获取模型列表，展示内置推荐模型");
    }
  } catch (err) {
    return fallback(`获取模型列表失败（${err?.message || "未知错误"}），已回退到内置推荐模型`);
  }

  const models = sortModels(ids);
  return json({
    success: true,
    provider,
    source: "upstream",
    models,
    recommended: models.filter((m) => recommended.includes(m)),
    note,
  });
}
