# 每日小红书面料文案

每天自动轮换一条「面料科普」类小红书文案，包含：不同布料的感觉、怎么挑选、怎么看成分、不同成分是怎么做成的。

## 功能

- **登录后使用**：系统为内部使用，需在登录页（`login.html`）用 Supabase 账号登录后，才能访问每日文案、客户喜好推荐、管理后台。
- **按日期轮换**：同一天所有人看到的都是同一条文案，第二天自动换下一条（共 10 条轮换）。
- **每条配图**：每条文案都配置了一张相关配图，页面会显示「今日配图」，可点击「保存配图」在新标签页打开后右键保存，发小红书时用这张图即可。
- **一键复制**：复制整段文案，直接粘贴到小红书发布。
- **昨天 / 明天**：可以查看「昨天」「明天」的文案内容。
- **预览全文**：展开可看到将要复制的完整纯文本。
- **今日灵感**：结合天气/节日，自动给出当天选题角度与标题模板（可一键复制）。
- **云端同步**：配置 Supabase 后，文案从云端读取；在管理后台可随时新增/编辑，任意设备同步。
- **布料试穿**：在「布料试穿」页上传一张布料图 + 一张模特全身照，通过 NANO BANANA（Gemini 图像模型）生成「布料穿在模特身上」的试穿效果图（需部署到 Vercel 并配置 `GEMINI_API_KEY`）。

## 使用方法

1. 打开 **登录页** `login.html`（或访问站点根路径 `/`，会显示登录页）。
2. 使用已创建的账号登录后，会进入「每日文案」页；可从顶部链接进入「客户喜好推荐」「管理后台」。
3. 在每日文案页点击 **「一键复制文案」** 后到小红书粘贴发布；需要看其他日期时，点「昨天」或「明天」切换。
4. 使用完毕后可点击顶部「登出」退出。

> 建议用 Live Server / 本地服务器打开（`http://localhost`），不要用 `file://` 直接双击打开，以免浏览器因 CORS/Origin 导致云端请求失败。

## 文件说明

| 文件 | 说明 |
|------|------|
| `login.html` | 登录/注册页（首页入口） |
| `index.html` | 每日文案页（需登录） |
| `admin.html` | 管理后台（登录后可云端编辑/新增） |
| `preference.html` | 客户喜好推荐（需登录） |
| `tryon.html` | 布料试穿（布料+模特→试穿效果图） |
| `api/tryon.js` | 布料试穿接口（调用 Gemini，需 `GEMINI_API_KEY`） |
| `data.js` | 所有面料文案内容（可自行增改） |
| `logic.js` | 按日期选文案、格式化为小红书风格 |
| `cloud.js` | 云端加载（Supabase）与本地回退 |
| `inspiration.js` | 天气/节日灵感生成 |
| `config.example.js` | 云端配置示例（复制为 `config.js`） |
| `supabase.sql` | Supabase 建表与权限策略 |

## 自定义内容

在 `data.js` 的 `FABRIC_POSTS` 数组里：

- 增加新对象即可增加「一天一条」的选题（会参与轮换）。
- 每条包含：`title`、`fabric`、**`imageUrl`**（配图地址）、**`imageAlt`**（配图说明，可选）、`points`（触感 / 挑选 / 成分 / 制作）、`tags`（话题标签）。
- **配图**：`imageUrl` 填图片链接（如 Unsplash、图床或本地路径）。发小红书时用该条对应的配图即可；可随时改成你自己的图片链接。

改完后刷新页面即可生效。

## 云端同步（Supabase）

### 1) 创建数据库与权限

1. 注册/登录 Supabase，新建项目。
2. 打开 SQL Editor，执行本项目的 `supabase.sql`。

### 2) 如何建立账号（两种方式）

**方式一：在 Supabase 后台手动添加用户（推荐，可控）**

1. 登录 [Supabase](https://app.supabase.com)，进入你的项目。
2. 左侧菜单点击 **Authentication（认证）** → **Users（用户）**。
3. 点击 **Add user** → **Create new user**。
4. 填写 **Email** 和 **Password**，点击创建。
5. 该邮箱/密码即可在 `login.html` 登录页使用。

**方式二：开启注册，让用户自己注册**

1. 在 Supabase 项目里进入 **Authentication** → **Providers**。
2. 找到 **Email**，确保 **Enable Email provider** 已开启。
3. 若希望新用户**无需邮箱验证**即可登录：在 **Auth** → **Settings** 里可关闭 “Confirm email”（需邮件验证），这样注册后可直接登录。
4. 用户打开 `login.html`，切到「注册」标签，填写邮箱和密码即可自助注册；注册后到「登录」标签登录。

### 3) 配置前端

1. 把 `config.example.js` 复制一份为 `config.js`。
2. 在 Supabase 控制台 Project Settings -> API 中找到：
   - `Project URL` → 填到 `supabaseUrl`
   - `anon public` → 填到 `supabaseAnonKey`

完成后：

- 打开 `admin.html` 登录并新增/编辑文案
- 打开 `index.html` 将自动从云端拉取最新文案（不再依赖本地 `data.js`）

### 快速导入（可选）

如果你想把本项目自带的 10 条示例文案一次性导入云端：

- 进入 `admin.html` 登录后，点击「导入本地示例(10条)」
- 仅当云端表为空时才会导入（避免重复）

## 布料试穿（NANO BANANA）

「布料试穿」页（`tryon.html`）需要后端接口才能生成图片：

1. **部署到 Vercel**（或其它支持 Node 的托管），确保 `api/tryon.js` 作为 Serverless Function 被部署。
2. 在 Vercel 项目 **Settings → Environment Variables** 中新增：
   - 名称：`GEMINI_API_KEY`
   - 值：在 [Google AI Studio](https://aistudio.google.com/apikey) 申请的 Gemini API Key
3. 重新部署后，打开「布料试穿」页，上传布料图与模特图，点击「生成试穿效果」即可。

若 Gemini 返回「模型不存在」等错误，可在 `api/tryon.js` 里把 `GEMINI_MODEL` 改为当前可用的图像模型 ID（如 `gemini-2.0-flash-preview-image-generation`），以官方文档为准。

## 技术说明

- 每日文案、客户喜好、管理后台为纯前端，无需服务器（仅需 Supabase）。
- 布料试穿依赖 Vercel Serverless 接口与 Gemini API。
- 使用「一年中的第几天」对文案数量取模，实现按日轮换；同一天多次打开看到的是同一条。
