#!/bin/bash
set -u
cd "$(dirname "$0")" || exit 1
# Alfred passes the selected item's arg as one argument. Accept only our fixed commands.
case "${1-}" in
  'menu full'|'menu area'|'menu window'|'capture full clipboard'|'capture area clipboard'|'capture window clipboard'|'capture full file'|'capture area file'|'capture window file') ;;
  *) echo 'Screenshot Toolkit: invalid action argument.' >&2; exit 2 ;;
esac
IFS=' ' read -r mode scope output <<< "$1"
case "$scope" in full|area|window) ;; *) exit 2 ;; esac
if [[ "$mode" == menu ]]; then
  /usr/bin/osascript - "$scope" <<'APPLESCRIPT'
on run argv
  tell application id "com.runningwithcrayons.Alfred" to search "s " & item 1 of argv
end run
APPLESCRIPT
  exit $?
fi
[[ "$mode" == capture && ( "$output" == clipboard || "$output" == file ) ]] || exit 2
notify_error() {
  /usr/bin/osascript - "$1" <<'APPLESCRIPT' >/dev/null 2>&1
on run argv
  display dialog (item 1 of argv) with title "Screenshot Toolkit" buttons {"OK"} default button "OK" with icon caution
end run
APPLESCRIPT
}
if [[ "$output" == file ]]; then
  [[ -d "$HOME/Downloads" ]] || { notify_error '找不到 Downloads 文件夹。'; exit 1; }
  temp_template="$HOME/Downloads/.screenshot-toolkit.XXXXXXXX"
else
  temp_template="${TMPDIR:-/tmp/}screenshot-toolkit.XXXXXXXX"
fi
tmp=$(/usr/bin/mktemp -d "$temp_template") || { notify_error '无法创建临时文件，请检查 Downloads 的权限。'; exit 1; }
trap '/bin/rm -rf "$tmp"' EXIT
image="$tmp/capture.png"
args=(-x -t png)
case "$scope" in full) args+=(-m);; area) args+=(-i -s);; window) args+=(-i -w);; esac
# Interactive cancellation may return success without creating an image.
/usr/sbin/screencapture "${args[@]}" "$image" 2>"$tmp/error"
status=$?
if [[ $status -ne 0 ]]; then
  notify_error '截图失败。请在系统设置的“隐私与安全性 → 屏幕与系统音频录制”中检查 Alfred 或截图相关进程的权限，然后重试。详情可在 Alfred 调试器中查看。'
  /bin/cat "$tmp/error" >&2
  exit 1
fi
[[ -s "$image" ]] || exit 0
if [[ "$output" == clipboard ]]; then
  if ! /usr/bin/osascript - "$image" <<'APPLESCRIPT'
on run argv
  set the clipboard to (read (POSIX file (item 1 of argv)) as «class PNGf»)
end run
APPLESCRIPT
  then notify_error '无法将截图复制到剪贴板。'; exit 1; fi
else
  directory="$HOME/Downloads"
  if [[ ! -d "$directory" ]]; then notify_error '找不到 Downloads 文件夹。'; exit 1; fi
  stamp=$(/bin/date '+%Y-%m-%d_%H-%M-%S')
  index=0
  while :; do
    suffix=''; (( index > 0 )) && suffix="_$index"
    dest="$directory/Screenshot_${stamp}${suffix}.png"
    # Hard link publishes the completed image atomically, without overwriting.
    if /bin/ln "$image" "$dest" 2>"$tmp/link-error"; then break; fi
    if [[ -e "$dest" || -L "$dest" ]]; then ((index+=1)); continue; fi
    /bin/cat "$tmp/link-error" >&2
    notify_error '保存截图失败，请检查 Downloads 的权限和可用空间。'; exit 1
  done
fi
