// WhatsCart - Frontend Controller linking to Node.js Backend Server API

// 1. Offline Mode Detection
const isOffline = window.location.protocol === 'file:';

// 1.1 In-Memory Database for local offline presentation (double-clicking landing.html)
const offlineDB = {
  stats: { sales: 148200, conversion: 5.4, sessions: 84, orderCount: 78 },
  products: [
    { id: 'prod1', name: 'Daab Chingri', price: 645, sku: 'BENG-DAAB-01', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80', desc: 'Tender prawns cooked in a rich mustard and coconut cream blend, served inside a fresh green coconut shell.' },
    { id: 'prod2', name: 'Bhapa Ilish', price: 725, sku: 'BENG-ILISH-02', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&auto=format&fit=crop&q=80', desc: 'The queen of fish, Hilsa, steamed to perfection with a sharp, pungent paste of mustard, poppy seeds, and green chilies.' },
    { id: 'prod3', name: 'Kosha Mangsho', price: 595, sku: 'BENG-KOSHA-03', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80', desc: 'Velvet-textured mutton pieces slow-cooked over hours in a thick, spicy, dark gravy of caramelized onions and traditional spices.' },
    { id: 'prod4', name: 'Bhetki Paturi', price: 525, sku: 'BENG-PATURI-04', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop&q=80', desc: 'Fresh fillet of Bhetki marinated in mustard, coconut, and chili paste, wrapped neatly in banana leaf envelopes and steamed.' }
  ],
  customers: {
    anirban: { id: 'anirban', name: 'Anirban Chatterjee', phone: '+91 98300 12345', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', ltv: 3280, ordersCount: 3, state: 'STATE_COMPLETED', address: 'Flat 4B, 12 Gariahat Road, Kolkata, WB 700019', notes: 'Prefers standard spice levels.', cart: [], chatHistory: [
      { sender: 'bot', text: '👋 Welcome to 6 Ballygunge Place! Tap the button below to browse our authentic Bengali culinary catalog.', time: '09:30 AM', isTemplate: true, templateType: 'welcome' },
      { sender: 'customer', text: 'Hi, I want to order some food for family lunch!', time: '09:31 AM' },
      { sender: 'bot', text: 'Sure! Here is our signature bestseller:', time: '09:31 AM', isProductCard: true, productId: 'prod1' }
    ]},
    priyanka: { id: 'priyanka', name: 'Priyanka Sen', phone: '+91 90070 98765', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', ltv: 999, ordersCount: 1, state: 'STATE_WAITING_AGENT', address: 'Ballygunge Circular Road, Building 5A, Kolkata, WB 700019', notes: 'Asked about gluten-free/allergy details on mustard gravy.', cart: [], chatHistory: [
      { sender: 'customer', text: 'Is the Bhapa Ilish prepared with white mustard or black mustard? I prefer a milder flavor.', time: '09:10 AM' }
    ]},
    rahul: { id: 'rahul', name: 'Rahul Banerjee', phone: '+91 80170 54321', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', ltv: 2185, ordersCount: 4, state: 'STATE_COMPLETED', address: 'Sector V, DLF 2, Salt Lake, Kolkata, WB 700091', notes: 'Prefers quick corporate lunch deliveries.', cart: [], chatHistory: [
      { sender: 'bot', text: 'Your order #W-9840 has been dispatched! Delivery executive is on the way. Contact: +91 98830 99211.', time: '08:00 AM' }
    ]}
  },
  orders: [
    { id: '#W-3916', customer: 'Anirban Chatterjee', products: 'Daab Chingri × 2', status: 'paid', total: '₹1290.00', source: 'chatbot' },
    { id: '#W-2728', customer: 'Anirban Chatterjee', products: 'Grand Bengali Non-Veg Thali × 1', status: 'paid', total: '₹999.00', source: 'chatbot' },
    { id: '#W-9840', customer: 'Rahul Banerjee', products: 'Bhapa Ilish × 3', status: 'shipped', total: '₹2175.00', source: 'chatbot' }
  ],
  logs: []
};

// 1.2 App State (mirrored from backend)
const state = {
  activeTab: 'dashboard',
  activeCustomer: 'anirban',
  activeOutlet: 'all',
  selectedTone: 'bengali',
  stats: { sales: 0, conversion: 0, sessions: 0, orderCount: 0 },
  products: [],
  orders: [],
  activeCustomerData: null,
  outletsData: [],
  collectionsData: null,
  catalogFilters: {
    search: '',
    category: 'all',
    dietary: 'all',
    sort: 'recommended'
  },
  lastLogTimestamp: null
};

// 2. DOM Elements Selection
const elements = {
  tabItems: document.querySelectorAll('.nav-item'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  currentTabTitle: document.getElementById('current-tab-title'),
  currentTabDesc: document.getElementById('current-tab-desc'),
  threadItems: document.querySelectorAll('.thread-item'),
  
  // Dashboard indicators
  dashboardSales: document.getElementById('dashboard-sales'),
  dashboardConversion: document.getElementById('dashboard-conversion'),
  dashboardSessions: document.getElementById('dashboard-sessions'),
  recentOrdersTbody: document.getElementById('recent-orders-tbody'),
  inboxUnreadCount: document.getElementById('inbox-unread-count'),
  
  // Merchant Chat Panels
  chatHeaderAvatar: document.getElementById('chat-header-avatar'),
  chatHeaderName: document.getElementById('chat-header-name'),
  merchantMessagesContainer: document.getElementById('merchant-messages-container'),
  merchantReplyInput: document.getElementById('merchant-reply-input'),
  btnSendMerchantReply: document.getElementById('btn-send-merchant-reply'),
  btnTakeover: document.getElementById('btn-takeover'),
  btnToggleCrm: document.getElementById('btn-toggle-crm'),
  btnToggleSim: document.getElementById('btn-toggle-sim'),
  crmDrawer: document.querySelector('.crm-drawer'),
  simulatorWrapper: document.getElementById('simulator-wrapper'),
  
  // CRM Panels
  crmAvatar: document.getElementById('crm-avatar'),
  crmName: document.getElementById('crm-name'),
  crmPhone: document.getElementById('crm-phone'),
  crmActiveState: document.getElementById('crm-active-state'),
  crmAddress: document.getElementById('crm-address'),
  crmNotes: document.querySelector('.crm-notes'),
  btnSyncShopify: document.querySelector('.sync-actions-row button'),
  
  // Utilities & Modals
  btnTemplatesDropdown: document.getElementById('btn-templates-dropdown'),
  templatesMenu: document.getElementById('templates-menu'),
  templatesModal: document.getElementById('templates-modal'),
  btnCloseTemplatesModal: document.getElementById('btn-close-templates-modal'),
  templateTargetCustomer: document.getElementById('template-target-customer'),
  btnPushCatalog: document.getElementById('btn-push-catalog'),
  pushProductsMenu: document.getElementById('push-products-menu'),
  sendProductModal: document.getElementById('send-product-modal'),
  btnCloseSendProductModal: document.getElementById('btn-close-send-product-modal'),
  sendProductTargetName: document.getElementById('send-product-target-name'),
  sendProductSearch: document.getElementById('send-product-search'),
  sendProductGrid: document.getElementById('send-product-grid'),
  chatSearchInput: document.getElementById('chat-search-input'),
  
  // WhatsApp Simulator
  waMessagesLog: document.getElementById('wa-messages-log'),
  waUserInput: document.getElementById('wa-user-input'),
  btnSendWaMessage: document.getElementById('btn-send-wa-message'),
  waSendIcon: document.getElementById('wa-send-icon'),
  
  // WhatsApp Catalog/Cart/Payment
  waCatalogModal: document.getElementById('wa-catalog-modal'),
  btnCloseWaCatalog: document.getElementById('btn-close-wa-catalog'),
  btnWaViewCart: document.getElementById('btn-wa-view-cart'),
  waCartBadge: document.getElementById('wa-cart-badge'),
  waCatalogProductsContainer: document.getElementById('wa-catalog-products-container'),
  
  waCartModal: document.getElementById('wa-cart-modal'),
  btnCloseWaCart: document.getElementById('btn-close-wa-cart'),
  waCartItemsContainer: document.getElementById('wa-cart-items-container'),
  waCartTotalVal: document.getElementById('wa-cart-total-val'),
  btnWaConfirmOrder: document.getElementById('btn-wa-confirm-order'),
  
  waPaymentModal: document.getElementById('wa-payment-modal'),
  payModalAmount: document.getElementById('pay-modal-amount'),
  btnPaySubmit: document.getElementById('btn-pay-submit'),
  btnPayCancel: document.getElementById('btn-pay-cancel'),
  
  // Catalog View Panel & Telemetry
  catalogProductsGrid: document.getElementById('catalog-products-grid'),
  btnOpenAddProductModal: document.getElementById('btn-add-product'),
  productModal: document.getElementById('product-modal'),
  btnCloseProductModal: document.getElementById('btn-close-product-modal'),
  productForm: document.getElementById('product-form'),
  catalogSearchInput: document.getElementById('catalog-search-input'),
  btnClearCatalogSearch: document.getElementById('btn-clear-catalog-search'),
  catalogCategoryPills: document.querySelectorAll('.cat-pill'),
  catalogDietaryBtns: document.querySelectorAll('.dietary-btn'),
  catalogSortSelect: document.getElementById('catalog-sort-select'),
  catalogShowingText: document.getElementById('catalog-showing-text'),
  catalogOutletHint: document.getElementById('catalog-outlet-hint'),
  catalogEmptyState: document.getElementById('catalog-empty-state'),
  btnResetCatalogFilters: document.getElementById('btn-reset-catalog-filters'),
  btnSyncMetaCatalog: document.getElementById('btn-sync-meta-catalog'),
  wabaSyncStatusTime: document.getElementById('waba-sync-status-time'),
  catalogStatTotalSkus: document.getElementById('catalog-stat-total-skus'),
  catalogStatInStock: document.getElementById('catalog-stat-in-stock'),
  catalogKitchenName: document.getElementById('catalog-kitchen-name'),
  editProductModal: document.getElementById('edit-product-modal'),
  btnCloseEditProductModal: document.getElementById('btn-close-edit-product-modal'),
  btnCancelEditProd: document.getElementById('btn-cancel-edit-prod'),
  editProductForm: document.getElementById('edit-product-form'),
  editProdId: document.getElementById('edit-prod-id'),
  editProdName: document.getElementById('edit-prod-name'),
  editProdPrice: document.getElementById('edit-prod-price'),
  editProdStock: document.getElementById('edit-prod-stock'),
  editProdDesc: document.getElementById('edit-prod-desc'),
  
  // Campaigns Panel
  campaignsContainer: document.getElementById('campaigns-container'),
  btnOpenCampaignModal: document.getElementById('btn-schedule-campaign'),
  btnQuickBroadcast: document.getElementById('btn-quick-broadcast'),
  campaignModal: document.getElementById('campaign-modal'),
  btnCloseCampaignModal: document.getElementById('btn-close-campaign-modal'),
  campaignForm: document.getElementById('campaign-form'),

  // Webhook Logs Console
  terminalLogsBody: document.getElementById('terminal-logs-body'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Global Outlet Selector
  globalOutletSelect: document.getElementById('global-outlet-select'),

  // AI Daily Executive Briefing Widget
  aiBriefingWidget: document.getElementById('ai-briefing-widget'),
  aiBriefingHeadline: document.getElementById('ai-briefing-headline'),
  aiBriefingPulse: document.getElementById('ai-briefing-pulse'),
  aiBriefingTop: document.getElementById('ai-briefing-top'),
  aiBriefingOpp: document.getElementById('ai-briefing-opp'),
  aiBriefingTime: document.getElementById('ai-briefing-time'),
  btnRefreshAiBriefing: document.getElementById('btn-refresh-ai-briefing'),
  btnAiTriggerAction: document.getElementById('btn-ai-trigger-action'),

  // AI Copilot in Merchant Chat
  aiCustomerSentiment: document.getElementById('ai-customer-sentiment'),
  aiSentimentIcon: document.getElementById('ai-sentiment-icon'),
  aiSentimentText: document.getElementById('ai-sentiment-text'),
  btnAiSummarizeNotes: document.getElementById('btn-ai-summarize-notes'),
  btnToneList: document.querySelectorAll('.btn-tone'),
  btnApplyAiDraft: document.getElementById('btn-apply-ai-draft'),
  aiSmartRepliesList: document.getElementById('ai-smart-replies-list'),

  // Outlets Collections Section
  kpiTotalGross: document.getElementById('kpi-total-gross'),
  kpiTargetPct: document.getElementById('kpi-target-pct'),
  kpiTotalCash: document.getElementById('kpi-total-cash'),
  kpiCashRatio: document.getElementById('kpi-cash-ratio'),
  kpiTotalDigital: document.getElementById('kpi-total-digital'),
  kpiDigitalRatio: document.getElementById('kpi-digital-ratio'),
  kpiTotalOnline: document.getElementById('kpi-total-online'),
  kpiOnlineRatio: document.getElementById('kpi-online-ratio'),
  kpiTotalNet: document.getElementById('kpi-total-net'),
  kpiTotalExpenses: document.getElementById('kpi-total-expenses'),
  segUpi: document.getElementById('seg-upi'),
  segCard: document.getElementById('seg-card'),
  segCash: document.getElementById('seg-cash'),
  segOnline: document.getElementById('seg-online'),
  legendUpi: document.getElementById('legend-upi'),
  legendCard: document.getElementById('legend-card'),
  legendCash: document.getElementById('legend-cash'),
  legendOnline: document.getElementById('legend-online'),
  badgeSettledCount: document.getElementById('badge-settled-count'),
  badgePendingCount: document.getElementById('badge-pending-count'),
  badgeOpenCount: document.getElementById('badge-open-count'),
  outletsCollectionTbody: document.getElementById('outlets-collection-tbody'),
  btnBroadcastEodReport: document.getElementById('btn-broadcast-eod-report'),
  btnOpenRecordShift: document.getElementById('btn-open-record-shift'),
  activeBranchIndicator: document.getElementById('active-branch-indicator'),
  activeBranchNameText: document.getElementById('active-branch-name-text'),
  branchCustomisedReportContainer: document.getElementById('branch-customised-report-container'),
  outletsHeaderDesc: document.getElementById('outlets-header-desc'),

  // Shift Close Modal
  recordShiftModal: document.getElementById('record-shift-modal'),
  btnCloseRecordShiftModal: document.getElementById('btn-close-record-shift-modal'),
  recordShiftForm: document.getElementById('record-shift-form'),
  shiftOutletSelect: document.getElementById('shift-outlet-select'),
  shiftCash: document.getElementById('shift-cash'),
  shiftUpi: document.getElementById('shift-upi'),
  shiftCard: document.getElementById('shift-card'),
  shiftOnline: document.getElementById('shift-online'),
  shiftExpenses: document.getElementById('shift-expenses'),
  shiftStatus: document.getElementById('shift-status'),
  shiftSettledBy: document.getElementById('shift-settled-by'),
  shiftNotes: document.getElementById('shift-notes'),
  shiftModalGross: document.getElementById('shift-modal-gross'),
  shiftModalNet: document.getElementById('shift-modal-net'),
  denomCalcTotal: document.getElementById('denom-calc-total'),
  denom500: document.getElementById('denom-500'),
  denom200: document.getElementById('denom-200'),
  denom100: document.getElementById('denom-100'),
  denomCoins: document.getElementById('denom-coins'),

  // AI Campaign Modal
  aiCampaignModal: document.getElementById('ai-campaign-modal'),
  btnOpenAiCampaign: document.getElementById('btn-open-ai-campaign'),
  btnCloseAiCampaignModal: document.getElementById('btn-close-ai-campaign-modal'),
  aiCampOccasion: document.getElementById('ai-camp-occasion'),
  aiCampDiscount: document.getElementById('ai-camp-discount'),
  btnGenerateAiCopy: document.getElementById('btn-generate-ai-copy'),
  aiCampPreviewText: document.getElementById('ai-camp-preview-text'),
  btnBroadcastAiCampaign: document.getElementById('btn-broadcast-ai-campaign'),

  // EOD Modal
  eodPreviewModal: document.getElementById('eod-preview-modal'),
  btnCloseEodModal: document.getElementById('btn-close-eod-modal'),
  eodPhonePreviewText: document.getElementById('eod-phone-preview-text'),
  eodRecipientPhone: document.getElementById('eod-recipient-phone'),
  btnConfirmEodBroadcast: document.getElementById('btn-confirm-eod-broadcast')
};

// 3. API Communication Layer with Offline Fail-safes
const API = {
  async getStats() {
    if (isOffline) return offlineDB.stats;
    const res = await fetch('/api/stats');
    return res.json();
  },
  async getProducts() {
    if (isOffline) return offlineDB.products;
    const res = await fetch('/api/products');
    return res.json();
  },
  async getOrders() {
    if (isOffline) return offlineDB.orders;
    const res = await fetch('/api/orders');
    return res.json();
  },
  async getCustomer(id) {
    if (isOffline) return offlineDB.customers[id];
    const res = await fetch(`/api/customers/${id}`);
    return res.json();
  },
  async getCustomers() {
    if (isOffline) return offlineDB.customers;
    const res = await fetch('/api/customers');
    return res.json();
  },
  async updateCustomer(id, data) {
    if (isOffline) {
      offlineDB.customers[id] = { ...offlineDB.customers[id], ...data };
      return offlineDB.customers[id];
    }
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async addProduct(prod) {
    if (isOffline) {
      const newProduct = {
        id: 'prod' + (offlineDB.products.length + 1),
        ...prod,
        price: parseFloat(prod.price)
      };
      offlineDB.products.push(newProduct);
      logOfflineTraffic('POST', '/api/products', { event: 'CATALOG_SYNC_WABA', productId: newProduct.id, sku: newProduct.sku });
      return newProduct;
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    return res.json();
  },
  async sendMerchantMessage(customerId, text) {
    if (isOffline) {
      const customer = offlineDB.customers[customerId];
      const time = getFormattedTime();
      customer.chatHistory.push({ sender: 'agent', text, time });
      logOfflineTraffic('POST', '/v20.0/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: customer.phone,
        type: 'text',
        text: { body: text }
      });
      return customer;
    }
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, text })
    });
    return res.json();
  },
  async sendWebhook(from, type, text, payload = null) {
    if (isOffline) {
      runOfflineWebhook(from, type, text, payload);
      return { success: true };
    }
    const res = await fetch('/api/webhook/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, type, text, payload })
    });
    return res.json();
  },
  async getLogs() {
    if (isOffline) return offlineDB.logs;
    const res = await fetch('/api/logs');
    return res.json();
  },
  async clearLogs() {
    if (isOffline) {
      offlineDB.logs = [];
      return { success: true };
    }
    const res = await fetch('/api/logs/clear', { method: 'POST' });
    return res.json();
  },
  async getOutlets() {
    const res = await fetch('/api/outlets');
    return res.json();
  },
  async getCollectionsToday() {
    const res = await fetch('/api/collections/today');
    return res.json();
  },
  async recordShift(data) {
    const res = await fetch('/api/collections/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async broadcastEOD(directorPhone, outletId) {
    const res = await fetch('/api/collections/broadcast-eod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directorPhone, outletId })
    });
    return res.json();
  },
  async getCollectionsReport(outletId) {
    const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : '';
    const res = await fetch(`/api/collections/report${query}`);
    return res.json();
  },
  async getAiSmartReplies(customerId) {
    const res = await fetch('/api/ai/smart-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    });
    return res.json();
  },
  async draftAiResponse(customerId, tone, prompt) {
    const res = await fetch('/api/ai/draft-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, tone, prompt })
    });
    return res.json();
  },
  async summarizeCustomer(customerId) {
    const res = await fetch('/api/ai/summarize-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId })
    });
    return res.json();
  },
  async getAiExecutiveBriefing(outletId) {
    const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : '';
    const res = await fetch(`/api/ai/executive-briefing${query}`);
    return res.json();
  },
  async generateAiCampaign(params) {
    const res = await fetch('/api/ai/generate-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },
  async updateProduct(id, updates) {
    if (isOffline) {
      const p = offlineDB.products.find(x => x.id === id);
      if (p) Object.assign(p, updates);
      return { success: true, product: p };
    }
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async syncMetaCatalog() {
    if (isOffline) return { success: true, message: 'All 12 dishes synced with Meta Cloud Commerce!' };
    const res = await fetch('/api/catalog/sync', { method: 'POST' });
    return res.json();
  }
};

// 3.1 Offline Webhook and state machine simulator helper
function logOfflineTraffic(method, endpoint, payload) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  offlineDB.logs.unshift({
    timestamp,
    method,
    endpoint,
    payload: JSON.parse(JSON.stringify(payload))
  });
  if (offlineDB.logs.length > 20) offlineDB.logs.pop();
}

function runOfflineWebhook(from, type, text, payload) {
  const customer = offlineDB.customers[from];
  const time = getFormattedTime();
  
  const simulatedMetaPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID_982312093',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '+919007378887', phone_number_id: 'phone_id_982312480928340' },
          contacts: [{ profile: { name: customer.name }, wa_id: customer.phone.replace(/[^0-9]/g, '') }],
          messages: [{
            from: customer.phone.replace(/[^0-9]/g, ''),
            id: 'wamid.HBgLOTE5MDA3Mzc4ODg3FQIAERg4QzM3Q...',
            timestamp: Math.floor(Date.now() / 1000),
            type: type === 'payment' ? 'interactive' : (type === 'cart_submission' ? 'interactive' : 'text')
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  const changeValueMsg = simulatedMetaPayload.entry[0].changes[0].value.messages[0];
  if (type === 'text') {
    changeValueMsg.text = { body: text };
  } else if (type === 'cart_submission') {
    changeValueMsg.interactive = {
      type: 'nfm_reply',
      nfm_reply: { response_json: JSON.stringify({ flow: 'checkout', items: payload }) }
    };
  } else if (type === 'payment') {
    changeValueMsg.interactive = {
      type: 'payment_confirm',
      payment: { status: 'success', amount: payload.amount, transaction_id: 'TXN-' + Math.floor(Math.random() * 1000000) }
    };
  }
  
  logOfflineTraffic('POST', '/api/webhook/whatsapp', simulatedMetaPayload);
  
  if (type === 'text') {
    if (text.startsWith('[Template Push]')) {
      const template = text.split('[Template Push] ')[1];
      let templateText = '';
      if (template === 'welcome') {
        templateText = '👋 Welcome to 6 Ballygunge Place! Tap the button below to browse our authentic Bengali culinary catalog.';
      } else if (template === 'flash_sale') {
        templateText = '🔥 Sunday FEAST SALE! Get 20% off all Grand Bengali Feasts for the next 2 hours only. Tap below to buy!';
      } else if (template === 'payment_reminder') {
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0) || 999.00;
        templateText = `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`;
      } else if (template === 'share_tracker') {
        const trackingId = '6BP-TRK-' + Math.floor(100000 + Math.random() * 900000);
        templateText = `🚚 *6 Ballygunge Place - Order Tracker*\n\nHere is your live tracking link:\n🔗 http://localhost:8080/success.html?customerId=${from}&trackingId=${trackingId}\n\nTracking ID: *${trackingId}*\nStatus: *Preparing your meal*\nEst. Delivery: *35 minutes*`;
      }
      customer.chatHistory.push({
        sender: 'bot',
        text: templateText,
        time,
        isTemplate: true,
        templateType: template
      });
      refreshInbox();
      return;
    }

    customer.chatHistory.push({
      sender: 'customer',
      text: text,
      time
    });
    
    if (text.includes("Sunday Heritage Feast Promo") || text.includes("paid_campaign")) {
      customer.state = 'STATE_CAMPAIGN_FLOW';
      
      setTimeout(() => {
        customer.chatHistory.push({
          sender: 'bot',
          text: `👋 Thank you for claiming our Sunday Heritage Feast Promo! Please choose one of our exclusive feast packages below to continue:`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'campaign_packages'
        });
        logOfflineTraffic('POST', '/v20.0/messages', {
          messaging_product: 'whatsapp',
          to: customer.phone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: 'Sunday Heritage Feast Packages' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'pkg_starter', title: 'Grand Thali (₹999)' } },
                { type: 'reply', reply: { id: 'pkg_deluxe', title: 'Seafood Platter (₹1499)' } },
                { type: 'reply', reply: { id: 'pkg_luxury', title: 'Classic Veg Feast (₹699)' } }
              ]
            }
          }
        });
        refreshInbox();
      }, 1000);
      return;
    }
    
    if(customer.state === 'STATE_AWAITING_ADDRESS') {
      customer.address = text;
      customer.state = 'STATE_AWAITING_PAYMENT';
      
      setTimeout(() => {
        customer.chatHistory.push({
          sender: 'bot',
          text: `🤖 Shipping address verified: *${text}*\n\nYour invoice is ready. Click below to pay:`,
          time: getFormattedTime()
        });
        
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0);
        customer.chatHistory.push({
          sender: 'bot',
          text: `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'payment_reminder'
        });
        
        logOfflineTraffic('POST', '/v20.0/messages', {
          messaging_product: 'whatsapp',
          to: customer.phone,
          type: 'interactive',
          interactive: { type: 'button', body: { text: `Invoice for ₹${total.toFixed(2)}` } }
        });
        refreshInbox();
      }, 1000);
      
    } else if(customer.state === 'STATE_SHOPPING') {
      setTimeout(() => {
        customer.chatHistory.push({
          sender: 'bot',
          text: `🤖 Hi! Thank you for messaging. I'm the 6 Ballygunge Place automated assistant. You can browse our dining catalog by clicking "View Catalog" or type 'help' to connect to a manager.`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'welcome'
        });
        refreshInbox();
      }, 1200);
    }
    
  } else if (type === 'campaign_package_select') {
    const pkg = payload;
    customer.cart = [{
      id: 'campaign_pkg',
      name: pkg.name,
      price: pkg.price,
      sku: pkg.sku,
      image: pkg.image,
      desc: 'Special promotional campaign bundle kit.'
    }];
    
    customer.state = 'STATE_AWAITING_PAYMENT';
    customer.chatHistory.push({
      sender: 'customer',
      text: `Selected Package: ${pkg.name} (₹${pkg.price.toFixed(2)})`,
      time
    });
    
    setTimeout(() => {
      customer.chatHistory.push({
        sender: 'bot',
        text: `🤖 Excellent choice! Your invoice for the *${pkg.name}* is ready. Click below to proceed to the payment gateway:`,
        time: getFormattedTime()
      });
      
      customer.chatHistory.push({
        sender: 'bot',
        text: `💳 Secure Payment Invoice\nTotal: *₹${pkg.price.toFixed(2)}*`,
        time: getFormattedTime(),
        isTemplate: true,
        templateType: 'payment_reminder'
      });
      
      logOfflineTraffic('POST', '/v20.0/messages', {
        messaging_product: 'whatsapp',
        to: customer.phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `Pay now for ${pkg.name}` }
        }
      });
      refreshInbox();
    }, 1000);
    
  } else if (type === 'cart_submission') {
    customer.cart = payload;
    customer.state = 'STATE_AWAITING_ADDRESS';
    const total = payload.reduce((sum, p) => sum + p.price, 0);
    const summary = payload.map(p => p.name).join(', ');
    
    customer.chatHistory.push({
      sender: 'customer',
      text: `🛒 Checkout Request: Sent Cart [${summary}] totaling ₹${total.toFixed(2)}`,
      time
    });
    
    setTimeout(() => {
      customer.chatHistory.push({
        sender: 'bot',
        text: `🤖 Order received!\n\nPlease reply with your delivery address to complete checkout.`,
        time: getFormattedTime()
      });
      refreshInbox();
    }, 1000);
    
  } else if (type === 'payment') {
    const total = customer.cart.reduce((sum, p) => sum + p.price, 0);
    const orderId = '#W-' + Math.floor(1000 + Math.random() * 9000);
    
    customer.state = 'STATE_COMPLETED';
    const trackingId = '6BP-TRK-' + Math.floor(100000 + Math.random() * 900000);
    customer.chatHistory.push({
      sender: 'bot',
      text: `✅ *Payment Successful!*\n\nThank you, *${customer.name}*. Your order *${orderId}* has been confirmed.\n\n🚚 *Delivery Tracking*:\nTracking ID: *${trackingId}*\nStatus: *Preparing your meal*\nEst. Delivery: *35 minutes*\n\nOur delivery executive will arrive with your hot meal shortly.`,
      time
    });
    
    offlineDB.stats.sales += total;
    offlineDB.stats.sessions = Math.max(0, offlineDB.stats.sessions - 1);
    offlineDB.stats.orderCount += 1;
    
    const itemsSummary = customer.cart.map(p => p.name).join(', ');
    offlineDB.orders.unshift({
      id: orderId,
      customer: customer.name,
      products: itemsSummary,
      status: 'paid',
      total: `₹${total.toFixed(2)}`,
      source: 'chatbot'
    });
    
    customer.cart = [];
  }
}

