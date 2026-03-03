/* global supabase */

function getAppConfig() {
  return (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};
}

function hasSupabaseConfig(cfg) {
  return Boolean(cfg && cfg.supabaseUrl && cfg.supabaseAnonKey);
}

function createSupabaseClient(cfg) {
  // supabase-js v2 在浏览器会挂到 window.supabase
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase SDK 未加载。请检查 index.html 是否已引入 supabase-js。");
  }
  return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
}

function mapDbRowToPost(row) {
  return {
    id: row.id,
    sortOrder: row.sort_order ?? 0,
    enabled: row.enabled ?? true,
    title: row.title,
    fabric: row.fabric,
    imageUrl: row.image_url || "",
    imageAlt: row.image_alt || "",
    points: Array.isArray(row.points) ? row.points : [],
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

async function fetchPostsFromSupabase(includeDisabled) {
  const cfg = getAppConfig();
  if (!hasSupabaseConfig(cfg)) return null;

  const client = createSupabaseClient(cfg);

  let query = client
    .from("fabric_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (!includeDisabled) {
    query = query.eq("enabled", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapDbRowToPost);
}

async function loadPostsPreferCloud() {
  try {
    const cloud = await fetchPostsFromSupabase(false);
    if (cloud && cloud.length > 0) return cloud;
  } catch (e) {
    console.warn("云端拉取失败，将回退本地 data.js。", e);
  }

  // fallback：本地 data.js
  if (typeof window !== "undefined" && Array.isArray(window.FABRIC_POSTS)) {
    return window.FABRIC_POSTS;
  }
  return [];
}

/** 获取当前登录会话（未登录返回 null） */
async function getSession() {
  const cfg = getAppConfig();
  if (!hasSupabaseConfig(cfg)) return null;
  const client = createSupabaseClient(cfg);
  const { data } = await client.auth.getSession();
  return data?.session ?? null;
}

/** 未登录则跳转到登录页，登录则返回 session */
async function requireAuth() {
  const session = await getSession();
  if (session) return session;
  const redirect = "login.html?redirect=" + encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(redirect);
  return null;
}

/** 登出并跳转登录页 */
async function signOut() {
  const cfg = getAppConfig();
  if (hasSupabaseConfig(cfg)) {
    const client = createSupabaseClient(cfg);
    await client.auth.signOut();
  }
  window.location.replace("login.html");
}

// 暴露给页面使用
window.__cloud = {
  getAppConfig,
  hasSupabaseConfig,
  createSupabaseClient,
  fetchPostsFromSupabase,
  loadPostsPreferCloud,
  getSession,
  requireAuth,
  signOut
};

