// 访问统计接口：/api/stats?action=visit（记录访问）或 /api/stats?action=count（获取计数）
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "count";

  const kv = env.SITE_STATS;
  if (!kv) {
    // KV 未绑定，返回默认值
    return new Response(
      JSON.stringify({ total: 0, online: 0, kv: false }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  const now = Date.now();

  if (action === "visit") {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // 更新当前访客活跃时间（5 分钟自动过期）
    await kv.put(`visitor:${ip}`, String(now), { expirationTtl: 300 });

    // 每个独立 IP 每天只计一次（用当天日期去重）
    const today = new Date().toISOString().slice(0, 10);
    const dailyKey = `daily:${today}:${ip}`;
    const alreadyVisited = await kv.get(dailyKey);
    if (!alreadyVisited) {
      // 新访客：总访问量 +1
      const total = parseInt(await kv.get("total_visits")) || 0;
      await kv.put("total_visits", String(total + 1));
      // 标记今天已访问
      await kv.put(dailyKey, "1", { expirationTtl: 86400 });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // action === "count"：获取计数
  try {
    const total = parseInt(await kv.get("total_visits")) || 0;

    // 通过 list visitor: 前缀来统计在线人数
    let online = 0;
    let cursor = undefined;
    do {
      const list = await kv.list({ prefix: "visitor:", cursor });
      online += list.keys.length;
      cursor = list.list_complete ? undefined : list.cursor;
      if (online >= 100) break; // 限制最多扫描 100 个 key
    } while (cursor);

    return new Response(
      JSON.stringify({ total, online, kv: true }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ total: 0, online: 0, error: true }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
