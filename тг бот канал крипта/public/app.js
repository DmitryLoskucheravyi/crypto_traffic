const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const statusMode = document.getElementById('statusMode');
const statusNext = document.getElementById('statusNext');
const statusLast = document.getElementById('statusLast');
const statusMsg = document.getElementById('statusMsg');
const modeButtons = document.querySelectorAll('.mode-btn');
const postNowBtn = document.getElementById('postNowBtn');

const draftCard = document.getElementById('draftCard');
const draftText = document.getElementById('draftText');
const publishBtn = document.getElementById('publishBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const rejectBtn = document.getElementById('rejectBtn');

const historyList = document.getElementById('historyList');

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (res.status === 401) {
    showLogin();
    throw new Error('unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Помилка запиту (${res.status})`);
  }
  return data;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uk-UA');
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;
}

function showDashboard() {
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
  refreshAll();
}

function renderStatus(state) {
  statusMode.textContent = state.mode;
  statusNext.textContent = formatDate(state.nextRunAt);
  statusLast.textContent = formatDate(state.lastRunAt);

  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === state.mode));

  if (state.pendingDraft) {
    draftCard.hidden = false;
    draftText.textContent = state.pendingDraft;
  } else {
    draftCard.hidden = true;
    draftText.textContent = '';
  }
}

function renderHistory(items) {
  historyList.innerHTML = '';
  if (items.length === 0) {
    historyList.innerHTML = '<li>Історія порожня.</li>';
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    const preview = item.content ? item.content.slice(0, 140) : '(без тексту)';
    li.innerHTML = `
      <div class="history-meta">
        <span>${formatDate(item.createdAt)}</span>
        <span>${item.trigger}/${item.mode}</span>
        <span class="status-${item.status}">${item.status}</span>
      </div>
      <div>${preview}</div>
    `;
    historyList.appendChild(li);
  }
}

async function refreshAll() {
  const [state, history] = await Promise.all([api('/api/status'), api('/api/history?limit=20')]);
  renderStatus(state);
  renderHistory(history);
}

async function checkSession() {
  try {
    await api('/api/auth/me');
    showDashboard();
  } catch {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    loginForm.reset();
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message === 'unauthorized' ? 'Невірний логін або пароль' : err.message;
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  showLogin();
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    await api('/api/mode', { method: 'POST', body: JSON.stringify({ mode: btn.dataset.mode }) });
    refreshAll();
  });
});

postNowBtn.addEventListener('click', async () => {
  postNowBtn.disabled = true;
  statusMsg.hidden = false;
  statusMsg.textContent = 'Генерую допис...';
  try {
    await api('/api/post-now', { method: 'POST' });
    statusMsg.textContent = 'Готово.';
  } catch (err) {
    statusMsg.textContent = `Помилка: ${err.message}`;
  } finally {
    postNowBtn.disabled = false;
    refreshAll();
  }
});

publishBtn.addEventListener('click', async () => {
  await api('/api/draft/publish', { method: 'POST' });
  refreshAll();
});

regenerateBtn.addEventListener('click', async () => {
  regenerateBtn.disabled = true;
  try {
    await api('/api/draft/regenerate', { method: 'POST' });
  } finally {
    regenerateBtn.disabled = false;
    refreshAll();
  }
});

rejectBtn.addEventListener('click', async () => {
  await api('/api/draft/reject', { method: 'POST' });
  refreshAll();
});

checkSession();
