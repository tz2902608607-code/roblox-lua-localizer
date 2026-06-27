const STORAGE_KEY = "roblox-localizer-v2";
const OLD_STORAGE_KEY = "roblox-localizer-v1";

const state = {
  translations: [
    { en: "", cn: "" },
  ],
  translatorProvider: "auto",
  apiKeys: {},
};

const LOCAL_TRANSLATION_DICTIONARY = {
  play: "开始",
  start: "开始",
  begin: "开始",
  settings: "设置",
  setting: "设置",
  shop: "商店",
  store: "商店",
  inventory: "背包",
  backpack: "背包",
  items: "物品",
  item: "物品",
  close: "关闭",
  open: "打开",
  back: "返回",
  next: "下一步",
  previous: "上一步",
  continue: "继续",
  confirm: "确认",
  cancel: "取消",
  yes: "是",
  no: "否",
  ok: "确定",
  buy: "购买",
  sell: "出售",
  equip: "装备",
  unequip: "卸下",
  use: "使用",
  claim: "领取",
  reward: "奖励",
  rewards: "奖励",
  daily: "每日",
  quest: "任务",
  quests: "任务",
  level: "等级",
  upgrade: "升级",
  delete: "删除",
  save: "保存",
  load: "加载",
  search: "搜索",
  join: "加入",
  leave: "离开",
  exit: "退出",
  menu: "菜单",
  home: "主页",
  profile: "资料",
  player: "玩家",
  players: "玩家",
  coins: "金币",
  gems: "宝石",
  money: "金钱",
  health: "生命值",
  damage: "伤害",
  speed: "速度",
  power: "力量",
  strength: "力量",
  rebirth: "重生",
  teleport: "传送",
};

const TRANSLATOR_LABELS = {
  auto: "自动选择",
  local: "本地词典",
  mymemory: "MyMemory 翻译",
  deeplx: "DeepLX 翻译",
  libre: "LibreTranslate 翻译",
  lingva: "Lingva 翻译",
  youdao: "有道翻译",
  bing: "必应翻译",
  google: "谷歌翻译",
  baidu: "百度翻译",
  yandex: "Yandex 翻译",
  deepl: "DeepL 翻译",
  deepseek: "DeepSeek AI 翻译",
  doubao: "豆包 AI 翻译",
  kimi: "Kimi AI 翻译",
  openai: "ChatGPT AI 翻译",
  customai: "自定义 AI",
};

// 自动选择时的接口尝试顺序（免费接口优先，AI接口需要Key放后面）
const AUTO_TRANSLATOR_ORDER = ["mymemory", "deeplx", "lingva", "libre", "google", "youdao", "bing"];

// 需要 API Key 的接口配置
const KEY_PROVIDERS = {
  baidu: { fields: [{ id: "baiduAppId", label: "AppID", placeholder: "百度翻译开放平台 AppID" }, { id: "baiduAppKey", label: "AppKey", placeholder: "百度翻译开放平台密钥" }] },
  yandex: { fields: [{ id: "yandexKey", label: "API Key", placeholder: "Yandex Translate API Key" }] },
  deepl: { fields: [{ id: "deeplKey", label: "API Key", placeholder: "DeepL API Key" }] },
  deepseek: { fields: [{ id: "deepseekKey", label: "API Key", placeholder: "DeepSeek API Key" }] },
  doubao: { fields: [{ id: "doubaoKey", label: "API Key", placeholder: "豆包/火山引擎 API Key" }] },
  kimi: { fields: [{ id: "kimiKey", label: "API Key", placeholder: "Moonshot AI API Key" }] },
  openai: { fields: [{ id: "openaiKey", label: "API Key", placeholder: "OpenAI API Key" }] },
  customai: {
    fields: [
      { id: "customaiApiUrl", label: "API 地址", placeholder: "如 https://api.siliconflow.cn/v1" },
      { id: "customaiModel", label: "模型名称", placeholder: "如 deepseek-ai/DeepSeek-V3" },
      { id: "customaiKey", label: "API Key", placeholder: "填写平台 API Key" },
    ],
  },
};

// 旧版兼容：将 KEY_PROVIDERS 转成 { fieldId: keyConfig } 的快速查找表
const KEY_FIELD_MAP = {};
for (const [provider, config] of Object.entries(KEY_PROVIDERS)) {
  for (const field of config.fields) {
    KEY_FIELD_MAP[field.id] = { provider, type: field.id === "baiduAppId" ? "appid" : field.id === "baiduAppKey" ? "appkey" : "key" };
  }
}

