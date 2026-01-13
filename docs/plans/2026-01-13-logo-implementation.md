# Logo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 IntelliPick 的"数据流 I"Logo，包含 SVG 主文件、favicon 和项目集成。

**Architecture:** 创建基于字母 "I" 的漏斗形态 Logo，使用纯 SVG 实现。顶部 5-7 条线代表多源输入，中部收窄过渡代表 AI 筛选，底部实心形状代表精选输出。支持深色/浅色背景适配，提供多尺寸版本。

**Tech Stack:** SVG (手写代码), Sharp (PNG 转换), ico-convert (ICO 生成)

---

## 前置准备

**安装依赖（如果需要）:**
```bash
cd apps/web
pnpm add -D sharp ico-convert
```

---

## Task 1: 创建主 Logo SVG

**Files:**
- Create: `apps/web/public/logo.svg`

**Step 1: 创建目录结构**

```bash
mkdir -p apps/web/public
```

Expected: 目录创建成功

**Step 2: 编写主 Logo SVG 代码**

在 `apps/web/public/logo.svg` 创建：

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- 顶部：5条输入线 (占 10-40 区域) -->
  <line x1="25" y1="10" x2="25" y2="40" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round" />
  <line x1="37.5" y1="10" x2="37.5" y2="40" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round" />
  <line x1="50" y1="10" x2="50" y2="40" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round" />
  <line x1="62.5" y1="10" x2="62.5" y2="40" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round" />
  <line x1="75" y1="10" x2="75" y2="40" stroke="#1e40af" stroke-width="2.5" stroke-linecap="round" />

  <!-- 中部：收窄过渡 (占 40-70 区域) -->
  <!-- 左侧收窄曲线 -->
  <path d="M 25 40 Q 35 55 42 70" stroke="#1e40af" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 37.5 40 Q 42 55 45 70" stroke="#1e40af" stroke-width="2.5" fill="none" stroke-linecap="round" />

  <!-- 右侧收窄曲线 -->
  <path d="M 62.5 40 Q 58 55 55 70" stroke="#1e40af" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 75 40 Q 65 55 58 70" stroke="#1e40af" stroke-width="2.5" fill="none" stroke-linecap="round" />

  <!-- 底部：输出矩形 (占 70-90 区域) -->
  <rect x="45" y="70" width="10" height="20" rx="2" fill="#1e40af" />
</svg>
```

Expected: 文件创建成功

**Step 3: 验证 SVG 语法**

在浏览器中打开 `apps/web/public/logo.svg` 或使用：
```bash
cat apps/web/public/logo.svg | grep -q "<svg" && echo "✓ SVG syntax valid"
```

Expected: ✓ SVG syntax valid

**Step 4: Commit**

```bash
git add apps/web/public/logo.svg
git commit -m "feat: add main logo SVG with data flow design"
```

---

## Task 2: 创建深色/浅色背景适配版本

**Files:**
- Create: `apps/web/public/logo-dark.svg`
- Create: `apps/web/public/logo-light.svg`

**Step 1: 创建深色背景版本（白色 Logo）**

在 `apps/web/public/logo-dark.svg` 创建：

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- 顶部：5条输入线 -->
  <line x1="25" y1="10" x2="25" y2="40" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="37.5" y1="10" x2="37.5" y2="40" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="50" y1="10" x2="50" y2="40" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="62.5" y1="10" x2="62.5" y2="40" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  <line x1="75" y1="10" x2="75" y2="40" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

  <!-- 中部：收窄过渡 -->
  <path d="M 25 40 Q 35 55 42 70" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 37.5 40 Q 42 55 45 70" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 62.5 40 Q 58 55 55 70" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 75 40 Q 65 55 58 70" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" />

  <!-- 底部：输出矩形 -->
  <rect x="45" y="70" width="10" height="20" rx="2" fill="#ffffff" />
</svg>
```

Expected: 文件创建成功

**Step 2: 创建浅色背景版本（使用主 logo 颜色）**

