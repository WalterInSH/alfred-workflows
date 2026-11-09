import AppKit
import ApplicationServices
import Foundation

func cleanText(_ text: String) -> String {
    let lines = text.replacingOccurrences(of: "\r\n", with: "\n")
        .components(separatedBy: "\n")
        .map { $0.trimmingCharacters(in: CharacterSet(charactersIn: " \t")).isEmpty ? "" : $0 }
    return lines.joined(separator: "\n")
        .replacingOccurrences(of: "\n{2,}", with: "\n", options: .regularExpression)
}

if CommandLine.arguments.dropFirst().first == "--self-test" {
    let cases = [
        ("第一段。\n\n第二段。", "第一段。\n第二段。"),
        ("  one  \r\n \t\r\n\t two  ", "  one  \n\t two  "),
        ("甲😀e\u{301}\n\n乙\n", "甲😀e\u{301}\n乙\n"),
        ("{clipboard} $HOME `test`", "{clipboard} $HOME `test`")
    ]
    for (input, expected) in cases {
        guard cleanText(input) == expected else { fatalError("Normalization failed") }
    }
    print("PASS: \(cases.count) text normalization cases")
    exit(0)
}

print("Clean Paste: started.")
guard AXIsProcessTrusted() else {
    print("Clean Paste: enable Accessibility for the process running the workflow.")
    exit(1)
}
let pasteboard = NSPasteboard.general
let count = pasteboard.changeCount
guard let text = pasteboard.string(forType: .string),
      !text.isEmpty, text.rangeOfCharacter(from: CharacterSet(charactersIn: " \t\r\n").inverted) != nil else {
    print("Clean Paste: no nonempty plain text available.")
    exit(0)
}
guard let target = NSWorkspace.shared.frontmostApplication, target.processIdentifier > 0 else {
    print("Clean Paste: focused application unavailable.")
    exit(1)
}
guard pasteboard.changeCount == count,
      NSWorkspace.shared.frontmostApplication?.processIdentifier == target.processIdentifier else {
    print("Clean Paste: clipboard or focused application changed.")
    exit(1)
}

// Let the hotkey modifiers come up before delivering text.
Thread.sleep(forTimeInterval: 0.2)

// Post Unicode text directly to the target, without changing the pasteboard.
// One Unicode scalar per event keeps surrogate pairs together and stays within
// the Unicode payload limit for a keyboard event.
for scalar in cleanText(text).unicodeScalars {
    guard NSWorkspace.shared.frontmostApplication?.processIdentifier == target.processIdentifier else {
        print("Clean Paste: focus changed; input stopped.")
        exit(1)
    }
    let units = Array(String(scalar).utf16)
    guard let down = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true),
          let up = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) else {
        print("Clean Paste: could not create keyboard event; input stopped.")
        exit(1)
    }
    units.withUnsafeBufferPointer { buffer in
        down.keyboardSetUnicodeString(stringLength: buffer.count, unicodeString: buffer.baseAddress!)
        up.keyboardSetUnicodeString(stringLength: buffer.count, unicodeString: buffer.baseAddress!)
    }
    down.postToPid(target.processIdentifier)
    up.postToPid(target.processIdentifier)
    // Give the target time to process each key pair rather than flooding its queue.
    Thread.sleep(forTimeInterval: 0.01)
}
print("Clean Paste: text input events sent.")
