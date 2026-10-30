# Screenshot Toolkit

macOS 原生截图 Alfred Workflow。需要 Alfred 5 或更新版本及 Powerpack。

## 安装与使用

双击 `Screenshot Toolkit.alfredworkflow`，在 Alfred 中选择 Import。打开 Alfred，输入 `s`，用方向键选择 Full Screen（主显示器全屏）、Selected Area（区域）或 Window（窗口），按回车；再选择 Copy to Clipboard 或 Save to File 并按回车。区域截图拖动选择，窗口截图点击窗口；按 Escape 取消。剪贴板截图可直接用 Command + V 粘贴。保存的 PNG 在 `~/Downloads`，名称为 `Screenshot_年-月-日_时-分-秒.png`；同秒重名时增加数字后缀，不覆盖已有文件。

首次使用时，按 macOS 提示允许截图相关进程的屏幕录制权限。如截图失败，在「系统设置 → 隐私与安全性 → 屏幕与系统音频录制」检查 Alfred 或系统提示的进程，必要时退出并重新打开应用。第二级菜单直接在 Alfred 中显示，搜索框保持空白。受保护的内容可能无法截图。没有截图成功通知；取消时不会显示成功提示。若截图命令报告错误，会显示提示并将详情写入 Alfred Workflow 调试器。

## 构建与验证

在本目录运行 `python3 make-icons.py` 生成图标，运行 `python3 build.py` 重新打包。运行 `python3 test.py` 检查菜单、plist、打包内容和脚本语法。实际截图、权限弹窗、剪贴板粘贴及 Escape 取消需要在已登录的 macOS 图形桌面和 Alfred 中手动验证。
