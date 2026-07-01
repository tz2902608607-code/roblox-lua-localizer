// Cloudflare Pages Function：把翻译接口请求转发到第三方，绕过浏览器跨域限制。
// 路由：/api/translate?provider=youdao|bing|google|mymemory|libre|lingva|deeplx|baidu|yandex|deepl|deepseek|doubao|kimi|openai|customai&text=xxx
// 对于需要 API Key 的接口，通过 &key=xxx 或 &appid=xxx&appkey=xxx 传入
// 自定义 AI 通过 &key=xxx&apiurl=xxx&model=xxx 传入

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "youdao").toLowerCase();
  const text = url.searchParams.get("text") || "";
  const key = url.searchParams.get("key") || "";
  const appid = url.searchParams.get("appid") || "";
  const appkey = url.searchParams.get("appkey") || "";
  const apiurl = url.searchParams.get("apiurl") || "";
  const model = url.searchParams.get("model") || "";
  const turnstileToken = url.searchParams.get("cf-turnstile-response") || "";

  if (!text.trim()) {
    return json({ error: "缺少 text 参数" }, 400);
  }

  // Turnstile 验证
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
        return json({ error: "Turnstile 验证失败", codes: verifyData["error-codes"] }, 403);
      }
      // timeout-or-duplicate 表示 token 之前已验证成功（并发请求场景），允许通过
    }
  } else if (TURNSTILE_SECRET && !turnstileToken) {
    return json({ error: "请先完成人机验证" }, 403);
  }

  try {
    let translated = "";
    if (provider === "youdao") {
      translated = await translateYoudao(text);
    } else if (provider === "bing") {
      translated = await translateBing(text);
    } else if (provider === "google") {
      translated = await translateGoogle(text);
    } else if (provider === "mymemory") {
      translated = await translateMyMemory(text);
    } else if (provider === "libre") {
      translated = await translateLibre(text);
    } else if (provider === "lingva") {
      translated = await translateLingva(text);
    } else if (provider === "deeplx") {
      translated = await translateDeepLX(text);
    } else if (provider === "baidu") {
      if (!appid || !appkey) {
        return json({ error: "百度翻译需要 appid 和 appkey 参数" }, 400);
      }
      translated = await translateBaidu(text, appid, appkey);
    } else if (provider === "yandex") {
      if (!key) {
        return json({ error: "Yandex 翻译需要 key 参数" }, 400);
      }
      translated = await translateYandex(text, key);
    } else if (provider === "deepl") {
      if (!key) {
        return json({ error: "DeepL 翻译需要 key 参数" }, 400);
      }
      translated = await translateDeepL(text, key);
    } else if (provider === "deepseek") {
      if (!key) {
        return json({ error: "DeepSeek 翻译需要 key 参数" }, 400);
      }
      translated = await translateDeepSeek(text, key);
    } else if (provider === "doubao") {
      if (!key) {
        return json({ error: "豆包翻译需要 key 参数" }, 400);
      }
      translated = await translateDoubao(text, key);
    } else if (provider === "kimi") {
      if (!key) {
        return json({ error: "Kimi 翻译需要 key 参数" }, 400);
      }
      translated = await translateKimi(text, key);
    } else if (provider === "openai") {
      if (!key) {
        return json({ error: "ChatGPT 翻译需要 key 参数" }, 400);
      }
      translated = await translateOpenAI(text, key);
    } else if (provider === "customai") {
      if (!key || !apiurl || !model) {
        return json({ error: "自定义 AI 需要 key、apiurl 和 model 参数" }, 400);
      }
      translated = await translateCustomAI(text, key, apiurl, model);
    } else if (provider === "gemini") {
      if (!key) {
        return json({ error: "Gemini 翻译需要 key 参数" }, 400);
      }
      translated = await translateGemini(text, key);
    } else {
      return json({ error: `未知 provider: ${provider}` }, 400);
    }

    return json({ provider, translated });
  } catch (err) {
    return json({ error: err?.message || "翻译失败", provider }, 502);
  }
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

// 从 HTTP 错误响应中提取可读的错误信息
export async function getErrorDetail(response) {
  const status = response.status;
  try {
    const data = await response.json();
    // OpenAI 兼容格式：data.error.message
    if (data?.error?.message) return `${status}：${data.error.message}`;
    if (data?.error?.code) return `${status}：${data.error.code}`;
    // Yandex 格式：data.code + data.message
    if (data?.code && data?.message) return `${status}：${data.message}`;
    if (data?.message) return `${status}：${data.message}`;
    if (data?.error) return `${status}：${data.error}`;
  } catch {
    try {
      const text = await response.text();
      if (text) return `${status}：${text.slice(0, 200)}`;
    } catch {}
  }
  return `${status}`;
}

