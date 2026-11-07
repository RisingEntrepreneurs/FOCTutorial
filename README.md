# 永磁同步电机 FOC 量产工程实战教程

从工程数学、矢量控制到车载 PMSM 嵌入式落地与台架标定。

单文件静态网页（`index.html`），纯 HTML + 原生 JavaScript，无后端，可直接由 GitHub Pages 发布，手机 / 电脑浏览器打开即可学习。

在线访问：<https://risingentrepreneurs.github.io/FOCTutorial/>

## 内容

全书围绕同一个案例：车载 EPS 助力内置式永磁同步电机（4 对极、12 V、旋变 + AD2S1210、NXP S32K146、20 kHz 定点 FOC）。

- [x] 课程导读与统一 EPS 工程案例、全书约定、证据等级
- [x] 模块 A：前置工程数学 A01–A08（代数、矢量、三角、复数、微分、积分、拉普拉斯、PID）
- [x] 模块 B：基础扫盲 B01–B07（为什么用 FOC、PMSM、坐标系、矢量控制、环路层级、时序、常用信号）
- [x] 模块 C：核心 FOC 链路 C01–C13（采样、Clarke、Park、SVPWM、电流环、MTPA、弱磁、速度 / 位置环、角度传感、无感观测、参数辨识、保护诊断、扰动补偿）
- [x] 模块 D：嵌入式落地实战 D01–D08（离散化、定点、中断架构、代码架构、Simulink、台架上电、标定、XCP）
- [x] 模块 E：故障与调试实战 E01–E04（根因库、示波器要点、仿真 vs 台架、定位流程）
- [x] 模块 F：拓展对比 F01–F05（FOC vs DTC、有感 vs 无感、SPMSM vs IPMSM、主驱 vs EPS、厂商方案）
- [x] 重点强化 X1–X4：端到端数据流追踪、浮点 vs 定点（含可复制 `foc_fix.h`）、仿真证据 vs 台架证据、参数表模板

每节固定十部分（小节基础 → 前置条件 → 原理公式 + 交互动画 → 嵌入式实现 → 波形预期 → EPS 案例代码 → 高频调试问题 → 工程踩坑 → 四类习题 → 考核小结）。

规模：49 个小节、34 个交互动画、294 道习题（单选 / 判断 / 简答 / 工程分析）、6 套模块自测卷 + 结业综合大试卷、全局错题本、4 个台架调试模拟场景。

## 源码结构与构建

`index.html` 由 `src/` 下的分段文件拼接生成，修改内容请编辑 `src/`，然后运行：

```bash
python3 build.py
```

| 文件 | 内容 |
|---|---|
| `src/p01_head.html` | `<head>`、全局 CSS（明暗主题、打印样式） |
| `src/p02_shell.html` | 顶栏、导航容器、课程导读 |
| `src/p03`–`p06_*.html` | 模块 A 正文 |
| `src/b*`、`c*`、`d*`、`e*`、`f*`、`x*`（数字编号）`.html` | 模块 B–F、重点强化正文 |
| `src/p07_tail.html` | 模块 A 自测卷、结业试卷、右侧辅助栏、底栏、弹窗 |
| `src/p08_core.js` | 导航、搜索、进度、习题 / 错题本 / 试卷、调试模拟、动画框架 |
| `src/p09_anims.js` | 模块 A 动画与公共绘图工具（`window.FOC_DRAW`） |
| `src/p10_questions.js` | 模块 A 题库与调试模拟场景 1–2 |
| `src/*_anims*.js`、`src/*_questions*.js` | 各模块动画与题库 |

新增小节：在对应 `src/xN_*.html` 中加 `<section class="chap" id="…">`，在题库文件中 `FOC_Q.push({...sec:'…'})`，动画 `FOC_ANIM_SPECS.push({host:'anim-…', …})`；导航条目在 `p08_core.js` 的 `NAV` 中。

## 发布到 GitHub Pages

仓库 **Settings → Pages → Build and deployment**：Source 选 **Deploy from a branch**，Branch 选 `main`，目录 `/ (root)`。`.nojekyll` 已包含。

## 说明

- 学习进度、错题本、自测成绩保存在各自浏览器的 localStorage 中，更新网页不会丢失（同一网址下）。
- 页面引用 Tailwind CSS CDN；CDN 不可用时所有布局、动画、习题仍正常（核心样式已内联）。删除 `<head>` 中该行即为完全离线版本。
- 文中标注【案例假设】的参数为教学假设，不代表任何量产产品数据；【厂商参考】为芯片厂商参考实现，不是唯一标准；【待核对】为需以官方资料或实测确认的内容。
- 页面动画属于 L0 证据，只说明概念、方向与趋势，不代表实际性能（见 X3）。