const els = {
  bgImage: document.querySelector("#bgImage"),
  bgLayer: document.querySelector(".bg-layer"),
  menuBtn: document.querySelector("#menuBtn"),
  closeMenuBtn: document.querySelector("#closeMenuBtn"),
  sidebar: document.querySelector("#sidebar"),
  overlay: document.querySelector("#overlay"),
  navLinks: document.querySelectorAll(".nav-link"),
  homePage: document.querySelector("#homePage"),
  tutorialPage: document.querySelector("#tutorialPage"),
  hookEnabled: document.querySelector("#hookEnabled"),
  scanInterval: document.querySelector("#scanInterval"),
  rawUrl: document.querySelector("#rawUrl"),
  translationBody: document.querySelector("#translationBody"),
  entryCount: document.querySelector("#entryCount"),
  addRowBtn: document.querySelector("#addRowBtn"),
  clearRowsBtn: document.querySelector("#clearRowsBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  autoTranslateBtn: document.querySelector("#autoTranslateBtn"),
  translatorProvider: document.querySelector("#translatorProvider"),
  translateStatus: document.querySelector("#translateStatus"),
  jsonFileInput: document.querySelector("#jsonFileInput"),
  generateBtn: document.querySelector("#generateBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  output: document.querySelector("#output"),
  scriptStatus: document.querySelector("#scriptStatus"),
  extractCode: document.querySelector("#extractCode"),
  copyExtractBtn: document.querySelector("#copyExtractBtn"),
  dialogMask: document.querySelector("#dialogMask"),
  dialogKicker: document.querySelector("#dialogKicker"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogMessage: document.querySelector("#dialogMessage"),
  dialogCancelBtn: document.querySelector("#dialogCancelBtn"),
  dialogSkipBtn: document.querySelector("#dialogSkipBtn"),
  dialogConfirmBtn: document.querySelector("#dialogConfirmBtn"),
  toast: document.querySelector("#toast"),
  toastText: document.querySelector("#toastText"),
  apiKeysToggle: document.querySelector("#apiKeysToggle"),
  apiKeysBody: document.querySelector("#apiKeysBody"),
  apiKeyInline: document.querySelector("#apiKeyInline"),
  apiKeyFields: document.querySelector("#apiKeyFields"),
};

function showToast(message) {
  els.toastText.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}

function loadRandomBackground() {
  const url = `https://www.dmoe.cc/random.php?time=${Date.now()}`;
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    els.bgImage.src = url;
    els.bgLayer.classList.add("loaded");
  };
  img.onerror = () => {
    els.bgLayer.classList.remove("loaded");
    showToast("随机背景图加载失败，已使用默认渐变背景。");
  };
  img.src = url;
}

function showDialog({
  kicker = "操作确认",
  title = "确认操作",
  message = "确定要继续吗？",
  confirmText = "确认",
  cancelText = "取消",
} = {}) {
  return new Promise((resolve) => {
    els.dialogKicker.textContent = kicker;
    els.dialogTitle.textContent = title;
    els.dialogMessage.textContent = message;
    els.dialogConfirmBtn.textContent = confirmText;
    els.dialogCancelBtn.textContent = cancelText;
    els.dialogSkipBtn.hidden = true;
    els.dialogMask.classList.add("show");
    els.dialogMask.setAttribute("aria-hidden", "false");

    const cleanup = (result) => {
      els.dialogMask.classList.remove("show");
      els.dialogMask.setAttribute("aria-hidden", "true");
      els.dialogConfirmBtn.removeEventListener("click", onConfirm);
      els.dialogCancelBtn.removeEventListener("click", onCancel);
      els.dialogMask.removeEventListener("click", onMask);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onMask = (event) => {
      if (event.target === els.dialogMask) cleanup(false);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") cleanup(false);
    };

    els.dialogConfirmBtn.addEventListener("click", onConfirm);
    els.dialogCancelBtn.addEventListener("click", onCancel);
    els.dialogMask.addEventListener("click", onMask);
    document.addEventListener("keydown", onKeydown);
  });
}

function showTranslateModeDialog() {
  return new Promise((resolve) => {
    els.dialogKicker.textContent = "自动翻译";
    els.dialogTitle.textContent = "检测到已有中文翻译";
    els.dialogMessage.textContent = "继续翻译时，你可以覆盖已填写的中文，也可以跳过已翻译内容，只翻译仍为空的词条。";
    els.dialogCancelBtn.textContent = "取消";
    els.dialogSkipBtn.textContent = "跳过已翻译";
    els.dialogConfirmBtn.textContent = "覆盖全部";
    els.dialogSkipBtn.hidden = false;
    els.dialogMask.classList.add("show");
    els.dialogMask.setAttribute("aria-hidden", "false");

    const cleanup = (result) => {
      els.dialogMask.classList.remove("show");
      els.dialogMask.setAttribute("aria-hidden", "true");
      els.dialogSkipBtn.hidden = true;
      els.dialogConfirmBtn.removeEventListener("click", onOverwrite);
      els.dialogSkipBtn.removeEventListener("click", onSkip);
      els.dialogCancelBtn.removeEventListener("click", onCancel);
      els.dialogMask.removeEventListener("click", onMask);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };

    const onOverwrite = () => cleanup("overwrite");
    const onSkip = () => cleanup("skip");
    const onCancel = () => cleanup("cancel");
    const onMask = (event) => {
      if (event.target === els.dialogMask) cleanup("cancel");
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") cleanup("cancel");
    };

    els.dialogConfirmBtn.addEventListener("click", onOverwrite);
    els.dialogSkipBtn.addEventListener("click", onSkip);
    els.dialogCancelBtn.addEventListener("click", onCancel);
    els.dialogMask.addEventListener("click", onMask);
    document.addEventListener("keydown", onKeydown);
  });
}

function updateTranslatorProvider(provider) {
  state.translatorProvider = provider;
  els.translatorProvider.value = provider;
}

function openMenu() {
  els.sidebar.classList.add("open");
  els.overlay.classList.add("show");
  els.sidebar.setAttribute("aria-hidden", "false");
}

function closeMenu() {
  els.sidebar.classList.remove("open");
  els.overlay.classList.remove("show");
  els.sidebar.setAttribute("aria-hidden", "true");
}

function switchPage(page) {
  const isTutorial = page === "tutorial";
  els.homePage.classList.toggle("active", !isTutorial);
  els.tutorialPage.classList.toggle("active", isTutorial);

  els.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getApiKeys() {
  return { ...(state.apiKeys || {}) };
}

function syncApiKeysFromDom() {
  if (els.apiKeyFields) {
    els.apiKeyFields.querySelectorAll("input").forEach((input) => {
      state.apiKeys[input.id] = input.value?.trim() || "";
    });
  }
}

function renderApiKeyFields(provider) {
  if (!els.apiKeyFields) return;

  // 渲染前先保存当前已填写的 Key 到 state
  syncApiKeysFromDom();

  const config = KEY_PROVIDERS[provider];

  if (!config) {
    els.apiKeyInline.classList.add("hidden");
    return;
  }

  els.apiKeyInline.classList.remove("hidden");
  els.apiKeyFields.innerHTML = "";

  config.fields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "field";
    const span = document.createElement("span");
    span.textContent = field.label;
    const input = document.createElement("input");
    input.id = field.id;
    input.type = "text";
    input.placeholder = field.placeholder;
    input.value = state.apiKeys[field.id] || "";
    input.autocomplete = "off";
    input.addEventListener("input", () => {
      syncApiKeysFromDom();
    });
    input.addEventListener("change", () => {
      syncApiKeysFromDom();
      saveState();
    });
    label.append(span, input);
    els.apiKeyFields.append(label);
  });
}

function saveState() {
  const payload = {
    hookEnabled: els.hookEnabled.checked,
    scanInterval: els.scanInterval.value,
    rawUrl: els.rawUrl.value.trim(),
    translations: state.translations,
    translatorProvider: state.translatorProvider,
    apiKeys: getApiKeys(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    const raw = currentRaw || oldRaw;
    if (!raw) {
      els.hookEnabled.checked = false;
      return;
    }

    const payload = JSON.parse(raw);
    els.hookEnabled.checked = currentRaw ? (payload.hookEnabled ?? false) : false;
    els.scanInterval.value = String(payload.scanInterval || "3");
    els.rawUrl.value = payload.rawUrl || "";
    updateTranslatorProvider(payload.translatorProvider || "auto");

    if (payload.apiKeys && typeof payload.apiKeys === "object") {
      state.apiKeys = payload.apiKeys;
    }

    if (Array.isArray(payload.translations)) {
      state.translations = payload.translations
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          en: String(item.en || ""),
          cn: String(item.cn || ""),
          selected: item.selected !== false,
        }));

      const isOldExampleOnly =
        state.translations.length === 2 &&
        state.translations[0].en === "Play" &&
        state.translations[0].cn === "开始" &&
        state.translations[1].en === "Settings" &&
        state.translations[1].cn === "设置";

      if (isOldExampleOnly) {
        state.translations = [{ en: "", cn: "", selected: true }];
        saveState();
      }
    }
  } catch {
    els.hookEnabled.checked = false;
    showToast("本地缓存读取失败，已使用默认数据。");
  }
}