export async function translateYoudao(text) {
  // 有道翻译网页版接口（带 sign）
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  const salt = String(Date.now());
  const sign = md5(`fanyideskweb${text}${salt}Y2FYu%TNSbMCxc3t`);

  try {
    const response = await fetch("https://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: "https://fanyi.youdao.com/",
        Cookie: "OUTFOX_SEARCH_USER_ID=-1@localhost",
      },
      body: new URLSearchParams({
        i: text,
        from: "AUTO",
        to: "AUTO",
        smartresult: "dict",
        client: "fanyideskweb",
        salt,
        sign,
        doctype: "json",
        version: "2.1",
        keyfrom: "fanyi.web",
        action: "FY_BY_CLICKBUTTION",
        typoResult: "false",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`有道翻译接口返回 ${response.status}`);
    }

    const data = await response.json();
    const translated = (data?.translateResult || [])
      .flat()
      .map((item) => item?.tgt || "")
      .join("")
      .trim();

    if (!translated) throw new Error("有道翻译没有返回有效结果");
    return translated;
  } catch (err) {
    throw new Error(`有道翻译失败：${err.message || "未知错误"}`);
  }
}

export async function translateBing(text) {
  // 必应网页版翻译（参考 bing-translate-api 实现）
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0";

  try {
    // 第一步：获取页面配置（IG、IID、token、key）
    const pageRes = await fetch("https://www.bing.com/translator", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "manual",
    });

    // 处理重定向获取 subdomain
    let subdomain = "";
    const location = pageRes.headers.get("location");
    if (location) {
      const match = location.match(/^https?:\/{2}(\w+)\.bing\.com/);
      if (match) subdomain = match[1];
    }

    const pageHtml = pageRes.ok ? await pageRes.text() : "";

    const igMatch = pageHtml.match(/IG:"([^"]+)"/);
    const iidMatch = pageHtml.match(/data-iid="([^"]+)"/);
    const paramsMatch = pageHtml.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/);

    if (!igMatch || !iidMatch || !paramsMatch) {
      throw new Error("必应翻译：无法从页面提取必要参数");
    }

    const ig = igMatch[1];
    const iid = iidMatch[1];
    const [key, token] = JSON.parse(paramsMatch[1]);

    if (!key || !token) {
      throw new Error("必应翻译：token 或 key 为空");
    }

    const domain = subdomain ? `https://${subdomain}.bing.com` : "https://www.bing.com";

    // 第二步：发送翻译请求
    const response = await fetch(`${domain}/ttranslatev3?isVertical=1&IG=${ig}&IID=${iid}&SFX=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: `${domain}/translator`,
        "User-Agent": UA,
      },
      body: new URLSearchParams({
        fromLang: "en",
        text,
        to: "zh-Hans",
        token: String(token),
        key: String(key),
        tryFetchingGenderDebiasedTranslations: "true",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`必应翻译接口返回 ${response.status}`);
    }

    const data = await response.json();
    const translated = data?.[0]?.translations?.[0]?.text?.trim();
    if (!translated) throw new Error("必应翻译没有返回有效结果");
    return translated;
  } catch (err) {
    throw new Error(`必应翻译失败：${err.message || "未知错误"}`);
  }
}

export async function translateGoogle(text) {
  const target = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(target);
  if (!response.ok) throw new Error(`谷歌翻译接口返回 ${response.status}`);
  const data = await response.json();
  const translated = (data?.[0] || [])
    .map((part) => part?.[0] || "")
    .join("")
    .trim();
  if (!translated) throw new Error("谷歌翻译没有返回有效结果");
  return translated;
}

export async function translateMyMemory(text) {
  const target = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const response = await fetch(target);
  if (!response.ok) throw new Error(`MyMemory 接口返回 ${response.status}`);
  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("MyMemory 没有返回有效结果");
  }
  return translated;
}

export async function translateLibre(text) {
  const response = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    body: JSON.stringify({
      q: text,
      source: "en",
      target: "zh",
      format: "text",
    }),
  });
  if (!response.ok) throw new Error(`LibreTranslate 接口返回 ${response.status}`);
  const data = await response.json();
  const translated = data?.translatedText?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("LibreTranslate 没有返回有效结果");
  }
  return translated;
}

export async function translateLingva(text) {
  const target = `https://lingva.lunar.icu/api/v1/en/zh/${encodeURIComponent(text)}`;
  const response = await fetch(target, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`Lingva 接口返回 ${response.status}`);
  const data = await response.json();
  const translated = data?.translation?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("Lingva 没有返回有效结果");
  }
  return translated;
}

