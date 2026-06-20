const STORAGE_KEY = "roblox-localizer-v2";
const OLD_STORAGE_KEY = "roblox-localizer-v1";

const state = {
  translations: [
    { en: "", cn: "" },
  ],
  translatorProvider: "youdao",
};

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
  scanSelect: document.querySelector(".custom-select"),
  scanSelectBtn: document.querySelector("#scanSelectBtn"),
  scanSelectText: document.querySelector("#scanSelectText"),
  scanSelectPanel: document.querySelector("#scanSelectPanel"),
  scanSelectOptions: document.querySelectorAll("#scanSelectPanel button"),
  rawUrl: document.querySelector("#rawUrl"),
  translationBody: document.querySelector("#translationBody"),
  entryCount: document.querySelector("#entryCount"),
  addRowBtn: document.querySelector("#addRowBtn"),
  clearRowsBtn: document.querySelector("#clearRowsBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  autoTranslateBtn: document.querySelector("#autoTranslateBtn"),
  translatorProvider: document.querySelector("#translatorProvider"),
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
  dialogConfirmBtn: document.querySelector("#dialogConfirmBtn"),
  toast: document.querySelector("#toast"),
  toastText: document.querySelector("#toastText"),
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

function updateScanSelect(value = els.scanInterval.value) {
  const option = [...els.scanInterval.options].find((item) => item.value === String(value));
  const label = option?.textContent || "3 秒（推荐）";

  els.scanInterval.value = String(value);
  els.scanSelectText.textContent = label;
  els.scanSelectOptions.forEach((button) => {
    button.classList.toggle("selected", button.dataset.value === String(value));
  });
}

function closeScanSelect() {
  els.scanSelect.classList.remove("open");
  els.scanSelectBtn.setAttribute("aria-expanded", "false");
}

function toggleScanSelect() {
  const willOpen = !els.scanSelect.classList.contains("open");
  els.scanSelect.classList.toggle("open", willOpen);
  els.scanSelectBtn.setAttribute("aria-expanded", String(willOpen));
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

function saveState() {
  const payload = {
    hookEnabled: els.hookEnabled.checked,
    scanInterval: els.scanInterval.value,
    rawUrl: els.rawUrl.value.trim(),
    translations: state.translations,
    translatorProvider: state.translatorProvider,
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
    updateTranslatorProvider(payload.translatorProvider || "youdao");

    if (Array.isArray(payload.translations)) {
      state.translations = payload.translations
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          en: String(item.en || ""),
          cn: String(item.cn || ""),
        }));

      const isOldExampleOnly =
        state.translations.length === 2 &&
        state.translations[0].en === "Play" &&
        state.translations[0].cn === "开始" &&
        state.translations[1].en === "Settings" &&
        state.translations[1].cn === "设置";

      if (isOldExampleOnly) {
        state.translations = [{ en: "", cn: "" }];
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
    state.translations.push({ en: "", cn: "" });
  }

  state.translations.forEach((item, index) => {
    const tr = document.createElement("tr");

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
    tr.append(enTd, cnTd, actionTd);
    els.translationBody.append(tr);
  });

  updateCount();
}

function addRow(en = "", cn = "") {
  state.translations.push({ en, cn });
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
    }))
    .filter((item) => item.en);
}

async function translateWithGoogle(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("谷歌翻译接口请求失败");
  const data = await response.json();
  const translated = data?.[0]?.map((part) => part?.[0] || "").join("").trim();
  if (!translated) throw new Error("谷歌翻译没有返回有效结果");
  return translated;
}

async function translateWithYoudao(text) {
  const url = `https://fanyi.youdao.com/translate?doctype=json&type=AUTO&i=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("有道翻译接口请求失败");
  const data = await response.json();
  const translated = data?.translateResult?.flat?.()?.map((item) => item?.tgt || "").join("").trim();
  if (!translated) throw new Error("有道翻译没有返回有效结果");
  return translated;
}

async function translateWithBing(text) {
  const response = await fetch("https://api-edge.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ Text: text }]),
  });
  if (!response.ok) throw new Error("必应翻译接口请求失败");
  const data = await response.json();
  const translated = data?.[0]?.translations?.[0]?.text?.trim();
  if (!translated) throw new Error("必应翻译没有返回有效结果");
  return translated;
}

async function translateWithFallback(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("备用翻译接口请求失败");
  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim();
  if (!translated || translated.toLowerCase() === text.toLowerCase()) {
    throw new Error("备用翻译没有返回有效结果");
  }
  return translated;
}

async function translateTextByProvider(text) {
  const primaryTasks = {
    youdao: translateWithYoudao,
    bing: translateWithBing,
    google: translateWithGoogle,
  };

  const primary = primaryTasks[state.translatorProvider] || translateWithYoudao;

  try {
    return await primary(text);
  } catch {
    return translateWithFallback(text);
  }
}

async function autoTranslateRows() {
  const rows = getRowsToTranslate();
  if (rows.length === 0) {
    showToast("请先填写需要翻译的英文原文。");
    return;
  }

  const hasExistingChinese = rows.some((row) => row.cn);
  if (hasExistingChinese) {
    const confirmed = await showDialog({
      kicker: "自动翻译",
      title: "是否覆盖已有中文翻译？",
      message: "检测到部分词条已经填写了中文。继续自动翻译会用接口返回结果覆盖这些中文内容。",
      confirmText: "覆盖并翻译",
      cancelText: "取消",
    });

    if (!confirmed) return;
  }

  const providerLabel = {
    youdao: "有道翻译",
    bing: "必应翻译",
    google: "谷歌翻译",
  }[state.translatorProvider];

  els.autoTranslateBtn.disabled = true;
  els.autoTranslateBtn.textContent = "翻译中...";

  let successCount = 0;
  try {
    for (const row of rows) {
      const translated = await translateTextByProvider(row.en);
      state.translations[row.index].cn = translated;
      successCount += 1;
      renderRows();
      saveState();
    }

    showToast(`${providerLabel}翻译完成，已处理 ${successCount} 条。`);
  } catch (error) {
    const extra = state.translatorProvider === "google" ? "谷歌翻译可能需要 VPN。" : "可尝试切换其它接口。";
    showToast(`${providerLabel}翻译失败：${error.message}。${extra}`);
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
        return { en: String(item[0] || ""), cn: String(item[1] || "") };
      }

      if (item && typeof item === "object") {
        return {
          en: String(item.en || item.english || item["英文原文"] || item["英文"] || ""),
          cn: String(item.cn || item.chinese || item["中文翻译"] || item["中文"] || ""),
        };
      }

      return { en: "", cn: "" };
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

els.scanSelectBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleScanSelect();
});

els.scanSelectOptions.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    updateScanSelect(button.dataset.value);
    saveState();
    closeScanSelect();
  });
});

els.translatorProvider.addEventListener("change", () => {
  updateTranslatorProvider(els.translatorProvider.value);
  saveState();
});

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
  state.translations = [{ en: "", cn: "" }];
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
    closeScanSelect();
  }

  if (event.key === "Escape") {
    closeMenu();
  }
});

document.addEventListener("click", (event) => {
  if (!els.scanSelect.contains(event.target)) {
    closeScanSelect();
  }
});

loadState();
updateScanSelect();
updateTranslatorProvider(state.translatorProvider);
renderRows();
loadRandomBackground();