function renderRows() {
  els.translationBody.innerHTML = "";

  if (state.translations.length === 0) {
    state.translations.push({ en: "", cn: "", selected: true });
  }

  state.translations.forEach((item, index) => {
    const tr = document.createElement("tr");

    if (typeof item.selected !== "boolean") {
      item.selected = true;
    }

    const selectTd = document.createElement("td");
    selectTd.className = "select-cell";
    const selectLabel = document.createElement("label");
    selectLabel.className = "row-check";
    selectLabel.title = "勾选后自动翻译会处理这一行";
    const selectInput = document.createElement("input");
    selectInput.type = "checkbox";
    selectInput.checked = item.selected !== false;
    selectInput.addEventListener("change", () => {
      state.translations[index].selected = selectInput.checked;
      saveState();
    });
    const selectUi = document.createElement("span");
    selectLabel.append(selectInput, selectUi);
    selectTd.append(selectLabel);

    const enTd = document.createElement("td");
    const enInput = document.createElement("input");
    enInput.value = item.en;
    enInput.placeholder = "例如：Play";
    enInput.addEventListener("input", () => {
      state.translations[index].en = enInput.value;
      updateCount();
      saveState();
    });
    enTd.append(enInput);

    const cnTd = document.createElement("td");
    const cnInput = document.createElement("input");
    cnInput.value = item.cn;
    cnInput.placeholder = "例如：开始";
    cnInput.addEventListener("input", () => {
      state.translations[index].cn = cnInput.value;
      updateCount();
      saveState();
    });
    cnTd.append(cnInput);

    const actionTd = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn";
    deleteBtn.textContent = "删除";
    deleteBtn.addEventListener("click", () => {
      state.translations.splice(index, 1);
      renderRows();
      saveState();
      showToast("词条已删除。");
    });

    actions.append(deleteBtn);
    actionTd.append(actions);
    tr.append(selectTd, enTd, cnTd, actionTd);
    els.translationBody.append(tr);
  });

  updateCount();
}