// 4. Tab Routing Logic
elements.tabItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tabName = item.getAttribute('data-tab');
    switchTab(tabName);
  });
});

function switchTab(tabName) {
  state.activeTab = tabName;

  if (tabName === 'inbox') {
    document.body.classList.add('inbox-active');
  } else {
    document.body.classList.remove('inbox-active');
  }
  
  elements.tabItems.forEach(item => {
    if(item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  elements.tabPanels.forEach(panel => {
    if(panel.id === `tab-${tabName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  
  const titles = {
    dashboard: { title: 'Dashboard Overview', desc: 'Real-time conversational sales & multi-outlet executive metrics.' },
    inbox: { title: 'Unified WhatsApp Inbox & AI Copilot', desc: 'AI-assisted customer care, smart suggestions, and agent takeover.' },
    outlets: { title: 'Outlet Daily Collections & Settlements', desc: 'Monitor branch-level cash in drawer, UPI, EDC card machines, and day-end audits.' },
    catalog: { title: 'eCommerce Catalog Sync', desc: 'Sync inventory, pricing, and push products directly into WhatsApp.' },
    campaigns: { title: 'WhatsApp Marketing Broadcasts', desc: 'Send approved templates, schedule sales blasts, and measure conversion.' },
    settings: { title: 'Console Settings', desc: 'Configure Meta Cloud APIs, API secrets, and store sync variables.' }
  };
  
  elements.currentTabTitle.textContent = titles[tabName].title;
  elements.currentTabDesc.textContent = titles[tabName].desc;
  
  if(tabName === 'dashboard') {
    refreshDashboard();
  } else if(tabName === 'inbox') {
    refreshInbox();
  } else if(tabName === 'outlets') {
    refreshOutletsTab();
  } else if(tabName === 'catalog') {
    refreshCatalogView();
  }
}

// 5. Dashboard Refresh
async function refreshDashboard() {
  try {
    state.stats = await API.getStats();
    state.orders = await API.getOrders();
    await refreshAiExecutiveBriefing(state.activeOutlet);
    
    // Update metric cards (outlet-aware)
    if (state.activeOutlet && state.activeOutlet !== 'all') {
      const colData = await API.getCollectionsToday();
      if (colData && colData.records) {
        const rec = colData.records.find(r => r.outletId === state.activeOutlet);
        const outlet = colData.outlets.find(o => o.id === state.activeOutlet);
        if (rec && outlet) {
          elements.dashboardSales.textContent = `₹${(rec.grossTotal || 0).toLocaleString('en-IN')}.00`;
          const targetAchieve = ((rec.grossTotal / (outlet.targetDaily || 1)) * 100).toFixed(1);
          elements.dashboardConversion.textContent = `${targetAchieve}%`;
        }
      }
    } else {
      elements.dashboardSales.textContent = `₹${state.stats.sales.toLocaleString('en-IN')}`;
      elements.dashboardSessions.textContent = state.stats.sessions;
      elements.dashboardConversion.textContent = `${state.stats.conversion}%`;
    }
    
    // Render orders
    elements.recentOrdersTbody.innerHTML = '';
    state.orders.forEach(ord => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ord.id}</td>
        <td>${ord.customer}</td>
        <td>${ord.products}</td>
        <td><span class="status-badge ${ord.status}">${ord.status.toUpperCase()}</span></td>
        <td>${ord.total}</td>
        <td><i class="fa-solid ${ord.source === 'chatbot' ? 'fa-robot' : 'fa-user-tie'} bot-icon"></i> ${ord.source === 'chatbot' ? 'Chatbot' : 'Agent'}</td>
      `;
      elements.recentOrdersTbody.appendChild(row);
    });
  } catch (err) {
    console.error('Error refreshing dashboard UI', err);
  }
}

// 6. Catalog Rendering & Interactive Management
async function refreshCatalogView() {
  try {
    state.products = await API.getProducts();
    
    // 1. Update Telemetry Header Metrics
    const totalItems = state.products.length;
    const inStockItems = state.products.filter(p => (p.stockStatus || 'in_stock') === 'in_stock').length;
    
    if (elements.catalogStatTotalSkus) elements.catalogStatTotalSkus.textContent = totalItems;
    if (elements.catalogStatInStock) elements.catalogStatInStock.textContent = inStockItems;
    
    // Update Kitchen name based on active outlet
    if (elements.catalogKitchenName) {
      if (state.activeOutlet && state.activeOutlet !== 'all') {
        const outletMap = {
          'outlet_ballygunge': 'Ballygunge Central Kitchen Live',
          'outlet_saltlake': 'Salt Lake Sector V Kitchen Live',
          'outlet_parkstreet': 'Park Street Heritage Kitchen Live',
          'outlet_southcity': 'South City Mall Kitchen Live',
          'outlet_newtown': 'New Town Cloud Hub Live',
          'outlet_whatsapp': 'WhatsApp Direct Dispatch Hub'
        };
        elements.catalogKitchenName.textContent = outletMap[state.activeOutlet] || 'Selected Kitchen Live';
      } else {
        elements.catalogKitchenName.textContent = 'All 6 Kitchens Live';
      }
    }

    if (elements.catalogOutletHint) {
      if (state.activeOutlet && state.activeOutlet !== 'all') {
        elements.catalogOutletHint.innerHTML = `<i class="fa-solid fa-store" style="color:var(--primary-color);"></i> Active Branch Kitchen Filter Applied`;
      } else {
        elements.catalogOutletHint.innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Kitchen menu live across all 6 Kolkata branch cloud kitchens`;
      }
    }

    // Update Category Pill Counter Badges
    const countAllEl = document.getElementById('cat-count-all');
    const countSigEl = document.getElementById('cat-count-sig');
    const countFishEl = document.getElementById('cat-count-fish');
    const countMeatEl = document.getElementById('cat-count-meat');
    const countThaliEl = document.getElementById('cat-count-thali');
    const countVegEl = document.getElementById('cat-count-veg');
    const countDessertEl = document.getElementById('cat-count-dessert');

    if (countAllEl) countAllEl.textContent = totalItems;
    if (countSigEl) countSigEl.textContent = state.products.filter(p => p.category === 'signature').length;
    if (countFishEl) countFishEl.textContent = state.products.filter(p => p.category === 'seafood' || p.category === 'signature' && (p.name.includes('Chingri') || p.name.includes('Ilish') || p.name.includes('Bhetki'))).length;
    if (countMeatEl) countMeatEl.textContent = state.products.filter(p => p.category === 'meat').length;
    if (countThaliEl) countThaliEl.textContent = state.products.filter(p => p.category === 'thali').length;
    if (countVegEl) countVegEl.textContent = state.products.filter(p => p.isVeg).length;
    if (countDessertEl) countDessertEl.textContent = state.products.filter(p => p.category === 'dessert').length;

    // 2. Filter & Sort Products
    const filters = state.catalogFilters || { search: '', category: 'all', dietary: 'all', sort: 'recommended' };
    let filtered = [...state.products];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      if (filters.category === 'seafood') {
        filtered = filtered.filter(p => p.category === 'seafood' || p.name.includes('Chingri') || p.name.includes('Ilish') || p.name.includes('Bhetki'));
      } else if (filters.category === 'veg') {
        filtered = filtered.filter(p => p.isVeg);
      } else {
        filtered = filtered.filter(p => p.category === filters.category);
      }
    }

    // Dietary filter
    if (filters.dietary === 'veg') {
      filtered = filtered.filter(p => p.isVeg);
    } else if (filters.dietary === 'nonveg') {
      filtered = filtered.filter(p => !p.isVeg);
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.desc && p.desc.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (filters.sort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Recommended: bestsellers and signatures on top
      filtered.sort((a, b) => {
        const scoreA = (a.bestseller ? 2 : 0) + (a.category === 'signature' ? 1 : 0);
        const scoreB = (b.bestseller ? 2 : 0) + (b.category === 'signature' ? 1 : 0);
        return scoreB - scoreA;
      });
    }

    // 3. Render Dashboard Catalog Grid
    elements.catalogProductsGrid.innerHTML = '';
    
    if (filtered.length === 0) {
      if (elements.catalogEmptyState) elements.catalogEmptyState.style.display = 'flex';
      if (elements.catalogShowingText) elements.catalogShowingText.innerHTML = `Showing <strong>0</strong> of <strong>${totalItems}</strong> dishes`;
    } else {
      if (elements.catalogEmptyState) elements.catalogEmptyState.style.display = 'none';
      if (elements.catalogShowingText) elements.catalogShowingText.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${totalItems}</strong> dishes in WhatsApp Catalog`;

      filtered.forEach(p => {
        const isSoldOut = p.stockStatus === 'out_of_stock';
        const isLowStock = p.stockStatus === 'low_stock';
        
        let stockPillHtml = `<span class="card-stock-pill in_stock"><i class="fa-solid fa-circle" style="font-size: 6px; color: #10B981;"></i> In Stock</span>`;
        if (isSoldOut) {
          stockPillHtml = `<span class="card-stock-pill out_of_stock"><i class="fa-solid fa-circle-xmark"></i> Sold Out</span>`;
        } else if (isLowStock) {
          stockPillHtml = `<span class="card-stock-pill low_stock"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock</span>`;
        }

        let tagHtml = '';
        if (p.bestseller) {
          tagHtml = `<span class="card-top-tag bestseller"><i class="fa-solid fa-fire"></i> Bestseller</span>`;
        } else if (p.category === 'signature') {
          tagHtml = `<span class="card-top-tag signature"><i class="fa-solid fa-crown"></i> Signature</span>`;
        }

        const categoryLabels = {
          signature: "Chef's Signature Heritage",
          seafood: "Fish & Seafood Special",
          meat: "Mutton & Meat Heritage",
          thali: "Complete Heritage Platter",
          veg: "Pure Bengali Vegetarian",
          dessert: "Traditional Mishti & Sweets"
        };

        const card = document.createElement('div');
        card.className = `catalog-card ${isSoldOut ? 'sold-out' : ''}`;
        card.innerHTML = `
          <div class="catalog-card-img-wrap">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <div class="dietary-icon-badge" title="${p.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}">
              <span class="dietary-box ${p.isVeg ? 'veg' : 'nonveg'}"></span>
            </div>
            ${tagHtml}
            ${stockPillHtml}
            <span class="card-prep-pill"><i class="fa-regular fa-clock"></i> ${p.prepTime || '25 mins'}</span>
          </div>
          <div class="catalog-card-body">
            <div class="dish-header">
              <span class="dish-category-label">${categoryLabels[p.category] || 'Bengali Heritage'}</span>
              <h4 class="dish-title">${p.name}</h4>
            </div>
            <p class="dish-desc">${p.desc}</p>
            <div class="catalog-card-pricing">
              <span class="dish-price">₹${Number(p.price).toFixed(2)}</span>
              <span class="dish-sku-tag">${p.sku}</span>
            </div>
            <div class="catalog-card-actions">
              <button class="btn-push-wa btn-card-push" data-id="${p.id}" title="Push directly to WhatsApp chat with ${state.activeCustomerData?.name || 'Customer'}">
                <i class="fa-brands fa-whatsapp"></i> Push to WhatsApp
              </button>
              <button class="btn-card-tool btn-card-edit" data-id="${p.id}" title="Edit Dish Details">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-card-tool btn-card-toggle-stock" data-id="${p.id}" title="Toggle Availability (In Stock / Sold Out)">
                <i class="fa-solid fa-toggle-${isSoldOut ? 'off' : 'on'}" style="color: ${isSoldOut ? '#EF4444' : '#10B981'};"></i>
              </button>
            </div>
          </div>
        `;

        // Bind Card Actions
        const btnPush = card.querySelector('.btn-card-push');
        if (btnPush) {
          btnPush.addEventListener('click', () => {
            pushProductCard(p.id);
            showCrmToast(`📦 "${p.name}" (₹${p.price}) pushed to WhatsApp chat with ${state.activeCustomerData?.name || 'Customer'}!`);
          });
        }

        const btnEdit = card.querySelector('.btn-card-edit');
        if (btnEdit) {
          btnEdit.addEventListener('click', () => openEditProductModal(p));
        }

        const btnToggleStock = card.querySelector('.btn-card-toggle-stock');
        if (btnToggleStock) {
          btnToggleStock.addEventListener('click', async () => {
            const nextStatus = isSoldOut ? 'in_stock' : 'out_of_stock';
            await API.updateProduct(p.id, { stockStatus: nextStatus });
            showCrmToast(`🔄 "${p.name}" is now marked as ${nextStatus === 'in_stock' ? 'In Stock (Live)' : 'Sold Out'}!`);
            await refreshCatalogView();
          });
        }

        elements.catalogProductsGrid.appendChild(card);
      });
    }

    // 4. Update Chat view Push Menu
    elements.pushProductsMenu.innerHTML = '';
    state.products.forEach(p => {
      const pushLink = document.createElement('a');
      pushLink.href = '#';
      pushLink.innerHTML = `<span>${p.isVeg ? '🟢' : '🔴'} ${p.name}</span> <span style="font-weight:700; color:var(--primary-color);">₹${p.price.toFixed(2)}</span>`;
      pushLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.pushProductsMenu.classList.remove('show');
        pushProductCard(p.id);
        showCrmToast(`📦 Sent "${p.name}" to WhatsApp customer!`);
      });
      elements.pushProductsMenu.appendChild(pushLink);
    });

    // 5. Customer-facing WhatsApp in-app Simulator Catalog
    elements.waCatalogProductsContainer.innerHTML = '';
    state.products.forEach(p => {
      const waItem = document.createElement('div');
      waItem.className = 'wa-catalog-item';
      waItem.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <div class="wa-catalog-item-info">
          <span class="wa-catalog-item-name">${p.name}</span>
          <span class="wa-catalog-item-price">₹${p.price.toFixed(2)}</span>
          <div class="wa-catalog-item-actions">
            <button class="btn-wa-add-cart" data-id="${p.id}"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
            <button class="btn-wa-buy-now" data-id="${p.id}"><i class="fa-solid fa-bolt"></i> Buy Now</button>
          </div>
        </div>
      `;
      elements.waCatalogProductsContainer.appendChild(waItem);
    });

  } catch (err) {
    console.error('Error loading products list', err);
  }
}

// Open Quick Edit Dish Modal
function openEditProductModal(product) {
  if (!elements.editProductModal) return;
  if (elements.editProdId) elements.editProdId.value = product.id;
  if (elements.editProdName) elements.editProdName.value = product.name;
  if (elements.editProdPrice) elements.editProdPrice.value = product.price;
  if (elements.editProdStock) elements.editProdStock.value = product.stockStatus || 'in_stock';
  if (elements.editProdDesc) elements.editProdDesc.value = product.desc || '';
  elements.editProductModal.classList.add('show');
}

// Handle Quick Edit Dish Form Submit
async function handleEditProductSubmit(e) {
  e.preventDefault();
  const id = elements.editProdId.value;
  const name = elements.editProdName.value.trim();
  const price = parseFloat(elements.editProdPrice.value);
  const stockStatus = elements.editProdStock.value;
  const desc = elements.editProdDesc.value.trim();

  try {
    await API.updateProduct(id, { name, price, stockStatus, desc });
    if (elements.editProductModal) elements.editProductModal.classList.remove('show');
    showCrmToast(`✅ "${name}" updated & synced with Meta WABA Catalog!`);
    await refreshCatalogView();
  } catch (err) {
    console.error('Error updating product', err);
    alert('Failed to update product. Check connection.');
  }
}

// Update navigation unread badge dynamically based on customer states
function updateSidebarUnreadCount(customers) {
  if (!elements.inboxUnreadCount) return;
  const count = Object.values(customers).filter(c => c.state === 'STATE_WAITING_AGENT').length;
  if (count > 0) {
    elements.inboxUnreadCount.style.display = 'inline-block';
    elements.inboxUnreadCount.textContent = count;
  } else {
    elements.inboxUnreadCount.style.display = 'none';
  }
}

// Render left sidebar threads dynamically from backend database
async function refreshThreadList() {
  try {
    const customers = await API.getCustomers();
    updateSidebarUnreadCount(customers);
    
    const threadsContainer = document.querySelector('.threads-container');
    if (!threadsContainer) return;
    
    threadsContainer.innerHTML = '';
    
    Object.values(customers).forEach(cust => {
      const isActive = cust.id === state.activeCustomer;
      const lastMsg = cust.chatHistory[cust.chatHistory.length - 1] || { text: 'No messages yet', time: '' };
      
      let previewText = lastMsg.text;
      if(previewText.length > 35) {
        previewText = previewText.substring(0, 35) + '...';
      }
      
      const isWaiting = cust.state === 'STATE_WAITING_AGENT';
      
      const threadItem = document.createElement('div');
      threadItem.className = `thread-item ${isActive ? 'active' : ''}`;
      threadItem.setAttribute('data-customer-id', cust.id);
      
      threadItem.innerHTML = `
        <img src="${cust.avatar}" alt="${cust.name}" class="avatar">
        <div class="thread-details">
          <div class="thread-meta">
            <h4 class="customer-name">${cust.name}</h4>
            <span class="message-time">${lastMsg.time || ''}</span>
          </div>
          <div class="thread-preview">
            <p id="thread-preview-${cust.id}">${previewText}</p>
            ${isWaiting ? `<span class="unread-badge">1</span>` : ''}
          </div>
        </div>
      `;
      
      threadItem.addEventListener('click', () => {
        state.activeCustomer = cust.id;
        refreshInbox();
      });
      
      threadsContainer.appendChild(threadItem);
    });
  } catch (err) {
    console.error('Error refreshing thread list', err);
  }
}

// 7. Inbox & Shared Chat logic
async function refreshInbox() {
  try {
    state.activeCustomerData = await API.getCustomer(state.activeCustomer);
    const customer = state.activeCustomerData;
    
    await refreshThreadList();
    
    // Update header details
    elements.chatHeaderAvatar.src = customer.avatar;
    elements.chatHeaderName.textContent = customer.name;
    
    // Update CRM Drawer
    elements.crmAvatar.src = customer.avatar;
    elements.crmName.textContent = customer.name;
    elements.crmPhone.textContent = customer.phone;
    elements.crmActiveState.textContent = customer.state;
    elements.crmAddress.textContent = customer.address || 'Not Provided';
    if(elements.crmNotes) {
      elements.crmNotes.value = customer.notes || '';
    }
    
    // Render Dashboard Chats (Merchant perspective)
    elements.merchantMessagesContainer.innerHTML = '';
    customer.chatHistory.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender === 'customer' ? 'received' : 'sent'}`;
      
      let bubbleContent = '';
      if(msg.isTemplate) {
        bubbleContent = `
          <div class="merchant-bubble merchant-template-bubble">
            <span class="template-header-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> Template: ${msg.templateType}</span>
            <p>${msg.text}</p>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">BOT (Auto)</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      } else if (msg.isProductCard) {
        const prod = state.products.find(p => p.id === msg.productId) || { name: 'Product', price: 0, image: '' };
        bubbleContent = `
          <div class="merchant-bubble">
            <p style="margin-bottom: 8px;"><em>Sent interactive product card:</em></p>
            <div class="wa-product-card" style="width: 100%; border:none;">
              <img src="${prod.image}" style="height: 80px; width:100%; object-fit:cover;">
              <div class="wa-product-info">
                <span class="wa-product-title">${prod.name}</span>
                <span class="wa-product-price">₹${prod.price.toFixed(2)}</span>
              </div>
            </div>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">${msg.sender === 'bot' ? 'BOT' : 'YOU'}</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      } else {
        bubbleContent = `
          <div class="merchant-bubble">
            <p>${msg.text}</p>
            <div class="bubble-meta">
              <span class="bubble-sender-tag">${msg.sender === 'customer' ? 'CUSTOMER' : (msg.sender === 'bot' ? 'BOT' : 'YOU')}</span>
              <span>${msg.time}</span>
            </div>
          </div>
        `;
      }
      row.innerHTML = bubbleContent;
      elements.merchantMessagesContainer.appendChild(row);
    });
    
    elements.merchantMessagesContainer.scrollTop = elements.merchantMessagesContainer.scrollHeight;
    
    // Sync to iPhone
    renderiPhoneSimulator();
    
    // Refresh AI Copilot for this customer
    refreshAiCopilot(state.activeCustomer);
    
  } catch (err) {
    console.error('Error refreshing active thread', err);
  }
}

// 8. Render Phone simulator UI
function renderiPhoneSimulator() {
  const customer = state.activeCustomerData;
  if(!customer) return;
  
  elements.waMessagesLog.innerHTML = '';
  
  customer.chatHistory.forEach(msg => {
    const wrapper = document.createElement('div');
    wrapper.className = `wa-msg-wrapper ${msg.sender === 'customer' ? 'outgoing' : 'incoming'}`;
    
    let bubbleContent = '';
    if(msg.isTemplate) {
      let buttonsHtml = '';
      if(msg.templateType === 'welcome') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-open-catalog" id="btn-wa-open-catalog"><i class="fa-solid fa-store"></i> View Catalog</button>
            <button class="wa-action-btn btn-wa-agent-talk" id="btn-wa-agent-talk"><i class="fa-solid fa-user-tie"></i> Talk to Agent</button>
          </div>
        `;
      } else if (msg.templateType === 'flash_sale') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-open-catalog" id="btn-wa-open-catalog">🔥 Shop Sale</button>
          </div>
        `;
      } else if (msg.templateType === 'campaign_packages') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Grand Bengali Thali" data-pkg-price="999.00" data-pkg-sku="MEAL-THALI-01" data-pkg-image="https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80">Grand Bengali Thali (₹999.00)</button>
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Royal Seafood Platter" data-pkg-price="1499.00" data-pkg-sku="MEAL-SEAFOOD-02" data-pkg-image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80">Royal Seafood Platter (₹1499.00)</button>
            <button class="wa-action-btn btn-wa-pkg" data-pkg-name="Classic Veg Feast" data-pkg-price="699.00" data-pkg-sku="MEAL-VEG-03" data-pkg-image="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80">Classic Veg Feast (₹699.00)</button>
          </div>
        `;
      } else if (msg.templateType === 'payment_reminder') {
        buttonsHtml = `
          <div class="wa-interactive-buttons">
            <button class="wa-action-btn btn-wa-pay"><i class="fa-solid fa-credit-card"></i> Pay Now</button>
          </div>
        `;
      }
      bubbleContent = `
        <div class="wa-bubble">
          <p>${msg.text}</p>
          ${buttonsHtml}
          <div class="wa-msg-time">${msg.time}</div>
        </div>
      `;
    } else if (msg.isProductCard) {
      const prod = state.products.find(p => p.id === msg.productId) || { name: 'Product', price: 0, image: '' };
      bubbleContent = `
        <div class="wa-bubble" style="padding:0; overflow:hidden;">
          <div class="wa-product-card">
            <img src="${prod.image}">
            <div class="wa-product-info">
              <div class="wa-product-title">${prod.name}</div>
              <div class="wa-product-price">₹${prod.price.toFixed(2)}</div>
            </div>
          </div>
          <div class="wa-interactive-buttons" style="border:none; margin:0; padding:4px;">
            <button class="wa-action-btn btn-wa-quick-add" data-id="${prod.id}">Add to Cart</button>
          </div>
          <div class="wa-msg-time" style="padding: 0 8px 4px 0;">${msg.time}</div>
        </div>
      `;
    } else {
      bubbleContent = `
        <div class="wa-bubble">
          <p>${msg.text}</p>
          <div class="wa-msg-time">
            ${msg.time}
            ${msg.sender === 'customer' ? '<i class="fa-solid fa-check-double"></i>' : ''}
          </div>
        </div>
      `;
    }
    
    wrapper.innerHTML = bubbleContent;
    elements.waMessagesLog.appendChild(wrapper);
  });
  
  elements.waMessagesLog.scrollTop = elements.waMessagesLog.scrollHeight;
  elements.waCartBadge.textContent = customer.cart.length;
}

// Thread selection is now handled dynamically in refreshThreadList()

// Merchant sends reply text
async function sendMerchantReply() {
  const text = elements.merchantReplyInput.value.trim();
  if(!text) return;
  
  await API.sendMerchantMessage(state.activeCustomer, text);
  elements.merchantReplyInput.value = '';
  refreshInbox();
  
  // update preview text
  const preview = document.getElementById(`thread-preview-${state.activeCustomer}`);
  if(preview) preview.textContent = text;
}

elements.btnSendMerchantReply.addEventListener('click', sendMerchantReply);
elements.merchantReplyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMerchantReply();
  }
});

// 1. WhatsApp Approved Message Templates Modal Handlers
function openTemplatesModal() {
  if (!elements.templatesModal) return;
  const customerName = state.activeCustomerData?.name || 'Customer';
  if (elements.templateTargetCustomer) elements.templateTargetCustomer.textContent = customerName;
  elements.templatesModal.classList.add('show');
}

if (elements.btnTemplatesDropdown) {
  elements.btnTemplatesDropdown.addEventListener('click', (e) => {
    e.preventDefault();
    openTemplatesModal();
  });
}

if (elements.btnCloseTemplatesModal) {
  elements.btnCloseTemplatesModal.addEventListener('click', () => {
    elements.templatesModal.classList.remove('show');
  });
}

document.querySelectorAll('.btn-dispatch-template').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const type = btn.getAttribute('data-template');
    if (elements.templatesModal) elements.templatesModal.classList.remove('show');
    
    await API.sendWebhook(state.activeCustomer, 'text', `[Template Push] ${type}`);
    const customerName = state.activeCustomerData?.name || 'Customer';
    showCrmToast(`🚀 Template "${type}" dispatched to ${customerName} on WhatsApp!`);
    await refreshInbox();
    setTimeout(refreshInbox, 1200);
  });
});

// 2. Interactive Send Product Card Modal Handlers
let sendProductFilter = { search: '', diet: 'all' };

async function openSendProductModal() {
  if (!elements.sendProductModal) return;
  if (!state.products || state.products.length === 0) {
    state.products = await API.getProducts();
  }
  const customerName = state.activeCustomerData?.name || 'Customer';
  if (elements.sendProductTargetName) elements.sendProductTargetName.textContent = customerName;
  renderSendProductGrid();
  elements.sendProductModal.classList.add('show');
}

function renderSendProductGrid() {
  if (!elements.sendProductGrid) return;
  elements.sendProductGrid.innerHTML = '';
  
  let list = [...(state.products || [])];
  if (sendProductFilter.diet === 'veg') {
    list = list.filter(p => p.isVeg);
  } else if (sendProductFilter.diet === 'nonveg') {
    list = list.filter(p => !p.isVeg);
  }
  if (sendProductFilter.search && sendProductFilter.search.trim()) {
    const q = sendProductFilter.search.trim().toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q)));
  }
  
  if (list.length === 0) {
    elements.sendProductGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">No matching dishes found. Try a different search.</div>`;
    return;
  }
  
  list.forEach(p => {
    const card = document.createElement('div');
    card.style.background = 'rgba(255, 255, 255, 0.03)';
    card.style.border = '1px solid var(--border-color)';
    card.style.borderRadius = '8px';
    card.style.overflow = 'hidden';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.innerHTML = `
      <div style="position: relative; height: 110px;">
        <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; top: 6px; left: 6px; width: 16px; height: 16px; background: rgba(0,0,0,0.7); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
          <span style="display: block; width: 8px; height: 8px; border-radius: 50%; background: ${p.isVeg ? '#10B981' : '#EF4444'};"></span>
        </div>
        <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.75); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">
          ⏱ ${p.prepTime || '25m'}
        </span>
      </div>
      <div style="padding: 10px; display: flex; flex-direction: column; flex: 1;">
        <h5 style="margin: 0 0 4px 0; font-size: 13px; color: #fff;">${p.name}</h5>
        <div style="font-size: 13px; font-weight: 700; color: var(--primary-color); margin-bottom: 10px;">₹${Number(p.price).toFixed(2)}</div>
        <button class="btn btn-small btn-primary btn-send-dish-now" data-id="${p.id}" style="margin-top: auto; width: 100%; font-size: 12px; padding: 6px 10px;">
          <i class="fa-brands fa-whatsapp"></i> Send to Customer
        </button>
      </div>
    `;
    
    card.querySelector('.btn-send-dish-now').addEventListener('click', async () => {
      elements.sendProductModal.classList.remove('show');
      await API.sendWebhook(state.activeCustomer, 'text', `[Product Push] ${p.name}`);
      const customerName = state.activeCustomerData?.name || 'Customer';
      showCrmToast(`📦 "${p.name}" (₹${p.price}) sent to ${customerName} on WhatsApp!`);
      await refreshInbox();
      setTimeout(refreshInbox, 1200);
    });
    
    elements.sendProductGrid.appendChild(card);
  });
}

if (elements.btnPushCatalog) {
  elements.btnPushCatalog.addEventListener('click', (e) => {
    e.preventDefault();
    openSendProductModal();
  });
}

if (elements.btnCloseSendProductModal) {
  elements.btnCloseSendProductModal.addEventListener('click', () => {
    elements.sendProductModal.classList.remove('show');
  });
}

if (elements.sendProductSearch) {
  elements.sendProductSearch.addEventListener('input', (e) => {
    sendProductFilter.search = e.target.value;
    renderSendProductGrid();
  });
}

document.querySelectorAll('.send-prod-diet-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.send-prod-diet-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sendProductFilter.diet = btn.getAttribute('data-diet') || 'all';
    renderSendProductGrid();
  });
});