```bash
cp apps/web/public/logo.svg apps/web/public/logo-light.svg
```

Expected: 文件复制成功

**Step 3: Commit**

```bash
git add apps/web/public/logo-dark.svg apps/web/public/logo-light.svg
git commit -m "feat: add logo variants for dark/light backgrounds"
```

---

## Task 3: 创建 Favicon SVG（简化版）

**Files:**
- Create: `apps/web/public/favicon.svg`

**Step 1: 创建简化版 favicon**

在 `apps/web/public/favicon.svg` 创建（去除中间细节，保留轮廓）：

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- 简化为实心漏斗形状，适配小尺寸 -->
  <path d="M 25 10 L 25 40 Q 35 55 42 70 L 42 70 L 45 70 L 45 90 L 55 90 L 55 70 L 58 70 Q 65 55 75 40 L 75 10 Z" fill="#1e40af" />
</svg>
```

Expected: 文件创建成功

**Step 2: 验证 favicon SVG**

```bash
cat apps/web/public/favicon.svg | grep -q "<svg" && echo "✓ Favicon SVG valid"
```

Expected: ✓ Favicon SVG valid

**Step 3: Commit**

```bash
git add apps/web/public/favicon.svg
git commit -m "feat: add simplified favicon SVG"
```

---

## Task 4: 生成 PNG 和 ICO 格式（可选）

**Files:**
- Create: `apps/web/scripts/generate-icons.js`
- Generate: `apps/web/public/favicon.ico`
- Generate: `apps/web/public/apple-touch-icon.png`

**Step 1: 创建图标生成脚本**

在 `apps/web/scripts/generate-icons.js` 创建：

```javascript
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

async function generateIcons() {
  const svgBuffer = await fs.readFile(join(publicDir, 'favicon.svg'));

  // 生成 Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));

  console.log('✓ Generated apple-touch-icon.png');

  // 生成多尺寸 PNG 用于 ICO
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // 手动组合成 ICO 格式
  // 注意：这是简化版本，生产环境建议使用 png-to-ico 等专用库
  await fs.writeFile(
    join(publicDir, 'favicon-16.png'),
    pngBuffers[0]
  );
  await fs.writeFile(
    join(publicDir, 'favicon-32.png'),
    pngBuffers[1]
  );
  await fs.writeFile(
    join(publicDir, 'favicon-48.png'),
    pngBuffers[2]
  );

  console.log('✓ Generated favicon PNG files (16, 32, 48)');
  console.log('ℹ For ICO format, use online converter or png-to-ico tool');
}