function addRow(en = "", cn = "") {
  state.translations.push({ en, cn, selected: true });
  renderRows();
  saveState();
}

function updateCount() {
  const count = getCleanTranslations().length;
  els.entryCount.textContent = `${count} 条`;
}

function getCleanTranslations() {
  const seen = new Set();
  return state.translations
    .map((item) => ({
      en: item.en.trim(),
      cn: item.cn.trim(),
    }))
    .filter((item) => item.en && item.cn)
    .filter((item) => {
      const key = item.en.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.en.length - a.en.length);
}

function getRowsToTranslate() {
  return state.translations
    .map((item, index) => ({
      index,
      en: item.en.trim(),
      cn: item.cn.trim(),
      selected: item.selected !== false,
    }))
    .filter((item) => item.en && item.selected);
}

function updateTranslateStatus(text, type = "") {
  els.translateStatus.textContent = text;
  els.translateStatus.className = `translator-status ${type}`.trim();
}

function translateWithLocalDictionary(text) {
  const key = text.trim().toLowerCase();
  if (LOCAL_TRANSLATION_DICTIONARY[key]) {
    return LOCAL_TRANSLATION_DICTIONARY[key];
  }

  return "";
}

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

// 全局代理可用性缓存：null = 未检测，true = 可用，false = 不可用
let proxyWorking = null;

function isProxyAvailable() {
  if (proxyWorking === false) return false;
  return location.protocol === "http:" || location.protocol === "https:";
}

async function translateViaProxy(provider, text) {
  if (proxyWorking === false) {
    throw new Error("代理服务未部署");
  }

  let url = `/api/translate?provider=${encodeURIComponent(provider)}&text=${encodeURIComponent(text)}`;

  // 如果接口需要 Key，从本地配置中获取并附加到请求
  const keyConfig = KEY_PROVIDERS[provider];
  if (keyConfig) {
    const keys = getApiKeys();
    if (provider === "baidu") {
      const appid = keys["baiduAppId"];
      const appkey = keys["baiduAppKey"];
      if (appid && appkey) {
        url += `&appid=${encodeURIComponent(appid)}&appkey=${encodeURIComponent(appkey)}`;
      }
    } else if (provider === "customai") {
      const apiurl = keys["customaiApiUrl"];
      const model = keys["customaiModel"];
      const key = keys["customaiKey"];
      if (apiurl && model && key) {
        url += `&apiurl=${encodeURIComponent(apiurl)}&model=${encodeURIComponent(model)}&key=${encodeURIComponent(key)}`;
      }
    } else {
      const field = keyConfig.fields?.[0];
      if (field) {
        const key = keys[field.id];
        if (key) {
          url += `&key=${encodeURIComponent(key)}`;
        }
      }
    }
  }

  // AI 接口响应较慢，给更长的超时；免费接口给较短的超时
  const timeout = ["deepseek", "doubao", "kimi", "openai", "customai"].includes(provider) ? 18000 : 10000;
  const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, timeout);

  if (!response.ok) {
    if (response.status === 404) {
      proxyWorking = false;
      throw new Error("代理服务未部署（404），请将接口切换为「自动选择」或部署 Cloudflare Function");
    }
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error || "";
    } catch {}
    throw new Error(`接口返回 ${response.status}${detail ? `：${detail}` : ""}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    // 200 但返回 HTML，可能是代理返回了错误页面
    proxyWorking = false;
    throw new Error("代理服务返回了非 JSON 数据，请检查 Cloudflare Function 是否正确部署");
  }

  proxyWorking = true;
  const translated = data?.translated?.trim();
  if (!translated) throw new Error("接口没有返回有效翻译结果");
  return { translated, provider: data.provider || provider };
}

async function translateWithGoogleDirect(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error("谷歌翻译接口请求失败");
  const data = await response.json();
  const translated = data?.[0]?.map((part) => part?.[0] || "").join("").trim();
  if (!translated) throw new Error("谷歌翻译没有返回有效结果");
  return translated;
}

async function translateWithMyMemoryDirect(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error("MyMemory 翻译接口请求失败");
  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("MyMemory 翻译没有返回有效结果");
  }
  return translated;
}

async function translateWithLingvaDirect(text) {
  const url = `https://lingva.lunar.icu/api/v1/en/zh/${encodeURIComponent(text)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error("Lingva 翻译接口请求失败");
  const data = await response.json();
  const translated = data?.translation?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("Lingva 翻译没有返回有效结果");
  }
  return translated;
}

