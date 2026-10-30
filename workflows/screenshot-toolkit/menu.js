ObjC.import('Foundation');
function run(argv) {
  const query = (argv[0] || '').trim().replace(/^menu /, '');
  const scopes = {full: 'Full Screen', area: 'Selected Area', window: 'Window'};
  const items = [];
  if (scopes[query]) {
    items.push({title: 'Copy to Clipboard', subtitle: scopes[query] + ' · 复制到剪贴板', arg: 'capture ' + query + ' clipboard', icon: {path: 'icons/clipboard.png'}});
    items.push({title: 'Save to File', subtitle: scopes[query] + ' · 保存 PNG 到 Downloads', arg: 'capture ' + query + ' file', icon: {path: 'icons/file.png'}});
  } else {
    for (const [id, title, subtitle] of [['area','Selected Area','区域截图'], ['full','Full Screen','全屏截图'], ['window','Window','窗口截图']]) {
      if (!query || (title + ' ' + subtitle + ' ' + id).toLowerCase().includes(query.toLowerCase()))
        items.push({title, subtitle, arg: '', variables: {capture_scope: id}, icon: {path: 'icons/' + id + '.png'}});
    }
  }
  return JSON.stringify({items});
}
