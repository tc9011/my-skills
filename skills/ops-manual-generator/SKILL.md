---
name: ops-manual-generator
description: |
  Use this skill to generate Chinese operations manual PPTs (.pptx) with annotated screenshots and field mapping diagrams. Converts CMS/admin backend configurations (Strapi, Admin Panel, 管理后台, 配置中心, headless CMS, contentful, or any backend system) into training slides for non-technical staff (ops, product, business teams). Triggers on: 操作手册, 运营文档, 配置说明, 字段对照, 字段映射, SOP, 使用说明, 培训材料, 后台使用指南, operations manual, field mapping, admin guide, CMS documentation. Also use when user says "帮我出个文档给运营", "写个配置说明", "教运营怎么用后台", "标记一下哪个字段对应页面哪个部分", "给业务方看的使用说明", or any request to document backend-to-frontend field relationships for non-developers. Do NOT use for: API technical docs, README, developer documentation, PRD, data reports, or coding tasks.
---

# 运营操作手册 & 字段对照图生成器

生成面向运营人员的中文操作手册 PPT（.pptx），一个文件包含操作手册幻灯片和字段对照图幻灯片。中间产物为 Markdown + HTML，经用户预览确认后用 pptxgenjs 生成最终 PPT 交付。

## 参考文件

本技能将大型模板和详细参考抽取到 `references/` 目录中，在对应阶段按需读取：

| 文件                                     | 用途                                                               | 何时读取             |
| ---------------------------------------- | ------------------------------------------------------------------ | -------------------- |
| `references/field-mapping-template.html` | 字段对照图 HTML 完整模板                                           | Phase 3 生成 HTML 时 |
| `references/preview-wrapper.html`        | Markdown 预览 HTML 包装器                                          | Phase 4 预览时       |
| `references/ppt-structure-reference.md`  | PPT 幻灯片结构、内容映射、样式约定                                 | Phase 5 生成 PPT 时  |
| `references/generate-ppt-template.mjs`   | 可执行的 pptxgenjs 脚本模板（含 withFont、freshOpts 等已验证模式） | Phase 5 生成脚本时   |

## 前置条件（截图必须先行）

**在开始任何分析或写作之前，必须先拿到截图。** 没有截图就不要开始。

### 必需输入

1. **后台截图**（🔴 必须）— 配置后台/管理界面的截图，每个配置模块至少一张
2. **前端截图**（🔴 必须）— 对应的前端 UI 截图，展示配置生效后的效果
3. **功能描述** — 用户简要说明配置的业务场景
4. **源代码访问**（推荐）— 若在代码项目中，可精确提取字段映射关系

### 截图缺失处理

如果用户没有提供截图，**立即停下来要求截图**：

> "要生成操作手册 PPT，我需要你先提供：
>
> 1. **后台配置界面截图** — 每个配置模块至少一张
> 2. **前端页面截图** — 展示配置生效后用户看到的样子
>
> 请先提供截图，我再开始生成。"

如果用户坚持先看文字，可以先生成 Markdown 草稿，但在文档开头标注"草稿版本 — 待补充截图后生成完整版"。

---

## Phase 1: 信息收集与分析

### 1.1 理解业务上下文

如果在代码项目中，按优先级搜索：

1. Git log — 搜索相关工单号或关键词
2. API 层 — GraphQL query / REST endpoint
3. 页面组件 — 前端渲染逻辑
4. 配置/常量 — 字段枚举、默认值、业务规则

### 1.2 构建字段映射表

从代码和截图中提取每个配置模块的字段映射（内部工作数据）：

```
配置模块: [模块名称]
├── 字段A
│   ├── 后台位置: 截图中的具体位置
│   ├── 前端位置: 页面上的展示位置
│   ├── 数据类型: 文本/图片URL/富文本/数组...
│   └── 特殊逻辑: 有条件展示/格式转换/...
```

宁可多列不可遗漏。每个后台可编辑字段都要对应到前端展示位置。

### 1.3 分析截图

仔细查看每张截图：

- 后台截图：可编辑字段位置、标签文字、输入类型
- 前端截图：对应内容的展示位置、样式、层级关系

---

## Phase 2: 生成操作手册（Markdown）

操作手册面向运营人员，语言要简洁易懂，避免技术术语。

### 手册结构

