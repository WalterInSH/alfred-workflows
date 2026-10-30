#!/usr/bin/env python3
"""Build the Alfred package with only the files needed at runtime."""
from pathlib import Path
import zipfile
root = Path(__file__).resolve().parent
out = root / 'Screenshot Toolkit.alfredworkflow'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in ('info.plist', 'menu.js', 'action.sh', 'icon.png', 'icons/full.png', 'icons/area.png', 'icons/window.png', 'icons/clipboard.png', 'icons/file.png'):
        archive.write(root / name, name)
print(out)