async function pushProductCard(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;
  await API.sendWebhook(state.activeCustomer, 'text', `[Product Push] ${prod.name}`);
  await refreshInbox();
  setTimeout(refreshInbox, 1200);
}

// Inbound Customer Actions (iPhone simulator)
elements.btnCloseWaCatalog.addEventListener('click', () => {
  elements.waCatalogModal.classList.remove('show');
});

elements.btnWaViewCart.addEventListener('click', () => {
  elements.waCatalogModal.classList.remove('show');
  elements.waCartModal.classList.add('show');
  renderCustomerCartHTML();
});

elements.btnCloseWaCart.addEventListener('click', () => {
  elements.waCartModal.classList.remove('show');
  elements.waCatalogModal.classList.add('show');
});

// Listen for clicks inside the Catalog products overlay (Event Delegation)
elements.waCatalogProductsContainer.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.btn-wa-add-cart');
  if (addBtn) {
    const id = addBtn.getAttribute('data-id');
    addProductToSimCart(id);
    return;
  }
  
  const buyBtn = e.target.closest('.btn-wa-buy-now');
  if (buyBtn) {
    const id = buyBtn.getAttribute('data-id');
    elements.waCatalogModal.classList.remove('show');
    window.open(`/payment.html?customerId=${state.activeCustomer}&buyNowProduct=${id}`, '_blank');
  }
});

