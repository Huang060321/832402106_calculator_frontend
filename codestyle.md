# 前端代码规范

> 规范来源：[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)、[MDN HTML 指南](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/HTML) 与 [MDN CSS 指南](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/CSS)。本项目根据无构建、原生 JavaScript 技术栈做了适配。

## 1. 通用规则

- 源文件使用 UTF-8 和 LF 换行，文件末尾保留一个换行。
- HTML、CSS、JavaScript 统一使用 2 个空格缩进，不使用 Tab。
- 删除未使用代码、调试日志和注释掉的大段旧实现。
- 名称应表达业务意义，避免无意义缩写。

## 2. HTML

- 使用语义元素，例如 `main`、`header`、`section`、`article`、`aside`、`nav`、`output`。
- 一个页面只使用一个一级标题，标题层级连续。
- 表单控件必须有关联的 `label` 或明确的 `aria-label`。
- 按钮行为使用 `button`，导航才使用 `a`。
- 图片必须提供有意义的 `alt`；纯装饰内容使用空 `alt` 或 `aria-hidden`。
- 属性值使用双引号，布尔属性不写冗余值。

## 3. CSS

- 类名使用语义化 `kebab-case`，避免依赖 DOM 层级的脆弱选择器。
- 颜色、间距和主题值优先使用 CSS 自定义属性统一管理。
- 先写基础样式，再写组件状态，最后写响应式媒体查询。
- 可交互控件必须提供悬停、键盘焦点、禁用和错误状态。
- 正文默认不小于 16px；常用标签不小于 14px。
- 动画应尊重 `prefers-reduced-motion`。
- 不使用 `!important` 掩盖层叠问题。

## 4. JavaScript

- 启用严格模式；语句以分号结束。
- 变量和函数使用 `camelCase`，常量使用 `UPPER_SNAKE_CASE`。
- 函数只承担一个明确职责，网络请求统一经过 API 包装函数。
- 使用 `async` / `await` 处理异步流程，并在界面显示失败状态。
- 不将不可信内容直接插入 `innerHTML`；必要时先转义。
- 禁止在前端实现最终表达式计算，前端只提交表达式并显示服务端返回值。
- 不把历史记录写入 `localStorage`；仅允许保存主题等非权威界面偏好。
- 不在源码中保存密码、令牌或私有服务地址。

## 5. API 与状态

- 所有 API 路径集中通过 `endpoint` 函数组装。
- 每个请求必须检查 HTTP 状态并处理非 JSON 或网络错误。
- 提交期间应防止重复计算，并给用户可理解的反馈。
- 删除后重新查询后端历史，不在本地假设数据库状态。
- 展示用户或服务端文本前进行 HTML 转义。

## 6. 可访问性与响应式

- 关键结果和错误使用 `aria-live` 通知辅助技术。
- 所有操作均可通过键盘完成，焦点样式清晰可见。
- 触控目标尽量不小于 42 × 42 像素。
- 至少检查 360px 手机宽度、768px 平板和 1280px 桌面布局。
- 在 200% 文本缩放下保持内容可读、控件可操作。

## 7. Git 提交

- 一次提交只包含一个主题。
- 提交信息采用 `type: summary`，例如 `feat: add history pagination`、`fix: show backend error`。
- 提交前在浏览器控制台确认无错误，并完成 README 中的验收用例。
