import type { FastifyInstance } from 'fastify'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sync Logs</title>
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
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    min-height: 100vh;
  }

  header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  header h1 { font-size: 16px; font-weight: 600; }
  header .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .auto-label { font-size: 11px; color: var(--muted); margin-left: auto; }

  .stats-bar {
    display: flex;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 100px;
  }
  .stat-value { font-size: 22px; font-weight: 700; }
  .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
  .stat-total .stat-value { color: var(--text); }
  .stat-info  .stat-value { color: var(--info); }
  .stat-warn  .stat-value { color: var(--warn); }
  .stat-error .stat-value { color: var(--error); }

  .filters {
    display: flex;
    gap: 10px;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    align-items: center;
  }
  .filters input, .filters select {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    padding: 7px 12px;
    font-size: 13px;
    outline: none;
    transition: border-color .15s;
  }
  .filters input:focus, .filters select:focus { border-color: var(--info); }
  .filters input[type="search"] { width: 220px; }
  .filters input[type="datetime-local"] { width: 190px; }
  .btn {
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    transition: background .15s, border-color .15s;
  }
  .btn:hover { background: var(--border); }
  .btn-primary { background: #3b55d4; border-color: #3b55d4; }
  .btn-primary:hover { background: #4a64e8; }
  .btn-sm { padding: 4px 10px; font-size: 12px; }

  .content { padding: 20px 24px; }

  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: var(--surface2);
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  tbody tr {
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background .1s;
  }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--surface2); }
  tbody td { padding: 10px 14px; vertical-align: top; }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .badge-info  { background: var(--info-bg);  color: var(--info); }
  .badge-warn  { background: var(--warn-bg);  color: var(--warn); }
  .badge-error { background: var(--error-bg); color: var(--error); }

  .event-chip {
    display: inline-block;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 4px;
    font-family: monospace;
  }

  .msg { font-size: 13px; }
  .product { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .time { font-size: 12px; color: var(--muted); white-space: nowrap; }

  /* Detail panel */
  .detail-row td {
    padding: 0 !important;
    background: #13151f;
  }
  .detail-inner {
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    font-family: monospace;
    white-space: pre-wrap;
    color: #a8b4c8;
    max-height: 300px;
    overflow-y: auto;
    word-break: break-all;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 0 0;
    font-size: 13px;
    color: var(--muted);
  }
  .pagination .btn { min-width: 80px; text-align: center; }

  .empty {
    text-align: center;
    padding: 60px 0;
    color: var(--muted);
  }
  .empty svg { opacity: .3; margin-bottom: 12px; }

  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--info);
    border-radius: 50%;
    animation: spin .6s linear infinite;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<header>
  <div class="dot"></div>
  <h1>Shopify → Instashop Sync Logs</h1>
  <span class="auto-label" id="refreshLabel">Refreshing every 30s</span>
</header>

<div class="stats-bar" id="statsBar">
  <div class="stat stat-total"><span class="stat-value" id="statTotal">—</span><span class="stat-label">Total</span></div>
  <div class="stat stat-info" ><span class="stat-value" id="statInfo">—</span><span class="stat-label">Info</span></div>
  <div class="stat stat-warn" ><span class="stat-value" id="statWarn">—</span><span class="stat-label">Warnings</span></div>
  <div class="stat stat-error"><span class="stat-value" id="statError">—</span><span class="stat-label">Errors</span></div>
</div>

<div class="filters">
  <input type="search" id="search" placeholder="Search messages, products…" />
  <select id="levelFilter">
    <option value="">All levels</option>
    <option value="info">Info</option>
    <option value="warn">Warning</option>
    <option value="error">Error</option>
  </select>
  <select id="eventFilter"><option value="">All events</option></select>
  <input type="datetime-local" id="fromDate" title="From date" />
  <input type="datetime-local" id="toDate"   title="To date" />
  <button class="btn btn-primary" onclick="fetchLogs(true)">Apply</button>
  <button class="btn" onclick="clearFilters()">Clear</button>
</div>

<div class="content">
  <div class="table-wrap">
    <table id="logsTable">
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

<script>
const PAGE_SIZE = 50
let currentOffset = 0
let totalRows = 0
let expandedRow = null

