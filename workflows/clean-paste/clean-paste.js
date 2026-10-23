/* Clean Paste: macOS JavaScript for Automation, with no third-party runtime. */
function cleanText(text) {
    return text.replace(/\r\n/g, '\n')
        .replace(/(^|\n)[ \t]+(?=\n|$)/g, '$1')
        .replace(/\n{2,}/g, '\n');
}

function selfTest() {
    var cases = [
        ['paragraphs', '第一段内容。\n\n第二段内容。\n\n第三段内容。', '第一段内容。\n第二段内容。\n第三段内容。'],
        ['multiple blank lines', '第一段内容。\n\n\n\n第二段内容。', '第一段内容。\n第二段内容。'],
        ['single newline', '第一段内容。\n第二段内容。', '第一段内容。\n第二段内容。'],
        ['body spaces', 'Bank of America 股价上涨 10%。\n\nJPMorgan 股价上涨 100%。', 'Bank of America 股价上涨 10%。\nJPMorgan 股价上涨 100%。'],
        ['CRLF and whitespace rows', '第一段。\r\n \t\r\n\t\r\n  Second 😀 é。\r\nThird。', '第一段。\n  Second 😀 é。\nThird。'],
        ['empty', '', ''],
        ['whitespace only', ' \t\r\n\t\r\n', '\n'],
        ['indentation and trailing spaces', '  one  \n \t\n\t two  ', '  one  \n\t two  '],
        ['single final newline', 'one\n', 'one\n'],
        ['literal placeholders', '{clipboard}\n\n{date} $HOME `test`', '{clipboard}\n{date} $HOME `test`'],
        ['Unicode separators preserved', '甲\u2028乙\u2029丙', '甲\u2028乙\u2029丙'],
        ['spaces near Unicode separators', '甲\u2028 \u2028乙\n\n丙', '甲\u2028 \u2028乙\n丙']
    ];
    cases.forEach(function (item) {
        if (cleanText(item[1]) !== item[2]) throw Error('FAIL: ' + item[0]);
    });
    return 'PASS: ' + cases.length + ' text normalization cases';
}

function run(args) {
    if (args.length === 1 && args[0] === '--self-test') return selfTest();
    console.log('Clean Paste: started.');
    ObjC.import('AppKit');
    var pb = $.NSPasteboard.generalPasteboard;
    var ownedCount = null;
    // Keep NSPasteboardItem references inside a native Objective-C collection.
    var backup = $.NSMutableArray.alloc.init;
    var originalCount;
    var targetPID;
    var target;
    var events;
    var stage = 'read clipboard';

    function stop(reason) {
        console.log('Clean Paste: ' + reason + '.');
    }

    function restoreIfOwned() {
        if (ownedCount === null) return;
        if (Number(pb.changeCount) !== ownedCount) {
            stop('clipboard changed; preserving the newer clipboard');
            return;
        }
        try {
            pb.clearContents;
            if (!pb.writeObjects(backup)) throw Error('Restore write failed');
            var restoreCount = Number(pb.changeCount);
            var actual = pb.pasteboardItems;
            if (!actual || Number(actual.count) !== Number(backup.count)) throw Error('Restore item count mismatch');
            for (var i = 0; i < Number(backup.count); i++) {
                var expectedItem = backup.objectAtIndex(i);
                var actualItem = actual.objectAtIndex(i);
                var expectedTypes = expectedItem.types;
                if (Number(actualItem.types.count) !== Number(expectedTypes.count)) throw Error('Restore type count mismatch');
                for (var j = 0; j < Number(expectedTypes.count); j++) {
                    var type = expectedTypes.objectAtIndex(j);
                    var expectedData = expectedItem.dataForType(type);
                    var actualData = actualItem.dataForType(type);
                    if (!actualData || actualData.isNil() || !expectedData.isEqualToData(actualData)) throw Error('Restore data mismatch');
                }
            }
            if (Number(pb.changeCount) !== restoreCount) {
                stop('clipboard changed during verification; preserving the newer clipboard');
                return;
            }
            console.log('Clean Paste: original clipboard restored and verified.');
        } catch (error) {
            stop('clipboard restoration could not be verified');
        }
    }

    try {
        originalCount = Number(pb.changeCount);
        if (!isFinite(originalCount)) return stop('clipboard service unavailable');
        var value = ObjC.unwrap(pb.stringForType($.NSPasteboardTypeString));
        if (typeof value !== 'string' || value.length === 0 || /^[ \t\r\n]*$/.test(value)) return stop('no nonempty plain text available');
        var cleaned = cleanText(value);
        var items = pb.pasteboardItems;
        if (!items || Number(items.count) < 1 || !isFinite(Number(items.count))) return stop('clipboard items unavailable');

        // Materialize every representation before changing the pasteboard.
        stage = 'snapshot clipboard';
        for (var i = 0; i < Number(items.count); i++) {
            var source = items.objectAtIndex(i);
            var copy = $.NSPasteboardItem.alloc.init;
            var types = source.types;
            for (var j = 0; j < Number(types.count); j++) {
                var type = types.objectAtIndex(j);
                var data = source.dataForType(type);
                if (!data || data.isNil() || !copy.setDataForType(data, type)) return stop('cannot safely snapshot all clipboard formats');
            }
            backup.addObject(copy);
        }

        target = $.NSWorkspace.sharedWorkspace.frontmostApplication;
        targetPID = Number(target.processIdentifier);
        if (!isFinite(targetPID) || targetPID <= 0) return stop('focused application unavailable');
        // Permission checks happen before any clipboard mutation.
        stage = 'check System Events permissions';
        events = Application('System Events');
        if (!events.uiElementsEnabled()) {
            console.log('Clean Paste: enable Accessibility for Alfred in System Settings.');
            return;
        }
        if (Number(pb.changeCount) !== originalCount ||
            Number($.NSWorkspace.sharedWorkspace.frontmostApplication.processIdentifier) !== targetPID) return stop('clipboard or focused application changed');

        stage = 'write plain text';
        pb.clearContents;
        ownedCount = Number(pb.changeCount);
        if (!pb.setStringForType($(cleaned), $.NSPasteboardTypeString)) throw Error('Cannot write plain text');
        ownedCount = Number(pb.changeCount);
        if (Number($.NSWorkspace.sharedWorkspace.frontmostApplication.processIdentifier) !== targetPID) return stop('focused application changed before paste');
        stage = 'send paste command';
        events.keystroke('v', {using: ['command down']});
        console.log('Clean Paste: paste command sent.');
        // macOS offers no paste-consumed acknowledgement. Allow the target time to read.
        delay(1.5);
    } catch (error) {
        // Only diagnostics go to stderr; no clipboard content or error text is pasted.
        console.log('Clean Paste: failed at ' + stage + '; error type: ' + error.name + '; error number: ' +
            (typeof error.number === 'number' ? error.number : 'unavailable') + '.');
    } finally {
        restoreIfOwned();
    }
}