async function translateWithLibreDirect(text) {
  const response = await fetchWithTimeout("https://libretranslate.de/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: "en",
      target: "zh",
      format: "text",
    }),
  }, 12000);
  if (!response.ok) throw new Error("LibreTranslate 翻译接口请求失败");
  const data = await response.json();
  const translated = data?.translatedText?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("LibreTranslate 翻译没有返回有效结果");
  }
  return translated;
}

async function translateDirect(provider, text) {
  let translated;
  if (provider === "google") translated = await translateWithGoogleDirect(text);
  else if (provider === "mymemory") translated = await translateWithMyMemoryDirect(text);
  else if (provider === "lingva") translated = await translateWithLingvaDirect(text);
  else if (provider === "libre") translated = await translateWithLibreDirect(text);
  else translated = await translateWithMyMemoryDirect(text);
  return { translated, provider };
}

function getAvailableProviders() {
  const keys = state.apiKeys || {};
  const available = [];

  // 支持直连的免费接口优先（速度快，不需要代理）
  available.push("mymemory", "google", "lingva", "libre");

  // 需要代理的免费接口
  available.push("deeplx", "youdao", "bing");

  // 已配置 Key 的 AI 接口（质量高，但需要代理）
  for (const [provider, config] of Object.entries(KEY_PROVIDERS)) {
    const allFilled = config.fields.every((f) => keys[f.id]);
    if (allFilled) available.push(provider);
  }

  return available;
}

// 支持浏览器直连的免费接口
const DIRECT_PROVIDERS = new Set(["google", "mymemory", "lingva", "libre"]);

