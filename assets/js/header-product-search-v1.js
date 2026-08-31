/* Qoffa Smart Header Search — live Arabic/French product discovery shared across public catalog surfaces. */
(() => {
  const PRODUCTS_URL = 'https://api.baserow.io/api/database/rows/table/882093/?user_field_names=true&size=200';
  const TOKEN = 'OIEan8aAjLjoCoTXKO6Evd4cifbtqRf8';
  // Optional: set `window.BASEROW_CDN_BASE` on pages to rewrite Baserow image hosts to a CDN.
  // Example: <script>window.BASEROW_CDN_BASE = 'https://cdn.example.com'</script>
  const CDN_BASE = (window && window.BASEROW_CDN_BASE) || '';
  let cataloguePromise;

  const normalize = value => String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ').trim();

  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]);
  const getImage = product => {
    const raw = product.product_image?.[0]?.url || '/assets/images/logo.png';
    if (!CDN_BASE) return raw;
    try {
      const u = new URL(raw, location.href);
      return CDN_BASE.replace(/\/$/, '') + u.pathname + u.search;
    } catch (e) {
      return raw;
    }
  };

  const getCatalogue = () => {
    if (!cataloguePromise) {
      cataloguePromise = fetch(PRODUCTS_URL, { headers: { Authorization: `Token ${TOKEN}` } })
        .then(response => { if (!response.ok) throw new Error('Product search unavailable'); return response.json(); })
        .then(data => {
          const toStr = v => (typeof v === 'string' ? v.toLowerCase().trim() : v);
          const isBaserowRowVisible = row => {
            if (!row || typeof row !== 'object') return true;
            if (row.hidden === true || row.hidden === 1 || toStr(row.hidden) === '1' || toStr(row.hidden) === 'true') return false;
            if (row.active === false || row.active === 0 || toStr(row.active) === '0' || toStr(row.active) === 'false') return false;
            if (row.is_active === false || row.is_active === 0 || toStr(row.is_active) === '0' || toStr(row.is_active) === 'false') return false;
            return true;
          };
          return (data.results || []).filter(product => product.name && isBaserowRowVisible(product)).map(product => ({
            id: product.id, name: product.name, nameFr: product.name_fr || product.name,
            price: Number(product.price) || 0, image: getImage(product)
          }));
        });
    }
    return cataloguePromise;
  };

  const renderState = (results, html) => { results.innerHTML = `<div class="qoffa-search-state">${html}</div>`; results.classList.add('is-visible'); };

  const mountSearch = root => {
    const input = root.querySelector('.qoffa-product-search-input');
    const results = root.querySelector('.qoffa-search-results');
    const clear = root.querySelector('.qoffa-search-clear');
    const mobileToggle = root.querySelector('.qoffa-search-mobile-toggle');
    if (!input || !results) return;

    const close = () => { root.classList.remove('is-open'); results.classList.remove('is-visible'); };
    const runSearch = async () => {
      const query = normalize(input.value);
      root.classList.toggle('has-query', Boolean(query));
      if (!query) { results.innerHTML = ''; results.classList.remove('is-visible'); return; }
      renderState(results, '<i class="fas fa-spinner fa-spin"></i><span>جاري البحث عن المنتجات...</span>');
      try {
        const matches = (await getCatalogue()).filter(product => normalize(`${product.name} ${product.nameFr}`).includes(query)).slice(0, 6);
        if (!matches.length) { renderState(results, '<i class="fas fa-search"></i><span>ما لقيناش منتج مطابق لبحثك</span>'); return; }
        results.innerHTML = matches.map(product => `<a class="qoffa-search-item" href="/product-detail/?id=${encodeURIComponent(product.id)}" role="option"><img alt="" loading="lazy" decoding="async" src="${escapeHtml(product.image)}"><span class="qoffa-search-item__copy"><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.nameFr)}</span></span><b class="qoffa-search-item__price">${product.price.toFixed(2)} د.م</b></a>`).join('');
        results.classList.add('is-visible');
      } catch (error) { renderState(results, '<i class="fas fa-circle-exclamation"></i><span>تعذر تحميل المنتجات، حاول مرة أخرى</span>'); }
    };

    let debounce;
    input.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(runSearch, 120); });
    input.addEventListener('focus', () => { if (input.value.trim()) runSearch(); });
    clear?.addEventListener('click', () => { input.value = ''; root.classList.remove('has-query'); close(); input.focus(); });
    mobileToggle?.addEventListener('click', () => { root.classList.toggle('is-open'); if (root.classList.contains('is-open')) setTimeout(() => input.focus(), 0); else close(); });
    input.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); input.blur(); } });
    document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
  };

  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-qoffa-product-search]').forEach(mountSearch));
})();
