// ==================== POST-ORDER POPUP SYSTEM ====================
// This file handles the success popup after order submission

let deferredPrompt = null;
let isAppInstalled = false;

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  isAppInstalled = false;
  updateInstallButtonState();
});

// Check if app is already installed
window.addEventListener('appinstalled', () => {
  isAppInstalled = true;
  deferredPrompt = null;
  updateInstallButtonState();
});

// Check if running in standalone mode (PWA installed)
function checkIfPWAInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isAppInstalled = true;
  }
  if (window.navigator.standalone === true) {
    isAppInstalled = true;
  }
}

function updateInstallButtonState() {
  const installBtn = document.getElementById('pwaInstallBtn');
  if (!installBtn) return;

  if (isAppInstalled || !deferredPrompt) {
    installBtn.textContent = '✓ التطبيق مثبت بالفعل';
    installBtn.disabled = true;
    installBtn.style.opacity = '0.6';
    installBtn.style.cursor = 'not-allowed';
  } else {
    installBtn.textContent = '📲 تثبيت تطبيق Qoffa Smart';
    installBtn.disabled = false;
    installBtn.style.opacity = '1';
    installBtn.style.cursor = 'pointer';
  }
}

// Show post-order popup
function showPostOrderPopup(orderId, orderData, cartItems) {
  checkIfPWAInstalled();

  const backdropId = 'postOrderBackdrop';
  const popupId = 'postOrderPopup';

  // Remove existing popups if any
  const existingBackdrop = document.getElementById(backdropId);
  const existingPopup = document.getElementById(popupId);
  if (existingBackdrop) existingBackdrop.remove();
  if (existingPopup) existingPopup.remove();

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = backdropId;
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9998;
    animation: fadeIn 0.3s ease;
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  // Create popup container
  const popup = document.createElement('div');
  popup.id = popupId;
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: popupScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    @keyframes popupScale {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `;

  // Create success view (default)
  const successView = createSuccessView(orderId, orderData, cartItems);
  popup.appendChild(successView);

  // Add to DOM
  document.body.appendChild(backdrop);
  document.body.appendChild(popup);

  // Close on backdrop click
  backdrop.addEventListener('click', () => {
    closePostOrderPopup();
  });

  // Store references
  popup.dataset.orderId = orderId;
  popup.dataset.orderData = JSON.stringify(orderData);
  popup.dataset.cartItems = JSON.stringify(cartItems);
}

function createSuccessView(orderId, orderData, cartItems) {
  const container = document.createElement('div');
  container.className = 'post-order-success-view';
  container.style.cssText = `
    padding: 30px 20px;
    text-align: center;
    animation: slideIn 0.4s ease;
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // Success animation
  const successIcon = document.createElement('div');
  successIcon.style.cssText = `
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #2E8B57, #3CB371);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    color: white;
    animation: pulse 2s infinite;
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `;
  successIcon.textContent = '✅';
  container.appendChild(successIcon);

  // Title
  const title = document.createElement('h2');
  title.textContent = 'تم إرسال طلبك بنجاح!';
  title.style.cssText = `
    margin: 0 0 10px 0;
    color: #1a1a2e;
    font-size: 1.5rem;
    font-weight: 800;
    font-family: 'Cairo', sans-serif;
  `;
  container.appendChild(title);

  // Order ID subtitle
  const subtitle = document.createElement('p');
  subtitle.textContent = `رقم التتبع: #${orderId}`;
  subtitle.style.cssText = `
    margin: 0 0 30px 0;
    color: #2E8B57;
    font-size: 1rem;
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
  `;
  container.appendChild(subtitle);

  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  `;

  // Button 1: View Details
  const viewDetailsBtn = document.createElement('button');
  viewDetailsBtn.textContent = '📋 عرض تفاصيل الطلب';
  viewDetailsBtn.style.cssText = `
    width: 100%;
    padding: 14px 20px;
    border: 2px solid #2E8B57;
    background: white;
    color: #2E8B57;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Cairo', sans-serif;
    transition: all 0.3s ease;
  `;
  viewDetailsBtn.addEventListener('mouseover', () => {
    viewDetailsBtn.style.background = '#f0f8f0';
  });
  viewDetailsBtn.addEventListener('mouseout', () => {
    viewDetailsBtn.style.background = 'white';
  });
  viewDetailsBtn.addEventListener('click', () => {
    showDetailsView(orderId, orderData, cartItems);
  });
  buttonsContainer.appendChild(viewDetailsBtn);

  // Button 2: PWA Install
  const installBtn = document.createElement('button');
  installBtn.id = 'pwaInstallBtn';
  installBtn.textContent = '📲 تثبيت تطبيق Qoffa Smart';
  installBtn.style.cssText = `
    width: 100%;
    padding: 14px 20px;
    border: none;
    background: linear-gradient(135deg, #2E8B57, #3CB371);
    color: white;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Cairo', sans-serif;
    transition: all 0.3s ease;
  `;
  installBtn.addEventListener('mouseover', () => {
    if (!installBtn.disabled) {
      installBtn.style.transform = 'translateY(-2px)';
      installBtn.style.boxShadow = '0 6px 20px rgba(46,139,87,0.3)';
    }
  });
  installBtn.addEventListener('mouseout', () => {
    if (!installBtn.disabled) {
      installBtn.style.transform = 'translateY(0)';
      installBtn.style.boxShadow = 'none';
    }
  });
  installBtn.addEventListener('click', () => {
    triggerPWAInstall();
  });
  buttonsContainer.appendChild(installBtn);

  // Button 3: Close
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ إغلاق';
  closeBtn.style.cssText = `
    width: 100%;
    padding: 14px 20px;
    border: none;
    background: #f0f0f0;
    color: #333;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Cairo', sans-serif;
    transition: all 0.3s ease;
  `;
  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.background = '#e0e0e0';
  });
  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.background = '#f0f0f0';
  });
  closeBtn.addEventListener('click', () => {
    closePostOrderPopup();
  });
  buttonsContainer.appendChild(closeBtn);

  container.appendChild(buttonsContainer);

  // Update install button state
  updateInstallButtonState();

  return container;
}

function createDetailsView(orderId, orderData, cartItems) {
  const container = document.createElement('div');
  container.className = 'post-order-details-view';
  container.style.cssText = `
    padding: 30px 20px;
    animation: slideIn 0.4s ease;
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // Header with back button
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
  `;

  const backBtn = document.createElement('button');
  backBtn.textContent = '← رجوع';
  backBtn.style.cssText = `
    background: none;
    border: none;
    color: #2E8B57;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Cairo', sans-serif;
    padding: 0;
  `;
  backBtn.addEventListener('click', () => {
    const popup = document.getElementById('postOrderPopup');
    popup.innerHTML = '';
    const successView = createSuccessView(orderId, orderData, cartItems);
    popup.appendChild(successView);
  });
  header.appendChild(backBtn);

  const headerTitle = document.createElement('h3');
  headerTitle.textContent = 'تفاصيل الطلب';
  headerTitle.style.cssText = `
    margin: 0;
    color: #1a1a2e;
    font-size: 1.2rem;
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
  `;
  header.appendChild(headerTitle);

  container.appendChild(header);

  // Customer Info Section
  const customerSection = document.createElement('div');
  customerSection.style.cssText = `
    background: #f9f9f9;
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
  `;

  const customerTitle = document.createElement('h4');
  customerTitle.textContent = '📋 معلومات العميل';
  customerTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #2E8B57;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
  `;
  customerSection.appendChild(customerTitle);

  const customerInfo = [
    { label: 'الاسم الكامل:', value: orderData.fullName },
    { label: 'رقم الهاتف:', value: orderData.phone || 'غير محدد' },
    { label: 'العنوان:', value: orderData.address },
    { label: 'الحي:', value: orderData.neighborhood },
    { label: 'وقت التوصيل المقترح:', value: orderData.deliveryTime }
  ];

  customerInfo.forEach((item) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.9rem;
      font-family: 'Cairo', sans-serif;
    `;
    row.innerHTML = `
      <span style="color: #666; font-weight: 600;">${item.label}</span>
      <span style="color: #333; font-weight: 700;">${item.value}</span>
    `;
    customerSection.appendChild(row);
  });

  container.appendChild(customerSection);

  // Products Section
  const productsSection = document.createElement('div');
  productsSection.style.cssText = `
    background: #f9f9f9;
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
  `;

  const productsTitle = document.createElement('h4');
  productsTitle.textContent = '🛒 المنتجات المطلوبة';
  productsTitle.style.cssText = `
    margin: 0 0 12px 0;
    color: #2E8B57;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
  `;
  productsSection.appendChild(productsTitle);

  cartItems.forEach((item, idx) => {
    const productRow = document.createElement('div');
    productRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: ${idx < cartItems.length - 1 ? '1px solid #e0e0e0' : 'none'};
      font-size: 0.85rem;
      font-family: 'Cairo', sans-serif;
    `;
    productRow.innerHTML = `
      <div style="flex: 1;">
        <div style="color: #333; font-weight: 700; margin-bottom: 2px;">${item.name}</div>
        <div style="color: #888; font-size: 0.8rem;">${item.quantity} ${item.unit || 'كجم'}</div>
      </div>
      <div style="color: #2E8B57; font-weight: 700; text-align: left;">
        ${(item.price * item.quantity).toFixed(2)} درهم
      </div>
    `;
    productsSection.appendChild(productRow);
  });

  container.appendChild(productsSection);

  // Totals Section
  const totalsSection = document.createElement('div');
  totalsSection.style.cssText = `
    background: linear-gradient(135deg, rgba(46,139,87,0.08), rgba(60,179,113,0.06));
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
  `;

  const totalRows = [
    { label: 'المجموع الفرعي:', value: orderData.subtotal.toFixed(2) + ' درهم' },
    { label: 'رسوم التوصيل:', value: orderData.deliveryFee === 0 ? 'مجاني' : orderData.deliveryFee + ' درهم' },
    { label: 'المجموع الكلي:', value: orderData.total.toFixed(2) + ' درهم', isBold: true }
  ];

  totalRows.forEach((item, idx) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 0.9rem;
      font-family: 'Cairo', sans-serif;
      ${item.isBold ? 'border-top: 2px solid rgba(46,139,87,0.2); padding-top: 12px; margin-top: 4px;' : ''}
      ${item.isBold ? 'font-weight: 800; color: #2E8B57; font-size: 1rem;' : 'color: #555; font-weight: 600;'}
    `;
    row.innerHTML = `
      <span>${item.label}</span>
      <span>${item.value}</span>
    `;
    totalsSection.appendChild(row);
  });

  container.appendChild(totalsSection);

  // Notes section if present
  if (orderData.notes) {
    const notesSection = document.createElement('div');
    notesSection.style.cssText = `
      background: #fff8f0;
      padding: 12px;
      border-radius: 12px;
      border-right: 4px solid #ff9800;
      margin-bottom: 20px;
    `;

    const notesTitle = document.createElement('p');
    notesTitle.textContent = 'ملاحظات:';
    notesTitle.style.cssText = `
      margin: 0 0 6px 0;
      color: #ff9800;
      font-weight: 700;
      font-family: 'Cairo', sans-serif;
      font-size: 0.85rem;
    `;
    notesSection.appendChild(notesTitle);

    const notesText = document.createElement('p');
    notesText.textContent = orderData.notes;
    notesText.style.cssText = `
      margin: 0;
      color: #666;
      font-size: 0.85rem;
      font-family: 'Cairo', sans-serif;
      line-height: 1.4;
    `;
    notesSection.appendChild(notesText);

    container.appendChild(notesSection);
  }

  return container;
}

function showDetailsView(orderId, orderData, cartItems) {
  const popup = document.getElementById('postOrderPopup');
  popup.innerHTML = '';
  const detailsView = createDetailsView(orderId, orderData, cartItems);
  popup.appendChild(detailsView);
}

function closePostOrderPopup() {
  const backdrop = document.getElementById('postOrderBackdrop');
  const popup = document.getElementById('postOrderPopup');

  if (backdrop) {
    backdrop.style.animation = 'fadeOut 0.3s ease forwards';
  }
  if (popup) {
    popup.style.animation = 'popupScaleOut 0.3s ease forwards';
  }

  setTimeout(() => {
    if (backdrop) backdrop.remove();
    if (popup) popup.remove();
    // Redirect to products page
    window.location.href = '/products/';
  }, 300);
}

async function triggerPWAInstall() {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);

  deferredPrompt = null;
  updateInstallButtonState();
}

// Add styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes popupScaleOut {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
  }
`;
document.head.appendChild(style);