async function translateTextByProvider(text) {
  const localResult = translateWithLocalDictionary(text);
  if (localResult) return { translated: localResult, provider: "local" };

  const provider = state.translatorProvider;

  if (provider === "auto") {
    // 自动选择：优先走直连（免费接口），直连失败后尝试代理
    const providers = getAvailableProviders();

    // 先尝试支持直连的接口
    for (const item of providers) {
      if (DIRECT_PROVIDERS.has(item)) {
        try {
          return await translateDirect(item, text);
        } catch (err) {
          console.warn(`[translator] ${item} 直连失败：`, err);
        }
      }
    }

    // 直连全部失败后，尝试代理接口
    if (isProxyAvailable()) {
      for (const item of providers) {
        if (!DIRECT_PROVIDERS.has(item)) {
          try {
            return await translateViaProxy(item, text);
          } catch (err) {
            console.warn(`[translator] ${item} 代理失败：`, err);
          }
        }
      }
    }

    throw new Error("所有翻译接口都不可用");
  } else {
    // 指定接口：先尝试代理，失败后如果支持直连则再试直连，仍失败才报错
    let lastError = null;
    if (isProxyAvailable()) {
      try {
        return await translateViaProxy(provider, text);
      } catch (err) {
        lastError = err;
        console.warn(`[translator] ${provider} 代理失败：`, err);
      }
    }
    // 不存在代理或代理失败时，尝试直连（仅免费接口支持直连）
    if (DIRECT_PROVIDERS.has(provider)) {
      try {
        return await translateDirect(provider, text);
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    throw new Error(`${TRANSLATOR_LABELS[provider] || provider} 不支持直连，需要部署 Cloudflare Function 代理。`);
  }
}

async function autoTranslateRows() {
  const rows = getRowsToTranslate();
  if (rows.length === 0) {
    showToast("请先填写英文原文，并勾选需要自动翻译的词条。");
    updateTranslateStatus("缺少英文", "error");
    return;
  }

  const hasExistingChinese = rows.some((row) => row.cn);
  let rowsToTranslate = rows;
  if (hasExistingChinese) {
    const mode = await showTranslateModeDialog();

    if (mode === "cancel") return;
    if (mode === "skip") {
      rowsToTranslate = rows.filter((row) => !row.cn);
      if (rowsToTranslate.length === 0) {
        updateTranslateStatus("无需翻译", "done");
        showToast("勾选的词条都已经有中文翻译，没有需要补充翻译的内容。");
        return;
      }
    }
  }

  const providerLabel = TRANSLATOR_LABELS[state.translatorProvider] || "自动翻译";
  const totalCount = rowsToTranslate.length;
  // 免费接口并发 5-6 条，AI 接口并发 3 条（AI 响应慢，不宜并发太多）
  const isAiProvider = ["deepseek", "doubao", "kimi", "openai", "customai"].includes(state.translatorProvider);
  const concurrency = isAiProvider ? 3 : (state.translatorProvider === "auto" ? 5 : 4);
  let nextIndex = 0;

  els.autoTranslateBtn.disabled = true;
  els.autoTranslateBtn.textContent = "翻译中...";
  updateTranslateStatus(`翻译中 0/${totalCount}`, "working");
  showToast(`正在调用${providerLabel}，将并发翻译 ${totalCount} 条。`);

  let successCount = 0;
  let failCount = 0;
  let firstError = null;
  const usedProviders = new Set();
  let shouldStop = false;

  try {
    const translateWorker = async () => {
      while (nextIndex < rowsToTranslate.length && !shouldStop) {
        const row = rowsToTranslate[nextIndex];
        nextIndex += 1;

        try {
          const result = await translateTextByProvider(row.en);
          state.translations[row.index].cn = result.translated;
          usedProviders.add(result.provider);
          successCount += 1;
        } catch (err) {
          failCount += 1;
          if (!firstError) firstError = err;
          // 指定接口时，失败就停止所有 worker
          if (state.translatorProvider !== "auto") {
            shouldStop = true;
          }
        }

        updateTranslateStatus(`翻译中 ${successCount + failCount}/${totalCount}`, "working");
      }
    };

    const workerCount = Math.min(concurrency, rowsToTranslate.length);
    await Promise.all(Array.from({ length: workerCount }, translateWorker));
    renderRows();
    saveState();

    // 组装实际使用的接口名称
    const actualProviderLabels = [...usedProviders].map((p) => TRANSLATOR_LABELS[p] || p);
    const actualText = actualProviderLabels.length > 0
      ? `（${actualProviderLabels.join("、")}）`
      : "";

    if (successCount > 0) {
      updateTranslateStatus(`完成 ${successCount} 条 ${actualText}`, "done");
      showToast(`${providerLabel}翻译完成，成功 ${successCount} 条${failCount ? `，失败 ${failCount} 条` : ""}。${actualText}`);
    } else {
      updateTranslateStatus("翻译失败", "error");
      let extra = "";
      if (state.translatorProvider === "google") {
        extra = "谷歌翻译可能需要 VPN。";
      } else if (firstError) {
        extra = firstError.message;
      } else {
        extra = "所有在线接口暂时不可用，请稍后重试或手动填写。";
      }
      showToast(`${providerLabel}翻译失败：${extra}`);
    }
  } finally {
    els.autoTranslateBtn.disabled = false;
    els.autoTranslateBtn.textContent = "自动翻译";
  }
}

function escapeLuaString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/"/g, '\\"');
}

function isLikelyUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildLuaScript() {
  const translations = getCleanTranslations();
  const rawUrl = els.rawUrl.value.trim();
  const scanInterval = Number(els.scanInterval.value) || 3;
  const useHook = els.hookEnabled.checked;

  if (translations.length === 0) {
    throw new Error("请至少填写一组完整的英文原文和中文翻译。");
  }

  if (!isLikelyUrl(rawUrl)) {
    throw new Error("远程脚本 Raw 链接格式不正确，请填写 http 或 https 链接。");
  }

  const lines = [];
  lines.push("-- Roblox 汉化脚本");
  lines.push("-- 由 Roblox 汉化脚本在线生成器生成");
  lines.push("-- 默认使用普通扫描模式。Hook 模式可能被反作弊拦截，请谨慎开启。");
  lines.push("");
  lines.push("local Translations = {");
  translations.forEach((item) => {
    lines.push(`    ["${escapeLuaString(item.en)}"] = "${escapeLuaString(item.cn)}",`);
  });
  lines.push("}");
  lines.push("");
  lines.push("local TextClasses = {");
  lines.push("    TextLabel = true,");
  lines.push("    TextButton = true,");
  lines.push("    TextBox = true,");
  lines.push("}");
  lines.push("");
  lines.push("local function isTextObject(obj)");
  lines.push("    return obj and TextClasses[obj.ClassName] == true");
  lines.push("end");
  lines.push("");
  lines.push("local function escapePattern(text)");
  lines.push("    return text:gsub(\"(%W)\", \"%%%1\")");
  lines.push("end");
  lines.push("");
  lines.push("local function translateText(text)");
  lines.push("    if type(text) ~= \"string\" or text == \"\" then");
  lines.push("        return text");
  lines.push("    end");
  lines.push("");
  lines.push("    if Translations[text] then");
  lines.push("        return Translations[text]");
  lines.push("    end");
  lines.push("");
  lines.push("    for en, cn in pairs(Translations) do");
  lines.push("        if string.find(text, en, 1, true) then");
  lines.push("            text = string.gsub(text, escapePattern(en), cn)");
  lines.push("        end");
  lines.push("    end");
  lines.push("");
  lines.push("    return text");
  lines.push("end");
  lines.push("");
  lines.push("local function translateObject(obj)");
  lines.push("    if not isTextObject(obj) then");
  lines.push("        return");
  lines.push("    end");
  lines.push("");
  lines.push("    pcall(function()");
  lines.push("        local oldText = obj.Text");
  lines.push("        local newText = translateText(oldText)");
  lines.push("");
  lines.push("        if newText ~= oldText then");
  lines.push("            obj.Text = newText");
  lines.push("        end");
  lines.push("    end)");
  lines.push("end");
  lines.push("");
  lines.push("local function scanContainer(container)");
  lines.push("    if not container then");
  lines.push("        return");
  lines.push("    end");
  lines.push("");
  lines.push("    pcall(function()");
  lines.push("        for _, obj in ipairs(container:GetDescendants()) do");
  lines.push("            translateObject(obj)");
  lines.push("        end");
  lines.push("    end)");
  lines.push("end");
  lines.push("");
  lines.push("local function listenContainer(container)");
  lines.push("    if not container then");
  lines.push("        return");
  lines.push("    end");
  lines.push("");
  lines.push("    pcall(function()");
  lines.push("        container.DescendantAdded:Connect(function(obj)");
  lines.push("            task.defer(function()");
  lines.push("                task.wait(0.05)");
  lines.push("                translateObject(obj)");
  lines.push("            end)");
  lines.push("        end)");
  lines.push("    end)");
  lines.push("end");
  lines.push("");
  lines.push("local function setupFallbackTranslation()");
  lines.push("    local CoreGui = game:GetService(\"CoreGui\")");
  lines.push("    local Players = game:GetService(\"Players\")");
  lines.push("    local LocalPlayer = Players.LocalPlayer");
  lines.push("");
  lines.push("    scanContainer(CoreGui)");
  lines.push("    listenContainer(CoreGui)");
  lines.push("");
  lines.push("    if LocalPlayer then");
  lines.push("        local PlayerGui = LocalPlayer:FindFirstChild(\"PlayerGui\") or LocalPlayer:WaitForChild(\"PlayerGui\", 5)");
  lines.push("");
  lines.push("        if PlayerGui then");
  lines.push("            scanContainer(PlayerGui)");
  lines.push("            listenContainer(PlayerGui)");
  lines.push("        end");
  lines.push("    end");
  lines.push("");
  lines.push("    task.spawn(function()");
  lines.push(`        while task.wait(${scanInterval}) do`);
  lines.push("            scanContainer(CoreGui)");
  lines.push("");
  lines.push("            local player = Players.LocalPlayer");
  lines.push("            if player and player:FindFirstChild(\"PlayerGui\") then");
  lines.push("                scanContainer(player.PlayerGui)");
  lines.push("            end");
  lines.push("        end");
  lines.push("    end)");
  lines.push("end");
  lines.push("");
  lines.push("local function setupHookTranslation()");
  lines.push("    local mt = getrawmetatable(game)");
  lines.push("    local oldNewIndex = mt.__newindex");
  lines.push("");
  lines.push("    setreadonly(mt, false)");
  lines.push("");
  lines.push("    mt.__newindex = newcclosure(function(t, k, v)");
  lines.push("        if isTextObject(t) and k == \"Text\" and type(v) == \"string\" then");
  lines.push("            v = translateText(v)");
  lines.push("        end");
  lines.push("");
  lines.push("        return oldNewIndex(t, k, v)");
  lines.push("    end)");
  lines.push("");
  lines.push("    setreadonly(mt, true)");
  lines.push("end");
  lines.push("");
  lines.push("local function setupTranslationEngine()");

  if (useHook) {
    lines.push("    local success, err = pcall(function()");
    lines.push("        setupHookTranslation()");
    lines.push("    end)");
    lines.push("");
    lines.push("    if success then");
    lines.push("        print(\"翻译引擎：Hook 模式已启用\")");
    lines.push("    else");
    lines.push("        warn(\"Hook 模式失败，已切换普通扫描模式：\", err)");
    lines.push("        setupFallbackTranslation()");
    lines.push("    end");
  } else {
    lines.push("    setupFallbackTranslation()");
    lines.push("    print(\"翻译引擎：普通扫描模式已启用\")");
  }

  lines.push("end");
  lines.push("");
  lines.push("setupTranslationEngine()");

  if (rawUrl) {
    lines.push("");
    lines.push("local success, err = pcall(function()");
    lines.push(`    loadstring(game:HttpGet("${escapeLuaString(rawUrl)}"))()`);
    lines.push("end)");
    lines.push("");
    lines.push("if not success then");
    lines.push("    warn(\"远程脚本加载失败：\", err)");
    lines.push("end");
  } else {
    lines.push("");
    lines.push("-- 未填写远程脚本 Raw 链接。");
    lines.push("-- 如需加载外部脚本，请在生成器中填写链接后重新生成。");
  }

  return lines.join("\n");
}

function generateScript() {
  try {
    const code = buildLuaScript();
    els.output.value = code;
    els.scriptStatus.textContent = "已生成";
    els.scriptStatus.classList.remove("muted");
    saveState();
    showToast("Lua 脚本已生成。");
  } catch (error) {
    showToast(error.message);
  }
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.append(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast(successMessage);
  }
}

function copyCode() {
  const code = els.output.value.trim();
  if (!code) {
    showToast("请先生成脚本。");
    return;
  }
  copyText(code, "代码已复制。");
}

function downloadText(filename, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadLua() {
  const code = els.output.value.trim();
  if (!code) {
    showToast("请先生成脚本。");
    return;
  }
  downloadText("roblox-localizer.lua", code);
}

function exportJson() {
  const translations = getCleanTranslations();
  if (translations.length === 0) {
    showToast("没有可导出的完整词条。");
    return;
  }

  const data = translations.map((item) => ({
    英文原文: item.en,
    中文翻译: item.cn,
  }));
  downloadText("translations.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}

function normalizeImportedJson(data) {
  if (!Array.isArray(data)) {
    throw new Error("JSON 内容必须是数组。");
  }

  return data
    .map((item) => {
      if (Array.isArray(item)) {
        return { en: String(item[0] || ""), cn: String(item[1] || ""), selected: true };
      }

      if (item && typeof item === "object") {
        return {
          en: String(item.en || item.english || item["英文原文"] || item["英文"] || ""),
          cn: String(item.cn || item.chinese || item["中文翻译"] || item["中文"] || ""),
          selected: true,
        };
      }

      return { en: "", cn: "", selected: true };
    })
    .filter((item) => item.en.trim() && item.cn.trim());
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ""));
      const imported = normalizeImportedJson(data);

      if (imported.length === 0) {
        throw new Error("未找到有效词条。");
      }

      state.translations = imported;
      renderRows();
      saveState();
      showToast(`已导入 ${imported.length} 条词条。`);
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    }
  };
  reader.readAsText(file, "utf-8");
}

