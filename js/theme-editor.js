// js/theme-editor.js — Live visual WYSIWYG theme editor for kitab
export function openThemeEditor(state) {
  const tokens = state.book.theme?.tokens || {};
  
  // Color & font fields to expose in the UI
  const editableKeys = [
    { key: '--ink', label: 'Background / Ink', type: 'color' },
    { key: '--acc', label: 'Accent Color', type: 'color' },
    { key: '--light', label: 'Text / Light', type: 'color' },
    { key: '--panel', label: 'Panel Fill', type: 'text' },
    { key: '--panel-border', label: 'Panel Border', type: 'text' },
    { key: '--font-body', label: 'Body Font', type: 'text' },
    { key: '--font-head', label: 'Heading Font', type: 'text' },
    { key: '--radius', label: 'Border Radius', type: 'text' },
    { key: '--maxw', label: 'Max Width', type: 'text' },
  ];

  // Helper to convert rgb/rgba/hex to hex for <input type="color">
  const toHex = (val) => {
    if (!val) return '#000000';
    if (val.startsWith('#')) return val.slice(0, 7);
    return '#d4a843'; // fallback
  };

  const fieldsHTML = editableKeys.map(item => {
    const curVal = tokens[item.key] || '';
    if (item.type === 'color') {
      return `
        <label class="kitab-field" style="display:flex; justify-space-between; align-items:center;">
          <span>${item.label} (${item.key})</span>
          <input type="color" data-token="${item.key}" value="${toHex(curVal)}" style="cursor:pointer; width:40px; height:30px; border:none; background:none;">
        </label>`;
    }
    return `
      <label class="kitab-field">
        <span>${item.label} (${item.key})</span>
        <input type="text" data-token="${item.key}" value="${curVal}">
      </label>`;
  }).join('');

  const modalHTML = `
    <p class="kitab-note">Tweak tokens visually. Changes reflect in real time.</p>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
      ${fieldsHTML}
    </div>
    <hr style="border-color:var(--panel-border); margin:0.5rem 0;">
    <button class="kitab-btn" id="kitab-export-theme">Export JSON to Clipboard</button>
  `;

  // Mount modal (using app.js's modal pattern)
  const back = document.createElement('div');
  back.className = 'kitab-modal-back';
  back.id = 'kitab-modal';
  back.innerHTML = `
    <div class="kitab-modal">
      <div class="kitab-modal-head">
        <b>Theme Visual Editor</b>
        <button class="kitab-x" id="kitab-x">×</button>
      </div>
      <div class="kitab-modal-body">${modalHTML}</div>
    </div>`;

  document.body.appendChild(back);

  const closeModal = () => back.remove();
  document.getElementById('kitab-x').addEventListener('click', closeModal);
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });

  // Bind live listeners
  back.querySelectorAll('[data-token]').forEach(input => {
    const token = input.dataset.token;
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      tokens[token] = val; // update in-memory state
      document.documentElement.style.setProperty(token, val); // update DOM live
    });
  });

  // Export updated config JSON
  document.getElementById('kitab-export-theme').addEventListener('click', async () => {
    const exportConfig = JSON.stringify({ tokens }, null, 2);
    await navigator.clipboard.writeText(exportConfig);
    alert('Exported theme tokens copied to clipboard! Paste them into config/book.config.json');
  });
}