// Show an elegant toast inside the phone simulator
function showSimToast(message) {
  const screen = document.querySelector('.iphone-screen');
  if (!screen) return;
  
  const oldToast = screen.querySelector('.wa-toast');
  if (oldToast) oldToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'wa-toast';
  toast.style.position = 'absolute';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(23, 32, 43, 0.95)';
  toast.style.color = '#F1F5F9';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '1000';
  toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.whiteSpace = 'nowrap';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--primary-color);"></i> ${message}`;
  
  screen.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-5px)';
  }, 10);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(5px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function addProductToSimCart(productId) {
  const customer = state.activeCustomerData;
  const prod = state.products.find(p => p.id === productId);
  
  customer.cart.push(prod);
  elements.waCartBadge.textContent = customer.cart.length;
  showSimToast(`${prod.name} added to cart!`);
}

function renderCustomerCartHTML() {
  const customer = state.activeCustomerData;
  elements.waCartItemsContainer.innerHTML = '';
  
  let total = 0;
  customer.cart.forEach(item => {
    total += item.price;
    const row = document.createElement('div');
    row.className = 'wa-cart-item-row';
    row.innerHTML = `
      <div class="wa-cart-item-details">
        <span>${item.name}</span>
        <em>SKU: ${item.sku}</em>
      </div>
      <span class="wa-cart-item-price">₹${item.price.toFixed(2)}</span>
    `;
    elements.waCartItemsContainer.appendChild(row);
  });
  elements.waCartTotalVal.textContent = `₹${total.toFixed(2)}`;
}

// Customer sends cart checkout webhook
elements.btnWaConfirmOrder.addEventListener('click', async () => {
  const customer = state.activeCustomerData;
  if(customer.cart.length === 0) return;
  
  await API.sendWebhook(state.activeCustomer, 'cart_submission', '', customer.cart);
  elements.waCartModal.classList.remove('show');
  
  // Refresh active details
  refreshInbox();
});

// Customer sends standard text input from WhatsApp Phone Simulator
async function sendWaText() {
  const text = elements.waUserInput.value.trim();
  if(!text) return;
  
  await API.sendWebhook(state.activeCustomer, 'text', text);
  elements.waUserInput.value = '';
  
  await refreshInbox();
  // Fetch bot auto-reply after 1.2s delay
  setTimeout(refreshInbox, 1200);
}

elements.btnSendWaMessage.addEventListener('click', sendWaText);
elements.waUserInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendWaText();
});

