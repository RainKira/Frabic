// 复制本文件为 config.js 并填入你的 Supabase 配置
// 注意：建议用 Live Server/本地服务器打开（http://localhost），不要用 file:// 直接双击打开，
// 否则某些浏览器可能因为 CORS/Origin= null 导致请求被拦截。
window.APP_CONFIG = {
  // Supabase 项目地址与 anon key（在 Supabase 控制台 Project Settings -> API）
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // 节日国家代码（Nager.Date）。中国为 CN
  countryCode: "CN",

  // 天气默认定位（用户不授权定位时使用）
  defaultLocation: {
    name: "上海",
    lat: 31.2304,
    lon: 121.4737
  }
};

