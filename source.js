// Runs in the frame that owns the blob URL, not in the extension origin.
// Keep this function self-contained: Chrome serializes it for injection.
async function readPageBlob(source) {
  try {
    if (!source.startsWith('blob:')) throw new Error('不是暫存圖片網址。');
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (blob.size > 50 * 1024 * 1024) throw new Error('圖片超過 50 MB，請改用較小的圖片。');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('讀取暫存圖片失敗。'));
      reader.readAsDataURL(blob);
    });
    return { data };
  } catch (error) {
    return { error: error.message };
  }
}

export async function loadSource(source, params) {
  const protocol = new URL(source).protocol;
  let readable = source;
  if (protocol === 'blob:') {
    const tabId = Number(params.get('tab'));
    const frameId = Number(params.get('frame') ?? 0);
    if (!params.has('tab') || !Number.isInteger(tabId) || tabId < 0 || !Number.isInteger(frameId) || frameId < 0) {
      throw new Error('缺少原網頁資訊。請保持圖片所在分頁開啟，回到原圖片按右鍵重新轉存。');
    }
    let result;
    try {
      [result] = await chrome.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        func: readPageBlob,
        args: [source]
      });
    } catch {
      throw new Error('無法存取原圖片分頁。請保持原網頁開啟、確認插件的網站存取權，再對圖片按右鍵重試。');
    }
    if (!result?.result?.data) {
      throw new Error(`暫存圖片已失效或無法讀取，請重新開啟原圖片後再試。${result?.result?.error || ''}`);
    }
    readable = result.result.data;
  } else if (!['https:', 'http:', 'data:'].includes(protocol)) {
    throw new Error('不支援此圖片網址。請改用網頁上的圖片。');
  }
  const response = await fetch(readable, { credentials: 'include', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`圖片網站拒絕讀取（HTTP ${response.status}）。可嘗試先在新分頁開啟圖片。`);
  const blob = await response.blob();
  if (blob.size > 50 * 1024 * 1024) throw new Error('圖片超過 50 MB，請改用較小的圖片。');
  return blob;
}