// Listen for clicks inside the WhatsApp Simulator chat history (Event Delegation)
elements.waMessagesLog.addEventListener('click', async (e) => {
  // 1. Open Catalog Button
  const catalogBtn = e.target.closest('.btn-wa-open-catalog');
  if (catalogBtn) {
    elements.waCatalogModal.classList.add('show');
    return;
  }
  
  // 2. Talk to Agent Button
  const agentBtn = e.target.closest('.btn-wa-agent-talk');
  if (agentBtn) {
    await API.sendWebhook(state.activeCustomer, 'button_click', 'Talk to Agent');
    setTimeout(refreshInbox, 500);
    return;
  }
  
  // 3. Quick Add Product Button
  const quickAddBtn = e.target.closest('.btn-wa-quick-add');
  if (quickAddBtn) {
    const id = quickAddBtn.getAttribute('data-id');
    addProductToSimCart(id);
    return;
  }
  
  // 4. Select Campaign Package Button
  const pkgBtn = e.target.closest('.btn-wa-pkg');
  if (pkgBtn) {
    const name = pkgBtn.getAttribute('data-pkg-name');
    const price = parseFloat(pkgBtn.getAttribute('data-pkg-price'));
    const sku = pkgBtn.getAttribute('data-pkg-sku');
    const image = pkgBtn.getAttribute('data-pkg-image');
    
    await API.sendWebhook(state.activeCustomer, 'campaign_package_select', '', { name, price, sku, image });
    refreshInbox();
    return;
  }
  
  // 5. Pay Now Button
  const payBtn = e.target.closest('.btn-wa-pay') || (e.target.closest('.wa-action-btn') && e.target.textContent.toLowerCase().includes('pay now'));
  if (payBtn) {
    openCheckoutGateway();
    return;
  }
});

function openCheckoutGateway() {
  window.open(`/payment.html?customerId=${state.activeCustomer}`, '_blank');
}

elements.btnPayCancel.addEventListener('click', () => {
  elements.waPaymentModal.classList.remove('show');
});

elements.btnPaySubmit.addEventListener('click', async () => {
  const customer = state.activeCustomerData;
  const total = customer.cart.reduce((sum, p) => sum + p.price, 0);
  
  elements.btnPaySubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  
  await API.sendWebhook(state.activeCustomer, 'payment', '', { amount: total });
  
  setTimeout(() => {
    elements.btnPaySubmit.textContent = `Pay Securely`;
    elements.waPaymentModal.classList.remove('show');
    refreshInbox();
    refreshDashboard();
    alert(`🎉 Client Presentation: Order checkout completed on backend server!`);
  }, 1200);
});

// Catalog Add Form handler
if (elements.productForm) {
  elements.productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category')?.value || 'signature';
    const isVeg = document.getElementById('prod-dietary')?.value === 'veg';
    const price = parseFloat(document.getElementById('prod-price').value);
    const sku = document.getElementById('prod-sku').value.trim();
    const prepTime = document.getElementById('prod-prep')?.value.trim() || '25 mins';
    const stockStatus = document.getElementById('prod-stock')?.value || 'in_stock';
    const image = document.getElementById('prod-image').value.trim();
    const desc = document.getElementById('prod-desc').value.trim();
    
    await API.addProduct({ name, category, isVeg, price, sku, prepTime, stockStatus, image, desc });
    
    elements.productForm.reset();
    elements.productModal.classList.remove('show');
    showCrmToast(`✨ "${name}" added and synchronized with Meta WABA Catalog!`);
    refreshCatalogView();
  });
}

if (elements.btnOpenAddProductModal) {
  elements.btnOpenAddProductModal.addEventListener('click', () => {
    elements.productModal.classList.add('show');
  });
}

if (elements.btnCloseProductModal) {
  elements.btnCloseProductModal.addEventListener('click', () => {
    elements.productModal.classList.remove('show');
  });
}

// Quick Edit Product Modal Handlers
if (elements.editProductForm) {
  elements.editProductForm.addEventListener('submit', handleEditProductSubmit);
}

if (elements.btnCloseEditProductModal) {
  elements.btnCloseEditProductModal.addEventListener('click', () => {
    elements.editProductModal.classList.remove('show');
  });
}

if (elements.btnCancelEditProd) {
  elements.btnCancelEditProd.addEventListener('click', () => {
    elements.editProductModal.classList.remove('show');
  });
}

// Catalog Search Input & Clear
if (elements.catalogSearchInput) {
  elements.catalogSearchInput.addEventListener('input', (e) => {
    state.catalogFilters.search = e.target.value;
    if (elements.btnClearCatalogSearch) {
      elements.btnClearCatalogSearch.style.display = e.target.value.trim() ? 'block' : 'none';
    }
    refreshCatalogView();
  });
}

if (elements.btnClearCatalogSearch) {
  elements.btnClearCatalogSearch.addEventListener('click', () => {
    if (elements.catalogSearchInput) elements.catalogSearchInput.value = '';
    state.catalogFilters.search = '';
    elements.btnClearCatalogSearch.style.display = 'none';
    refreshCatalogView();
  });
}

// Catalog Category Pills
if (elements.catalogCategoryPills) {
  elements.catalogCategoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.catalogCategoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.catalogFilters.category = pill.getAttribute('data-category') || 'all';
      refreshCatalogView();
    });
  });
}

// Catalog Dietary Toggle
if (elements.catalogDietaryBtns) {
  elements.catalogDietaryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.catalogDietaryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.catalogFilters.dietary = btn.getAttribute('data-dietary') || 'all';
      refreshCatalogView();
    });
  });
}

// Catalog Sort Select
if (elements.catalogSortSelect) {
  elements.catalogSortSelect.addEventListener('change', (e) => {
    state.catalogFilters.sort = e.target.value;
    refreshCatalogView();
  });
}

// Catalog Reset Filters
if (elements.btnResetCatalogFilters) {
  elements.btnResetCatalogFilters.addEventListener('click', () => {
    state.catalogFilters = { search: '', category: 'all', dietary: 'all', sort: 'recommended' };
    if (elements.catalogSearchInput) elements.catalogSearchInput.value = '';
    if (elements.btnClearCatalogSearch) elements.btnClearCatalogSearch.style.display = 'none';
    if (elements.catalogCategoryPills) {
      elements.catalogCategoryPills.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category') === 'all');
      });
    }
    if (elements.catalogDietaryBtns) {
      elements.catalogDietaryBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-dietary') === 'all');
      });
    }
    if (elements.catalogSortSelect) elements.catalogSortSelect.value = 'recommended';
    refreshCatalogView();
  });
}

// Force Sync Meta WABA Catalog
if (elements.btnSyncMetaCatalog) {
  elements.btnSyncMetaCatalog.addEventListener('click', async () => {
    const originalText = elements.btnSyncMetaCatalog.innerHTML;
    elements.btnSyncMetaCatalog.disabled = true;
    elements.btnSyncMetaCatalog.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing Meta API...`;
    
    try {
      const res = await API.syncMetaCatalog();
      if (elements.wabaSyncStatusTime) {
        elements.wabaSyncStatusTime.textContent = '• Synced Just now';
      }
      showCrmToast('🚀 All 12 dishes synchronized with Meta Cloud Commerce API!');
      pollWebhookLogs();
      await refreshCatalogView();
    } catch (err) {
      console.error('Error syncing Meta catalog', err);
    } finally {
      setTimeout(() => {
        elements.btnSyncMetaCatalog.disabled = false;
        elements.btnSyncMetaCatalog.innerHTML = originalText;
      }, 1000);
    }
  });
}

// Broadcast schedule simulation
elements.btnOpenCampaignModal.addEventListener('click', () => elements.campaignModal.classList.add('show'));
elements.btnQuickBroadcast.addEventListener('click', () => elements.campaignModal.classList.add('show'));
elements.btnCloseCampaignModal.addEventListener('click', () => elements.campaignModal.classList.remove('show'));

elements.campaignForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('camp-name').value.trim();
  const template = document.getElementById('camp-template').value;
  
  elements.campaignModal.classList.remove('show');
  
  // Submit mock event to webhook stream
  await API.sendWebhook(state.activeCustomer, 'text', `[Campaign Broadcast Schedule] Title: "${title}", Template: ${template}`);
  
  const row = document.createElement('div');
  row.className = 'campaign-row';
  row.innerHTML = `
    <div class="campaign-info">
      <h4>🔥 ${title} (Approved Template)</h4>
      <p>Sent to: <strong>All active subscribers (412 users)</strong> • Just now</p>
    </div>
    <div class="campaign-performance">
      <div class="perf-metric"><span class="num">Sending...</span><span class="lbl">Sent</span></div>
      <div class="perf-metric"><span class="num text-green">-</span><span class="lbl">Read</span></div>
      <div class="perf-metric"><span class="num text-blue">-</span><span class="lbl">Replied</span></div>
    </div>
    <div class="campaign-status-col"><span class="status-badge pending">Sending</span></div>
  `;
  elements.campaignsContainer.prepend(row);
  elements.campaignForm.reset();
  
  setTimeout(() => {
    row.querySelector('.num').textContent = '412';
    row.querySelector('.text-green').textContent = '96%';
    row.querySelector('.text-blue').textContent = '42%';
    row.querySelector('.campaign-status-col').innerHTML = `<span class="status-badge paid">Completed</span>`;
    refreshInbox();
  }, 2000);
});

// =========================================================================
// TERMINAL VISUALIZER POLLING (REAL-TIME CONSOLE TRAFFIC)
// =========================================================================
async function pollWebhookLogs() {
  try {
    const logs = await API.getLogs();
    
    // Check if new webhook log activity occurred and sync in real-time
    if (logs.length > 0) {
      const latestTimestamp = logs[0].timestamp;
      if (state.lastLogTimestamp && latestTimestamp !== state.lastLogTimestamp) {
        // A new webhook event occurred, refresh active UI components
        refreshInbox();
        if (state.activeTab === 'dashboard') {
          refreshDashboard();
        }
      }
      state.lastLogTimestamp = latestTimestamp;
    }
    
    elements.terminalLogsBody.innerHTML = '';
    
    if(logs.length === 0) {
      elements.terminalLogsBody.innerHTML = `<span style="color:var(--text-dark);">// No active API traffic. Interact with the dashboard or simulator to generate traffic.</span>`;
      return;
    }
    
    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `
        <div class="log-meta">
          <span class="log-time">[${log.timestamp}]</span>
          <span class="log-method ${log.log_method || log.method}">${log.method}</span>
          <span class="log-endpoint">${log.endpoint}</span>
        </div>
        <pre class="log-json">${JSON.stringify(log.payload, null, 2)}</pre>
      `;
      elements.terminalLogsBody.appendChild(entry);
    });
  } catch (err) {
    console.error('Error fetching server logs', err);
  }
}

elements.btnClearLogs.addEventListener('click', async () => {
  await API.clearLogs();
  pollWebhookLogs();
});

// =========================================================================
// ✨ AI COPILOT & MULTI-OUTLET MANAGEMENT CONTROLLERS
// =========================================================================

