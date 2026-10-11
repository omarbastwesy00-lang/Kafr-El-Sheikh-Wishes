import { createClient } from '@supabase/supabase-js';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import './admin.css';

const projectUrl = import.meta.env.VITE_SUPABASE_URL || '';
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = projectUrl && publishableKey ? createClient(projectUrl, publishableKey) : null;
const palette = ['#6fd8cb', '#f4c874', '#c79bff'];
const colorNames = ['فيروزي', 'ذهبي', 'أرجواني'];
const statusNames = { pending: 'قيد الانتظار', confirmed: 'مؤكدة', expired: 'منتهية', rejected: 'مرفوضة' };
const login = document.getElementById('login');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const message = document.getElementById('message');
const loginMessage = document.getElementById('login-message');
const rows = document.getElementById('orders');
let allOrders = [];
let activeStatus = 'pending';
let loadRunning = false;
let confirmedTotal = 0;

function notify(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = !text;
}

function errorText(error) {
  if (!supabase) return 'أضف إعدادات Supabase إلى متغيرات البناء أولًا.';
  if (error?.message?.includes('admin_only')) return 'هذا الحساب غير مسجل كمسؤول.';
  return error?.message || 'تعذر تنفيذ الطلب. تحقق من الاتصال ثم أعد المحاولة.';
}

function showDashboard() {
  login.hidden = true;
  dashboard.hidden = false;
  document.getElementById('logout').hidden = false;
}

async function loadData() {
  if (!supabase || loadRunning) return;
  loadRunning = true;
  document.getElementById('refresh').disabled = true;
  try {
    const [ordersResult, statsResult] = await Promise.all([
      supabase.rpc('admin_orders'),
      supabase.rpc('admin_stats')
    ]);
    if (ordersResult.error) throw ordersResult.error;
    if (statsResult.error) throw statsResult.error;
    allOrders = ordersResult.data || [];
    renderStats(statsResult.data || {});
    renderRows();
    notify('تم تحديث البيانات.', 'success');
  } catch (error) {
    notify(errorText(error), 'error');
    if (error?.message?.includes('admin_only')) {
      await supabase.auth.signOut();
      dashboard.hidden = true;
      login.hidden = false;
      document.getElementById('logout').hidden = true;
      loginMessage.textContent = errorText(error);
      loginMessage.className = 'message error';
      loginMessage.hidden = false;
    }
  } finally {
    loadRunning = false;
    document.getElementById('refresh').disabled = false;
  }
}

function renderStats(stats) {
  for (const status of Object.keys(statusNames)) {
    const count = Number(stats[status] ?? allOrders.filter((order) => order.status === status).length);
    document.getElementById(`stat-${status}`).textContent = status === 'confirmed' ? `${count} / 1,000` : String(count);
    document.getElementById(`tab-${status}`).textContent = String(count);
  }
  confirmedTotal = Number(stats.confirmed ?? allOrders.filter((order) => order.status === 'confirmed').length);
  document.getElementById('stat-today').textContent = String(stats.today ?? 0);
  const revenue = stats.revenue || {};
  for (const color of [0, 1, 2]) {
    document.getElementById(`rev-${color}`).textContent = `${colorNames[color]}: ${Number(revenue[color] || 0).toLocaleString('ar-EG')} ج`;
  }
}

function makeCell(content, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content == null ? '' : String(content);
  return cell;
}

function orderWarnings(order) {
  const normalizedWish = order.wish.trim().toLocaleLowerCase();
  const duplicatePhone = Boolean(order.sender_phone) && allOrders.some((other) => other.id !== order.id && other.sender_phone === order.sender_phone);
  const duplicateWish = allOrders.some((other) => other.id !== order.id && other.wish.trim().toLocaleLowerCase() === normalizedWish);
  const warnings = [];
  if (duplicatePhone) warnings.push('رقم التحويل مكرر');
  if (duplicateWish) warnings.push('نص الأمنية مكرر');
  if (order.status === 'pending') {
    const expiresAt = new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000;
    const remaining = expiresAt - Date.now();
    if (remaining > 0 && remaining < 2 * 60 * 60 * 1000) warnings.push(`ينتهي خلال ${Math.ceil(remaining / 60000)} د`);
  }
  return warnings;
}

function tentativePosition(order, pending) {
  if (order.status === 'confirmed') return Number(order.no).toLocaleString('ar-EG');
  if (order.status !== 'pending') return 'غير محجوز';
  const index = pending.findIndex((item) => item.id === order.id);
  return index < 0 ? '—' : `${confirmedTotal + index + 1}`;
}

function renderRows() {
  const search = document.getElementById('search').value.trim().toLocaleLowerCase();
  const oldestFirst = document.getElementById('sort').value === 'oldest';
  const pending = allOrders.filter((order) => order.status === 'pending')
    .sort((a, b) => Number(a.queue_seq) - Number(b.queue_seq));
  const visible = allOrders.filter((order) => order.status === activeStatus)
    .filter((order) => !search || [order.code, order.name, order.sender_phone].some((value) => String(value || '').toLocaleLowerCase().includes(search)))
    .sort((a, b) => (new Date(a.created_at) - new Date(b.created_at)) * (oldestFirst ? 1 : -1));
  rows.replaceChildren();
  for (const order of visible) rows.append(createRow(order, pending));
  document.getElementById('empty').hidden = visible.length !== 0;
}

