/**
 * generate-ppt.mjs — 操作手册 PPT 生成脚本模板
 *
 * 使用方式：agent 根据实际内容修改此模板，填入具体的幻灯片内容。
 * 运行前确保 pptxgenjs 已安装：npm install pptxgenjs
 *
 * 此模板包含经过验证的中文 PPT 生成模式：
 * - 中文字体处理（Heiti SC + lang: zh-CN）
 * - 选项对象深拷贝（避免 pptxgenjs 的对象突变问题）
 * - 斑马纹表格
 * - 截图标记系统
 */
import pptxgen from "pptxgenjs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imgDir = resolve(__dirname, "images");
const imgPath = (name) => resolve(imgDir, name);

// ─── Color Palette ──────────────────────────────────────────────
// 按需调整色板，颜色值不加 # 号（pptxgenjs 要求）
const C = {
  dark: "2C3E50",
  accent: "E74C3C",
  blue: "3498DB",
  white: "FFFFFF",
  light: "F8F9FA",
  textPrimary: "2C3E50",
  textSecondary: "7F8C8D",
  tableHeaderBg: "2C3E50",
  tableRow1: "FFFFFF",
  tableRow2: "F2F4F7",
};

// ─── Font（中文必须） ───────────────────────────────────────────
// Heiti SC: macOS 核心系统字体，无懒加载问题
// lang: 'zh-CN': 确保 pptxgenjs 生成正确的 XML lang 属性
const FONT = "Heiti SC";
const LANG = "zh-CN";

// 为所有文本选项注入字体设置，避免遗漏导致乱码
const withFont = (opts = {}) => ({ fontFace: FONT, lang: LANG, ...opts });

// ─── Slide Dimensions (16:9) ────────────────────────────────────
const SLIDE_W = 10;
const SLIDE_H = 5.625;

// ─── Helpers ────────────────────────────────────────────────────

// pptxgenjs 会原地修改 options 对象——复用同一个对象会导致
// 第二次调用拿到已转换的值（比如颜色被加上 #）。
// 用 freshOpts 深拷贝来安全复用样式模板。
function freshOpts(base) {
  return JSON.parse(JSON.stringify(base));
}

function addSlideNumber(slide, num) {
  slide.addText(
    String(num),
    withFont({
      x: 9.3,
      y: 5.2,
      w: 0.5,
      h: 0.3,
      fontSize: 8,
      color: C.textSecondary,
      align: "right",
    })
  );
}

function addFooter(slide) {
  slide.addShape("rect", {
    x: 0,
    y: 5.45,
    w: SLIDE_W,
    h: 0.175,
    fill: { color: C.accent },
  });
}

// 截图标记：彩色圆圈 + 白色编号
function addMarker(slide, { x, y, num, color, size = 0.22 }) {
  slide.addShape("ellipse", {
    x: x - size / 2,
    y: y - size / 2,
    w: size,
    h: size,
    fill: { color },
    shadow: {
      type: "outer",
      blur: 3,
      offset: 1,
      color: "000000",
      opacity: 0.3,
    },
  });
  slide.addText(
    String(num),
    withFont({
      x: x - size / 2,
      y: y - size / 2,
      w: size,
      h: size,
      fontSize: 9,
      color: C.white,
      align: "center",
      valign: "middle",
      margin: 0,
    })
  );
}

// 斑马纹表格行背景色
function zebraFill(rowIndex) {
  return { fill: { color: rowIndex % 2 === 0 ? C.tableRow1 : C.tableRow2 } };
}

// ─── 表格 cell 样式模板 ────────────────────────────────────────
const headerCell = (text) => ({
  text,
  options: withFont({
    bold: true,
    fontSize: 10,
    color: C.white,
    fill: { color: C.tableHeaderBg },
  }),
});

const bodyCell = (text, rowIdx = 0) => ({
  text,
  options: withFont({
    fontSize: 10,
    ...zebraFill(rowIdx),
  }),
});

// ═══════════════════════════════════════════════════════════════
//  以下为幻灯片内容——agent 根据实际操作手册和字段对照数据填写
// ═══════════════════════════════════════════════════════════════

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "运营手册生成器";
pres.title = "[功能名称] 运营操作手册";

let slideNum = 0;

// ── 封面页 ──────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slideNum++;
  slide.background = { color: C.dark };
  slide.addText(
    "[功能名称] 运营操作手册",
    withFont({
      x: 1,
      y: 1.5,
      w: 8,
      h: 1.5,
      fontSize: 36,
      bold: true,
      color: C.white,
      align: "center",
    })
  );
  slide.addText(
    "后台配置指南 · 字段对照说明",
    withFont({
      x: 1,
      y: 3,
      w: 8,
      h: 0.8,
      fontSize: 18,
      color: C.textSecondary,
      align: "center",
    })
  );
  addFooter(slide);
}

// ── 目录页 ──────────────────────────────────────────────────────
// TODO: agent 根据实际模块列表生成目录

// ── Part 1: 操作手册 ───────────────────────────────────────────
// TODO: agent 根据 Markdown 操作手册内容生成幻灯片
// 参考：references/ppt-structure-reference.md 中的映射表

// ── Part 2: 字段对照图 ─────────────────────────────────────────
// TODO: agent 根据 HTML 字段对照数据生成幻灯片
// 每个模块: 截图 + addMarker() 标记 + 图例表格

// ── 生成文件 ────────────────────────────────────────────────────
const outputPath = resolve(__dirname, "操作手册.pptx");
await pres.writeFile({ fileName: outputPath });
console.log(`✅ PPT 已生成: ${outputPath}`);
