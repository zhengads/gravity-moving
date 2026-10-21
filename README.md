# 重力搬家

一款面向手机浏览器的物理解谜小游戏。让房间保持正立，改变重力方向，把网球、笔记本和闹钟送进搬家箱。游戏有玄关、书房、客厅三个关卡，可选择手机体感或屏幕按钮操作。

**在线测试链接：** [https://zhengads.github.io/gravity-moving/](https://zhengads.github.io/gravity-moving/)

![手机端开场界面](docs/mobile-start.png)

## 在手机上测试

1. 用手机浏览器打开上面的 HTTPS 链接，先选择“点击按钮”，确认游戏和关卡可正常运行。
2. 刷新页面，选择“倾斜手机”；如果浏览器请求运动传感器权限，请允许访问。
3. 竖屏缓慢倾斜手机，观察场景里的重力箭头和物件运动；手机正放时箭头应指向下方，哪一侧压低就应指向哪一侧。右上角齿轮可切换操作方式，也可直接选择三间房。旁边的按钮显示“音效 开/关”，控制游戏反馈音效，没有循环背景音乐。

体感需要设备提供运动传感器，并由浏览器开放相关接口。无法获取传感器数据时，游戏会回退到按钮操作。体感优先读取倾角，倾角中断时才用加速度；此逻辑已通过模拟传感器事件验证，实际方向与手感仍需在目标手机上测试。

## 本地构建

需要 Node.js。安装锁定依赖并生成独立 HTML：

```bash
npm ci
npm run build
```

构建产物是仓库根目录的 `index.html`，其中内嵌 Matter.js、游戏脚本、样式、图片和字体；无需后端或数据库。普通操作可直接打开该文件；手机体感测试请使用上面的 HTTPS 页面。

## 项目结构

```text
├─ index.html             # GitHub Pages 发布的单文件构建产物
├─ build.mjs              # 将源码与素材打包进 index.html
├─ src/
│  ├─ template.html       # 页面结构与弹窗
│  ├─ style.css           # 响应式布局与视觉样式
│  ├─ app.js              # Matter.js 物理、关卡、体感与交互
│  ├─ assets/             # 构建使用的 WebP 场景和物件素材
│  └─ fonts/              # 字体子集及其 OFL 许可证
└─ docs/mobile-start.png  # 手机端界面预览
```

游戏使用 Canvas 2D 绘制场景，用 Matter.js 处理碰撞与运动；体感优先读取 `DeviceMotionEvent`，必要时使用 `DeviceOrientationEvent`。字体许可证见 `src/fonts/`。
