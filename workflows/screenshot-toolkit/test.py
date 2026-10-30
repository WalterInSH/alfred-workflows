#!/usr/bin/env python3
import json, plistlib, subprocess, tempfile, zipfile
from pathlib import Path
p=Path(__file__).resolve().parent
with (p/'info.plist').open('rb') as f: info=plistlib.load(f)
assert info['objects'][0]['config']['argumenttype']==1  # optional argument
assert info['objects'][0]['config']['keyword']=='s'
assert info['objects'][0]['config']['withspace'] is True
assert info['objects'][2]['config']['script']=='./action.sh "$1"'
assert info['connections']['SCREENSHOT-MENU'][0]['destinationuid']=='SCREENSHOT-OUTPUT-MENU'
def menu(query=''):
    return json.loads(subprocess.check_output(['/usr/bin/osascript','-l','JavaScript',str(p/'menu.js'),query]))['items']
assert [x['variables']['capture_scope'] for x in menu()]==['area','full','window']
assert all(x['arg']=='' for x in menu())
for scope in ('full','area','window'):
    assert [x['arg'] for x in menu('menu ' + scope)]==[f'capture {scope} clipboard',f'capture {scope} file']
subprocess.run(['/bin/bash','-n',str(p/'action.sh')],check=True)
# Test the actual Alfred shell wrapper with one argument containing spaces. An
# invalid output is rejected after parsing, without taking a screenshot.
wrapper=info['objects'][2]['config']['script']
r=subprocess.run(['/bin/zsh','-c',wrapper,'alfred','capture full invalid'],cwd=p,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
assert r.returncode == 2 and b'invalid action argument' in r.stderr
# Replace only the AppleScript executable in a temporary copy, so the menu
# branch can be checked without opening Alfred or taking a screenshot.
with tempfile.TemporaryDirectory() as tmp:
    copy=Path(tmp)/'action.sh'
    copy.write_text((p/'action.sh').read_text().replace('/usr/bin/osascript - "$scope"', '/usr/bin/printf "scope=%s\\n" "$scope"'))
    for scope in ('full','area','window'):
        result=subprocess.run(['/bin/bash',str(copy),f'menu {scope}'],capture_output=True,text=True)
        assert result.returncode == 0 and result.stdout == f'scope={scope}\n', result


with zipfile.ZipFile(p/'Screenshot Toolkit.alfredworkflow') as z:
    assert set(z.namelist())=={'info.plist','menu.js','action.sh','icon.png','icons/full.png','icons/area.png','icons/window.png','icons/clipboard.png','icons/file.png'}
    assert (z.getinfo('action.sh').external_attr >> 16) & 0o111
    assert z.testzip() is None
print('Menu, workflow configuration, shell syntax and package checks passed.')
