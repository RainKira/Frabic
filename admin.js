function $(id) {
  return document.getElementById(id);
}

function showToast(text) {
  const t = $("toast");
  t.textContent = text || "完成";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function parseTags(raw) {
  return (raw || "")
    .split(/[\s,，]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pointsFromForm() {
  const points = [];
  for (let i = 0; i < 4; i++) {
    const emoji = $(`p${i}e`).value.trim();
    const title = $(`p${i}t`).value.trim();
    const content = $(`p${i}c`).value.trim();
    if (!title && !content) continue;
    points.push({ emoji, title, content });
  }
  return points;
}

function fillPoints(points) {
  const safe = Array.isArray(points) ? points : [];
  for (let i = 0; i < 4; i++) {
    const p = safe[i] || { emoji: "", title: "", content: "" };
    $(`p${i}e`).value = p.emoji || $(`p${i}e`).value || "";
    $(`p${i}t`).value = p.title || "";
    $(`p${i}c`).value = p.content || "";
  }
}

function clearEditor() {
  $("editorTitle").textContent = "编辑/新增";
  $("postId").value = "";
  $("sortOrder").value = "0";
  $("enabled").value = "true";
  $("title").value = "";
  $("fabric").value = "";
  $("imageUrl").value = "";
  $("imageAlt").value = "";
  $("tags").value = "";
  for (let i = 0; i < 4; i++) {
    $(`p${i}c`).value = "";
    if (i > 0) {
      // 保留默认 emoji/title，用户可自改
      $(`p${i}t`).value = $(`p${i}t`).value || "";
    }
  }
}

function setEditor(post) {
  $("editorTitle").textContent = "编辑：当前选中";
  $("postId").value = post.id || "";
  $("sortOrder").value = String(post.sortOrder ?? 0);
  $("enabled").value = String(Boolean(post.enabled));
  $("title").value = post.title || "";
  $("fabric").value = post.fabric || "";
  $("imageUrl").value = post.imageUrl || "";
  $("imageAlt").value = post.imageAlt || "";
  $("tags").value = (post.tags || []).join(" ");
  fillPoints(post.points);
}

function renderList(posts) {
  const list = $("postList");
  if (!posts.length) {
    list.innerHTML = "<div class=\"note\">暂无数据。点击「新增一条」开始。</div>";
    return;
  }

  list.innerHTML = posts
    .map((p) => {
      const pill = p.enabled ? "<span class=\"pill on\">启用</span>" : "<span class=\"pill\">停用</span>";
      const fabric = (p.fabric || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const title = (p.title || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `
        <div class="item">
          <div class="meta">
            <div class="title">${title}${pill}</div>
            <div class="desc">${fabric}</div>
          </div>
          <div class="actions" style="margin-top:0;">
            <button class="btn btn-secondary" type="button" data-act="edit" data-id="${p.id}">编辑</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function main() {
  const cfg = window.__cloud?.getAppConfig?.() || {};
  const hasCfg = window.__cloud?.hasSupabaseConfig?.(cfg);
  const setupCard = $("setupCard");
  const appGrid = $("appGrid");

  if (!hasCfg) {
    setupCard.classList.remove("hidden");
    appGrid.classList.add("hidden");
    return;
  }

  setupCard.classList.add("hidden");
  await window.__cloud.requireAuth();

  appGrid.classList.remove("hidden");
  const client = window.__cloud.createSupabaseClient(cfg);

  let cachedPosts = [];

  async function loadPosts() {
    const posts = await window.__cloud.fetchPostsFromSupabase(true);
    cachedPosts = posts;
    renderList(posts);
  }

  async function importFromLocalIfEmpty() {
    const local = Array.isArray(window.FABRIC_POSTS) ? window.FABRIC_POSTS : [];
    if (!local.length) {
      showToast("本地无数据");
      return;
    }

    const { count, error: countErr } = await client
      .from("fabric_posts")
      .select("id", { count: "exact", head: true });
    if (countErr) throw countErr;
    if ((count || 0) > 0) {
      showToast("云端已有数据，已跳过");
      return;
    }

    const payloads = local.map((p, idx) => ({
      sort_order: idx,
      enabled: true,
      title: p.title,
      fabric: p.fabric,
      image_url: p.imageUrl || null,
      image_alt: p.imageAlt || null,
      points: Array.isArray(p.points) ? p.points : [],
      tags: Array.isArray(p.tags) ? p.tags : []
    }));

    const { error } = await client.from("fabric_posts").insert(payloads);
    if (error) throw error;
    await loadPosts();
    showToast("已导入到云端");
  }

  $("refreshBtn").onclick = function () {
    loadPosts().catch((e) => {
      console.warn(e);
      showToast("刷新失败");
    });
  };

  $("newBtn").onclick = function () {
    clearEditor();
    showToast("开始新增");
  };

  $("importBtn").onclick = function () {
    importFromLocalIfEmpty().catch((e) => {
      console.warn(e);
      showToast("导入失败");
    });
  };

  $("logoutBtn").onclick = function () {
    window.__cloud.signOut();
  };
  const headerLogout = $("headerLogout");
  if (headerLogout) headerLogout.onclick = function (e) { e.preventDefault(); window.__cloud.signOut(); };

  $("resetBtn").onclick = function () {
    clearEditor();
    showToast("已清空");
  };

  $("postList").onclick = function (e) {
    const btn = e.target?.closest?.("button[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");
    if (act === "edit") {
      const hit = cachedPosts.find((x) => x.id === id);
      if (hit) setEditor(hit);
    }
  };

  $("editorForm").onsubmit = async function (e) {
    e.preventDefault();

    const id = $("postId").value.trim();
    const sortOrder = Number($("sortOrder").value || 0);
    const enabled = $("enabled").value === "true";
    const title = $("title").value.trim();
    const fabric = $("fabric").value.trim();
    const imageUrl = $("imageUrl").value.trim();
    const imageAlt = $("imageAlt").value.trim();
    const points = pointsFromForm();
    const tags = parseTags($("tags").value);

    if (!title || !fabric) {
      showToast("标题/面料必填");
      return;
    }
    if (!points.length) {
      showToast("请至少写一段要点");
      return;
    }

    const payload = {
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      enabled,
      title,
      fabric,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      points,
      tags
    };
    if (id) payload.id = id;

    try {
      const { error } = await client.from("fabric_posts").upsert(payload);
      if (error) throw error;
      await loadPosts();
      showToast("已保存");
    } catch (err) {
      console.warn(err);
      showToast("保存失败");
    }
  };

  await loadPosts();
}

main().catch((e) => console.warn(e));

