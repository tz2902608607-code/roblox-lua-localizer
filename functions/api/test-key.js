// API Key 测试接口：/api/test-key?provider=xxx&key=xxx&appid=xxx&appkey=xxx&apiurl=xxx&model=xxx
import {
  json,
  translateBaidu,
  translateBaiduLLM,
  translateYandex,
  translateDeepL,
  translateDeepSeek,
  translateDoubao,
  translateKimi,
  translateOpenAI,
  translateCustomAI,
  translateGemini,
  translateBaiduAI,
  translateOpenAICompat,
} from "./translate.js";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "").toLowerCase();
  const key = url.searchParams.get("key") || "";
  const appid = url.searchParams.get("appid") || "";
  const appkey = url.searchParams.get("appkey") || "";
  const apiurl = url.searchParams.get("apiurl") || "";
  const model = url.searchParams.get("model") || "";

  if (!provider) {
    return json({ error: "缺少 provider 参数" }, 400);
  }

  const testText = "Hello";
  const startTime = Date.now();

  try {
    let translated = "";
    if (provider === "baidu") {
      if (!appid || !appkey) return json({ success: false, error: "缺少 AppID 或 AppKey" });
      translated = await translateBaidu(testText, appid, appkey);
    } else if (provider === "baidullm") {
      if (!appid || !appkey) return json({ success: false, error: "缺少 AppID 或 AppKey" });
      translated = await translateBaiduLLM(testText, appid, appkey);
    } else if (provider === "yandex") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateYandex(testText, key);
    } else if (provider === "deepl") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateDeepL(testText, key);
    } else if (provider === "deepseek") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateDeepSeek(testText, key);
    } else if (provider === "doubao") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateDoubao(testText, key);
    } else if (provider === "kimi") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateKimi(testText, key);
    } else if (provider === "openai") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAI(testText, key);
    } else if (provider === "customai") {
      if (!key || !apiurl || !model) return json({ success: false, error: "缺少 Key、API URL 或模型" });
      translated = await translateCustomAI(testText, key, apiurl, model);
    } else if (provider === "gemini") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateGemini(testText, key);
    } else if (provider === "baiduai") {
      if (!appid || !appkey) return json({ success: false, error: "缺少 API Key 或 Secret Key" });
      translated = await translateBaiduAI(testText, appid, appkey);
    } else if (provider === "qwen") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAICompat(testText, key, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "qwen-turbo");
    } else if (provider === "glm") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAICompat(testText, key, "https://open.bigmodel.cn/api/paas/v4/chat/completions", "glm-4.7-flash");
    } else if (provider === "spark") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAICompat(testText, key, "https://spark-api-open.xf-yun.com/v1/chat/completions", "lite");
    } else if (provider === "yi") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAICompat(testText, key, "https://api.lingyiwanwu.com/v1/chat/completions", "yi-lightning");
    } else if (provider === "hunyuan") {
      if (!key) return json({ success: false, error: "缺少 API Key" });
      translated = await translateOpenAICompat(testText, key, "https://tokenhub.tencentmaas.com/v1/chat/completions", "hunyuan-turbo");
    } else {
      return json({ success: false, error: `未知 provider: ${provider}` }, 400);
    }

    const elapsed = Date.now() - startTime;
    return json({ success: true, translated, elapsed: `${elapsed}ms`, provider });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    return json({ success: false, error: err?.message || "测试失败", elapsed: `${elapsed}ms`, provider });
  }
}
