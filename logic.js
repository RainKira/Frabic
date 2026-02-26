/**
 * 根据日期选择当日文案（同一日期所有人看到同一篇，每天轮换）
 */
function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 86400000;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear;
}

function getTodaysPost() {
  const index = getDayIndex() % FABRIC_POSTS.length;
  return FABRIC_POSTS[index];
}

/**
 * 格式化成小红书风格长文案（带换行、emoji、标签）
 */
function formatForXiaohongshu(post) {
  const lines = [];
  lines.push(post.title);
  lines.push("");
  lines.push(`📌 今日面料：${post.fabric}`);
  lines.push("");
  for (const p of post.points) {
    lines.push(`${p.emoji} ${p.title}`);
    lines.push(p.content);
    lines.push("");
  }
  lines.push(post.tags.join(" "));
  return lines.join("\n");
}

/**
 * 格式化成小红书「分段式」短文案（每段适合一屏）
 */
function formatForXiaohongshuShort(post) {
  const parts = [];
  parts.push(post.title + "\n");
  parts.push(`📌 ${post.fabric}\n`);
  for (const p of post.points) {
    parts.push(`${p.emoji} ${p.title}\n${p.content}\n`);
  }
  parts.push("\n" + post.tags.join(" "));
  return parts.join("\n");
}
