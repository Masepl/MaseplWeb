const updateBtn = document.getElementById('update-btn');

// Update logic
updateBtn.onclick = async () => {
  updateBtn.disabled = true;
  updateBtn.title = 'Checking...';
  const result = await window.electronAPI.checkForUpdate();
  updateBtn.disabled = false;
  updateBtn.title = 'Check for Updates';
  if (result && result.error) {
    alert('Update check failed: ' + result.error);
    return;
  }
  if (result && result.version) {
    if (confirm(`A new version (${result.version}) is available!\n\n${result.notes || ''}\n\nDownload and install now?`)) {
      window.electronAPI.runUpdater(result.path);
    }
  } else {
    alert('No update found.');
  }
};


const webview = document.getElementById('webview');
const urlInput = document.getElementById('url');
const goBtn = document.getElementById('go');
const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');
const bookmarkPageBtn = document.getElementById('bookmark-page-btn');
const bookmarksBtn = document.getElementById('bookmarks-btn');
const bookmarksModal = document.getElementById('bookmarks-modal');
const bookmarksList = document.getElementById('bookmarks-list');
const closeBookmarks = document.getElementById('close-bookmarks');
let history = JSON.parse(localStorage.getItem('history') || '[]');
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

function saveHistory(url, title) {
  if (!url || url.startsWith('about:')) return;
  history.push({ url, title, time: new Date().toLocaleString() });
  if (history.length > 200) history = history.slice(-200);
  localStorage.setItem('history', JSON.stringify(history));
}

function navigate() {
  let url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  webview.src = url;
}
goBtn.onclick = navigate;
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(); });
backBtn.onclick = () => webview.goBack();
forwardBtn.onclick = () => webview.goForward();
reloadBtn.onclick = () => webview.reload();

webview.addEventListener('did-navigate', () => {
  urlInput.value = webview.getURL();
  saveHistory(webview.getURL(), webview.getTitle());
});
webview.addEventListener('did-navigate-in-page', () => {
  urlInput.value = webview.getURL();
  saveHistory(webview.getURL(), webview.getTitle());
});
webview.addEventListener('did-finish-load', () => {
  urlInput.value = webview.getURL();
  saveHistory(webview.getURL(), webview.getTitle());
});

// Bookmarks logic
bookmarkPageBtn.onclick = () => {
  const url = webview.getURL();
  const title = webview.getTitle() || url;
  if (!bookmarks.some(b => b.url === url)) {
    bookmarks.push({ url, title });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    alert('Bookmarked!');
  }
};
bookmarksBtn.onclick = () => {
  bookmarksList.innerHTML = '';
  bookmarks.slice().reverse().forEach(entry => {
    const li = document.createElement('li');
    li.style.marginBottom = '8px';
    li.innerHTML = `<a href=\"#\" style=\"color:#4f8cff;text-decoration:none;\" data-url=\"${entry.url}\">${entry.title || entry.url}</a>`;
    li.querySelector('a').onclick = (e) => {
      e.preventDefault();
      urlInput.value = entry.url;
      navigate();
      bookmarksModal.style.display = 'none';
    };
    bookmarksList.appendChild(li);
  });
  bookmarksModal.style.display = 'flex';
};
closeBookmarks.onclick = () => { bookmarksModal.style.display = 'none'; };
bookmarksModal.onclick = (e) => { if (e.target === bookmarksModal) bookmarksModal.style.display = 'none'; };

// History modal logic
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const closeHistory = document.getElementById('close-history');

historyBtn.onclick = () => {
  historyList.innerHTML = '';
  history.slice().reverse().forEach(entry => {
    const li = document.createElement('li');
    li.style.marginBottom = '8px';
    li.innerHTML = `<a href=\"#\" style=\"color:#4f8cff;text-decoration:none;\" data-url=\"${entry.url}\">${entry.title || entry.url}</a> <span style=\"color:#888;font-size:0.9em;\">${entry.time}</span>`;
    li.querySelector('a').onclick = (e) => {
      e.preventDefault();
      urlInput.value = entry.url;
      navigate();
      historyModal.style.display = 'none';
    };
    historyList.appendChild(li);
  });
  historyModal.style.display = 'flex';
};
closeHistory.onclick = () => { historyModal.style.display = 'none'; };
historyModal.onclick = (e) => { if (e.target === historyModal) historyModal.style.display = 'none'; };
