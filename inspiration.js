function formatWeatherHint(tempC, weatherCode, precipitation) {
  const hints = [];

  if (typeof tempC === "number") {
    if (tempC >= 28) hints.push("天气偏热，选轻薄透气：亚麻/棉/真丝更舒服");
    else if (tempC >= 18) hints.push("温度舒适，日常通勤：棉/莫代尔/莱赛尔都很友好");
    else if (tempC >= 8) hints.push("有点凉，叠穿更稳：棉+针织，或轻羊毛");
    else hints.push("偏冷，保暖优先：羊毛/羊绒更合适");
  }

  const rainLike = typeof precipitation === "number" ? precipitation > 0 : false;
  if (rainLike || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    hints.push("可能有雨，外层可考虑锦纶/涤纶，抗风耐磨、好打理");
  }

  return hints;
}

function getSeasonHint() {
  const m = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(m)) return "冬季角度：保暖、静电、起球护理";
  if ([3, 4, 5].includes(m)) return "春季角度：叠穿、垂感、抗皱";
  if ([6, 7, 8].includes(m)) return "夏季角度：透气、吸汗、清凉触感";
  return "秋季角度：质感、挺括、层次穿搭";
}

async function fetchWeather(lat, lon) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    "&current=temperature_2m,precipitation,weather_code" +
    "&timezone=auto";

  const res = await fetch(url);
  if (!res.ok) throw new Error("天气接口请求失败");
  const json = await res.json();
  return {
    tempC: json?.current?.temperature_2m,
    precipitation: json?.current?.precipitation,
    weatherCode: json?.current?.weather_code
  };
}

async function fetchHoliday(countryCode) {
  const now = new Date();
  const year = now.getFullYear();
  const yyyy = String(year);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;

  const url = `https://date.nager.at/api/v3/publicholidays/${year}/${encodeURIComponent(countryCode || "CN")}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("节日接口请求失败");
  const list = await res.json();
  const hit = (Array.isArray(list) ? list : []).find((x) => x?.date === today);
  if (!hit) return null;
  return {
    name: hit.localName || hit.name || "节日",
    date: hit.date
  };
}

async function getLocationPreferBrowser(cfg) {
  const fallback = cfg?.defaultLocation || { name: "上海", lat: 31.2304, lon: 121.4737 };

  if (!navigator.geolocation) return { source: "fallback", ...fallback };

  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          source: "browser",
          name: fallback.name,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      },
      () => resolve({ source: "fallback", ...fallback }),
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 3600_000 }
    );
  });
}

function buildInspirationText({ locationName, holiday, weather, hints }) {
  const lines = [];
  lines.push("今日选题灵感（可直接发小红书）");
  lines.push("");
  if (locationName) lines.push(`📍 定位：${locationName}`);
  if (holiday?.name) lines.push(`🎉 节日：${holiday.name}`);
  if (typeof weather?.tempC === "number") lines.push(`🌡️ 温度：${weather.tempC}°C`);
  if (hints?.length) {
    lines.push("");
    lines.push("✅ 推荐角度：");
    for (const h of hints) lines.push(`- ${h}`);
  }
  lines.push("");
  lines.push("🧩 可用标题模板：");
  lines.push("1) 「这件衣服为什么穿着舒服？关键看这一项成分」");
  lines.push("2) 「同样是XX，手感差很多：教你3秒看懂吊牌」");
  lines.push("3) 「今天这种天气，穿XX面料真的更省心」");
  lines.push("");
  lines.push("#面料知识 #服装成分 #穿搭干货 #买衣服必看");
  return lines.join("\n");
}

async function loadDailyInspiration() {
  const cfg = window.__cloud?.getAppConfig?.() || {};
  const location = await getLocationPreferBrowser(cfg);
  const countryCode = cfg?.countryCode || "CN";

  const [holiday, weather] = await Promise.allSettled([
    fetchHoliday(countryCode),
    fetchWeather(location.lat, location.lon)
  ]);

  const holidayVal = holiday.status === "fulfilled" ? holiday.value : null;
  const weatherVal = weather.status === "fulfilled" ? weather.value : {};

  const hints = [
    ...formatWeatherHint(weatherVal?.tempC, weatherVal?.weatherCode, weatherVal?.precipitation),
    getSeasonHint()
  ];

  return {
    location,
    holiday: holidayVal,
    weather: weatherVal,
    hints,
    text: buildInspirationText({
      locationName: location.name,
      holiday: holidayVal,
      weather: weatherVal,
      hints
    })
  };
}

window.__inspiration = {
  loadDailyInspiration
};