function fmtTime(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())} \${pad(d.getHours())}:\${pad(d.getMinutes())}:\${pad(d.getSeconds())}\`
}

function badge(level) {
  return \`<span class="badge badge-\${level}">\${level}</span>\`
}

async function loadEvents() {
  try {
    const res = await fetch('/api/logs/events')
    const events = await res.json()
    const sel = document.getElementById('eventFilter')
    events.forEach(e => {
      const opt = document.createElement('option')
      opt.value = e; opt.textContent = e
      sel.appendChild(opt)
    })
  } catch {}
}

async function fetchLogs(reset = false) {
  if (reset) currentOffset = 0

  const search  = document.getElementById('search').value.trim()
  const level   = document.getElementById('levelFilter').value
  const event   = document.getElementById('eventFilter').value
  const from    = document.getElementById('fromDate').value
  const to      = document.getElementById('toDate').value

  const params = new URLSearchParams({ limit: PAGE_SIZE, offset: currentOffset })
  if (search) params.set('search', search)
  if (level)  params.set('level', level)
  if (event)  params.set('event', event)
  if (from)   params.set('from', new Date(from).toISOString())
  if (to)     params.set('to',   new Date(to).toISOString())

  const tbody = document.getElementById('tbody')
  tbody.innerHTML = '<tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>'

  try {
    const res  = await fetch('/api/logs?' + params)
    const data = await res.json()

    totalRows = data.total
    const s = data.stats
    document.getElementById('statTotal').textContent = s.total_count
    document.getElementById('statInfo').textContent  = s.info_count
    document.getElementById('statWarn').textContent  = s.warn_count
    document.getElementById('statError').textContent = s.error_count

    renderTable(data.logs)
    renderPagination()
  } catch (e) {
    tbody.innerHTML = \`<tr><td colspan="5" class="empty">Failed to load logs: \${e.message}</td></tr>\`
  }
}

function renderTable(logs) {
  const tbody = document.getElementById('tbody')
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No logs found</td></tr>'
    return
  }

  tbody.innerHTML = logs.map((log, i) => {
    const det = log.details ? JSON.stringify(log.details, null, 2) : null
    return \`<tr data-idx="\${i}" data-details='\${det ? det.replace(/'/g,"&apos;") : ""}' onclick="toggleDetail(this, \${i})">
      <td class="time">\${fmtTime(log.created_at)}</td>
      <td>\${badge(log.level)}</td>
      <td><span class="event-chip">\${log.event}</span></td>
      <td>
        <div class="msg">\${escHtml(log.message)}</div>
        \${log.product_title || log.product_id
          ? \`<div class="product">\${escHtml(log.product_title || '')} \${log.product_id ? '<code>#' + log.product_id + '</code>' : ''}</div>\`
          : ''}
      </td>
      <td>\${det ? '<button class="btn btn-sm">View</button>' : '<span style="color:var(--muted)">—</span>'}</td>
    </tr>\`
  }).join('')
}

function toggleDetail(row, idx) {
  const existing = document.querySelector('.detail-row')
  if (existing) {
    const wasThisRow = existing.dataset.forIdx === String(idx)
    existing.remove()
    expandedRow = null
    if (wasThisRow) return
  }

  const details = row.dataset.details
  if (!details) return

  const detRow = document.createElement('tr')
  detRow.className = 'detail-row'
  detRow.dataset.forIdx = idx
  detRow.innerHTML = \`<td colspan="5"><div class="detail-inner">\${escHtml(details)}</div></td>\`
  row.after(detRow)
  expandedRow = idx
}

function renderPagination() {
  const pg = document.getElementById('pagination')
  const page = Math.floor(currentOffset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  pg.innerHTML = \`
    <button class="btn" \${currentOffset === 0 ? 'disabled' : ''} onclick="goPage(-1)">← Prev</button>
    <span>Page \${page} of \${totalPages} &nbsp;·&nbsp; \${totalRows} total</span>
    <button class="btn" \${currentOffset + PAGE_SIZE >= totalRows ? 'disabled' : ''} onclick="goPage(1)">Next →</button>
  \`
}

function goPage(dir) {
  currentOffset = Math.max(0, currentOffset + dir * PAGE_SIZE)
  fetchLogs()
}

function clearFilters() {
  document.getElementById('search').value = ''
  document.getElementById('levelFilter').value = ''
  document.getElementById('eventFilter').value = ''
  document.getElementById('fromDate').value = ''
  document.getElementById('toDate').value = ''
  fetchLogs(true)
}

function escHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
}

// Auto-refresh
let countdown = 30
setInterval(() => {
  countdown--
  if (countdown <= 0) {
    countdown = 30
    fetchLogs()
  }
  document.getElementById('refreshLabel').textContent = \`Refreshing in \${countdown}s\`
}, 1000)

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