export async function translateDeepLX(text) {
  const response = await fetch("https://api.deeplx.org/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text: text,
      source_lang: "EN",
      target_lang: "ZH",
    }),
  });
  if (!response.ok) throw new Error(`DeepLX 接口返回 ${response.status}`);
  const data = await response.json();
  const translated = data?.data || data?.translation?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("DeepLX 没有返回有效结果");
  }
  return translated;
}

export async function translateBaidu(text, appid, appkey) {
  const salt = Date.now();
  const sign = md5(`${appid}${text}${salt}${appkey}`);
  const target = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(text)}&from=en&to=zh&appid=${appid}&salt=${salt}&sign=${sign}`;
  const response = await fetch(target);
  if (!response.ok) throw new Error(`百度翻译接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.trans_result?.[0]?.dst?.trim();
  if (!translated) throw new Error("百度翻译没有返回有效结果");
  return translated;
}

export async function translateYandex(text, key) {
  const target = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${encodeURIComponent(key)}&text=${encodeURIComponent(text)}&lang=en-zh`;
  const response = await fetch(target);
  if (!response.ok) throw new Error(`Yandex 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  // Yandex 返回 200 但 code 不为 200 时表示业务错误
  if (data?.code && data.code !== 200) {
    throw new Error(`Yandex 接口返回 ${data.code}：${data.message || "未知错误"}`);
  }
  const translated = data?.text?.[0]?.trim();
  if (!translated) throw new Error("Yandex 翻译没有返回有效结果");
  return translated;
}

export async function translateDeepL(text, key) {
  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: "EN",
      target_lang: "ZH",
    }),
  });
  if (!response.ok) throw new Error(`DeepL 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.translations?.[0]?.text?.trim();
  if (!translated) throw new Error("DeepL 翻译没有返回有效结果");
  return translated;
}

export async function translateDeepSeek(text, key) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a translator. Translate the following English text to Chinese. Only return the translation, no explanations." },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("DeepSeek 翻译没有返回有效结果");
  return translated;
}

export async function translateDoubao(text, key) {
  const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "doubao-pro-32k",
      messages: [
        { role: "system", content: "你是一个翻译助手。请将以下英文翻译成中文，只返回翻译结果，不要解释。" },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });
  if (!response.ok) throw new Error(`豆包接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("豆包翻译没有返回有效结果");
  return translated;
}

export async function translateKimi(text, key) {
  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      messages: [
        { role: "system", content: "你是一个翻译助手。请将以下英文翻译成中文，只返回翻译结果，不要解释。" },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });
  if (!response.ok) throw new Error(`Kimi 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("Kimi 翻译没有返回有效结果");
  return translated;
}

export async function translateOpenAI(text, key) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a translator. Translate the following English text to Chinese. Only return the translation, no explanations." },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("OpenAI 翻译没有返回有效结果");
  return translated;
}

export async function translateCustomAI(text, key, apiurl, model) {
  // 规范化 URL：去掉尾部斜杠，避免双斜杠
  const baseUrl = apiurl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是一个翻译助手。请将以下英文翻译成中文，只返回翻译结果，不要解释。" },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  });
  if (!response.ok) throw new Error(`自定义 AI 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error("自定义 AI 翻译没有返回有效结果");
  return translated;
}

export async function translateGemini(text, key) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "你是一个翻译助手。请将以下英文翻译成中文，只返回翻译结果，不要解释。" },
              { text },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini 接口返回 ${await getErrorDetail(response)}`);
  const data = await response.json();
  const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!translated) throw new Error("Gemini 翻译没有返回有效结果");
  return translated;
}

// 内联 MD5 实现（用于百度翻译签名）
export function md5(inputString) {
  const hc = "0123456789abcdef";
  function rh(n) { let j, s = ""; for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s; }
  function ad(x, y) { const l = (x & 0xFFFF) + (y & 0xFFFF); const m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
  function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
  function cm(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
  function sb(x) {
    let i; const nblk = ((x.length + 8) >> 6) + 1; const blks = new Array(nblk * 16);
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8;
    return blks;
  }
  let i, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
  const x = sb(inputString);
  for (i = 0; i < x.length; i += 16) {
    olda = a; oldb = b; oldc = c; oldd = d;
    a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}

// 十六进制字符串转 Uint8Array
export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Base64 字符串转 Uint8Array
export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
