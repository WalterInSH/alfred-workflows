# Clean Paste

Copy text, focus an editable field, and press **Control + Command + V**.
Clean Paste removes extra blank lines and pastes plain text. It normalizes CRLF
to LF, removes whitespace from otherwise empty lines, and collapses repeated
line breaks. Other spaces and a single final newline are preserved.

The workflow temporarily writes the cleaned text to the system clipboard and
sends Command + V. It marks that temporary item as `org.nspasteboard.TransientType`
so Alfred Clipboard History should ignore it. After 1.5 seconds, it restores the
original clipboard items and their formats, also adding the transient marker to
the first restored item to avoid adding the restoration as a new history entry.
The content is preserved, but that metadata remains until the next copy.

If the clipboard changes before restoration, the newer clipboard is left alone.
If the workflow is interrupted or restoration fails, the temporary text may
remain. Some clipboard managers may not honor the marker. Existing history
entries are not deleted. Very slow applications may need a longer delay in
`clean-paste.js`. Accessibility and Automation permissions may be needed.

## Installation and testing

Import `Clean-Paste.alfredworkflow` into Alfred 5. Confirm the hotkey is Control
+ Command + V. In a scratch document, copy Chinese text containing a blank line,
invoke the hotkey, and confirm fast clean paste. After two seconds, ordinary
Command + V should paste the original text. Open Alfred Clipboard History to
confirm no cleaned or restored duplicate was added. Test copied formatted text
and a new copy during the delay as well. Avoid testing in a shell prompt.

Normalization self-test: `/usr/bin/osascript -l JavaScript ./clean-paste.js --self-test`.
The included `clean-paste.swift` is the slower, no-clipboard-write alternative;
it is not the default action. Use Alfred's debugger for diagnostics.