```markdown
# [系统/功能名称] 运营操作手册

## 1. 概述

### 1.1 文档说明

### 1.2 涉及配置项

| 配置项名称 | 用途 | 影响页面 |

### 1.3 操作入口

## 2. [配置模块 A] 配置说明

### 2.1 功能说明

### 2.2 字段说明

| 字段 | 说明 | 类型 | 必填 | 示例 |

### 2.3 操作步骤

1. 进入 XXX 后台
2. 找到 XXX 配置
3. 修改字段...
4. 点击发布

### 2.4 注意事项

（每个配置模块重复上述结构）

## N. 常见问题 (FAQ)

## N+1. 快速参考
```

### 写作要点

- **面向运营人员**：不写代码细节、API 名称、技术架构
- **使用具体指引**：不说"修改相关字段"，说"在「标题」输入框中填写新标题"
- **配图引用**：`![描述](images/xxx.png)`
- **发布流程特别标注**：很多 CMS 有"保存 ≠ 发布"的概念，运营容易忘记点发布
- **中文标点**：全文使用中文标点符号（，。！？：；）

---

## Phase 3: 生成字段对照图（HTML）

字段对照图是核心产出——交互式 HTML 页面，左右并排展示后台/前端截图，用编号标记对应字段。

### 生成步骤

1. 读取 `references/field-mapping-template.html` 作为基础模板
2. 按实际配置模块复制 `mapping-group` 区块
3. 替换截图路径、标题、标记位置和图例表格内容

### 标记定位要点

- 使用 **百分比定位**（`top: 25%; left: 60%`），图片缩放时标记位置不变
- 标记放在字段输入框/显示区域旁边，不遮挡内容
- 同一编号在左右两侧成对出现：后台 ① 对应前端 ①
- 颜色区分：红色（`#e74c3c`）= 后台，蓝色（`#3498db`）= 前端

### 验证清单

- [ ] 所有截图正确显示
- [ ] 编号标记位置准确，不遮挡关键内容
- [ ] 左右编号一一对应
- [ ] 图例表格完整
- [ ] 页面在不同宽度下仍可阅读

---

## Phase 4: 本地预览（用户确认）

生成 Markdown 和 HTML 后，先让用户预览确认，再生成 PPT。

### 4.1 输出文件结构

```
output-dir/
├── 操作手册.md
├── 字段对照图.html
└── images/
    ├── backend-*.png
    └── frontend-*.png
```

### 4.2 预览方式

字段对照图可直接用浏览器打开 HTML 文件：

```bash
open <output-dir>/字段对照图.html
```

Markdown 预览：读取 `references/preview-wrapper.html`，将 Markdown 转为 HTML 后嵌入，保存为临时文件并打开：

```bash
# 方法 1：用 marked 转换（需安装 marked）
npx marked --gfm < <output-dir>/操作手册.md > /tmp/操作手册-preview.html
open /tmp/操作手册-preview.html

# 方法 2：用 Python HTTP 服务器（如需图片正确显示）
python3 -m http.server 8080 --directory <output-dir> &
open http://localhost:8080/字段对照图.html
```

### 4.3 等待用户确认

> "预览已就绪：
> 📋 **操作手册**: [预览路径]
> 🖼️ **字段对照图**: [预览路径]
>
> 请检查：字段映射是否完整、操作步骤是否准确、标记位置是否正确
>
> ✅ 没问题请回复 **approve**
> ✏️ 需要修改请告诉我哪里需要调整"

**在用户明确 approve 之前，不要生成 PPT。**

---

## Phase 5: 生成 PPT（用户 approve 后执行）

### 5.1 加载依赖技能

进入 Phase 5 前，**先加载 `pptx` 技能**（`use_skill("pptx")`）。`pptx` 技能包含完整的 pptxgenjs API 参考和 Common Pitfalls。本技能只提供操作手册 PPT 的结构和内容指导，pptxgenjs 底层用法以 `pptx` 技能为准。

**如果 `pptx` 技能不可用**，必须至少遵守这些关键规则：

1. 颜色不加 `#` 号 — `"FF0000"` 不是 `"#FF0000"`
2. 不在颜色字符串中编码透明度 — 用 `opacity` 属性
3. 不用 unicode 符号当 bullet — 用 `bullet: true`
4. 多行文本用 `breakLine: true`
5. 不复用 options 对象 — 用 `freshOpts()` 深拷贝
6. 中文字体必须 `Heiti SC` + `lang: 'zh-CN'`（见 5.3）

