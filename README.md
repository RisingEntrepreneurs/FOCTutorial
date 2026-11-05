# 永磁同步电机 FOC 量产工程实战教程

从工程数学、矢量控制到车载 PMSM 嵌入式落地与台架标定。

单文件静态网页（`index.html`），纯 HTML + 原生 JavaScript，无后端、无构建步骤，可直接由 GitHub Pages 发布，手机 / 电脑浏览器打开即可学习。

## 内容（持续分段更新）

- [x] 课程导读与统一 EPS 工程案例
- [x] 模块 A：前置工程数学 A01–A08（每节交互动画 + 四类习题）+ 模块 A 综合自测卷
- [ ] 模块 B：基础扫盲 B01–B07
- [ ] 模块 C：核心 FOC 链路 C01–C13
- [ ] 模块 D：嵌入式落地实战 D01–D08
- [ ] 模块 E：故障与调试实战 E01–E04
- [ ] 模块 F：拓展对比 F01–F05
- [ ] 重点强化：数据流追踪 / 浮点 vs 定点 / 证据等级 / 参数表模板
- [x] 结业综合大试卷（题库随模块扩充）、全局错题本、台架调试模拟

## 发布到 GitHub Pages

1. 新建仓库（建议一个教程一个仓库，例如 `FOCTutorial`）。
2. 上传本目录下的 `index.html`、`.nojekyll`、`README.md` 到仓库根目录。
3. 仓库 **Settings → Pages → Build and deployment**：Source 选 **Deploy from a branch**，Branch 选 `main`，目录 `/ (root)`，保存。
4. 约 1 分钟后访问：`https://<用户名或组织名>.github.io/<仓库名>/`

## 更新

后续每次拿到新版本，只需覆盖上传 `index.html`。学习进度、错题本、自测成绩保存在各自浏览器的 localStorage 中，覆盖更新不会丢失（同一网址下）。

## 说明

- 页面引用 Tailwind CSS CDN；CDN 不可用时，所有布局、动画、习题仍正常（核心样式已内联）。
- 文中标注【案例假设】的参数为教学假设，不代表任何量产产品数据。