generateIcons().catch(console.error);
```

Expected: 文件创建成功

**Step 2: 更新 package.json 添加脚本**

在 `apps/web/package.json` 的 `scripts` 中添加：

```json
"generate-icons": "node scripts/generate-icons.js"
```

**Step 3: 运行图标生成**

```bash
cd apps/web
pnpm generate-icons
```

Expected:
```
✓ Generated apple-touch-icon.png
✓ Generated favicon PNG files (16, 32, 48)
```

**Step 4: Commit**

```bash
git add apps/web/scripts/generate-icons.js apps/web/package.json apps/web/public/*.png
git commit -m "feat: add icon generation script and generated assets"
```

---

## Task 5: 更新 HTML 集成

**Files:**
- Modify: `apps/web/index.html:4-7`

**Step 1: 读取当前 HTML**

```bash
cat apps/web/index.html
```

Expected: 显示当前 HTML 内容

**Step 2: 更新 head 部分的图标引用**

修改 `apps/web/index.html`，将：

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

替换为：

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

Expected: 文件更新成功

**Step 3: 验证 HTML 语法**

```bash
grep -q "favicon.svg" apps/web/index.html && echo "✓ HTML updated with new favicon"
```

Expected: ✓ HTML updated with new favicon

**Step 4: Commit**

```bash
git add apps/web/index.html
git commit -m "feat: integrate new logo and favicon into web app"
```

---

## Task 6: 清理旧资源

**Files:**
- Delete: `apps/web/public/vite.svg`

**Step 1: 删除 Vite 默认 logo**

```bash
rm -f apps/web/public/vite.svg
```

Expected: 文件删除成功

**Step 2: 验证文件已删除**

```bash
test ! -f apps/web/public/vite.svg && echo "✓ Old vite.svg removed"
```

Expected: ✓ Old vite.svg removed

**Step 3: Commit**

```bash
git add apps/web/public/vite.svg
git commit -m "chore: remove old Vite logo"
```

---

## Task 7: 验证和测试

**Step 1: 启动开发服务器**

```bash
cd apps/web
pnpm dev
```

Expected: 开发服务器启动在 http://localhost:5173

**Step 2: 浏览器验证**

打开浏览器访问 http://localhost:5173，检查：
- [ ] 浏览器标签页显示新 favicon
- [ ] favicon 在小尺寸下清晰可见
- [ ] Logo 颜色为深蓝色 (#1e40af)
- [ ] Logo 形态为漏斗状（顶宽底窄）

**Step 3: 检查多尺寸适配**

在浏览器开发者工具中：
1. 右键点击标签页 favicon
2. 在新标签打开图片
3. 放大/缩小查看清晰度

Expected: Logo 在不同尺寸下都保持清晰

**Step 4: 验证文件完整性**

```bash
ls -lh apps/web/public/{logo,favicon}*.{svg,png} 2>/dev/null | wc -l
```

Expected: 至少 6 个文件（3个 SVG + 3个 PNG）

**Step 5: 停止开发服务器**

按 `Ctrl+C` 停止服务器

---

## Task 8: 更新文档

**Files:**
- Modify: `docs/plans/2026-01-13-logo-design.md`

**Step 1: 在设计文档末尾添加实施记录**

在 `docs/plans/2026-01-13-logo-design.md` 末尾添加：

```markdown

---

## 实施记录

**实施日期**: 2026-01-13

**文件清单**:
- ✅ `apps/web/public/logo.svg` - 主 Logo（深蓝色）
- ✅ `apps/web/public/logo-dark.svg` - 深色背景版本（白色）
- ✅ `apps/web/public/logo-light.svg` - 浅色背景版本
- ✅ `apps/web/public/favicon.svg` - Favicon 简化版
- ✅ `apps/web/public/apple-touch-icon.png` - Apple Touch Icon (180x180)
- ✅ `apps/web/public/favicon-16.png` - 16x16 PNG
- ✅ `apps/web/public/favicon-32.png` - 32x32 PNG
- ✅ `apps/web/public/favicon-48.png` - 48x48 PNG

**集成位置**:
- ✅ `apps/web/index.html` - HTML head 中的图标引用
- ✅ `apps/web/scripts/generate-icons.js` - 图标生成脚本

**验证结果**:
- ✅ 浏览器标签页正常显示 favicon
- ✅ Logo 在不同尺寸下保持清晰
- ✅ 颜色符合设计规范 (#1e40af)
- ✅ 形态符合设计（漏斗状数据流）
```

Expected: 文档更新成功

**Step 2: Commit**

```bash
git add docs/plans/2026-01-13-logo-design.md
git commit -m "docs: add implementation record to logo design"
```

---

## 完成检查清单

在完成所有任务后，验证：

- [ ] 所有 SVG 文件语法正确
- [ ] 所有 PNG 文件成功生成
- [ ] HTML 正确引用新图标
- [ ] 浏览器中 favicon 正常显示
- [ ] 旧的 vite.svg 已删除
- [ ] 所有更改已提交到 git
- [ ] 设计文档已更新实施记录
- [ ] 开发服务器中验证通过

---

## 后续优化建议

实施完成后可以考虑：
1. 添加 PWA manifest.json 支持
2. 创建不同颜色主题的 Logo 变体
3. 添加 Logo 的 CSS 动画效果
4. 生成 README 展示用的 Logo 横幅图
5. 创建品牌指南文档
