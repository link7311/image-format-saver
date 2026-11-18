chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'convert-image', title: '將圖片轉存為…', contexts: ['image'] });
    for (const format of ['jpg', 'png', 'webp']) {
      chrome.contextMenus.create({
        id: `convert-${format}`, parentId: 'convert-image',
        title: format.toUpperCase(), contexts: ['image']
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const format = String(info.menuItemId).replace('convert-', '');
  if (!['jpg', 'png', 'webp'].includes(format) || !info.srcUrl) return;
  const params = new URLSearchParams({ source: info.srcUrl, format });
  if (Number.isInteger(tab?.id)) params.set('tab', String(tab.id));
  params.set('frame', String(info.frameId ?? 0));
  chrome.tabs.create({ url: chrome.runtime.getURL(`convert.html#${params}`) });
});
