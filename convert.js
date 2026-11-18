import { convertImage, filenameFor, formats } from './image.js';
import { loadSource } from './source.js';

const status = document.querySelector('#status');
const detail = document.querySelector('#detail');
const save = document.querySelector('#save');
const preview = document.querySelector('#preview');
let outputUrl;
let filename;
let busy = false;
document.querySelector('#close').addEventListener('click', () => window.close());
window.addEventListener('pagehide', () => { if (outputUrl) URL.revokeObjectURL(outputUrl); });

async function download() {
  if (busy) return;
  busy = true;
  save.disabled = true;
  status.textContent = '請選擇儲存位置…';
  try {
    const id = await chrome.downloads.download({ url: outputUrl, filename, saveAs: true });
    // A download ID means accepted, not necessarily written to disk yet.
    const check = (item) => {
      if (item.state === 'complete') status.textContent = '已儲存，可以關閉此分頁。';
      else if (item.state === 'interrupted') status.textContent = '儲存已取消或中斷，可按下方按鈕重試。';
    };
    const listener = (delta) => {
      if (delta.id !== id || !delta.state) return;
      check({ state: delta.state.current });
      if (['complete', 'interrupted'].includes(delta.state.current)) chrome.downloads.onChanged.removeListener(listener);
    };
    chrome.downloads.onChanged.addListener(listener);
    status.textContent = '正在儲存，請稍候…';
    const [item] = await chrome.downloads.search({ id });
    if (item) {
      check(item);
      if (['complete', 'interrupted'].includes(item.state)) chrome.downloads.onChanged.removeListener(listener);
    }
  } catch (error) {
    status.textContent = '尚未儲存，可按下方按鈕重試。';
    detail.textContent = `${filename} · ${error.message}`;
  } finally {
    busy = false;
    save.disabled = false;
  }
}
save.addEventListener('click', download);

async function start() {
  const params = new URLSearchParams(location.hash.slice(1));
  const source = params.get('source');
  const format = params.get('format');
  if (!source || !Object.hasOwn(formats, format)) throw new Error('缺少圖片或格式，請回到網頁，對圖片按右鍵重新選擇。');
  const blob = await loadSource(source, params);
  status.textContent = `正在轉換為 ${format.toUpperCase()}…`;
  const result = await convertImage(blob, format);
  filename = filenameFor(source, format);
  outputUrl = URL.createObjectURL(result.blob);
  preview.src = outputUrl;
  preview.hidden = false;
  detail.textContent = `${filename} · ${result.width} × ${result.height} · ${Math.max(1, Math.round(result.blob.size / 1024))} KB`;
  save.hidden = false;
  await download();
}

start().catch(error => {
  status.textContent = '無法轉存這張圖片';
  detail.textContent = `${error.message} 若網站有登入、防盜連限制，或內容不是有效圖片，可能無法轉換。`;
});
