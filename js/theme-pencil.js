// js/theme-editor.js — Yellow Pencil Visual WYSIWYG Editor for Kitab
export function initThemeEditor(state) {
  const initialTokens = { ...state.book.theme?.tokens };
  
  // History stack for Undo / Redo
  let history = [JSON.stringify(initialTokens)];
  let pointer = 0;

  // Google Fonts Catalog
  const googleFonts = {
    "'Noto Serif', serif": "Noto+Serif:wght@400;700",
    "'Noto Sans', sans-serif": "Noto+Sans:wght@400;700",
    "'Merriweather', serif": "Merriweather:wght@400;700",
    "'Playfair Display', serif": "Playfair+Display:wght@400;700",
    "'Inter', sans-serif": "Inter:wght@400;700",
    "Georgia, serif": null,
    "'Courier New', monospace": null
  };

  // Helper: Inject Google Font stylesheet dynamically
  function loadFont(fontFamily) {
    const fontSpec = googleFonts[fontFamily];
    if (!fontSpec) return;
    const fontId = `gf-${fontSpec.replace(/[^a-zA-Z]/g, '')}`;
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontSpec}&display=swap`;
      document.head.appendChild(link);
    }
  }

  // Styles for the FAB and Editor Panel
  const style = document.createElement('style');
  style.textContent = `
    #kitab-pencil-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 52px; height: 52px; border-radius: 50%;
      background: #f59e0b; color: #111; border: 2px solid #fff;
      font-size: 22px; cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, background 0.2s;
    }
    #kitab-pencil-fab:hover { transform: scale(1.1); background: #d97706; }
    
    #kitab-editor-panel {
      position: fixed; top: 0; right: -380px; width: 360px; height: 100vh;
      background: #111827; color: #f3f4f6; z-index: 9998;
      box-shadow: -10px 0 30px rgba(0,0,0,0.5);
      border-left: 1px solid #374151; padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1.2rem;
      transition: right 0.3s ease; font-family: system-ui, -apple-system, sans-serif;
      overflow-y: auto;
    }
    #kitab-editor-panel.open { right: 0; }
    .ked-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; padding-bottom: 0.8rem; }
    .ked-head h3 { margin: 0; font-size: 1.1rem; color: #f59e0b; }
    .ked-close { background: none; border: none; color: #9ca3af; font-size: 1.5rem; cursor: pointer; }
    
    .ked-toolbar { display: flex; gap: 0.5rem; }
    .ked-btn {
      flex: 1; padding: 0.45rem 0.6rem; background: #1f2937; border: 1px solid #374151;
      color: #e5e7eb; border-radius: 6px; cursor: pointer; font-size: 0.82rem; transition: background 0.2s;
    }
    .ked-btn:hover { background: #374151; }
    .ked-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    
    .ked-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .ked-label { font-size: 0.78rem; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .ked-row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; font-size: 0.9rem; }
    
    .ked-color-wheel { width: 42px; height: 32px; border: none; background: none; cursor: pointer; padding: 0; border-radius: 4px; }
    .ked-select, .ked-range { background: #1f2937; color: #fff; border: 1px solid #374151; padding: 0.45rem; border-radius: 6px; width: 100%; }
    .ked-range { cursor: pointer; accent-color: #f59e0b; }
  `;
  document.head.appendChild(style);

  // Floating Action Button
  const fab = document.createElement('button');
  fab.id = 'kitab-pencil-fab';
  fab.innerHTML = '✏️';
  fab.title = 'Open Visual WYSIWYG Theme Editor';
  document.body.appendChild(fab);

  // Side Drawer Panel
  const panel = document.createElement('div');
  panel.id = 'kitab-editor-panel';
  panel.innerHTML = `
    <div class="ked-head">
      <h3>✏️ Theme WYSIWYG</h3>
      <button class="ked-close" id="ked-close">×</button>
    </div>

    <!-- History Controls -->
    <div class="ked-toolbar">
      <button class="ked-btn" id="ked-undo">↩️ Undo</button>
      <button class="ked-btn" id="ked-redo">↪️ Redo</button>
      <button class="ked-btn" id="ked-reset">🔄 Reset</button>
    </div>

    <!-- Colors -->
    <div class="ked-group">
      <div class="ked-label">Colors (Color Wheel)</div>
      <div class="ked-row">
        <span>Ink (Background)</span>
        <input type="color" class="ked-color-wheel" data-token="--ink">
      </div>
      <div class="ked-row">
        <span>Accent Color</span>
        <input type="color" class="ked-color-wheel" data-token="--acc">
      </div>
      <div class="ked-row">
        <span>Light (Text Color)</span>
        <input type="color" class="ked-color-wheel" data-token="--light">
      </div>
    </div>

    <!-- Typography -->
    <div class="ked-group">
      <div class="ked-label">Typography</div>
      <label class="ked-row" style="flex-direction:column; align-items:flex-start;">
        <span style="font-size:0.85rem; margin-bottom: 2px;">Body Font:</span>
        <select class="ked-select" data-token="--font-body">
          <option value="Georgia, serif">Georgia (Default)</option>
          <option value="'Noto Serif', serif">Noto Serif (Google Font)</option>
          <option value="'Noto Sans', sans-serif">Noto Sans (Google Font)</option>
          <option value="'Merriweather', serif">Merriweather (Google Font)</option>
          <option value="'Playfair Display', serif">Playfair Display (Google Font)</option>
          <option value="'Inter', sans-serif">Inter (Google Font)</option>
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </label>
      <label class="ked-row" style="flex-direction:column; align-items:flex-start;">
        <span style="font-size:0.85rem; margin-bottom: 2px;">Heading Font:</span>
        <select class="ked-select" data-token="--font-head">
          <option value="Georgia, serif">Georgia (Default)</option>
          <option value="'Noto Serif', serif">Noto Serif (Google Font)</option>
          <option value="'Noto Sans', sans-serif">Noto Sans (Google Font)</option>
          <option value="'Merriweather', serif">Merriweather (Google Font)</option>
          <option value="'Playfair Display', serif">Playfair Display (Google Font)</option>
          <option value="'Inter', sans-serif">Inter (Google Font)</option>
        </select>
      </label>
    </div>

    <!-- Geometry / Sliders -->
    <div class="ked-group">
      <div class="ked-label">Layout & Geometry Sliders</div>
      <label class="ked-row" style="flex-direction:column; align-items:flex-start;">
        <span style="font-size:0.85rem;" id="ked-val-radius">Border Radius: 4px</span>
        <input type="range" class="ked-range" data-token="--radius" min="0" max="24" step="1" data-unit="px">
      </label>
      <label class="ked-row" style="flex-direction:column; align-items:flex-start;">
        <span style="font-size:0.85rem;" id="ked-val-maxw">Max Content Width: 1100px</span>
        <input type="range" class="ked-range" data-token="--maxw" min="600" max="1400" step="20" data-unit="px">
      </label>
    </div>

    <!-- Export Action -->
    <div style="margin-top:auto; padding-top: 1rem;">
      <button class="ked-btn" id="ked-export" style="width:100%; background:#f59e0b; color:#111; font-weight:bold; padding:0.75rem; border:none;">
        📋 Copy JSON for book.config.json
      </button>
    </div>
  `;
  document.body.appendChild(panel);

  fab.addEventListener('click', () => panel.classList.toggle('open'));
  document.getElementById('ked-close').addEventListener('click', () => panel.classList.remove('open'));

  function updateUI(tokens) {
    for (const [k, v] of Object.entries(tokens)) {
      document.documentElement.style.setProperty(k, v);
      if (k.startsWith('--font')) loadFont(v);
    }

    panel.querySelectorAll('.ked-color-wheel').forEach(input => {
      const token = input.dataset.token;
      if (tokens[token]) input.value = tokens[token];
    });

    panel.querySelectorAll('.ked-select').forEach(select => {
      const token = select.dataset.token;
      if (tokens[token]) select.value = tokens[token];
    });

    panel.querySelectorAll('.ked-range').forEach(range => {
      const token = range.dataset.token;
      if (tokens[token]) {
        const num = parseInt(tokens[token]);
        if (!isNaN(num)) range.value = num;
      }
    });

    document.getElementById('ked-val-radius').textContent = `Border Radius: ${tokens['--radius'] || '4px'}`;
    document.getElementById('ked-val-maxw').textContent = `Max Content Width: ${tokens['--maxw'] || '1100px'}`;

    document.getElementById('ked-undo').disabled = pointer <= 0;
    document.getElementById('ked-redo').disabled = pointer >= history.length - 1;
  }

  function pushState(newTokens) {
    history = history.slice(0, pointer + 1);
    history.push(JSON.stringify(newTokens));
    pointer++;
    updateUI(newTokens);
  }

  function getActiveTokens() {
    return JSON.parse(history[pointer]);
  }

  panel.querySelectorAll('[data-token]').forEach(input => {
    input.addEventListener('change', (e) => {
      const token = e.target.dataset.token;
      const unit = e.target.dataset.unit || '';
      const val = e.target.value + unit;

      const updated = { ...getActiveTokens(), [token]: val };
      pushState(updated);
    });

    if (input.type === 'range' || input.type === 'color') {
      input.addEventListener('input', (e) => {
        const token = e.target.dataset.token;
        const unit = e.target.dataset.unit || '';
        const val = e.target.value + unit;
        document.documentElement.style.setProperty(token, val);
        if (unit) {
          if (token === '--radius') document.getElementById('ked-val-radius').textContent = `Border Radius: ${val}`;
          if (token === '--maxw') document.getElementById('ked-val-maxw').textContent = `Max Content Width: ${val}`;
        }
      });
    }
  });

  document.getElementById('ked-undo').addEventListener('click', () => {
    if (pointer > 0) { pointer--; updateUI(getActiveTokens()); }
  });

  document.getElementById('ked-redo').addEventListener('click', () => {
    if (pointer < history.length - 1) { pointer++; updateUI(getActiveTokens()); }
  });

  document.getElementById('ked-reset').addEventListener('click', () => {
    pushState(initialTokens);
  });

  document.getElementById('ked-export').addEventListener('click', async () => {
    const jsonOutput = JSON.stringify({ theme: { tokens: getActiveTokens() } }, null, 2);
    await navigator.clipboard.writeText(jsonOutput);
    alert('Exported theme tokens copied to clipboard!');
  });

  updateUI(initialTokens);
}