### 5.2 读取参考文件

1. 读取 `references/ppt-structure-reference.md` — 了解幻灯片结构、内容映射和样式约定
2. 读取 `references/generate-ppt-template.mjs` — 复制为生成脚本的起点

脚本模板已包含：色板（`C`）、字体常量（`FONT`/`LANG`）、`withFont()`、`freshOpts()`、`addMarker()`、`addFooter()`、`addSlideNumber()`、斑马纹表格工具函数、和表格 cell 样式模板。

### 5.3 中文字体处理（🔴 乱码防线）

pptxgenjs 生成中文 PPT 时，**必须同时满足三个条件**，否则中文会显示为方块：

```javascript
const FONT = "Heiti SC"; // macOS 核心字体，无懒加载
const LANG = "zh-CN"; // 生成正确的 XML lang 属性

const withFont = (opts = {}) => ({ fontFace: FONT, lang: LANG, ...opts });

// 每个 addText / addTable cell 都必须经过 withFont
slide.addText("中文", withFont({ fontSize: 14 }));
```

为什么这三条缺一不可：

- **fontFace 是字面字体名**：`"PingFang SC, Microsoft YaHei"` 会被当作一个不存在的字体（不是 CSS font-family 的 fallback 语法）
- **lang 默认 `en-US`**：缺少 `zh-CN` 时，macOS Keynote 忽略东亚字体声明，表格单元格中文显示为豆腐块
- **PingFang SC 有懒加载问题**：Keynote 中会先显示方块再切换为文字，Heiti SC 无此问题

表格单元格比普通文本框更敏感——`addText()` 可能降级显示，`addTable()` 单元格不会。

### 5.4 生成脚本

1. 复制 `references/generate-ppt-template.mjs` 到输出目录
2. 根据实际操作手册和字段对照数据填写幻灯片内容（替换 TODO 区块）
3. 执行脚本：

```bash
npm list pptxgenjs 2>/dev/null || npm install pptxgenjs
node <output-dir>/generate-ppt.mjs
```

### 5.5 PPT 视觉 QA

生成后打开 PPT 检查：

- 文字是否溢出幻灯片边界
- 截图是否清晰、标记是否对齐
- 表格是否完整、列宽是否合理
- **重点检查表格单元格中文是否正常**（如有豆腐块，检查是否遗漏 `withFont()`）

```bash
# 如有 LibreOffice，可转为图片检查
soffice --headless --convert-to pdf <output-dir>/操作手册.pptx
# 或直接用 Keynote / PowerPoint 打开
```

### 5.6 清理

```bash
# 如启动了 HTTP 服务器
kill $(cat /tmp/ops-manual-preview.pid) 2>/dev/null
rm -f /tmp/ops-manual-preview.pid /tmp/操作手册-preview.html
# 生成脚本可选保留（方便后续更新）
```

---

## Phase 6: 交付

> "✅ 已生成最终文件：
>
> 📊 **操作手册 PPT**: `操作手册.pptx` — 包含操作手册 + 字段对照图，可直接分发
>
> 📝 **源文件**（方便后续编辑）：
>
> - `操作手册.md` — Markdown 源文件
> - `字段对照图.html` — HTML 源文件
> - `images/` — 截图原图"

---

## 常见场景

| 场景                    | 处理方式                                          |
| ----------------------- | ------------------------------------------------- |
| 有代码 + 截图（最理想） | 完整流程：代码分析 → Markdown + HTML → 预览 → PPT |
| 只有截图                | 根据截图可见字段推断映射，向用户确认不确定的字段  |
| 有代码没截图            | **停下来要求截图**。可先分析代码，但不生成对照图  |
| 增量更新                | git diff 找出变更，只更新变化部分                 |

## 输出质量标准

- **准确性**: 每个字段映射都有代码/截图依据，不靠猜测
- **完整性**: 所有可配置字段都被覆盖
- **可读性**: 运营人员无需技术背景即可理解
- **实用性**: 能作为日常运营参考手册
- **视觉清晰**: 标记准确、颜色醒目、不遮挡内容