function createRow(order, pending) {
  const row = document.createElement('tr');
  const code = document.createElement('strong');
  code.className = 'code';
  code.textContent = order.code;
  const status = document.createElement('small');
  status.className = 'subline';
  status.textContent = statusNames[order.status] || order.status;
  const codeBlock = document.createElement('div');
  codeBlock.append(code, status);
  row.append(makeCell(codeBlock));
  row.append(makeCell(order.name));

  const wishBlock = document.createElement('div');
  wishBlock.className = 'wish-cell';
  wishBlock.textContent = order.wish;
  for (const warning of orderWarnings(order)) {
    const label = document.createElement('small');
    label.className = 'warning';
    label.textContent = warning;
    wishBlock.append(document.createElement('br'), label);
  }
  row.append(makeCell(wishBlock));

  const colorBlock = document.createElement('span');
  const swatch = document.createElement('i');
  swatch.className = 'swatch';
  swatch.style.setProperty('--swatch', palette[order.color] || '#ffffff');
  colorBlock.append(swatch, document.createTextNode(`${colorNames[order.color] || '—'} · ${order.price} ج`));
  row.append(makeCell(colorBlock));

  const phoneButton = document.createElement('button');
  phoneButton.type = 'button';
  phoneButton.className = 'copy-phone';
  phoneButton.textContent = order.sender_phone || 'حُذف بعد سنة';
  phoneButton.title = 'اضغط لنسخ رقم التحويل';
  phoneButton.disabled = !order.sender_phone;
  phoneButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(order.sender_phone);
      notify('تم نسخ رقم التحويل.', 'success');
    } catch {
      notify('تعذر النسخ من هذا المتصفح.', 'error');
    }
  });
  row.append(makeCell(phoneButton));

  const time = document.createElement('div');
  const created = new Date(order.created_at);
  const date = document.createElement('time');
  date.dateTime = created.toISOString();
  date.textContent = created.toLocaleString('ar-EG');
  const age = document.createElement('small');
  age.className = 'age';
  age.textContent = `منذ ${Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000))} د`;
  time.append(date, age);
  row.append(makeCell(time));
  row.append(makeCell(tentativePosition(order, pending), 'position'));
  row.append(makeCell(createActions(order), 'row-editor'));
  return row;
}

function actionButton(label, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `action ${className}`;
  button.textContent = label;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await handler(button);
    } catch (error) {
      notify(errorText(error), 'error');
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

function createActions(order) {
  const wrapper = document.createElement('div');
  const controls = document.createElement('div');
  controls.className = 'row-actions';
  if (order.status === 'pending' || order.status === 'expired') {
    controls.append(actionButton('تأكيد', 'confirm', async (button) => {
      if (!window.confirm(`تأكيد استلام الدفع للطلب ${order.code}؟`)) return;
      button.textContent = 'جارٍ التأكيد...';
      const result = await supabase.rpc('confirm_order', { p_id: order.id });
      if (result.error) throw result.error;
      await loadData();
      notify(`تم التأكيد. رقم الأمنية ${Number(result.data).toLocaleString('ar-EG')}.`, 'success');
    }));
    controls.append(actionButton('رفض', 'reject', async (button) => {
      if (!window.confirm(`رفض الطلب ${order.code}؟`)) return;
      button.textContent = 'جارٍ الرفض...';
      const result = await supabase.rpc('reject_order', { p_id: order.id });
      if (result.error) throw result.error;
      await loadData();
      notify('تم رفض الطلب.', 'success');
    }));
  }
  wrapper.append(controls);
  if (order.status !== 'rejected') {
    const wishInput = document.createElement('textarea');
    wishInput.maxLength = 140;
    wishInput.setAttribute('aria-label', `تعديل أمنية ${order.code}`);
    wishInput.value = order.wish;
    const noteInput = document.createElement('input');
    noteInput.maxLength = 1000;
    noteInput.placeholder = 'ملاحظة إدارية';
    noteInput.setAttribute('aria-label', `ملاحظة ${order.code}`);
    noteInput.value = order.admin_note || '';
    wrapper.append(wishInput, noteInput, actionButton('حفظ التعديل والملاحظة', 'save', async () => {
      const result = await supabase.rpc('admin_update_order', {
        p_id: order.id,
        p_wish: wishInput.value,
        p_admin_note: noteInput.value
      });
      if (result.error) throw result.error;
      notify('تم حفظ التعديل.', 'success');
      await loadData();
    }));
  }
  return wrapper;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    if (!supabase) throw new Error('Supabase settings are missing.');
    const result = await supabase.auth.signInWithPassword({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });
    if (result.error) throw result.error;
    showDashboard();
    await loadData();
  } catch (error) {
    loginMessage.textContent = errorText(error);
    loginMessage.className = 'message error';
    loginMessage.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

document.getElementById('logout').addEventListener('click', async () => {
  if (supabase) await supabase.auth.signOut();
  allOrders = [];
  dashboard.hidden = true;
  login.hidden = false;
  document.getElementById('logout').hidden = true;
  loginMessage.hidden = true;
});

document.querySelectorAll('[data-status]').forEach((tab) => tab.addEventListener('click', () => {
  activeStatus = tab.dataset.status;
  document.querySelectorAll('[data-status]').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
  renderRows();
}));
document.getElementById('search').addEventListener('input', renderRows);
document.getElementById('sort').addEventListener('change', renderRows);
document.getElementById('refresh').addEventListener('click', loadData);
document.getElementById('export').addEventListener('click', () => {
  const fields = ['code', 'name', 'wish', 'color', 'price', 'sender_phone', 'status', 'created_at', 'confirmed_at', 'no', 'admin_note'];
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = '\ufeff' + [fields.join(','), ...allOrders.map((order) => fields.map((field) => quote(order[field])).join(','))].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = `kfs-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

async function restoreSession() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    showDashboard();
    await loadData();
  }
}
restoreSession();
setInterval(() => { if (!dashboard.hidden) loadData(); }, 30000);