// Notification Toast Utility for CRM
function showCrmToast(message, icon = 'fa-circle-check') {
  let toastContainer = document.getElementById('crm-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'crm-toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '24px';
    toastContainer.style.right = '24px';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.background = 'linear-gradient(135deg, #17202B, #202D3C)';
  toast.style.border = '1px solid rgba(16, 185, 129, 0.4)';
  toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
  toast.style.borderRadius = '10px';
  toast.style.padding = '12px 18px';
  toast.style.color = '#F1F5F9';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '500';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '10px';
  toast.style.animation = 'fadeIn 0.3s ease-out';
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: #10B981; font-size: 16px;"></i> <span>${message}</span>`;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease-out';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// 1. AI Executive Briefing Loader
async function refreshAiExecutiveBriefing(outletId = null) {
  try {
    const targetOutlet = outletId || state.activeOutlet || 'all';
    const briefing = await API.getAiExecutiveBriefing(targetOutlet);
    if (elements.aiBriefingHeadline) elements.aiBriefingHeadline.textContent = briefing.headline;
    if (elements.aiBriefingPulse) elements.aiBriefingPulse.textContent = briefing.revenuePulse;
    if (elements.aiBriefingTop) elements.aiBriefingTop.textContent = briefing.topOutletHighlight;
    if (elements.aiBriefingOpp) elements.aiBriefingOpp.textContent = briefing.proactiveOpportunity;
    if (elements.aiBriefingTime) elements.aiBriefingTime.textContent = 'Updated ' + getFormattedTime();
  } catch (err) {
    console.warn('Error loading AI executive briefing', err);
  }
}

// 2. AI Copilot in Merchant Chat
async function refreshAiCopilot(customerId) {
  try {
    const res = await API.getAiSmartReplies(customerId);
    if (!res) return;

    // Update Sentiment Pill
    if (elements.aiCustomerSentiment && res.sentiment) {
      elements.aiCustomerSentiment.className = `sentiment-pill ${res.sentiment.color || 'positive'}`;
      if (elements.aiSentimentIcon) elements.aiSentimentIcon.className = `fa-solid ${res.sentiment.icon || 'fa-face-smile'}`;
      if (elements.aiSentimentText) elements.aiSentimentText.textContent = `${res.sentiment.label} (${res.sentiment.score}%) • ${res.sentiment.intent}`;
    }

    // Populate Smart Replies Pills
    if (elements.aiSmartRepliesList && res.suggestions) {
      elements.aiSmartRepliesList.innerHTML = '';
      res.suggestions.forEach(sugg => {
        const btn = document.createElement('button');
        btn.className = 'smart-reply-pill';
        btn.innerHTML = `<i class="fa-solid fa-reply-all" style="color: var(--primary-color);"></i> ${sugg}`;
        btn.addEventListener('click', () => {
          elements.merchantReplyInput.value = sugg;
          elements.merchantReplyInput.focus();
        });
        elements.aiSmartRepliesList.appendChild(btn);
      });
    }
  } catch (err) {
    console.warn('Error refreshing AI Copilot', err);
  }
}

// 3. Multi-Outlet Collections Tab Renderer
async function refreshOutletsTab() {
  try {
    const data = await API.getCollectionsToday();
    if (!data) return;

    state.collectionsData = data;
    const { summary, outlets, records } = data;

    const isSpecificBranch = state.activeOutlet && state.activeOutlet !== 'all';
    const selectedOutlet = isSpecificBranch ? outlets.find(o => o.id === state.activeOutlet) : null;
    const selectedRecord = isSpecificBranch ? (records.find(r => r.outletId === state.activeOutlet) || {
      cash: 0, upi: 0, card: 0, onlineDelivery: 0, grossTotal: 0, expenses: 0, netDeposit: 0, status: 'open', notes: '', denominations: {}
    }) : null;

    let displayGross = summary.totalGross;
    let displayTargetPct = summary.achievementPct;
    let displayCash = summary.totalCash;
    let displayCashRatio = summary.cashRatio;
    let displayDigital = summary.totalDigital;
    let displayDigitalRatio = summary.digitalRatio;
    let displayOnline = summary.totalOnline;
    let displayOnlineRatio = summary.onlineRatio;
    let displayNet = summary.totalNet;
    let displayExpenses = summary.totalExpenses;

    let totalUpi = summary.totalUpi;
    let totalCard = summary.totalCard;
    let totalCashAmt = summary.totalCash;
    let totalOnlineAmt = summary.totalOnline;

    if (isSpecificBranch && selectedOutlet && selectedRecord) {
      displayGross = selectedRecord.grossTotal || 0;
      const target = selectedOutlet.targetDaily || 100000;
      displayTargetPct = ((displayGross / target) * 100).toFixed(1);
      displayCash = selectedRecord.cash || 0;
      displayCashRatio = ((displayCash / (displayGross || 1)) * 100).toFixed(1);
      displayDigital = (selectedRecord.upi || 0) + (selectedRecord.card || 0);
      displayDigitalRatio = ((displayDigital / (displayGross || 1)) * 100).toFixed(1);
      displayOnline = selectedRecord.onlineDelivery || 0;
      displayOnlineRatio = ((displayOnline / (displayGross || 1)) * 100).toFixed(1);
      displayNet = selectedRecord.netDeposit || 0;
      displayExpenses = selectedRecord.expenses || 0;

      totalUpi = selectedRecord.upi || 0;
      totalCard = selectedRecord.card || 0;
      totalCashAmt = selectedRecord.cash || 0;
      totalOnlineAmt = selectedRecord.onlineDelivery || 0;
    }

    // Update KPI Card values
    if (elements.kpiTotalGross) elements.kpiTotalGross.textContent = `₹${displayGross.toLocaleString('en-IN')}.00`;
    if (elements.kpiTargetPct) elements.kpiTargetPct.textContent = `${displayTargetPct}%`;
    if (elements.kpiTotalCash) elements.kpiTotalCash.textContent = `₹${displayCash.toLocaleString('en-IN')}.00`;
    if (elements.kpiCashRatio) elements.kpiCashRatio.textContent = `${displayCashRatio}% of ${isSpecificBranch ? 'branch' : 'total'} collection`;
    if (elements.kpiTotalDigital) elements.kpiTotalDigital.textContent = `₹${displayDigital.toLocaleString('en-IN')}.00`;
    if (elements.kpiDigitalRatio) elements.kpiDigitalRatio.textContent = `${displayDigitalRatio}% digital adoption`;
    if (elements.kpiTotalOnline) elements.kpiTotalOnline.textContent = `₹${displayOnline.toLocaleString('en-IN')}.00`;
    if (elements.kpiOnlineRatio) elements.kpiOnlineRatio.textContent = `${displayOnlineRatio}% conversational share`;
    if (elements.kpiTotalNet) elements.kpiTotalNet.textContent = `₹${displayNet.toLocaleString('en-IN')}.00`;
    if (elements.kpiTotalExpenses) elements.kpiTotalExpenses.textContent = `₹${displayExpenses.toLocaleString('en-IN')} petty cash deducted`;

    // Update Progress Split
    const totalG = displayGross || 1;
    const upiW = ((totalUpi / totalG) * 100).toFixed(1);
    const cardW = ((totalCard / totalG) * 100).toFixed(1);
    const cashW = ((totalCashAmt / totalG) * 100).toFixed(1);
    const onlineW = ((totalOnlineAmt / totalG) * 100).toFixed(1);

    if (elements.segUpi) elements.segUpi.style.width = `${upiW}%`;
    if (elements.segCard) elements.segCard.style.width = `${cardW}%`;
    if (elements.segCash) elements.segCash.style.width = `${cashW}%`;
    if (elements.segOnline) elements.segOnline.style.width = `${onlineW}%`;

    if (elements.legendUpi) elements.legendUpi.textContent = `₹${(totalUpi / 1000).toFixed(1)}K / ${upiW}%`;
    if (elements.legendCard) elements.legendCard.textContent = `₹${(totalCard / 1000).toFixed(1)}K / ${cardW}%`;
    if (elements.legendCash) elements.legendCash.textContent = `₹${(totalCashAmt / 1000).toFixed(1)}K / ${cashW}%`;
    if (elements.legendOnline) elements.legendOnline.textContent = `₹${(totalOnlineAmt / 1000).toFixed(1)}K / ${onlineW}%`;

    // Update Active Branch Indicator Header
    if (elements.activeBranchNameText) {
      elements.activeBranchNameText.textContent = isSpecificBranch ? `${selectedOutlet.name} (${selectedOutlet.code})` : 'Consolidated (All 6 Branches)';
    }
    if (elements.outletsHeaderDesc) {
      elements.outletsHeaderDesc.textContent = isSpecificBranch
        ? `Filtered report for ${selectedOutlet.name} • Location: ${selectedOutlet.location} • Manager: ${selectedRecord.settledBy || selectedOutlet.manager}`
        : 'Real-time cross-branch cash in drawer, UPI, POS cards, and shift closing audits across Kolkata.';
    }

    // Update Badge Counts
    if (elements.badgeSettledCount) elements.badgeSettledCount.textContent = isSpecificBranch ? (selectedRecord.status === 'settled' ? 1 : 0) : summary.settledCount;
    if (elements.badgePendingCount) elements.badgePendingCount.textContent = isSpecificBranch ? (selectedRecord.status === 'pending_audit' ? 1 : 0) : summary.pendingAuditCount;
    if (elements.badgeOpenCount) elements.badgeOpenCount.textContent = isSpecificBranch ? (selectedRecord.status === 'open' ? 1 : 0) : summary.openCount;

    // Render the Dedicated Customised Branch Report Card
    renderBranchCustomisedReport(selectedOutlet, selectedRecord, summary);

    // Render Table Rows (Filter by state.activeOutlet if specified)
    if (elements.outletsCollectionTbody) {
      elements.outletsCollectionTbody.innerHTML = '';

      let filteredOutlets = outlets;
      if (isSpecificBranch) {
        filteredOutlets = outlets.filter(o => o.id === state.activeOutlet);
      }

      filteredOutlets.forEach(outlet => {
        const rec = records.find(r => r.outletId === outlet.id) || {
          cash: 0, upi: 0, card: 0, onlineDelivery: 0, grossTotal: 0, expenses: 0, netDeposit: 0, status: 'open'
        };

        const statusClasses = {
          settled: 'badge-settled',
          pending_audit: 'badge-pending',
          open: 'badge-open'
        };
        const statusLabels = {
          settled: '<i class="fa-solid fa-circle-check"></i> Settled',
          pending_audit: '<i class="fa-solid fa-clock"></i> In Audit',
          open: '<i class="fa-solid fa-door-open"></i> Open'
        };

        const tr = document.createElement('tr');
        if (isSpecificBranch) {
          tr.style.background = 'rgba(218, 165, 32, 0.07)';
        }
        tr.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${outlet.isFlagship ? '<i class="fa-solid fa-star text-gold" title="Flagship Heritage Branch"></i>' : '<i class="fa-solid fa-utensils text-muted" style="font-size:12px;"></i>'}
              <div>
                <strong>${outlet.name}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${outlet.code} • ${outlet.currentShift}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${rec.settledBy || outlet.manager}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${outlet.phone}</div>
          </td>
          <td>₹${outlet.targetDaily.toLocaleString('en-IN')}</td>
          <td>₹${(rec.cash || 0).toLocaleString('en-IN')}</td>
          <td>₹${(rec.upi || 0).toLocaleString('en-IN')}</td>
          <td>₹${(rec.card || 0).toLocaleString('en-IN')}</td>
          <td>₹${(rec.onlineDelivery || 0).toLocaleString('en-IN')}</td>
          <td><strong style="color: #fff; font-size: 14px;">₹${(rec.grossTotal || 0).toLocaleString('en-IN')}</strong></td>
          <td style="color: #f87171;">-₹${(rec.expenses || 0).toLocaleString('en-IN')}</td>
          <td><strong style="color: #34d399; font-size: 14px;">₹${(rec.netDeposit || 0).toLocaleString('en-IN')}</strong></td>
          <td><span class="badge ${statusClasses[rec.status] || 'badge-open'}">${statusLabels[rec.status] || rec.status}</span></td>
          <td>
            <button class="btn-record-action" data-outlet-id="${outlet.id}">
              <i class="fa-solid fa-cash-register"></i> Audit / Edit
            </button>
          </td>
        `;

        // Wire edit action button
        const editBtn = tr.querySelector('.btn-record-action');
        editBtn.addEventListener('click', () => {
          openRecordShiftModal(outlet.id);
        });

        elements.outletsCollectionTbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Error loading outlets tab data', err);
  }
}

// Render Customised Branch Executive Report Card
function renderBranchCustomisedReport(outlet, rec, summary) {
  if (!elements.branchCustomisedReportContainer) return;

  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const isBranch = !!(outlet && rec);

  let html = '';

  if (isBranch) {
    const gross = rec.grossTotal || 0;
    const target = outlet.targetDaily || 100000;
    const achieve = ((gross / (target || 1)) * 100).toFixed(1);
    const isAchieved = Number(achieve) >= 100;
    const denoms = rec.denominations || { '500': 0, '200': 0, '100': 0, coins: 0 };

    const statusBadge = rec.status === 'settled'
      ? '<span class="badge badge-settled"><i class="fa-solid fa-circle-check"></i> Settled & Audited</span>'
      : (rec.status === 'pending_audit'
        ? '<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> In Audit</span>'
        : '<span class="badge badge-open"><i class="fa-solid fa-door-open"></i> Register Open</span>');

    html = `
      <div class="branch-customised-report-card">
        <div class="branch-report-header">
          <div class="branch-report-title-area">
            <h4>
              ${outlet.isFlagship ? '<i class="fa-solid fa-star text-gold" title="Flagship Heritage"></i>' : '<i class="fa-solid fa-store text-gold"></i>'}
              <span>${outlet.name} — Branch Executive Report</span>
              ${statusBadge}
            </h4>
            <div class="branch-report-meta">
              <span><i class="fa-solid fa-location-dot"></i> ${outlet.location}</span>
              <span><i class="fa-solid fa-user-tie"></i> <strong>Manager:</strong> ${rec.settledBy || outlet.manager}</span>
              <span><i class="fa-solid fa-phone"></i> ${outlet.phone}</span>
              <span><i class="fa-solid fa-clock"></i> <strong>Shift:</strong> ${outlet.currentShift}</span>
              <span><i class="fa-solid fa-calendar-day"></i> ${todayStr}</span>
            </div>
          </div>
          <div class="branch-report-actions">
            <button class="btn-report-action btn-report-whatsapp" id="btn-quick-wa-report">
              <i class="fa-brands fa-whatsapp"></i> Broadcast to WhatsApp
            </button>
            <button class="btn-report-action btn-report-copy" id="btn-quick-copy-report">
              <i class="fa-solid fa-copy"></i> Copy Report Text
            </button>
            <button class="btn-report-action btn-report-copy" id="btn-clear-branch-filter">
              <i class="fa-solid fa-globe"></i> View All Branches
            </button>
          </div>
        </div>

        <div class="branch-report-grid">
          <!-- Box 1: Revenue vs Target -->
          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Gross Turnover vs Goal</span>
              <span class="target-badge ${isAchieved ? 'achieved' : 'under'}">
                ${isAchieved ? '<i class="fa-solid fa-trophy"></i> ' + achieve + '% Achieved' : achieve + '% of Goal'}
              </span>
            </div>
            <div class="report-stat-hero">
              <span class="gross-val">₹${gross.toLocaleString('en-IN')}.00</span>
              <span style="font-size: 12px; color: var(--text-muted);">Target: ₹${target.toLocaleString('en-IN')}</span>
            </div>
            <div style="background: rgba(255,255,255,0.06); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px;">
              <div style="background: ${isAchieved ? '#10B981' : '#F59E0B'}; height: 100%; width: ${Math.min(100, Number(achieve))}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              <span>Net Deposit: <strong style="color: #34d399;">₹${(rec.netDeposit || 0).toLocaleString('en-IN')}</strong></span>
              <span>Expenses: <strong style="color: #f87171;">-₹${(rec.expenses || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <!-- Box 2: Payment Channels Audit -->
          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Payment Breakdown & Cash Audit</span>
              <span style="color: var(--primary-color); font-size: 11px;"><i class="fa-solid fa-shield-check"></i> Balanced</span>
            </div>
            <div class="channel-breakdown-list">
              <div class="channel-row">
                <span>💵 Physical Cash in Drawer:</span>
                <span class="amt">₹${(rec.cash || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="denom-badges-wrap">
                <span class="denom-badge">₹500 × ${denoms['500'] || 0}</span>
                <span class="denom-badge">₹200 × ${denoms['200'] || 0}</span>
                <span class="denom-badge">₹100 × ${denoms['100'] || 0}</span>
              </div>
              <div class="channel-row" style="margin-top: 4px;">
                <span>⚡ UPI QR Collections:</span>
                <span class="amt" style="color: #60a5fa;">₹${(rec.upi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="channel-row">
                <span>💳 EDC POS Cards:</span>
                <span class="amt" style="color: #c084fc;">₹${(rec.card || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="channel-row">
                <span>🛵 Online (Swiggy / WhatsApp):</span>
                <span class="amt" style="color: #fbbf24;">₹${(rec.onlineDelivery || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <!-- Box 3: Shift Closing Audit & Notes -->
          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Shift Audit Status & Manager Notes</span>
              <span style="font-size: 11px; color: var(--text-dark);">${rec.settledAt || 'Live Shift'}</span>
            </div>
            <div class="notes-quote-box">
              <i class="fa-solid fa-quote-left" style="color: var(--primary-color); margin-right: 4px;"></i>
              ${rec.notes || 'All card slips, QR receipts, and physical cash drawer reconciled without shortage.'}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span>Shift: <strong>${outlet.currentShift}</strong></span>
              <span>Auditor: <strong>${rec.settledBy || outlet.manager}</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // Consolidated report across all 6 outlets
    const gross = summary.totalGross || 688400;
    const target = summary.totalTarget || 660000;
    const achieve = summary.achievementPct || 104.3;

    html = `
      <div class="branch-customised-report-card">
        <div class="branch-report-header">
          <div class="branch-report-title-area">
            <h4>
              <i class="fa-solid fa-network-wired text-gold"></i>
              <span>Consolidated Brand Executive Report (All 6 Branches)</span>
              <span class="badge badge-settled"><i class="fa-solid fa-circle-check"></i> ${summary.settledCount}/${summary.totalOutlets} Settled</span>
            </h4>
            <div class="branch-report-meta">
              <span><i class="fa-solid fa-store"></i> 6 Outlets Across Kolkata</span>
              <span><i class="fa-solid fa-calendar-day"></i> ${todayStr}</span>
              <span><i class="fa-solid fa-trophy"></i> <strong>Top Branch:</strong> Ballygunge Flagship (₹1,55,800)</span>
            </div>
          </div>
          <div class="branch-report-actions">
            <button class="btn-report-action btn-report-whatsapp" id="btn-quick-wa-report">
              <i class="fa-brands fa-whatsapp"></i> Broadcast EOD to WhatsApp
            </button>
            <button class="btn-report-action btn-report-copy" id="btn-quick-copy-report">
              <i class="fa-solid fa-copy"></i> Copy Consolidated Text
            </button>
          </div>
        </div>

        <div class="branch-report-grid">
          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Brand Gross Turnover</span>
              <span class="target-badge achieved"><i class="fa-solid fa-trophy"></i> ${achieve}% Achieved</span>
            </div>
            <div class="report-stat-hero">
              <span class="gross-val">₹${gross.toLocaleString('en-IN')}.00</span>
              <span style="font-size: 12px; color: var(--text-muted);">Brand Target: ₹${target.toLocaleString('en-IN')}</span>
            </div>
            <div style="background: rgba(255,255,255,0.06); height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px;">
              <div style="background: #10B981; height: 100%; width: ${Math.min(100, Number(achieve))}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              <span>Net Bank Deposits: <strong style="color: #34d399;">₹${(summary.totalNet || 0).toLocaleString('en-IN')}</strong></span>
              <span>Total Petty Deducted: <strong style="color: #f87171;">-₹${(summary.totalExpenses || 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Cross-Outlet Collection Audit</span>
              <span style="color: var(--primary-color); font-size: 11px;">6 Outlets Active</span>
            </div>
            <div class="channel-breakdown-list">
              <div class="channel-row">
                <span>💵 Physical Cash Across Drawers:</span>
                <span class="amt">₹${(summary.totalCash || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="channel-row">
                <span>⚡ UPI QR Brand Volume:</span>
                <span class="amt" style="color: #60a5fa;">₹${(summary.totalUpi || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="channel-row">
                <span>💳 EDC POS Cards Brand Volume:</span>
                <span class="amt" style="color: #c084fc;">₹${(summary.totalCard || 0).toLocaleString('en-IN')}</span>
              </div>
              <div class="channel-row">
                <span>🛵 Online & WhatsApp Delivery:</span>
                <span class="amt" style="color: #fbbf24;">₹${(summary.totalOnline || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div class="report-panel-box">
            <div class="report-panel-title">
              <span>Settlement Audit Progress</span>
              <span style="font-size: 11px; color: var(--text-dark);">Central Reconciliation</span>
            </div>
            <div class="notes-quote-box">
              <i class="fa-solid fa-building-circle-check" style="color: #10B981; margin-right: 4px;"></i>
              Ballygunge Flagship, Salt Lake Sector V, South City Mall, and New Town shifts settled. Park Street slip reconciliation in progress.
            </div>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span>Digital Adoption: <strong style="color: #60a5fa;">${summary.digitalRatio}%</strong></span>
              <span>Audit Status: <strong style="color: #34d399;">${summary.settledCount} Settled, ${summary.pendingAuditCount} In Audit</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  elements.branchCustomisedReportContainer.innerHTML = html;

  // Wire quick action buttons on the report card
  const btnQuickWa = elements.branchCustomisedReportContainer.querySelector('#btn-quick-wa-report');
  if (btnQuickWa) {
    btnQuickWa.addEventListener('click', () => {
      openEodBroadcastModal(outlet ? outlet.id : 'all');
    });
  }

  const btnQuickCopy = elements.branchCustomisedReportContainer.querySelector('#btn-quick-copy-report');
  if (btnQuickCopy) {
    btnQuickCopy.addEventListener('click', async () => {
      try {
        const report = await API.getCollectionsReport(outlet ? outlet.id : 'all');
        if (report && report.formattedText) {
          await navigator.clipboard.writeText(report.formattedText);
          showCrmToast('📋 Executive Report copied to clipboard!');
        }
      } catch (e) {
        showCrmToast('Report copied!');
      }
    });
  }

  const btnClearFilter = elements.branchCustomisedReportContainer.querySelector('#btn-clear-branch-filter');
  if (btnClearFilter) {
    btnClearFilter.addEventListener('click', async () => {
      state.activeOutlet = 'all';
      if (elements.globalOutletSelect) elements.globalOutletSelect.value = 'all';
      await refreshOutletsTab();
      await refreshDashboard();
      showCrmToast('📍 Restored view to All 6 Branches (Consolidated 6BP)');
    });
  }
}

// 4. Open Record Shift Modal
function openRecordShiftModal(outletId = null) {
  if (!elements.recordShiftModal) return;

  const targetOutletId = outletId || (state.activeOutlet !== 'all' ? state.activeOutlet : 'outlet_ballygunge');
  elements.shiftOutletSelect.value = targetOutletId;

  // Pre-fill existing record if available
  const existingRecord = (state.collectionsData?.records || []).find(r => r.outletId === targetOutletId);

  if (existingRecord) {
    elements.shiftCash.value = existingRecord.cash || 0;
    elements.shiftUpi.value = existingRecord.upi || 0;
    elements.shiftCard.value = existingRecord.card || 0;
    elements.shiftOnline.value = existingRecord.onlineDelivery || 0;
    elements.shiftExpenses.value = existingRecord.expenses || 0;
    elements.shiftStatus.value = existingRecord.status || 'settled';
    elements.shiftSettledBy.value = existingRecord.settledBy || '';
    elements.shiftNotes.value = existingRecord.notes || '';

    if (existingRecord.denominations) {
      if (elements.denom500) elements.denom500.value = existingRecord.denominations['500'] || '';
      if (elements.denom200) elements.denom200.value = existingRecord.denominations['200'] || '';
      if (elements.denom100) elements.denom100.value = existingRecord.denominations['100'] || '';
      if (elements.denomCoins) elements.denomCoins.value = existingRecord.denominations['coins'] || '';
    }
  } else {
    elements.recordShiftForm.reset();
    elements.shiftOutletSelect.value = targetOutletId;
  }

  calcShiftModalTotals();
  elements.recordShiftModal.classList.add('show');
}

// Live calculation in Shift Modal
function calcShiftModalTotals() {
  const cash = parseFloat(elements.shiftCash?.value) || 0;
  const upi = parseFloat(elements.shiftUpi?.value) || 0;
  const card = parseFloat(elements.shiftCard?.value) || 0;
  const online = parseFloat(elements.shiftOnline?.value) || 0;
  const expenses = parseFloat(elements.shiftExpenses?.value) || 0;

  const gross = cash + upi + card + online;
  const net = Math.max(0, gross - expenses);

  if (elements.shiftModalGross) elements.shiftModalGross.textContent = `₹${gross.toLocaleString('en-IN')}.00`;
  if (elements.shiftModalNet) elements.shiftModalNet.textContent = `₹${net.toLocaleString('en-IN')}.00`;

  // Denominations count
  const n500 = parseInt(elements.denom500?.value) || 0;
  const n200 = parseInt(elements.denom200?.value) || 0;
  const n100 = parseInt(elements.denom100?.value) || 0;
  const nCoins = parseInt(elements.denomCoins?.value) || 0;
  const denomTotal = (n500 * 500) + (n200 * 200) + (n100 * 100) + nCoins;

  if (elements.denomCalcTotal) {
    elements.denomCalcTotal.textContent = `₹${denomTotal.toLocaleString('en-IN')}`;
    if (denomTotal === cash && cash > 0) {
      elements.denomCalcTotal.style.color = '#10B981';
    } else if (cash > 0) {
      elements.denomCalcTotal.style.color = '#F59E0B';
    }
  }
}

// 5. Handle Shift Record Form Submit
async function handleRecordShiftSubmit(e) {
  e.preventDefault();
  const outletId = elements.shiftOutletSelect.value;
  const cash = elements.shiftCash.value;
  const upi = elements.shiftUpi.value;
  const card = elements.shiftCard.value;
  const onlineDelivery = elements.shiftOnline.value;
  const expenses = elements.shiftExpenses.value;
  const status = elements.shiftStatus.value;
  const settledBy = elements.shiftSettledBy.value;
  const notes = elements.shiftNotes.value;

  const denominations = {
    '500': parseInt(elements.denom500?.value) || 0,
    '200': parseInt(elements.denom200?.value) || 0,
    '100': parseInt(elements.denom100?.value) || 0,
    'coins': parseInt(elements.denomCoins?.value) || 0
  };

  try {
    const res = await API.recordShift({
      outletId,
      cash,
      upi,
      card,
      onlineDelivery,
      expenses,
      status,
      settledBy,
      notes,
      denominations
    });

    if (res && res.success) {
      elements.recordShiftModal.classList.remove('show');
      showCrmToast(`✅ Shift record saved! Net deposit ₹${res.record.netDeposit.toLocaleString('en-IN')} audited.`);
      await refreshOutletsTab();
      await refreshDashboard();
    }
  } catch (err) {
    console.error('Error recording outlet shift', err);
    alert('Failed to save outlet shift. Check network connection.');
  }
}

// 6. EOD Broadcast Modal & Confirm
async function openEodBroadcastModal(outletId = null) {
  try {
    const targetOutletId = outletId !== null ? outletId : (state.activeOutlet || 'all');
    state.modalEodOutlet = targetOutletId;

    const reportData = await API.getCollectionsReport(targetOutletId);
    if (reportData && reportData.formattedText) {
      if (elements.eodPhonePreviewText) elements.eodPhonePreviewText.textContent = reportData.formattedText;
      if (elements.eodPreviewModal) elements.eodPreviewModal.classList.add('show');
      return;
    }

    const data = await API.getCollectionsToday();
    const summary = data.summary;
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    let topOutlet = { name: 'Ballygunge Flagship', gross: 0 };
    data.records.forEach(r => {
      if (r.grossTotal > topOutlet.gross) topOutlet = { name: r.outletName, gross: r.grossTotal };
    });

    const previewMsg = `📊 *6 Ballygunge Place - Consolidated EOD Report*\n` +
      `📅 *Date:* ${todayStr}\n\n` +
      `💰 *Brand Gross Turnover:* ₹${summary.totalGross.toLocaleString('en-IN')}\n` +
      `🎯 *Target Achievement:* ${summary.achievementPct}% of ₹${summary.totalTarget.toLocaleString('en-IN')}\n\n` +
      `💵 *Cash in Drawer:* ₹${summary.totalCash.toLocaleString('en-IN')} (${summary.cashRatio}%)\n` +
      `⚡ *Digital (UPI/Cards):* ₹${summary.totalDigital.toLocaleString('en-IN')} (${summary.digitalRatio}%)\n` +
      `🛵 *Online & WhatsApp:* ₹${summary.totalOnline.toLocaleString('en-IN')}\n` +
      `🏦 *Net Cash to Bank:* ₹${summary.totalNet.toLocaleString('en-IN')}\n\n` +
      `🏆 *Top Branch:* ${topOutlet.name} (₹${topOutlet.gross.toLocaleString('en-IN')})\n` +
      `✅ *Audited & Settled Outlets:* ${summary.settledCount}/${summary.totalOutlets}\n\n` +
      `_Sent automatically from 6BP Central Management Console._`;

    if (elements.eodPhonePreviewText) elements.eodPhonePreviewText.textContent = previewMsg;
    if (elements.eodPreviewModal) elements.eodPreviewModal.classList.add('show');
  } catch (err) {
    console.error('Error generating EOD preview', err);
  }
}

async function handleEodBroadcastConfirm() {
  const phone = elements.eodRecipientPhone?.value || '+919007378887';
  const targetOutletId = state.modalEodOutlet || state.activeOutlet || 'all';
  try {
    const res = await API.broadcastEOD(phone, targetOutletId);
    if (res && res.success) {
      if (elements.eodPreviewModal) elements.eodPreviewModal.classList.remove('show');
      const isSingle = targetOutletId && targetOutletId !== 'all';
      const targetLabel = isSingle ? 'Branch Shift EOD Report' : 'Consolidated EOD Executive Summary';
      showCrmToast(`🚀 ${targetLabel} sent to WhatsApp (${phone})!`);
      pollWebhookLogs();
    }
  } catch (err) {
    console.error('Error broadcasting EOD report', err);
  }
}

// 7. AI Campaign Copy Generator
function openAiCampaignModal() {
  if (elements.aiCampaignModal) {
    elements.aiCampaignModal.classList.add('show');
    handleGenerateAiCampaignCopy();
  }
}

async function handleGenerateAiCampaignCopy() {
  const occasion = elements.aiCampOccasion?.value || 'Sunday Heritage Feast';
  const discount = elements.aiCampDiscount?.value || '20%';

  try {
    const res = await API.generateAiCampaign({ occasion, discount });
    if (res && res.templateCopy) {
      elements.aiCampPreviewText.value = res.templateCopy;
    }
  } catch (err) {
    console.warn('Error generating AI campaign copy', err);
  }
}

async function handleBroadcastAiCampaign() {
  const copy = elements.aiCampPreviewText?.value;
  if (!copy) return;

  try {
    // Send simulated broadcast
    await API.sendWebhook(state.activeCustomer, 'text', `[AI Broadcast] ${copy}`);
    if (elements.aiCampaignModal) elements.aiCampaignModal.classList.remove('show');
    showCrmToast('🚀 AI Campaign broadcasted via Meta Cloud API to 412 subscribers!');
    pollWebhookLogs();
    refreshInbox();
  } catch (err) {
    console.error('Error broadcasting AI campaign', err);
  }
}

// Close modals clicking outside
window.addEventListener('click', (e) => {
  if (elements.productModal?.contains(e.target) && e.target === elements.productModal) elements.productModal.classList.remove('show');
  if (elements.editProductModal?.contains(e.target) && e.target === elements.editProductModal) elements.editProductModal.classList.remove('show');
  if (elements.campaignModal?.contains(e.target) && e.target === elements.campaignModal) elements.campaignModal.classList.remove('show');
  if (elements.recordShiftModal?.contains(e.target) && e.target === elements.recordShiftModal) elements.recordShiftModal.classList.remove('show');
  if (elements.aiCampaignModal?.contains(e.target) && e.target === elements.aiCampaignModal) elements.aiCampaignModal.classList.remove('show');
  if (elements.eodPreviewModal?.contains(e.target) && e.target === elements.eodPreviewModal) elements.eodPreviewModal.classList.remove('show');
  if (elements.templatesModal?.contains(e.target) && e.target === elements.templatesModal) elements.templatesModal.classList.remove('show');
  if (elements.sendProductModal?.contains(e.target) && e.target === elements.sendProductModal) elements.sendProductModal.classList.remove('show');
});

// Bootstrapping page load
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Session check & redirect
  const userJson = localStorage.getItem('whatscart_user');
  if (!userJson) {
    window.location.href = '/login.html';
    return;
  }
  
  const user = JSON.parse(userJson);

  // Auto-upgrade agent/manager identity to authentic Bengali (Indian) portraits
  if (user.role === 'agent') {
    user.name = 'Subhashis Banerjee';
    user.avatar = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80';
    localStorage.setItem('whatscart_user', JSON.stringify(user));
  } else if (user.role === 'owner') {
    user.name = 'Joydeep Sen';
    user.avatar = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80';
    localStorage.setItem('whatscart_user', JSON.stringify(user));
  }

  // 2. Populate sidebar profile
  const sidebarAvatar = document.querySelector('.user-profile img.avatar');
  const sidebarName = document.querySelector('.user-profile .user-name');
  const sidebarRole = document.querySelector('.user-profile .user-role');
  
  if (sidebarAvatar) sidebarAvatar.src = user.avatar;
  if (sidebarName) sidebarName.textContent = user.name;
  if (sidebarRole) sidebarRole.textContent = user.role === 'owner' ? 'Restaurant General Manager' : 'Senior Support Agent';

  // 3. Role-based feature restriction
  if (user.role === 'agent') {
    const catalogTabLink = document.querySelector('.nav-menu a[data-tab="catalog"]');
    const campaignsTabLink = document.querySelector('.nav-menu a[data-tab="campaigns"]');
    if (catalogTabLink) catalogTabLink.style.display = 'none';
    if (campaignsTabLink) campaignsTabLink.style.display = 'none';
    
    // Hide quick template broadcasts or campaign buttons
    const quickBroadcastBtn = document.getElementById('btn-quick-broadcast');
    if (quickBroadcastBtn) quickBroadcastBtn.style.display = 'none';
    
    // Hide settings Shopify storefront sync row completely
    const shopifySyncCard = document.querySelector('.settings-card:nth-child(2)');
    if (shopifySyncCard) shopifySyncCard.style.display = 'none';
  }

  // 4. Bind logout action
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('whatscart_user');
      window.location.href = '/login.html';
    });
  }

  // Bind toggle CRM drawer
  if (elements.btnToggleCrm && elements.crmDrawer) {
    elements.btnToggleCrm.addEventListener('click', () => {
      elements.crmDrawer.classList.toggle('collapsed');
      elements.btnToggleCrm.classList.toggle('active');
    });
  }

  // Bind toggle WhatsApp Simulator
  if (elements.btnToggleSim && elements.simulatorWrapper) {
    elements.btnToggleSim.addEventListener('click', () => {
      elements.simulatorWrapper.classList.toggle('collapsed');
      elements.btnToggleSim.classList.toggle('active');
    });
  }

  // Bind takeover button
  if (elements.btnTakeover) {
    elements.btnTakeover.addEventListener('click', async () => {
      await API.sendWebhook(state.activeCustomer, 'text', '[Agent Takeover Request]');
      refreshInbox();
      alert('🤖 Support session manual agent takeover triggered.');
    });
  }

  // Bind CRM notes save
  if (elements.crmNotes) {
    elements.crmNotes.addEventListener('change', async () => {
      await API.updateCustomer(state.activeCustomer, { notes: elements.crmNotes.value });
    });
  }

  // Bind Shopify storefront sync
  if (elements.btnSyncShopify) {
    elements.btnSyncShopify.addEventListener('click', async () => {
      const originalContent = elements.btnSyncShopify.innerHTML;
      elements.btnSyncShopify.disabled = true;
      elements.btnSyncShopify.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing catalog...`;
      
      try {
        const res = await fetch('/api/shopify/sync', { method: 'POST' });
        const data = await res.json();
        
        setTimeout(() => {
          elements.btnSyncShopify.innerHTML = `<i class="fa-solid fa-check" style="color:var(--primary-color);"></i> Synced!`;
          
          setTimeout(() => {
            elements.btnSyncShopify.disabled = false;
            elements.btnSyncShopify.innerHTML = originalContent;
          }, 2000);
        }, 1500);
      } catch (err) {
        console.error('Error syncing Shopify storefront', err);
        elements.btnSyncShopify.disabled = false;
        elements.btnSyncShopify.innerHTML = originalContent;
      }
    });
  }

  await refreshDashboard();
  await refreshCatalogView();
  await refreshInbox();
  await refreshOutletsTab();

  // Wire Global Outlet Selector
  if (elements.globalOutletSelect) {
    elements.globalOutletSelect.addEventListener('change', async (e) => {
      state.activeOutlet = e.target.value;
      const outletName = e.target.options[e.target.selectedIndex]?.text || e.target.value;
      showCrmToast(`🏢 Active Outlet: ${outletName}`);
      await refreshOutletsTab();
      await refreshDashboard();
      await refreshAiExecutiveBriefing();
      await refreshCatalogView();
    });
  }

  // Wire AI Executive Briefing events
  if (elements.btnRefreshAiBriefing) {
    elements.btnRefreshAiBriefing.addEventListener('click', async () => {
      elements.btnRefreshAiBriefing.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> Analyzing...`;
      await refreshAiExecutiveBriefing();
      showCrmToast('✨ AI Executive Intelligence re-analyzed.');
      elements.btnRefreshAiBriefing.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Refresh AI Insights`;
    });
  }

  if (elements.btnAiTriggerAction) {
    elements.btnAiTriggerAction.addEventListener('click', async () => {
      await API.sendWebhook(state.activeCustomer, 'text', '[AI Proactive Offer] 15% VIP Dinner Voucher dispatched!');
      showCrmToast('⚡ Proactive AI Dinner Voucher broadcasted to 18 active carts!');
      refreshInbox();
    });
  }

  // Wire AI Tone Selection & Draft Generator
  // Wire AI Tone Selection & Instant Draft Generator
  if (elements.btnToneList) {
    elements.btnToneList.forEach(btn => {
      btn.addEventListener('click', async () => {
        elements.btnToneList.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedTone = btn.getAttribute('data-tone') || 'bengali';

        // Immediately auto-draft reply in the clicked tone!
        const toneLabel = btn.textContent.trim();
        try {
          if (elements.btnApplyAiDraft) elements.btnApplyAiDraft.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles fa-spin"></i> Drafting...`;
          const res = await API.draftAiResponse(state.activeCustomer, state.selectedTone);
          if (res && res.draftedText) {
            elements.merchantReplyInput.value = res.draftedText;
            elements.merchantReplyInput.focus();
            showCrmToast(`✨ AI drafted reply in "${toneLabel}" tone!`);
          }
        } catch (err) {
          console.warn('Error drafting tone response', err);
        } finally {
          if (elements.btnApplyAiDraft) elements.btnApplyAiDraft.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Draft Reply`;
        }
      });
    });
  }

  if (elements.btnApplyAiDraft) {
    elements.btnApplyAiDraft.addEventListener('click', async () => {
      const originalText = elements.btnApplyAiDraft.innerHTML;
      elements.btnApplyAiDraft.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles fa-spin"></i> Drafting...`;
      try {
        const res = await API.draftAiResponse(state.activeCustomer, state.selectedTone);
        if (res && res.draftedText) {
          elements.merchantReplyInput.value = res.draftedText;
          elements.merchantReplyInput.focus();
          showCrmToast(`✨ AI drafted response ready for ${state.activeCustomerData?.name || 'Customer'}!`);
        }
      } catch (err) {
        console.warn('Error drafting AI response', err);
      } finally {
        elements.btnApplyAiDraft.innerHTML = originalText;
      }
    });
  }

  // Wire AI Summarize to CRM Profile Notes
  if (elements.btnAiSummarizeNotes) {
    elements.btnAiSummarizeNotes.addEventListener('click', async () => {
      const originalText = elements.btnAiSummarizeNotes.innerHTML;
      elements.btnAiSummarizeNotes.innerHTML = `<i class="fa-solid fa-brain fa-spin"></i> Summarizing...`;
      try {
        const res = await API.summarizeCustomer(state.activeCustomer);
        if (res && res.notes) {
          if (elements.crmNotes) {
            elements.crmNotes.value = res.notes;
            elements.crmNotes.style.borderColor = '#10B981';
            elements.crmNotes.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.4)';
            setTimeout(() => {
              elements.crmNotes.style.borderColor = '';
              elements.crmNotes.style.boxShadow = '';
            }, 3000);
          }
          showCrmToast(`🧠 AI summarized customer profile notes for ${state.activeCustomerData?.name || 'Guest'}!`);
        }
      } catch (err) {
        console.warn('Error summarizing customer', err);
      } finally {
        elements.btnAiSummarizeNotes.innerHTML = originalText;
      }
    });
  }

  // Wire Real-Time Thread Search
  if (elements.chatSearchInput) {
    elements.chatSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.threads-container .thread-item').forEach(item => {
        const name = (item.querySelector('.customer-name')?.textContent || '').toLowerCase();
        const preview = (item.querySelector('.thread-preview p')?.textContent || '').toLowerCase();
        if (!q || name.includes(q) || preview.includes(q)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // Wire Outlets Shift Modal & EOD
  if (elements.btnOpenRecordShift) {
    elements.btnOpenRecordShift.addEventListener('click', () => openRecordShiftModal());
  }

  if (elements.btnCloseRecordShiftModal) {
    elements.btnCloseRecordShiftModal.addEventListener('click', () => {
      elements.recordShiftModal.classList.remove('show');
    });
  }

  if (elements.recordShiftForm) {
    elements.recordShiftForm.addEventListener('submit', handleRecordShiftSubmit);
  }

  // Recalculate live totals on modal inputs
  ['shiftCash', 'shiftUpi', 'shiftCard', 'shiftOnline', 'shiftExpenses', 'denom500', 'denom200', 'denom100', 'denomCoins'].forEach(id => {
    const el = elements[id];
    if (el) {
      el.addEventListener('input', calcShiftModalTotals);
    }
  });

  if (elements.shiftOutletSelect) {
    elements.shiftOutletSelect.addEventListener('change', (e) => {
      openRecordShiftModal(e.target.value);
    });
  }

  // Wire EOD WhatsApp Broadcast
  if (elements.btnBroadcastEodReport) {
    elements.btnBroadcastEodReport.addEventListener('click', openEodBroadcastModal);
  }

  if (elements.btnCloseEodModal) {
    elements.btnCloseEodModal.addEventListener('click', () => {
      elements.eodPreviewModal.classList.remove('show');
    });
  }

  if (elements.btnConfirmEodBroadcast) {
    elements.btnConfirmEodBroadcast.addEventListener('click', handleEodBroadcastConfirm);
  }

  // Wire AI Campaign modal
  if (elements.btnOpenAiCampaign) {
    elements.btnOpenAiCampaign.addEventListener('click', openAiCampaignModal);
  }

  if (elements.btnCloseAiCampaignModal) {
    elements.btnCloseAiCampaignModal.addEventListener('click', () => {
      elements.aiCampaignModal.classList.remove('show');
    });
  }

  if (elements.btnGenerateAiCopy) {
    elements.btnGenerateAiCopy.addEventListener('click', handleGenerateAiCampaignCopy);
  }

  if (elements.btnBroadcastAiCampaign) {
    elements.btnBroadcastAiCampaign.addEventListener('click', handleBroadcastAiCampaign);
  }
  
  // Poll webhook logs every 1.5 seconds
  setInterval(pollWebhookLogs, 1500);
  pollWebhookLogs(); // direct call on load
  
  // Detect campaign referral query string
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') === 'paid_campaign') {
    // Switch to Inbox view
    switchTab('inbox');
    
    // Simulate customer sending pre-filled message
    setTimeout(async () => {
      // Clear url parameter from address bar
      try {
        window.history.pushState({}, document.title, window.location.pathname);
      } catch(e) {
        console.warn('Skipping URL parameter clean on file:// protocol', e);
      }
      
      // Trigger webhook to mock customer inbound referral message
      await API.sendWebhook(state.activeCustomer, 'text', '[Campaign Referral] Sunday Heritage Feast Promo');
      refreshInbox();
    }, 1000);
  }
});