els.menuBtn.addEventListener("click", openMenu);
els.closeMenuBtn.addEventListener("click", closeMenu);
els.overlay.addEventListener("click", closeMenu);

els.navLinks.forEach((link) => {
  link.addEventListener("click", () => switchPage(link.dataset.page));
});

els.translatorProvider.addEventListener("change", () => {
  updateTranslatorProvider(els.translatorProvider.value);
  renderApiKeyFields(els.translatorProvider.value);
  saveState();
});

// 初始化时渲染 API Key 输入框

els.addRowBtn.addEventListener("click", () => addRow());

els.clearRowsBtn.addEventListener("click", async () => {
  const confirmed = await showDialog({
    kicker: "清空词条",
    title: "确定清空全部翻译词条？",
    message: "清空后当前页面里的英文原文和中文翻译都会移除。如果你还没导出 JSON，建议先备份再操作。",
    confirmText: "确认清空",
    cancelText: "先不清空",
  });

  if (!confirmed) return;
  state.translations = [{ en: "", cn: "", selected: true }];
  renderRows();
  saveState();
  showToast("词条已清空。");
});

els.importJsonBtn.addEventListener("click", () => els.jsonFileInput.click());
els.exportJsonBtn.addEventListener("click", exportJson);

els.jsonFileInput.addEventListener("change", () => {
  const file = els.jsonFileInput.files?.[0];
  if (file) importJsonFile(file);
  els.jsonFileInput.value = "";
});

els.generateBtn.addEventListener("click", generateScript);
els.copyBtn.addEventListener("click", copyCode);
els.downloadBtn.addEventListener("click", downloadLua);
els.autoTranslateBtn.addEventListener("click", autoTranslateRows);

els.copyExtractBtn.addEventListener("click", () => {
  copyText(els.extractCode.textContent.trim(), "提取 UI 文本脚本已复制。");
});

[els.hookEnabled, els.scanInterval, els.rawUrl].forEach((el) => {
  el.addEventListener("change", saveState);
  el.addEventListener("input", saveState);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

document.addEventListener("click", (event) => {
});

loadState();
updateTranslatorProvider(state.translatorProvider);
renderApiKeyFields(state.translatorProvider);
renderRows();
loadRandomBackground();
