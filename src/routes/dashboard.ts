import type { FastifyInstance } from 'fastify'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sync Logs</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface2: #22263a;
    --border: #2e3248;
    --text: #e2e8f0;
    --muted: #8892a4;
    --info: #60a5fa;
    --info-bg: #1e3a5f;
    --warn: #fbbf24;
    --warn-bg: #3d2e0a;
    --error: #f87171;
    --error-bg: #3d1515;
    --green: #34d399;
    --green-bg: #0d2e1f;
  }

  body { background:var(--bg); color:var(--text); font-family:'Inter',system-ui,-apple-system,sans-serif; font-size:14px; line-height:1.6; min-height:100vh; }

  header { background:var(--surface); border-bottom:1px solid var(--border); padding:16px 24px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:10; }
  header h1 { font-size:16px; font-weight:600; }
  .dot { width:8px; height:8px; border-radius:50%; background:var(--green); animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .auto-label { font-size:11px; color:var(--muted); margin-left:auto; }

  /* Tabs */
  .tabs { display:flex; gap:2px; padding:12px 24px 0; border-bottom:1px solid var(--border); background:var(--surface); }
  .tab { padding:8px 18px; border-radius:6px 6px 0 0; font-size:13px; font-weight:500; cursor:pointer; color:var(--muted); border:1px solid transparent; border-bottom:none; transition:all .15s; position:relative; top:1px; }
  .tab:hover { color:var(--text); }
  .tab.active { background:var(--bg); border-color:var(--border); color:var(--text); }

  /* Stats */
  .stats-bar { display:flex; gap:12px; padding:16px 24px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
  .stat { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 16px; display:flex; flex-direction:column; gap:2px; min-width:100px; }
  .stat-value { font-size:22px; font-weight:700; }
  .stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; }
  .stat-total .stat-value { color:var(--text); }
  .stat-info  .stat-value { color:var(--info); }
  .stat-warn  .stat-value { color:var(--warn); }
  .stat-error .stat-value { color:var(--error); }

  /* Filters */
  .filters { display:flex; gap:10px; padding:14px 24px; border-bottom:1px solid var(--border); flex-wrap:wrap; align-items:center; }
  .filters input, .filters select {
    background:var(--surface); border:1px solid var(--border); border-radius:6px;
    color:var(--text); padding:7px 12px; font-size:13px; outline:none; transition:border-color .15s;
  }
  .filters input:focus, .filters select:focus { border-color:var(--info); }
  .search-wrap { position:relative; display:flex; align-items:center; }
  .search-wrap input { width:280px; padding-left:32px; }
  .search-icon { position:absolute; left:10px; color:var(--muted); pointer-events:none; }

  /* Date picker wrapper */
  .date-wrap { position:relative; display:flex; align-items:center; }
  .date-wrap .cal-icon { position:absolute; left:10px; color:var(--muted); pointer-events:none; z-index:1; }
  .date-wrap input { width:180px; padding-left:32px; cursor:pointer; }

  /* Override flatpickr to match theme */
  .flatpickr-calendar {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    border-radius: 10px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,.5) !important;
    font-family: inherit !important;
  }
  .flatpickr-months, .flatpickr-weekdays { background: var(--surface2) !important; }
  .flatpickr-month { color: var(--text) !important; fill: var(--text) !important; }
  .flatpickr-current-month input.cur-year,
  .flatpickr-current-month .flatpickr-monthDropdown-months { color: var(--text) !important; background: transparent !important; }
  .flatpickr-weekday { color: var(--muted) !important; }
  .flatpickr-day { color: var(--text) !important; border-radius: 6px !important; }
  .flatpickr-day:hover { background: var(--surface2) !important; border-color: var(--border) !important; }
  .flatpickr-day.selected, .flatpickr-day.startRange, .flatpickr-day.endRange {
    background: #3b55d4 !important; border-color: #3b55d4 !important; color: #fff !important;
  }
  .flatpickr-day.today { border-color: var(--info) !important; }
  .flatpickr-day.flatpickr-disabled { color: var(--border) !important; }
  .flatpickr-time { background: var(--surface) !important; border-top: 1px solid var(--border) !important; }
  .flatpickr-time input, .flatpickr-time .flatpickr-am-pm {
    color: var(--text) !important; background: transparent !important;
  }
  .flatpickr-time input:hover, .flatpickr-time .flatpickr-am-pm:hover { background: var(--surface2) !important; }
  .numInputWrapper span { border-color: var(--border) !important; }
  .numInputWrapper span svg { fill: var(--muted) !important; }
  .flatpickr-prev-month svg, .flatpickr-next-month svg { fill: var(--muted) !important; }
  .flatpickr-prev-month:hover svg, .flatpickr-next-month:hover svg { fill: var(--text) !important; }

  .btn { padding:7px 14px; border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; border:1px solid var(--border); background:var(--surface2); color:var(--text); transition:background .15s; }
  .btn:hover { background:var(--border); }
  .btn:disabled { opacity:.4; cursor:default; }
  .btn-primary { background:#3b55d4; border-color:#3b55d4; }
  .btn-primary:hover { background:#4a64e8; }
  .btn-sm { padding:4px 10px; font-size:12px; }

  /* Search results */
  .search-results { padding:20px 24px; display:flex; flex-direction:column; gap:10px; }
  .product-card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:14px 18px; }
  .product-card-header { display:flex; align-items:baseline; gap:10px; margin-bottom:8px; }
  .product-name { font-weight:600; font-size:14px; }
  .product-id { font-size:12px; color:var(--muted); font-family:monospace; }
  .product-time { font-size:12px; color:var(--muted); margin-left:auto; white-space:nowrap; }
  .barcode-list { display:flex; flex-wrap:wrap; gap:6px; }
  .barcode-chip { display:inline-flex; align-items:center; gap:5px; background:var(--surface2); border:1px solid var(--border); border-radius:5px; padding:3px 9px; font-size:12px; font-family:monospace; }
  .status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .status-dot.in_stock   { background:var(--green); }
  .status-dot.out_of_stock { background:var(--error); }
  .no-results { text-align:center; padding:60px 0; color:var(--muted); font-size:13px; }

  /* Table */
  .content { padding:20px 24px; }
  .table-wrap { background:var(--surface); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  table { width:100%; border-collapse:collapse; }
  thead th { background:var(--surface2); padding:10px 14px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); border-bottom:1px solid var(--border); }
  tbody tr { border-bottom:1px solid var(--border); cursor:pointer; transition:background .1s; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:var(--surface2); }
  tbody td { padding:10px 14px; vertical-align:top; }

  .badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
  .badge-info  { background:var(--info-bg);  color:var(--info); }
  .badge-warn  { background:var(--warn-bg);  color:var(--warn); }
  .badge-error { background:var(--error-bg); color:var(--error); }

  .event-chip { display:inline-block; background:var(--surface2); border:1px solid var(--border); color:var(--muted); font-size:11px; padding:1px 7px; border-radius:4px; font-family:monospace; }
  .msg { font-size:13px; }
  .product { font-size:12px; color:var(--muted); margin-top:2px; }
  .time { font-size:12px; color:var(--muted); white-space:nowrap; }

  .detail-row td { padding:0 !important; background:#13151f; }
  .detail-inner { padding:14px 18px; border-top:1px solid var(--border); font-size:12px; font-family:monospace; white-space:pre-wrap; color:#a8b4c8; max-height:300px; overflow-y:auto; word-break:break-all; }

  .pagination { display:flex; align-items:center; gap:8px; padding:14px 0 0; font-size:13px; color:var(--muted); }
  .pagination .btn { min-width:80px; text-align:center; }

  .empty { text-align:center; padding:60px 0; color:var(--muted); }
  .spinner { display:inline-block; width:14px; height:14px; border:2px solid var(--border); border-top-color:var(--info); border-radius:50%; animation:spin .6s linear infinite; vertical-align:middle; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .hidden { display:none !important; }
</style>
</head>
<body>

<header>
  <div class="dot"></div>
  <h1>Shopify → Instashop Sync Logs</h1>
  <span class="auto-label" id="lastUpdated"></span>
  <button class="btn" onclick="manualRefresh()" style="margin-left:8px">↻ Refresh</button>
</header>

<div class="tabs">
  <div class="tab active" onclick="switchTab('logs')">All Logs</div>
  <div class="tab" onclick="switchTab('search')">Search Products</div>
</div>

<!-- ═══ ALL LOGS TAB ═══ -->
<div id="tabLogs">
  <div class="stats-bar">
    <div class="stat stat-total"><span class="stat-value" id="statTotal">—</span><span class="stat-label">Total</span></div>
    <div class="stat stat-info" ><span class="stat-value" id="statInfo">—</span><span class="stat-label">Info</span></div>
    <div class="stat stat-warn" ><span class="stat-value" id="statWarn">—</span><span class="stat-label">Warnings</span></div>
    <div class="stat stat-error"><span class="stat-value" id="statError">—</span><span class="stat-label">Errors</span></div>
  </div>

  <div class="filters">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="search" id="logsSearch" placeholder="Search messages, products…" onkeydown="if(event.key==='Enter')fetchLogs(true)" />
    </div>
    <select id="levelFilter">
      <option value="">All levels</option>
      <option value="info">Info</option>
      <option value="warn">Warning</option>
      <option value="error">Error</option>
    </select>
    <select id="eventFilter"><option value="">All events</option></select>
    <div class="date-wrap">
      <svg class="cal-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <input type="text" id="fromDate" placeholder="From date & time" readonly />
    </div>
    <div class="date-wrap">
      <svg class="cal-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <input type="text" id="toDate" placeholder="To date & time" readonly />
    </div>
    <button class="btn btn-primary" onclick="fetchLogs(true)">Apply</button>
    <button class="btn" onclick="clearLogsFilters()">Clear</button>
  </div>

  <div class="content">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:130px">Time</th>
            <th style="width:70px">Level</th>
            <th style="width:180px">Event</th>
            <th>Message / Product</th>
            <th style="width:80px">Details</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
    <div class="pagination" id="pagination"></div>
  </div>
</div>

<!-- ═══ SEARCH PRODUCTS TAB ═══ -->
<div id="tabSearch" class="hidden">
  <div class="filters">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="search" id="productSearch" placeholder="Product name or barcode…" onkeydown="if(event.key==='Enter')searchProducts()" />
    </div>
    <button class="btn btn-primary" onclick="searchProducts()">Search</button>
    <button class="btn" onclick="clearProductSearch()">Clear</button>
  </div>
  <div class="search-results" id="searchResults">
    <p class="no-results" style="padding:40px 0">Type a product name or barcode and press Search</p>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script>
let currentTab = 'logs'
let currentOffset = 0
let totalRows = 0
let fpFrom, fpTo

// Init date pickers after flatpickr loads
const pickerOpts = {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  time_24hr: true,
  disableMobile: true,
}
fpFrom = flatpickr('#fromDate', pickerOpts)
fpTo   = flatpickr('#toDate',   pickerOpts)

function switchTab(tab) {
  currentTab = tab
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='logs')||(i===1&&tab==='search')))
  document.getElementById('tabLogs').classList.toggle('hidden', tab !== 'logs')
  document.getElementById('tabSearch').classList.toggle('hidden', tab !== 'search')
  if (tab === 'search') document.getElementById('productSearch').focus()
}

function fmtTime(iso) {
  const d = new Date(iso)
  const p = n => String(n).padStart(2,'0')
  return \`\${d.getFullYear()}-\${p(d.getMonth()+1)}-\${p(d.getDate())} \${p(d.getHours())}:\${p(d.getMinutes())}:\${p(d.getSeconds())}\`
}

function badge(level) { return \`<span class="badge badge-\${level}">\${level}</span>\` }

function escHtml(s) {
  if (!s) return ''
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

async function loadEvents() {
  try {
    const events = await fetch('/api/logs/events').then(r => r.json())
    const sel = document.getElementById('eventFilter')
    events.forEach(e => {
      const o = document.createElement('option')
      o.value = e; o.textContent = e; sel.appendChild(o)
    })
  } catch {}
}

async function fetchLogs(reset = false) {
  if (reset) currentOffset = 0
  const search = document.getElementById('logsSearch').value.trim()
  const level  = document.getElementById('levelFilter').value
  const event  = document.getElementById('eventFilter').value
  const from   = fpFrom.selectedDates[0]
  const to     = fpTo.selectedDates[0]

  const p = new URLSearchParams({ limit: 50, offset: currentOffset })
  if (search) p.set('search', search)
  if (level)  p.set('level', level)
  if (event)  p.set('event', event)
  if (from)   p.set('from', from.toISOString())
  if (to)     p.set('to',   to.toISOString())

  const tbody = document.getElementById('tbody')
  tbody.innerHTML = '<tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>'

  try {
    const data = await fetch('/api/logs?' + p).then(r => r.json())
    totalRows = data.total
    const s = data.stats
    document.getElementById('statTotal').textContent = s.total_count
    document.getElementById('statInfo').textContent  = s.info_count
    document.getElementById('statWarn').textContent  = s.warn_count
    document.getElementById('statError').textContent = s.error_count
    renderTable(data.logs)
    renderPagination()
    markUpdated()
  } catch (e) {
    tbody.innerHTML = \`<tr><td colspan="5" class="empty">Failed to load: \${e.message}</td></tr>\`
  }
}

function renderTable(logs) {
  const tbody = document.getElementById('tbody')
  if (!logs.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">No logs found</td></tr>'; return }
  tbody.innerHTML = logs.map((log, i) => {
    const det = log.details ? JSON.stringify(log.details, null, 2) : null
    return \`<tr data-idx="\${i}" data-details='\${det ? det.replace(/'/g,"&apos;") : ""}' onclick="toggleDetail(this,\${i})">
      <td class="time">\${fmtTime(log.created_at)}</td>
      <td>\${badge(log.level)}</td>
      <td><span class="event-chip">\${log.event}</span></td>
      <td>
        <div class="msg">\${escHtml(log.message)}</div>
        \${log.product_title || log.product_id
          ? \`<div class="product">\${escHtml(log.product_title||'')} \${log.product_id ? '<code>#'+log.product_id+'</code>' : ''}</div>\`
          : ''}
      </td>
      <td>\${det ? '<button class="btn btn-sm">View</button>' : '<span style="color:var(--muted)">—</span>'}</td>
    </tr>\`
  }).join('')
}

function toggleDetail(row, idx) {
  const existing = document.querySelector('.detail-row')
  if (existing) {
    const was = existing.dataset.forIdx === String(idx)
    existing.remove()
    if (was) return
  }
  const details = row.dataset.details
  if (!details) return
  const dr = document.createElement('tr')
  dr.className = 'detail-row'; dr.dataset.forIdx = idx
  dr.innerHTML = \`<td colspan="5"><div class="detail-inner">\${escHtml(details)}</div></td>\`
  row.after(dr)
}

function renderPagination() {
  const pg = document.getElementById('pagination')
  const page = Math.floor(currentOffset / 50) + 1
  const total = Math.max(1, Math.ceil(totalRows / 50))
  pg.innerHTML = \`
    <button class="btn" \${currentOffset===0?'disabled':''} onclick="goPage(-1)">← Prev</button>
    <span>Page \${page} of \${total} · \${totalRows} total</span>
    <button class="btn" \${currentOffset+50>=totalRows?'disabled':''} onclick="goPage(1)">Next →</button>
  \`
}

function goPage(dir) { currentOffset = Math.max(0, currentOffset + dir * 50); fetchLogs() }

function clearLogsFilters() {
  document.getElementById('logsSearch').value = ''
  document.getElementById('levelFilter').value = ''
  document.getElementById('eventFilter').value = ''
  fpFrom.clear()
  fpTo.clear()
  fetchLogs(true)
}

async function searchProducts() {
  const q = document.getElementById('productSearch').value.trim()
  const container = document.getElementById('searchResults')
  if (!q) return

  container.innerHTML = '<p class="no-results"><span class="spinner"></span></p>'

  try {
    const params = new URLSearchParams({ search: q, event: 'instashop_response', limit: 100, offset: 0 })
    const data = await fetch('/api/logs?' + params).then(r => r.json())

    if (!data.logs.length) {
      container.innerHTML = \`<p class="no-results">No synced products found for "<strong>\${escHtml(q)}</strong>"</p>\`
      return
    }

    container.innerHTML = data.logs.map(log => {
      const d = log.details || {}
      const updated = d.updated || []
      const failed  = d.failed  || []

      const barcodes = updated.map(u =>
        \`<span class="barcode-chip"><span class="status-dot \${u.status}"></span>\${escHtml(u.barcode)} <span style="color:var(--muted);font-size:11px">\${u.status==='in_stock'?'In Stock':'Out of Stock'}</span></span>\`
      ).join('')

      const failedChips = failed.map(f =>
        \`<span class="barcode-chip" style="border-color:var(--error-bg)"><span class="status-dot out_of_stock"></span>\${escHtml(f.barcode)} <span style="color:var(--error);font-size:11px">failed</span></span>\`
      ).join('')

      return \`<div class="product-card">
        <div class="product-card-header">
          <span class="product-name">\${escHtml(log.product_title || 'Unknown product')}</span>
          \${log.product_id ? \`<span class="product-id">#\${log.product_id}</span>\` : ''}
          <span class="product-time">\${fmtTime(log.created_at)}</span>
        </div>
        <div class="barcode-list">
          \${barcodes || failedChips || '<span style="color:var(--muted);font-size:12px">No variant data</span>'}
          \${barcodes && failedChips ? failedChips : ''}
        </div>
      </div>\`
    }).join('')
  } catch (e) {
    container.innerHTML = \`<p class="no-results">Search failed: \${e.message}</p>\`
  }
}

function clearProductSearch() {
  document.getElementById('productSearch').value = ''
  document.getElementById('searchResults').innerHTML = '<p class="no-results" style="padding:40px 0">Type a product name or barcode and press Search</p>'
}

function manualRefresh() { fetchLogs(true) }

function markUpdated() {
  const p = n => String(n).padStart(2,'0')
  const d = new Date()
  document.getElementById('lastUpdated').textContent =
    \`Last updated \${p(d.getHours())}:\${p(d.getMinutes())}:\${p(d.getSeconds())}\`
}

loadEvents()
fetchLogs()
</script>
</body>
</html>`

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    return reply.type('text/html').send(HTML)
  })
}
