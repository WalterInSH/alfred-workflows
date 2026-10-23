# Clean Paste

Independent Alfred 5 workflow. Default hotkey: **Command + Shift + V**.
Alfred Clipboard History now uses Control + Command + V on this Mac.
Existing workflows and Alfred preferences are not edited by this package.

## Installation and hotkey

Double-click `Alfred-Clean-Paste.alfredworkflow`, then choose Import in Alfred.
If Clean Paste is already installed, use the installed copy rather than importing
another copy. In Alfred Preferences > Workflows > Clean Paste, double-click the
Hotkey object to inspect or change its shortcut. Alfred can omit assigned hotkeys
from exported workflows; if the imported Hotkey field is empty, enter
Command + Shift + V there.

The installed Alfred files report version 5.7.3 (2320). A Powerpack license file
and existing workflows are present, but license validity and live workflow access
must be confirmed in Alfred Preferences. The current automation session could not
open Alfred Preferences (Launch Services error -10827), so GUI activation and
hotkey registration have not been verified.

The current Alfred configuration assigns Command + Shift + V to Clean Paste
and Control + Command + V to Clipboard History. No other configured Alfred
workflow or enabled macOS symbolic shortcut matches Command + Shift + V.
Live hotkey registration and application-specific shortcuts remain unverified.

## Operation

Copy text, focus an editable field, and press Command + Shift + V.
Wait about 1.5 seconds before invoking it again.

The native Hotkey trigger runs `/usr/bin/osascript` in JavaScript for Automation
(JXA) mode. AppKit reads explicitly available plain text and snapshots every
clipboard item and representation in memory. No clipboard backup is written to
disk. The script normalizes CRLF to LF, removes spaces and tabs on otherwise
empty lines, and compresses repeated LF to one LF. It preserves indentation,
ordinary body spaces, punctuation, Unicode, and a single final newline. It does
not expand Alfred placeholders, shell expressions, or text as executable code.

System Events sends Command + V after the clipboard contains only UTF-8 plain
text. The original representations are restored after 1.5 seconds if the
pasteboard change counter still identifies this workflow's write. A native
NSMutableArray retains the backup items without JavaScript array conversion.
After restoration, item counts, format counts, and every format's bytes are
compared with the backup before success is logged. A new copy
during that interval is left intact. Empty, whitespace-only, unsupported, or
unreadable clipboard data exits before changing the clipboard. Snapshot and
permission failures also exit before changing it.

Run Script is used instead of Replace and Copy to Clipboard because the same
process can keep the complete original clipboard in memory and restore it
without editing Alfred's global clipboard preferences or writing a backup file.

## Permissions

Alfred must be allowed under System Settings > Privacy & Security > Accessibility.
The first execution may request Automation access for Alfred/osascript to control
System Events. If needed, inspect Privacy & Security > Automation > Alfred >
System Events. Grant permissions yourself only if you want this behavior.
This workflow does not change permissions, require Full Disk Access, or install
Python, Perl, or another runtime. Diagnostics go to the Alfred debugger, never
into the target field.

## Clipboard restoration limits and fallback

Restoration is best effort: macOS does not acknowledge when an arbitrary app has
finished reading a pasteboard. Slow apps may require increasing `delay(1.5)` in
`clean-paste.js` to `delay(3)`. A force-quit, process crash, failed pasteboard
write, or clipboard-manager intervention can prevent restoration. Clipboard
history tools may observe the temporary clean text; their settings are unchanged.

If an app reliably reads the clipboard too late, the reliable fallback for that
app is to leave the cleaned text on the clipboard: edit a separate copy of this
workflow and remove the `restoreIfOwned();` call in the `finally` block. That copy
will intentionally replace the clipboard with plain text; preserve the source
text separately first. Keep the installed default workflow for apps where the
restoring behavior works. Secure fields or apps that reject simulated paste may
not accept this workflow.

## Verification

Run without touching the clipboard:

```sh
/usr/bin/osascript -l JavaScript ./clean-paste.js --self-test
```

All 12 text cases passed in the actual JXA regular-expression engine, including
the requested Chinese paragraphs, multiple empty rows, unchanged single LF,
mixed English/Chinese with spaces, whitespace rows with CRLF, empty input,
Unicode, indentation, a trailing LF, and literal placeholder text.

Real clipboard access in the execution session was unavailable: `pbpaste`
returned exit 1, and AppKit exposed no usable clipboard change counter/items.
Calling the workflow script exits safely; diagnostic logging now reports
`Clean Paste: clipboard service unavailable.` This verifies
the unavailable-clipboard guard only. Real empty/image-only clipboard behavior,
full-format restoration remains unverified in this tool session. The user has
confirmed successful Word paste, and debugger output confirms hotkey dispatch
and the paste command. A restoration bridge error was subsequently fixed;
final live restoration verification is still pending.

For a manual acceptance check, copy `one`, a blank line, and `two`; focus a new
scratch document and invoke the hotkey. Expect two adjacent text lines. After
two seconds, ordinary Command + V should paste the original text with its blank
line. Also check an empty clipboard and a copied image: nothing should be pasted
or replaced. Test in a scratch document, never a shell command prompt.

## Modify, disable, uninstall

Use Alfred Preferences > Workflows > Clean Paste. Double-click Hotkey to change
the shortcut; use Open in Finder to inspect the source. Disable the workflow via
its context menu, or clear its Hotkey field. Delete only Clean Paste from Alfred
to uninstall. This workflow has no persistent data, background service, or other
preferences to remove. The archive in Downloads can be retained or deleted.

## Troubleshooting a silent hotkey

Select Clean Paste in Alfred Preferences > Workflows and click the debugger
(bug icon). Keep the debugger open, focus a scratch Word document, and invoke
Command + Shift + V. Inspect the Run Script messages. `started` confirms that the
script ran. Later messages identify a clipboard, snapshot, permission, or focus
failure. Only stage names and error numbers are logged; clipboard text is never
logged. `paste command sent` confirms dispatch, not acceptance by Word.

The successful restoration diagnostic is now:
`Clean Paste: original clipboard restored and verified.`
A failed or interrupted verification never logs restoration success.
