console.log("APP VERSION 439 LOADED");
const API_BASE = "https://telegram-marketplace-api.onrender.com";

const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";
const FRONTEND_VERSION = "439";
const PRODUCT_PHOTO_MAX_SIZE = 8 * 1024 * 1024;
const PRODUCT_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PRODUCT_TITLE_MAX_LENGTH = 80;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 1500;
const VERIFICATION_FULL_NAME_MAX_LENGTH = 120;
const VERIFICATION_PHOTO_MAX_SIZE = 6 * 1024 * 1024;
const VERIFICATION_ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let tg = null;
let telegramUser = null;
let currentUser = null;
let isLoading = false;
let myProductsView = "active";
let catalogView = "all";
let currentModalImageIndex = 0;
let currentModalImages = [];
let filtersOpen = false;
let catalogSearchOpen = false;
let notificationsUnread = 0;
let dashboardRefreshTimer = null;
let editingProductId = null;
let editingExistingImages = [];
let selectedProductFiles = [];
let myProductsSearchQuery = "";
let myProductsSortValue = "newest";

const TG_CACHE_INIT_KEY = "marketplace_tg_init_data";
const TG_CACHE_USER_KEY = "marketplace_tg_user";

const APP_LANG_KEY = "marketplace_lang";
const supportedLanguages = ["uk", "en"];

function normalizeLanguage(lang) {
    return supportedLanguages.includes(lang) ? lang : "uk";
}

let currentLanguage = normalizeLanguage(localStorage.getItem(APP_LANG_KEY));

const I18N = {
    uk: {
        authLoginTitle: "Увійдіть або зареєструйтеся",
        authLoginTab: "Вхід",
        authRegisterTab: "Реєстрація",
        loginBtn: "Увійти",
        registerBtn: "Зареєструватися",
        authDivider: "або",
        rememberTitle: "Запам’ятати акаунт",
        rememberSubtitle: "Зберегти вхід на цьому пристрої",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        fullNamePlaceholder: "Ім'я",
        tgLogin: "Увійти через Telegram",
        tgHintReady: "Швидкий вхід через ваш Telegram акаунт",
        tgHintUnavailable: "Кнопку Telegram тимчасово приховано — використайте звичайний вхід",
        appMini: "Маркетплейс у Telegram",
        catalogTitle: "Каталог товарів",
        refresh: "Оновити",
        catalogTab: "Каталог",
        favoritesTab: "Обране",
        searchPlaceholder: "Пошук товарів...",
        filters: "Фільтри",
        resetFilters: "Скинути фільтри",
        searchBtn: "Шукати",
        myProductsTitle: "Мої оголошення",
        activeTab: "Активні",
        requestsTab: "Запити на продаж",
        soldTab: "Продані",
        archivedTab: "Архів",
        createTitle: "Створити оголошення",
        cancelEdit: "Скасувати редагування",
        cartTitle: "Кошик",
        buyAll: "Купити все",
        profileTitle: "Профіль",
        profileSettings: "Налаштування профілю",
        stats: "Статистика", hideStats: "Сховати статистику",
        purchases: "Історія покупок", hidePurchases: "Сховати історію покупок",
        reviews: "Мої відгуки",
        admin: "Адмін панель", hideAdmin: "Сховати адмін панель",
        ideas: "Ідеї та побажання", hideIdeas: "Сховати ідеї та побажання",
        logout: "Змінити акаунт / Вийти",
        navCatalog: "Каталог", navMine: "Мої", navCart: "Кошик", navProfile: "Профіль",
        rating: "Рейтинг",
        status: "Статус",
        tgOnly: "Працює лише всередині Telegram Mini App",
        loading: "Завантаження...",
        noReviews: "У вас поки немає відгуків",
        noSellerReviews: "Відгуків поки немає",
        noComment: "Без коментаря",
        buyer: "Покупець",
        dealAmount: "Сума угоди",
        item: "Оголошення",
        authorProfile: "Профіль автора",
        archivedState: "В архіві",
        restoreBtn: "Повернути в каталог",
        ratingReviews: "відгуків",
        authLangTitle: "Мова інтерфейсу",
        superadmin: "Суперадмін",
        protectedAdmin: "Захищений акаунт"
    },
    en: {
        authLoginTitle: "Sign in or register",
        authLoginTab: "Sign in",
        authRegisterTab: "Register",
        loginBtn: "Sign in",
        registerBtn: "Create account",
        authDivider: "or",
        rememberTitle: "Remember account",
        rememberSubtitle: "Keep me signed in on this device",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        fullNamePlaceholder: "Full name",
        tgLogin: "Sign in with Telegram",
        tgHintReady: "Fast sign-in with your Telegram account",
        tgHintUnavailable: "Telegram button is temporarily hidden — use regular sign in",
        appMini: "Marketplace in Telegram",
        catalogTitle: "Product catalog",
        refresh: "Refresh",
        catalogTab: "Catalog",
        favoritesTab: "Favorites",
        searchPlaceholder: "Search products...",
        filters: "Filters",
        resetFilters: "Reset filters",
        searchBtn: "Search",
        myProductsTitle: "My listings",
        activeTab: "Active",
        requestsTab: "Sale requests",
        soldTab: "Sold",
        archivedTab: "Archive",
        createTitle: "Create listing",
        cancelEdit: "Cancel editing",
        cartTitle: "Cart",
        buyAll: "Buy all",
        profileTitle: "Profile",
        profileSettings: "Profile settings",
        stats: "Statistics", hideStats: "Hide statistics",
        purchases: "Purchase history", hidePurchases: "Hide purchase history",
        reviews: "My reviews",
        admin: "Admin panel", hideAdmin: "Hide admin panel",
        ideas: "Ideas & suggestions", hideIdeas: "Hide ideas & suggestions",
        logout: "Switch account / Log out",
        navCatalog: "Catalog", navMine: "Mine", navCart: "Cart", navProfile: "Profile",
        rating: "Rating",
        status: "Status",
        tgOnly: "Works only inside Telegram Mini App",
        loading: "Loading...",
        noReviews: "No reviews yet",
        noSellerReviews: "No reviews yet",
        noComment: "No comment",
        buyer: "Buyer",
        dealAmount: "Deal amount",
        item: "Listing",
        authorProfile: "Author profile",
        archivedState: "Archived",
        restoreBtn: "Return to catalog",
        ratingReviews: "reviews",
        authLangTitle: "Interface language",
        superadmin: "Superadmin",
        protectedAdmin: "Protected account"
    }
};

function t(key) {
    return I18N[currentLanguage]?.[key] || I18N.uk[key] || key;
}

function tr(uk, en) {
    return currentLanguage === "en" ? en : uk;
}

const VALUE_TRANSLATIONS = {
    "Усі категорії": "All categories",
    "Усі міста": "All cities",
    "Будь-який стан": "Any condition",
    "Оберіть категорію": "Choose a category",
    "Оберіть стан": "Choose condition",
    "Без категорії": "No category",
    "Без міста": "No city",
    "Інше": "Other",
    "Шахрайство": "Fraud",
    "Неправдивий опис": "Misleading description",
    "Заборонений товар": "Prohibited item",
    "Спам": "Spam",
    "Підозрілий профіль": "Suspicious profile",
    "Образи або небажана поведінка": "Abuse or unwanted behavior",
    "Не отримав товар": "Item not received",
    "Покупець не підтверджує отримання": "Buyer has not confirmed receipt",
    "Новий": "New",
    "Б/У": "Used",
    "Смартфони": "Smartphones",
    "Ноутбуки": "Laptops",
    "Навушники": "Headphones",
    "Ігрові приставки": "Game consoles",
    "Планшети": "Tablets",
    "Смарт-годинники": "Smartwatches",
    "Телевізори": "TVs",
    "Фото / відео": "Photo / video",
    "ПК комплектуючі": "PC components",
    "Монітори": "Monitors",
    "Аксесуари": "Accessories",
    "Будматеріали": "Building materials",
    "Інструменти": "Tools",
    "Тварини": "Pets",
    "Нерухомість": "Real estate",
    "Дім та сад": "Home & garden",
    "Меблі": "Furniture",
    "Посуд": "Kitchenware",
    "Одяг": "Clothing",
    "Взуття": "Shoes",
    "Дитячі товари": "Kids' goods",
    "Краса і здоровʼя": "Beauty & health",
    "Автотовари": "Car accessories",
    "Авто": "Cars",
    "Мото": "Motorcycles",
    "Велосипеди": "Bicycles",
    "Спорт": "Sports",
    "Книги": "Books",
    "Хобі": "Hobbies",
    "Музичні інструменти": "Musical instruments",
    "Робота": "Jobs",
    "Послуги": "Services",
    "Колекції": "Collections",
    "Подарунки": "Gifts",
    "Київ": "Kyiv",
    "Одеса": "Odesa",
    "Дніпро": "Dnipro",
    "Львів": "Lviv",
    "Харків": "Kharkiv",
    "Прага": "Prague",
    "Берлін": "Berlin",
    "Рим": "Rome",
    "Варшава": "Warsaw",
    "Відень": "Vienna",
    "Париж": "Paris",
    "Мадрид": "Madrid",
    "Лондон": "London",
    "Амстердам": "Amsterdam",
    "Брюссель": "Brussels",
    "Будапешт": "Budapest",
    "Братислава": "Bratislava",
    "Вільнюс": "Vilnius",
    "Рига": "Riga",
    "Таллінн": "Tallinn",
    "Новіші": "Newest",
    "Старіші": "Oldest",
    "Дешевші": "Cheapest first",
    "Дорожчі": "Most expensive first",
    "Кращий рейтинг продавця": "Best seller rating",
    "Шахрайство": "Fraud",
    "Неправдивий опис": "Misleading description",
    "Заборонений товар": "Prohibited item",
    "Спам": "Spam",
    "Продано": "Sold",
    "Архів": "Archive",
    "Активні": "Active",
    "Продані": "Sold",
    "Куплені": "Bought",
    "У кошику": "In cart",
    "Запити": "Requests",
    "Покупки": "Purchases",
    "Очікують": "Pending",
    "Користувачі": "Users",
    "Оголошення": "Listings",
    "Ідеї": "Ideas",
    "Скарги": "Reports",
    "Логи": "Logs",
    "Виконано": "Done",
    "На розгляді": "In review",
    "Нова": "New",
    "Підтверджено": "Approved",
    "Відхилено": "Rejected",
    "Скасовано": "Cancelled",
    "Очікує підтвердження": "Pending approval",
    "Очікує відповіді": "Waiting for response",
    "Активний": "Active",
    "Заблокований": "Blocked",
    "Без імені": "No name",
    "Без фото": "No photo",
    "Товар": "Product",
    "Продавець": "Seller",
    "Покупець": "Buyer",
    "Дата": "Date",
    "Ім'я": "Name",
    "Разом": "Total",
    "Бан": "Banned",
    "Розбан": "Unban",
    "Адміністратор": "Administrator"
};

function tv(value) {
    const text = String(value ?? "");
    if (currentLanguage !== "en") return text;
    return VALUE_TRANSLATIONS[text] || text;
}
function translateMessage(message) {
    const text = String(message ?? "");
    if (currentLanguage !== "en") return text;
    const exact = {
        "Помилка завантаження": "Loading error",
        "Помилка покупки": "Purchase error",
        "Помилка роботи з обраним": "Favorites error",
        "Не вдалося обробити запит": "Failed to process request",
        "Не вдалося видалити оголошення": "Failed to archive listing",
        "Не вдалося додати товар": "Failed to add item",
        "Не вдалося видалити товар з кошика": "Failed to remove item from cart",
        "Не вдалося купити всі товари": "Failed to buy all items",
        "API недоступне": "API is unavailable",
        "Помилка": "Error",
        "Сталася помилка": "Something went wrong"
    };
    return exact[text] || VALUE_TRANSLATIONS[text] || text;
}


function translateStatusValue(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["sold", "продано"].includes(normalized)) return tr("Продано", "Sold");
    if (["archived", "архів", "в архіві"].includes(normalized)) return tr("Архів", "Archived");
    if (["active", "активний", "активні"].includes(normalized)) return tr("Активний", "Active");
    if (["reserved", "зарезервовано"].includes(normalized)) return tr("Зарезервовано", "Reserved");
    if (["blocked", "заблокирован", "заблокований"].includes(normalized)) return tr("Заблокований", "Blocked");
    return currentLanguage === "en" ? tv(value) : String(value || "");
}

function translateSelectOptions(selectId) {
    const select = $(selectId);
    if (!select) return;
    Array.from(select.options).forEach(option => {
        if (!option.dataset.ukLabel) option.dataset.ukLabel = option.textContent;
        option.textContent = currentLanguage === "en" ? tv(option.dataset.ukLabel) : option.dataset.ukLabel;
    });
}


function animateModalOpen(modalId) {
    const modal = $(modalId);
    const content = modal?.querySelector?.(".modal-content");
    if (!modal || !content) return;
    modal.classList.remove("hidden");
    content.classList.remove("modal-animate-in");
    requestAnimationFrame(() => requestAnimationFrame(() => content.classList.add("modal-animate-in")));
}

function animateModalClose(modalId) {
    const modal = $(modalId);
    const content = modal?.querySelector?.(".modal-content");
    if (content) content.classList.remove("modal-animate-in");
    modal?.classList.add("hidden");
}

function safeOpenReview(orderId, sellerId, event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    requestAnimationFrame(() => openReviewModal(orderId, sellerId, event));
}

function safeOpenReport(productId, title = "", event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    if (!$("product-modal")?.classList.contains("hidden")) {
        closeProductModal();
        requestAnimationFrame(() => requestAnimationFrame(() => openReportModal(productId, title, event)));
        return;
    }
    requestAnimationFrame(() => openReportModal(productId, title, event));
}

function syncBodyScrollLock() {
    const hasOpenModal = ["product-modal", "image-viewer-modal", "review-modal", "report-modal", "user-profile-modal", "verification-modal"].some((id) => {
        const el = $(id);
        return el && !el.classList.contains("hidden");
    });

    document.body.classList.toggle("no-scroll", hasOpenModal);
    document.documentElement.classList.toggle("no-scroll", hasOpenModal);
}

function setProfileMenuButton(btnId, icon, label, isOpen = false) {
    const btn = $(btnId);
    if (!btn) return;
    const text = isOpen ? (t('hide' + label.charAt(0).toUpperCase() + label.slice(1)) || label) : t(label);
    btn.innerHTML = `<span class="profile-menu-icon">${icon}</span><span>${escapeHtml(text)}</span><span class="profile-menu-arrow">›</span>`;
}

function applyLanguageTexts() {
    const authTitle = document.querySelector('.auth-title-line');
    if (authTitle) authTitle.textContent = t('authLoginTitle');
    if ($('auth-tab-login')) $('auth-tab-login').textContent = t('authLoginTab');
    if ($('auth-tab-register')) $('auth-tab-register').textContent = t('authRegisterTab');
    if ($('login-submit-btn')) $('login-submit-btn').textContent = t('loginBtn');
    if ($('register-submit-btn')) $('register-submit-btn').textContent = t('registerBtn');
    if ($('auth-divider-text')) $('auth-divider-text').textContent = t('authDivider');
    if ($('remember-title')) $('remember-title').textContent = t('rememberTitle');
    if ($('remember-subtitle')) $('remember-subtitle').textContent = t('rememberSubtitle');
    if ($('login-username')) $('login-username').placeholder = t('usernamePlaceholder');
    if ($('login-password')) $('login-password').placeholder = t('passwordPlaceholder');
    if ($('register-username')) $('register-username').placeholder = t('usernamePlaceholder');
    if ($('register-fullname')) $('register-fullname').placeholder = t('fullNamePlaceholder');
    if ($('register-password')) $('register-password').placeholder = t('passwordPlaceholder');
    const tgBtn = $('tg-login-btn');
    if (tgBtn) tgBtn.textContent = t('tgLogin');
    const ratingLabel = document.querySelector('.profile-mini-label');
    if (ratingLabel) ratingLabel.innerHTML = `<span class="profile-menu-icon">⭐</span> ${escapeHtml(t('rating'))}`;
    setProfileMenuButton('stats-toggle-btn', '📊', 'stats', $('stats-wrap') && !$('stats-wrap').classList.contains('hidden'));
    setProfileMenuButton('purchase-history-toggle-btn', '🛍', 'purchases', $('purchase-history-wrap') && !$('purchase-history-wrap').classList.contains('hidden'));
    setProfileMenuButton('my-reviews-toggle-btn', '⭐', 'reviews', $('my-reviews-wrap') && !$('my-reviews-wrap').classList.contains('hidden'));
    setProfileMenuButton('admin-toggle-btn', '🛡', 'admin', $('admin-panel-body') && !$('admin-panel-body').classList.contains('hidden'));
    setProfileMenuButton('ideas-toggle-btn', '💡', 'ideas', $('ideas-wrap') && !$('ideas-wrap').classList.contains('hidden'));
    const verificationBtnLabel = document.querySelector('#verification-toggle-btn > span:nth-child(2)');
    if (verificationBtnLabel) verificationBtnLabel.textContent = tr('Верифікація', 'Verification');
    const verificationMenuStatus = $('verification-menu-status');
    if (verificationMenuStatus) {
        const status = verificationStatusValue(currentUser);
        verificationMenuStatus.textContent = verificationStatusLabel(status);
        verificationMenuStatus.className = `verification-menu-status ${verificationBadgeClass(status)}`;
    }
    if ($('verification-wrap') && !$('verification-wrap').classList.contains('hidden')) renderVerificationPanel();
    const logoutBtn = document.querySelector('.profile-logout-btn');
    if (logoutBtn) logoutBtn.innerHTML = `<span class="profile-menu-icon">🚪</span><span>${escapeHtml(t('logout'))}</span>`;
    const navMap = { 'nav-catalog-btn': 'navCatalog', 'nav-my-products-btn': 'navMine', 'nav-cart-btn': 'navCart', 'nav-profile-btn': 'navProfile' };
    Object.entries(navMap).forEach(([id,key]) => {
        const btn = $(id);
        const label = btn?.querySelector('.nav-label');
        if (label) label.textContent = t(key);
    });
    const langSelect = $('language-select');
    if (langSelect) langSelect.value = currentLanguage;
    const authLangSelect = $('auth-language-select');
    if (authLangSelect) authLangSelect.value = currentLanguage;
    const authLangTitle = document.querySelector('.auth-lang-title');
    if (authLangTitle) authLangTitle.textContent = t('authLangTitle');
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLanguage));

    const setText = (sel, value) => { const el = document.querySelector(sel); if (el) el.textContent = value; };
    const setRefreshButtonLabel = (btn) => {
        if (!btn) return;
        const label = t('refresh');
        btn.setAttribute('title', label);
        btn.setAttribute('aria-label', label);
        if (!btn.classList.contains('icon-refresh-btn')) btn.textContent = label;
    };

    setText('.topbar-mini', t('appMini'));
    setText('#tab-catalog .section-header h2', t('catalogTitle'));
    setText('#tab-catalog .catalog-subtabs #catalog-all-btn', t('catalogTab'));
    setText('#tab-catalog .catalog-subtabs #catalog-favorites-btn', t('favoritesTab'));

    setText('#catalog-search-label', tr('Пошук товарів', 'Product search'));
    setText('#seller-search-label', tr('🔎 Пошук продавця', '🔎 Seller search'));
    setText('#catalog-search-btn', t('searchBtn'));
    setText('#seller-search-btn', tr('Знайти', 'Find'));
    setText('.catalog-search-head-title', tr('Пошук та фільтри', 'Search and filters'));
    const collapseBtn = $('catalog-search-collapse-btn');
    if (collapseBtn) collapseBtn.title = tr('Відкрити або закрити пошук', 'Open or close search');
    if ($('seller-search-input')) $('seller-search-input').placeholder = tr('username (без @)', 'username (without @)');
    const searchInput = $('search-input'); if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    const filtersBtn = $('filters-toggle-btn'); if (filtersBtn && !filtersOpen) filtersBtn.textContent = t('filters');
    const catRefreshBtn = $('catalog-refresh-btn') || document.querySelector('#tab-catalog .icon-refresh-btn');
    setRefreshButtonLabel(catRefreshBtn);

    translateSelectOptions('category-filter');
    translateSelectOptions('city-filter');
    translateSelectOptions('condition-filter');
    translateSelectOptions('sort-filter');
    if ($('price-min-filter')) $('price-min-filter').placeholder = tr('Ціна від', 'Price from');
    if ($('price-max-filter')) $('price-max-filter').placeholder = tr('Ціна до', 'Price to');
    const resetFiltersBtn = $('reset-filters-btn'); if (resetFiltersBtn) resetFiltersBtn.textContent = t('resetFilters');

    setText('#tab-my-products .section-header h2', t('myProductsTitle'));
    const mpRefreshBtn = $('my-products-refresh-btn');
    setRefreshButtonLabel(mpRefreshBtn);
    const mpBtns = document.querySelectorAll('#tab-my-products .subtab-btn');
    if (mpBtns[0]) mpBtns[0].textContent = t('activeTab');
    if ($('my-products-requests-btn-label')) $('my-products-requests-btn-label').textContent = t('requestsTab');
    if (mpBtns[2]) mpBtns[2].textContent = t('soldTab');
    if (mpBtns[3]) mpBtns[3].textContent = t('archivedTab');
    const myToolbarLabel = document.querySelector('#tab-my-products .catalog-toolbar .toolbar-label');
    if (myToolbarLabel) myToolbarLabel.textContent = tr('Пошук у моїх оголошеннях', 'Search in my listings');
    if ($('my-products-search-input')) $('my-products-search-input').placeholder = tr('Назва, покупець, місто...', 'Title, buyer, city...');
    translateSelectOptions('my-products-sort-select');
    const myApplyBtn = document.querySelector('#tab-my-products .catalog-toolbar .section-btn');
    if (myApplyBtn) myApplyBtn.textContent = tr('Застосувати', 'Apply');
    setText('.requests-header', tr('Запити на покупку', 'Purchase requests'));

    setText('#tab-create .section-header h2', t('createTitle'));
    const cancelEditBtn = $('cancel-edit-btn'); if (cancelEditBtn) cancelEditBtn.textContent = t('cancelEdit');
    syncCreateSectionHeader();

    const createLabels = document.querySelectorAll('#tab-create label');
    if (createLabels[0]) createLabels[0].textContent = tr('Назва товару', 'Product title');
    if (createLabels[1]) createLabels[1].textContent = tr('Опис', 'Description');
    if (createLabels[2]) createLabels[2].textContent = tr('Ціна', 'Price');
    if (createLabels[3]) createLabels[3].textContent = tr('Категорія', 'Category');
    if (createLabels[4]) createLabels[4].textContent = tr('Стан товару', 'Condition');
    if (createLabels[5]) createLabels[5].textContent = tr('Місто', 'City');
    if (createLabels[6]) createLabels[6].textContent = tr('Причина', 'Reason');

    setText('.listing-eyebrow', tr('Швидке створення', 'Quick creation'));
    setText('.listing-form-hero h3', tr('Створи оголошення красиво і без зайвого', 'Create a clean and attractive listing'));
    setText('.listing-form-hero p', tr('Заповни основну інформацію, вибери категорію та додай фото. Ми залишили тільки те, що реально важливо.', 'Fill in the main details, choose a category, and add photos. We kept only what really matters.'));
    const stepBadges = document.querySelectorAll('.listing-step-badge');
    if (stepBadges[0]) stepBadges[0].textContent = tr('1. Основне', '1. Basics');
    if (stepBadges[1]) stepBadges[1].textContent = tr('2. Деталі', '2. Details');
    if (stepBadges[2]) stepBadges[2].textContent = tr('3. Фото', '3. Photos');
    const sectionTitles = document.querySelectorAll('.listing-section-title');
    if (sectionTitles[0]) sectionTitles[0].textContent = tr('Основна інформація', 'Main information');
    if (sectionTitles[1]) sectionTitles[1].textContent = tr('Категорія та параметри', 'Category and details');
    if (sectionTitles[2]) sectionTitles[2].textContent = tr('Фото товару', 'Product photos');
    if ($('product-title')) $('product-title').placeholder = tr('Наприклад: iPhone 15 Pro Max', 'Example: iPhone 15 Pro Max');
    if ($('product-description')) $('product-description').placeholder = tr('Коротко опишіть стан, комплект, особливості та що важливо для покупця', 'Briefly describe the condition, included items, special features, and what matters to the buyer');
    const fieldHint = document.querySelector('.field-hint'); if (fieldHint) fieldHint.textContent = tr('Найкраще працюють короткі, чесні та зрозумілі описи.', 'Short, honest, and clear descriptions work best.');
    if ($('category-selected-label')) $('category-selected-label').textContent = $('product-category')?.value ? tv($('product-category').value) : tr('Оберіть категорію', 'Choose a category');
    if ($('product-city')) $('product-city').placeholder = tr('Почни вводити місто або вибери зі списку', 'Start typing a city or choose from the list');
    const uploadTitle = document.querySelector('.upload-dropzone-title'); if (uploadTitle) uploadTitle.textContent = tr('Додати фото товару', 'Add product photos');
    const uploadSubtitle = document.querySelector('.upload-dropzone-subtitle'); if (uploadSubtitle) uploadSubtitle.textContent = tr('До 10 фото. Можна додавати по одному. Перше фото буде головним у каталозі.', 'Up to 10 photos. You can add them one by one. The first photo will be the cover image in the catalog.');
    const submitNote = document.querySelector('.listing-submit-note'); if (submitNote) submitNote.textContent = tr('Перед публікацією перевір назву, ціну та головне фото.', 'Before publishing, check the title, price, and cover photo.');
    const submitBtn = $('submit-product-btn'); if (submitBtn) submitBtn.textContent = editingProductId ? tr('Зберегти зміни', 'Save changes') : tr('Створити оголошення', 'Create listing');
    const editHint = $('edit-photos-hint'); if (editHint) editHint.textContent = tr('Якщо вибереш нові фото, старі буде замінено.', 'If you choose new photos, the old ones will be replaced.');
    translateSelectOptions('product-category');
    translateSelectOptions('product-condition');
    document.querySelectorAll('#category-chip-group .choice-chip').forEach(chip => chip.textContent = tv(chip.dataset.value || ''));
    document.querySelectorAll('#condition-chip-group .segment-chip').forEach(chip => chip.textContent = tv(chip.dataset.value || ''));

    setText('#tab-cart .section-header h2', t('cartTitle'));
    const cartRefresh = $('cart-refresh-btn');
    setRefreshButtonLabel(cartRefresh);
    const buyAllBtn = $('buy-all-btn'); if (buyAllBtn) buyAllBtn.textContent = t('buyAll');

    setText('#tab-profile > h2', t('profileTitle'));
    setText('#profile-edit-wrap h3', t('profileSettings'));
    setText('#profile-quick-active-label', tr('Активні', 'Active'));
    setText('#profile-quick-sold-label', tr('Продані', 'Sold'));
    setText('#profile-quick-favorites-label', tr('Обране', 'Favorites'));
    const appSubtitle = document.querySelector('.profile-ref-app-subtitle'); if (appSubtitle) appSubtitle.textContent = t('appMini');
    const settingsTitle = document.querySelector('.profile-edit-desc'); if (settingsTitle) settingsTitle.textContent = tr('Онови основні дані профілю. Зміни збережуться одразу після натискання кнопки.', 'Update the main profile details. Changes will be saved right after you press the button.');
    const profileEditBadge = document.querySelector('.profile-edit-badge'); if (profileEditBadge) profileEditBadge.textContent = t('profileTitle');
    const profileLabels = Array.from(document.querySelectorAll('#profile-edit-wrap .profile-edit-field > label')).filter(label => !label.hasAttribute('for'));
    if (profileLabels[0]) profileLabels[0].textContent = tr('Username (без @)', 'Username (without @)');
    if (profileLabels[1]) profileLabels[1].textContent = tr("Ім'я", 'Name');
    if (profileLabels[2]) profileLabels[2].textContent = tr('Аватарка', 'Avatar');
    if (profileLabels[3]) profileLabels[3].textContent = tr('Новий пароль', 'New password');
    if ($('profile-edit-username')) $('profile-edit-username').placeholder = tr('username (без @)', 'username (without @)');
    if ($('profile-edit-fullname')) $('profile-edit-fullname').placeholder = tr("Ваше ім'я", 'Your name');
    if ($('profile-edit-password')) $('profile-edit-password').placeholder = tr('Залиш порожнім, якщо не змінюєш', "Leave empty if you don't want to change it");
    const filePickerBtn = document.querySelector('.file-picker-btn'); if (filePickerBtn) filePickerBtn.textContent = tr('Змінити фото', 'Change photo');
    const filePickerHint = document.querySelector('.file-picker-hint'); if (filePickerHint) filePickerHint.textContent = tr('PNG або JPG. Можна перетягнути фото сюди.', 'PNG or JPG. You can drag a photo here.');
    updateAvatarPreview();
    initProfileAvatarDropzone();
    const saveProfileBtn = document.querySelector('.profile-save-btn'); if (saveProfileBtn) saveProfileBtn.textContent = tr('Зберегти зміни', 'Save changes');
    const statusLabel = document.querySelectorAll('.profile-mini-label')[1]; if (statusLabel) statusLabel.textContent = t('status');

    const statCards = document.querySelectorAll('#stats-wrap .stat-card .stat-label');
    if (statCards[0]) statCards[0].textContent = tr('Активні', 'Active');
    if (statCards[1]) statCards[1].textContent = tr('Продані', 'Sold');
    if (statCards[2]) statCards[2].textContent = tr('Обране', 'Favorites');
    if (statCards[3]) statCards[3].textContent = tr('У кошику', 'In cart');
    if (statCards[4]) statCards[4].textContent = tr('Запити', 'Requests');
    if (statCards[5]) statCards[5].textContent = tr('Покупки', 'Purchases');
    if (statCards[6]) statCards[6].textContent = tr('Очікують', 'Pending');

    const adminTabBtns = document.querySelectorAll('#admin-panel-body .subtabs .subtab-btn');
    if (adminTabBtns[0]) adminTabBtns[0].textContent = tr('Користувачі', 'Users');
    if (adminTabBtns[1]) adminTabBtns[1].textContent = tr('Оголошення', 'Listings');
    if (adminTabBtns[2]) adminTabBtns[2].textContent = tr('Ідеї', 'Ideas');
    if (adminTabBtns[3]) adminTabBtns[3].textContent = tr('Скарги', 'Reports');
    if (adminTabBtns[4]) adminTabBtns[4].textContent = tr('Верифікації', 'Verifications');
    if (adminTabBtns[5]) adminTabBtns[5].textContent = tr('Логи', 'Logs');
    if ($('admin-users-search')) $('admin-users-search').placeholder = tr('Пошук користувача', 'Search user');
    if ($('admin-products-search')) $('admin-products-search').placeholder = tr('Пошук оголошення', 'Search listing');
    const adminSearchBtns = document.querySelectorAll('#admin-panel-body .admin-search-row .secondary-btn');
    adminSearchBtns.forEach(btn => btn.textContent = t('searchBtn'));

    const languageLabel = document.querySelector('.language-switch-label span:last-child');
    if (languageLabel) languageLabel.textContent = t('authLangTitle');

    const notificationsBtnLabel = document.querySelector('#notifications-toggle-btn span:nth-child(2)');
    if (notificationsBtnLabel) notificationsBtnLabel.textContent = tr('Повідомлення', 'Notifications');
    const ideaLabels = document.querySelectorAll('#ideas-wrap label');
    if (ideaLabels[0]) ideaLabels[0].textContent = tr('Назва ідеї', 'Idea title');
    if (ideaLabels[1]) ideaLabels[1].textContent = tr('Опишіть вашу пропозицію', 'Describe your suggestion');
    if ($('idea-title')) $('idea-title').placeholder = tr('Наприклад: Додати чат між продавцем і покупцем', 'Example: Add chat between seller and buyer');
    if ($('idea-message')) $('idea-message').placeholder = tr('Що саме хочете покращити або додати?', 'What exactly do you want to improve or add?');
    const ideaSubmitBtn = document.querySelector('#ideas-wrap .primary-btn');
    if (ideaSubmitBtn) ideaSubmitBtn.textContent = tr('Надіслати ідею', 'Send idea');

    const reviewTitle = document.querySelector('#review-modal .modal-title'); if (reviewTitle) reviewTitle.textContent = tr('Залишити відгук', 'Leave a review');
    const reviewLabels = document.querySelectorAll('#review-modal label');
    if (reviewLabels[0]) reviewLabels[0].textContent = tr('Оцінка', 'Rating');
    if (reviewLabels[1]) reviewLabels[1].textContent = tr('Коментар', 'Comment');
    if ($('review-comment')) $('review-comment').placeholder = tr('Коротко опишіть ваш досвід покупки', 'Briefly describe your purchase experience');
    const reviewSubmit = document.querySelector('#review-modal .primary-btn'); if (reviewSubmit) reviewSubmit.textContent = tr('Зберегти відгук', 'Save review');

    const verificationModalTitle = document.querySelector('#verification-modal .modal-title');
    if (verificationModalTitle) verificationModalTitle.textContent = tr('Верифікація продавця', 'Seller verification');
    const verificationHint = document.querySelector('#verification-modal .verification-form-hint');
    if (verificationHint) verificationHint.textContent = tr('Документи тимчасово зберігаються в закритому розділі Cloudinary лише до рішення адміністратора. Після підтвердження або відмови фото автоматично видаляються.', 'Documents are temporarily stored in a restricted Cloudinary area only until the administrator decides. Photos are deleted automatically after approval or rejection.');
    const verificationModalLabels = document.querySelectorAll('#verification-modal > .modal-content > label:not(.verification-file-card):not(.verification-consent-row)');
    if (verificationModalLabels[0]) verificationModalLabels[0].textContent = tr('ПІБ', 'Full name');
    if (verificationModalLabels[1]) verificationModalLabels[1].textContent = tr('Дата народження', 'Birth date');
    if ($('verification-full-name')) $('verification-full-name').placeholder = tr("Введіть повне ім'я", 'Enter your full name');
    const frontTitle = document.querySelector('#verification-modal .verification-file-card[for="verification-front-file"] .verification-file-title');
    if (frontTitle) frontTitle.innerHTML = `${escapeHtml(tr('Основне фото документа', 'Main document photo'))} <strong>*</strong>`;
    const frontHint = document.querySelector('#verification-modal .verification-file-card[for="verification-front-file"] .verification-file-hint');
    if (frontHint) frontHint.textContent = tr('Лицьова сторона ID-картки або основна сторінка документа', 'Front side of the ID card or main document page');
    const backTitle = document.querySelector('#verification-modal .verification-file-card[for="verification-back-file"] .verification-file-title');
    if (backTitle) backTitle.innerHTML = `${escapeHtml(tr('Друге фото документа', 'Second document photo'))} <small>${escapeHtml(tr('необов’язково', 'optional'))}</small>`;
    const backHint = document.querySelector('#verification-modal .verification-file-card[for="verification-back-file"] .verification-file-hint');
    if (backHint) backHint.textContent = tr('Наприклад, зворотна сторона ID-картки', 'For example, the back side of the ID card');
    const consentText = document.querySelector('#verification-modal .verification-consent-row span');
    if (consentText) consentText.textContent = tr('Погоджуюся на обробку даних для перевірки профілю', 'I consent to data processing for profile verification');
    const verificationSubmitBtn = document.querySelector('#verification-modal .primary-btn');
    if (verificationSubmitBtn) verificationSubmitBtn.textContent = tr('Надіслати на перевірку', 'Submit for review');
    updateVerificationFileLabels();

    const reportLabels = document.querySelectorAll('#report-modal label');
    if (reportLabels[0]) reportLabels[0].textContent = tr('Причина', 'Reason');
    if ($('report-comment-label')) $('report-comment-label').textContent = tr('Коментар', 'Comment');
    if ($('report-comment')) $('report-comment').placeholder = tr('Додаткова інформація для адміністратора', 'Additional information for the administrator');
    translateSelectOptions('report-reason');
    const reportSubmit = document.querySelector('#report-modal .warning-btn'); if (reportSubmit) reportSubmit.textContent = tr('Надіслати скаргу', 'Send report');

    refreshTelegramLoginUi();
    updateCategorySummary();
    updateProductFileLabel(selectedProductFiles);
    updateAvatarFileLabel();
}

function changeLanguage(lang) {
    currentLanguage = normalizeLanguage(lang);
    try { localStorage.setItem(APP_LANG_KEY, currentLanguage); } catch {}
    applyLanguageTexts();
}


function cacheTelegramState(user, initData) {
    try {
        if (user && typeof user === "object") localStorage.setItem(TG_CACHE_USER_KEY, JSON.stringify(user));
        if (initData) localStorage.setItem(TG_CACHE_INIT_KEY, String(initData));
    } catch {}
}

function getCachedTelegramUser() {
    try {
        const raw = localStorage.getItem(TG_CACHE_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function getCachedTelegramInitData() {
    try {
        return localStorage.getItem(TG_CACHE_INIT_KEY) || null;
    } catch {
        return null;
    }
}

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(value) {
    return JSON.stringify(String(value ?? "")).slice(1, -1).replace(/'/g, "\'");
}


function isValidUrl(value) {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function currencySymbol(currency) {
    return currency === "EUR" ? "€" : currency === "UAH" ? "₴" : "$";
}

function formatPrice(price, currency = "USD") {
    const num = Number(price);
    const value = Number.isFinite(num) ? num : price;
    return `${value}${currencySymbol(currency)}`;
}

function formatDate(value) {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return "";
    }
}

function formatRelativeTime(value) {
    if (!value) return "";
    try {
        const date = new Date(value);
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));
        if (diffMin < 1) return tr("щойно", "just now");
        if (diffMin < 60) return currentLanguage === "en" ? `${diffMin} min ago` : `${diffMin} хв тому`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return currentLanguage === "en" ? `${diffHours} h ago` : `${diffHours} год тому`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return tr("вчора", "yesterday");
        if (diffDays < 30) return currentLanguage === "en" ? `${diffDays} days ago` : `${diffDays} дн. тому`;
        return formatDate(value);
    } catch {
        return formatDate(value);
    }
}

function getConditionTagClass(condition) {
    const value = String(condition || "").toLowerCase();
    if (value.includes("б/у") || value.includes("бу")) return "tag-condition-used";
    if (value.includes("нов")) return "tag-condition-new";
    return "";
}

function getUserAverageRating(user = currentUser) {
    const count = Number(user?.rating_count || 0);
    if (!count) return 0;
    return Number((Number(user?.rating_sum || 0) / count).toFixed(1));
}

function getUserRatingLabel(user = currentUser) {
    const count = Number(user?.rating_count || 0);
    if (!count) return tr("Новий продавець", "New seller");
    return currentLanguage === "en"
        ? `⭐ ${getUserAverageRating(user)} · ${count} reviews`
        : `⭐ ${getUserAverageRating(user)} · ${count} відгук${count > 1 ? 'ів' : ''}`;
}

function getSellerBadgeText(soldProducts = 0, reviewCount = 0) {
    const sold = Number(soldProducts || 0);
    const reviews = Number(reviewCount || 0);
    if (sold >= 10) return tr("Топ продавець", "Top seller");
    if (sold >= 3 && reviews >= 3) return tr("Надійний продавець", "Trusted seller");
    return tr("Новий продавець", "New seller");
}


function verificationStatusValue(user = currentUser) {
    const status = String(user?.verification_status || "unverified").toLowerCase();
    return ["unverified", "pending", "verified", "rejected"].includes(status) ? status : "unverified";
}

function verificationStatusLabel(status = verificationStatusValue()) {
    if (status === "verified") return tr("Пройдено", "Verified");
    if (status === "pending") return tr("На перевірці", "Under review");
    if (status === "rejected") return tr("Відмовлено", "Rejected");
    return tr("Не пройдено", "Not verified");
}

function verificationBadgeLabel(status = verificationStatusValue()) {
    if (status === "verified") return tr("✓ Верифікований", "✓ Verified");
    if (status === "pending") return tr("На перевірці", "Under review");
    if (status === "rejected") return tr("Відмовлено", "Rejected");
    return tr("Не верифікований", "Not verified");
}

function verificationBadgeClass(status = verificationStatusValue()) {
    return `verification-${status}`;
}

function parseTelegramUserFromInitData(initData) {
    if (!initData) return null;
    try {
        const params = new URLSearchParams(initData);
        const userRaw = params.get("user");
        if (!userRaw) return null;
        const user = JSON.parse(userRaw);
        return user && typeof user === "object" ? user : null;
    } catch (error) {
        console.error("Parse Telegram initData error:", error);
        return null;
    }
}

function getTelegramInitDataFromLocation() {
    try {
        const candidates = [window.location.search || "", window.location.hash || ""];
        for (const raw of candidates) {
            if (!raw) continue;
            const clean = raw.startsWith("#") || raw.startsWith("?") ? raw.slice(1) : raw;
            const params = new URLSearchParams(clean);
            const direct = params.get("tgWebAppData") || params.get("tgWebAppInitData") || params.get("initData");
            if (direct) return direct;
        }
    } catch (error) {
        console.error("Telegram location initData parse error:", error);
    }

    try {
        const initFromWebView = window.Telegram?.WebView?.initParams?.tgWebAppData
            || window.Telegram?.WebView?.initParams?.tgWebAppInitData
            || window.Telegram?.WebApp?.initData
            || window.parent?.Telegram?.WebApp?.initData;
        if (initFromWebView) return initFromWebView;
    } catch (error) {
        console.error("Telegram WebView initData parse error:", error);
    }

    return getCachedTelegramInitData();
}

function getTelegramUserFromEnvironment() {
    return telegramUser
        || tg?.initDataUnsafe?.user
        || window.Telegram?.WebApp?.initDataUnsafe?.user
        || window.parent?.Telegram?.WebApp?.initDataUnsafe?.user
        || parseTelegramUserFromInitData(tg?.initData)
        || parseTelegramUserFromInitData(window.Telegram?.WebApp?.initData)
        || parseTelegramUserFromInitData(window.parent?.Telegram?.WebApp?.initData)
        || parseTelegramUserFromInitData(getTelegramInitDataFromLocation())
        || getCachedTelegramUser()
        || null;
}

function getTelegramInitData() {
    return tg?.initData
        || window.Telegram?.WebApp?.initData
        || window.parent?.Telegram?.WebApp?.initData
        || getTelegramInitDataFromLocation()
        || getCachedTelegramInitData()
        || null;
}

function refreshTelegramLoginUi(forceHide = false) {
    const tgButton = $("tg-login-btn");
    const hint = $("tg-login-hint");
    const wrap = $("tg-login-wrap");
    const divider = $("auth-divider");
    if (!tgButton && !hint) return;

    const currentTgUser = getTelegramUserFromEnvironment();
    const initData = getTelegramInitData();
    const hasTelegramShell = Boolean(tg || window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || window.Telegram?.WebView);
    const hasUsableTelegramData = Boolean(initData || currentTgUser?.id || currentTgUser?.username);
    const hasTelegramEnv = Boolean(hasTelegramShell || hasUsableTelegramData);

    const shouldHideWrap = forceHide || (hasTelegramShell && !hasUsableTelegramData);
    if (wrap) wrap.classList.toggle('hidden', shouldHideWrap);
    if (divider) divider.classList.toggle('hidden', shouldHideWrap);

    if (tgButton) {
        tgButton.textContent = t('tgLogin');
        tgButton.disabled = forceHide || !hasUsableTelegramData;
        tgButton.classList.toggle("tg-ready", hasUsableTelegramData);
        tgButton.classList.toggle("tg-disabled", forceHide || !hasUsableTelegramData);
    }

    if (hint) {
        hint.textContent = forceHide || (hasTelegramShell && !hasUsableTelegramData)
            ? t('tgHintUnavailable')
            : hasTelegramEnv
                ? t('tgHintReady')
                : t('tgOnly');
    }
}

function ideaStatusLabel(status) {
    if (status === "done") return tr("Виконано", "Done");
    if (status === "review") return tr("На розгляді", "In review");
    return tr("Нова", "New");
}

function renderCartTotals(totalsByCurrency = {}) {
    const parts = Object.entries(totalsByCurrency)
        .filter(([, value]) => Number(value) > 0)
        .map(([currency, value]) => formatPrice(value, currency));
    return parts.length ? `${tr("Разом", "Total")}: ${parts.join(" / ")}` : `${tr("Разом", "Total")}: 0$`;
}

function initTelegramWebApp() {
    try {
        tg = window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || tg || null;

        if (tg) {
            tg.ready?.();
            tg.expand?.();
            telegramUser = tg.initDataUnsafe?.user
                || window.Telegram?.WebApp?.initDataUnsafe?.user
                || parseTelegramUserFromInitData(tg.initData)
                || parseTelegramUserFromInitData(window.Telegram?.WebApp?.initData)
                || parseTelegramUserFromInitData(getTelegramInitDataFromLocation())
                || telegramUser
                || null;
            cacheTelegramState(telegramUser, tg.initData || window.Telegram?.WebApp?.initData || getTelegramInitDataFromLocation());
        } else {
            telegramUser = parseTelegramUserFromInitData(getTelegramInitDataFromLocation()) || getCachedTelegramUser() || telegramUser || null;
            cacheTelegramState(telegramUser, getTelegramInitDataFromLocation());
        }
    } catch (error) {
        console.error("Telegram init error:", error);
        tg = null;
        telegramUser = parseTelegramUserFromInitData(getTelegramInitDataFromLocation()) || null;
    }

    refreshTelegramLoginUi();
    setTimeout(() => {
        const currentTgUser = getTelegramUserFromEnvironment();
        const initData = getTelegramInitData();
        const hasTelegramShell = Boolean(window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || window.Telegram?.WebView || tg);
        if (hasTelegramShell && !(initData || currentTgUser?.id || currentTgUser?.username)) {
            refreshTelegramLoginUi(true);
        }
    }, 3200);
}


function showAlert(message) {
    const text = translateMessage(message || tr("Сталася помилка", "Something went wrong"));
    try {
        if (tg?.showAlert) {
            tg.showAlert(text);
        } else {
            alert(text);
        }
    } catch {
        alert(text);
    }
}

function setLoading(state) {
    isLoading = state;
    document.querySelectorAll("button").forEach(btn => {
        btn.disabled = state;
    });
}

function saveSession(user) {
    const remember = $("remember-me")?.checked ?? true;

    localStorage.removeItem("marketplace_user");
    sessionStorage.removeItem("marketplace_user");

    if (remember) {
        localStorage.setItem("marketplace_user", JSON.stringify(user));
    } else {
        sessionStorage.setItem("marketplace_user", JSON.stringify(user));
    }
}

function loadSession() {
    const localUser = localStorage.getItem("marketplace_user");
    const sessionUser = sessionStorage.getItem("marketplace_user");
    const saved = localUser || sessionUser;

    if (!saved) return false;

    try {
        currentUser = JSON.parse(saved);
        return true;
    } catch {
        localStorage.removeItem("marketplace_user");
        sessionStorage.removeItem("marketplace_user");
        currentUser = null;
        return false;
    }
}

async function refreshCurrentUserFromApi() {
    if (!currentUser?.id) return;

    try {
        const freshUser = await safeFetch(`${API_BASE}/users/${currentUser.id}`);
        currentUser = freshUser;
        saveSession(freshUser);
    } catch (error) {
        console.error("Refresh current user error:", error);
    }
}

function logout() {
    localStorage.removeItem("marketplace_user");
    sessionStorage.removeItem("marketplace_user");
    currentUser = null;

    $("app-screen")?.classList.add("hidden");
    $("auth-screen")?.classList.remove("hidden");

    if ($("login-password")) $("login-password").value = "";
}

function setActiveNavButton(tabName) {
    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.tab === tabName);
    });
}

function toggleFilters(forceState = null) {
    const filtersWrap = $("catalog-filters-wrap");
    const toggleBtn = $("filters-toggle-btn");

    if (!filtersWrap || !toggleBtn) return;

    if (!catalogSearchOpen) {
        filtersOpen = false;
        filtersWrap.classList.add("hidden");
        toggleBtn.textContent = t("filters");
        toggleBtn.classList.remove("active");
        return;
    }

    filtersOpen = forceState === null ? !filtersOpen : Boolean(forceState);

    filtersWrap.classList.toggle("hidden", !filtersOpen);
    toggleBtn.textContent = filtersOpen ? tr("Сховати фільтри", "Hide filters") : t("filters");
    toggleBtn.classList.toggle("active", filtersOpen);
}

function resetCatalogFilters() {
    if ($("search-input")) $("search-input").value = "";
    if ($("category-filter")) $("category-filter").value = "Усі";
    if ($("city-filter")) $("city-filter").value = "Усі";
    if ($("condition-filter")) $("condition-filter").value = "Усі";
    if ($("sort-filter")) $("sort-filter").value = "newest";
    if ($("price-min-filter")) $("price-min-filter").value = "";
    if ($("price-max-filter")) $("price-max-filter").value = "";
    loadProducts();
}

function toggleCatalogSearchPanel(forceState = null) {
    const panelBody = $("catalog-search-panel-body");
    const collapseBtn = $("catalog-search-collapse-btn");
    if (!panelBody || !collapseBtn) return;

    catalogSearchOpen = forceState === null ? !catalogSearchOpen : Boolean(forceState);
    panelBody.classList.toggle("hidden", !catalogSearchOpen);
    collapseBtn.textContent = catalogSearchOpen ? '˄' : '˅';
    collapseBtn.setAttribute('aria-expanded', catalogSearchOpen ? 'true' : 'false');

    if (!catalogSearchOpen) {
        toggleFilters(false);
    }
}

function fillProfile() {
    if (!currentUser) return;

    const usernameEl = $("profile-username");
    const fullnameEl = $("profile-fullname");
    const avatarEl = $("profile-avatar");

    if (usernameEl) usernameEl.textContent = currentUser.username ? `@${currentUser.username}` : "—";
    if (fullnameEl) fullnameEl.textContent = currentUser.full_name || currentUser.username || tr("Без імені", "No name");
    if (avatarEl) {
        if (currentUser.avatar_url && isValidUrl(currentUser.avatar_url)) {
            avatarEl.innerHTML = `<img src="${escapeHtml(currentUser.avatar_url)}" alt="avatar">`;
        } else {
            avatarEl.textContent = (currentUser.full_name || currentUser.username || "U").trim().charAt(0).toUpperCase();
        }
    }

    if ($("profile-edit-username")) $("profile-edit-username").value = currentUser.username || "";
    if ($("profile-edit-fullname")) $("profile-edit-fullname").value = currentUser.full_name || "";
    if ($("profile-edit-password")) $("profile-edit-password").value = "";
    if ($("profile-avatar-file")) $("profile-avatar-file").value = "";
    updateAvatarPreview();
    initProfileAvatarDropzone();
    if ($("profile-rating-badge")) {
        const avg = getUserAverageRating(currentUser);
        const ratingCount = Number(currentUser.rating_count || 0);
        $("profile-rating-badge").textContent = ratingCount > 0
            ? `⭐ ${avg} · ${ratingCount} ${currentLanguage === "en" ? "reviews" : tr("відгуків", "reviews")}`
            : getUserRatingLabel(currentUser);
    }
    if ($("profile-rating-value")) {
        $("profile-rating-value").textContent = Number(currentUser.rating_count || 0) > 0 ? `${getUserAverageRating(currentUser)}` : "—";
    }
    if ($("profile-rating-count")) {
        $("profile-rating-count").textContent = `${Number(currentUser.rating_count || 0)} ${tr("відгуків", "reviews")}`;
    }
    if ($("profile-register-date")) {
        $("profile-register-date").textContent = formatDate(currentUser.created_at) || "—";
    }
    if ($("profile-register-date-inline")) {
        $("profile-register-date-inline").textContent = formatDate(currentUser.created_at) || "—";
    }
    if ($("profile-status-value")) {
        $("profile-status-value").textContent = getSellerBadgeText(currentUser.sold_products || 0, currentUser.rating_count || 0);
    }
    if ($("profile-status-chip")) {
        $("profile-status-chip").textContent = getSellerBadgeText(currentUser.sold_products || 0, currentUser.rating_count || 0);
    }
    const verificationStatus = verificationStatusValue(currentUser);
    const verificationBadge = $("profile-verification-badge");
    if (verificationBadge) {
        verificationBadge.textContent = verificationBadgeLabel(verificationStatus);
        verificationBadge.className = `verification-badge ${verificationBadgeClass(verificationStatus)}`;
    }
    if ($("verification-menu-status")) {
        $("verification-menu-status").textContent = verificationStatusLabel(verificationStatus);
        $("verification-menu-status").className = `verification-menu-status ${verificationBadgeClass(verificationStatus)}`;
    }
    if ($("verification-wrap") && !$("verification-wrap").classList.contains("hidden")) renderVerificationPanel();
}

function renderVerificationPanel() {
    const wrap = $("verification-wrap");
    if (!wrap) return;
    const status = verificationStatusValue(currentUser);
    if (status === "verified") {
        wrap.innerHTML = `<div class="verification-state-card ${verificationBadgeClass(status)}"><div class="verification-state-title">✓ ${tr("Верифікацію успішно пройдено", "Verification completed")}</div><p>${tr("Ваш профіль підтверджено. Ви можете публікувати оголошення.", "Your profile is confirmed. You can publish listings.")}</p></div>`;
        return;
    }
    if (status === "pending") {
        wrap.innerHTML = `<div class="verification-state-card ${verificationBadgeClass(status)}"><div class="verification-state-title">${tr("Заявка на перевірці", "Application under review")}</div><p>${tr("Документи вже надіслано. Очікуйте рішення адміністратора.", "Documents have been submitted. Wait for the administrator's decision.")}</p></div>`;
        return;
    }
    if (status === "rejected") {
        wrap.innerHTML = `<div class="verification-state-card ${verificationBadgeClass(status)}"><div class="verification-state-title">${tr("Верифікацію відхилено", "Verification rejected")}</div><p><strong>${tr("Причина", "Reason")}:</strong> ${escapeHtml(currentUser?.verification_rejection_reason || tr("Не вказано", "Not specified"))}</p><button type="button" class="primary-btn full-btn" onclick="openVerificationForm()">${tr("Пройти повторно", "Submit again")}</button></div>`;
        return;
    }
    wrap.innerHTML = `<div class="verification-state-card ${verificationBadgeClass(status)}"><div class="verification-state-title">${tr("Верифікація продавця", "Seller verification")}</div><p>${tr("Для публікації нових оголошень підтвердьте особу. Потрібне одне обов’язкове фото документа, друге фото можна додати за бажанням.", "Confirm your identity to publish new listings. One document photo is required; a second photo is optional.")}</p><button type="button" class="primary-btn full-btn" onclick="openVerificationForm()">${tr("Пройти верифікацію", "Start verification")}</button></div>`;
}

function toggleVerificationPanel(forceState = null) {
    const wrap = $("verification-wrap");
    if (!wrap) return;
    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
    if (shouldOpen) renderVerificationPanel();
}

function openVerificationForm() {
    const status = verificationStatusValue(currentUser);
    if (status === "pending") {
        showAlert(tr("Заявка вже знаходиться на перевірці", "The application is already under review"));
        return;
    }
    if (status === "verified") {
        showAlert(tr("Верифікацію вже пройдено", "Verification has already been completed"));
        return;
    }
    if ($("verification-full-name")) $("verification-full-name").value = currentUser?.full_name || "";
    if ($("verification-birth-date")) $("verification-birth-date").value = "";
    if ($("verification-front-file")) $("verification-front-file").value = "";
    if ($("verification-back-file")) $("verification-back-file").value = "";
    if ($("verification-consent")) $("verification-consent").checked = false;
    updateVerificationFileLabels();
    animateModalOpen("verification-modal");
    syncBodyScrollLock();
}

function closeVerificationModal() {
    animateModalClose("verification-modal");
    syncBodyScrollLock();
}

function closeVerificationModalOnBackdrop(event) {
    if (event.target?.id === "verification-modal") closeVerificationModal();
}

function updateVerificationFileLabels() {
    const front = $("verification-front-file")?.files?.[0];
    const back = $("verification-back-file")?.files?.[0];
    if ($("verification-front-file-name")) $("verification-front-file-name").textContent = front?.name || tr("Файл не вибрано", "No file selected");
    if ($("verification-back-file-name")) $("verification-back-file-name").textContent = back?.name || tr("Файл не вибрано", "No file selected");
}

async function submitVerification() {
    if (!currentUser?.id || isLoading) return;
    const fullName = $("verification-full-name")?.value?.trim() || "";
    const birthDate = $("verification-birth-date")?.value || "";
    const front = $("verification-front-file")?.files?.[0] || null;
    const back = $("verification-back-file")?.files?.[0] || null;
    const consent = Boolean($("verification-consent")?.checked);
    if (!fullName || !birthDate || !front) {
        showAlert(tr("Заповніть ПІБ, дату народження та додайте основне фото документа", "Fill in your full name, birth date, and add the main document photo"));
        return;
    }
    if (fullName.length > VERIFICATION_FULL_NAME_MAX_LENGTH) {
        showAlert(tr("ПІБ має містити максимум 120 символів", "Full name must contain no more than 120 characters"));
        return;
    }
    const verificationFiles = [front, back].filter(Boolean);
    if (verificationFiles.some(file => !VERIFICATION_ALLOWED_IMAGE_TYPES.has(file.type))) {
        showAlert(tr("Документ має бути у форматі JPG, PNG або WEBP", "Document photo must be JPG, PNG, or WEBP"));
        return;
    }
    if (verificationFiles.some(file => file.size > VERIFICATION_PHOTO_MAX_SIZE)) {
        showAlert(tr("Максимальний розмір одного фото документа — 6 МБ", "Maximum document photo size is 6 MB"));
        return;
    }
    if (!consent) {
        showAlert(tr("Потрібна згода на обробку даних", "Consent to data processing is required"));
        return;
    }
    const form = new FormData();
    form.append("verification_full_name", fullName);
    form.append("verification_birth_date", birthDate);
    form.append("consent_accepted", "true");
    form.append("document_front", front);
    if (back) form.append("document_back", back);
    try {
        setLoading(true);
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/verification/submit`, { method: "POST", body: form });
        currentUser = { ...currentUser, ...data };
        saveSession(currentUser);
        fillProfile();
        renderVerificationPanel();
        closeVerificationModal();
        showAlert(tr("Заявку надіслано на перевірку", "Application sent for review"));
    } catch (error) {
        showAlert(error.message || tr("Не вдалося надіслати заявку", "Failed to submit application"));
    } finally {
        setLoading(false);
    }
}

function toggleProfileEdit(forceState = null) {
    const wrap = $("profile-edit-wrap");
    if (!wrap) return;

    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
}

async function togglePurchaseHistory(forceState = null) {
    const wrap = $("purchase-history-wrap");
    const btn = $("purchase-history-toggle-btn");
    if (!wrap || !btn) return;

    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
    setProfileMenuButton('purchase-history-toggle-btn', '🛍', 'purchases', shouldOpen);

    if (shouldOpen) await loadPurchaseHistory();
}
async function toggleMyReviews(forceState = null) {
    const wrap = $("my-reviews-wrap");
    const btn = $("my-reviews-toggle-btn");
    if (!wrap || !btn) return;

    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
    btn.classList.toggle("is-open", shouldOpen);

    if (shouldOpen) await loadMyReviews();
}

async function loadMyReviews() {
    const list = $("my-reviews-list");
    if (!list || !currentUser?.id) return;

    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;

    try {
        const items = await safeFetch(`${API_BASE}/users/${currentUser.id}/reviews`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">${escapeHtml(t('noReviews'))}</div>`;
            return;
        }

        list.innerHTML = `<div class="cards">${items.map(item => renderReviewCard(item, true)).join("")}</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Не вдалося завантажити відгуки", "Failed to load reviews"))}</div>`;
    }
}

function renderReviewCard(item, showProfileButton = true) {
    const buyerName = item.buyer_full_name || item.buyer_username || t('buyer');
    const productThumb = item.product_image_url
        ? `<img src="${escapeHtml(item.product_image_url)}" alt="review-product">`
        : `<div class="review-thumb-placeholder">🛍</div>`;
    const profileBtn = showProfileButton && item.buyer_id
        ? `<button class="secondary-btn section-btn" onclick="openUserProfile(${Number(item.buyer_id)})">${escapeHtml(t('authorProfile'))}</button>`
        : '';
    const amountText = item.deal_amount != null ? formatPrice(item.deal_amount, item.currency) : '—';
    return `
        <div class="card review-card">
            <div class="card-body">
                <div class="review-topline">
                    <div class="review-stars">⭐ ${Number(item.rating || 0)}/5</div>
                    <div class="review-date">${formatDate(item.created_at) || "—"}</div>
                </div>
                <h4 class="card-title">${escapeHtml(buyerName)}</h4>
                <p class="card-description">${escapeHtml(item.comment || t('noComment'))}</p>
                <div class="review-deal-box">
                    <div class="review-deal-thumb">${productThumb}</div>
                    <div class="review-deal-info">
                        <div><strong>${escapeHtml(t('dealAmount'))}:</strong> ${escapeHtml(amountText)}</div>
                        <div><strong>${escapeHtml(t('item'))}:</strong> ${escapeHtml(item.product_title || '—')}</div>
                    </div>
                </div>
                <div class="card-actions compact-actions">${profileBtn}</div>
            </div>
        </div>
    `;
}

async function showApp() {
    $("auth-screen")?.classList.add("hidden");
    $("app-screen")?.classList.remove("hidden");
    $("app-screen")?.classList.toggle("profile-mode", document.querySelector('#tab-profile')?.classList.contains('active'));

    fillProfile();
    toggleProfileEdit(false);
    toggleStatsPanel(false);

    if ($("purchase-history-wrap")) $("purchase-history-wrap").classList.add("hidden");
    if ($("notifications-wrap")) $("notifications-wrap").classList.add("hidden");
    if ($("my-reviews-wrap")) $("my-reviews-wrap").classList.add("hidden");
    if ($("admin-panel-body")) $("admin-panel-body").classList.add("hidden");
    applyLanguageTexts();

    initCreateFormUi();
    resetCreateForm();
    toggleCatalogSearchPanel(false);
    toggleFilters(false);
    setActiveNavButton("catalog");
    switchTab("catalog");

    await refreshCurrentUserFromApi();
    fillProfile();
    await detectAdminAccess();

    loadProducts();
    loadStats();
}

function switchAuthTab(tabName, btn) {
    document.querySelectorAll(".auth-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".auth-panel").forEach(panel => panel.classList.remove("active"));

    if (btn) btn.classList.add("active");
    $(`auth-${tabName}`)?.classList.add("active");
}

function switchTab(tabName, btn = null) {
    if (tabName === "create" && currentUser && verificationStatusValue(currentUser) !== "verified" && !editingProductId) {
        showAlert(tr("Для публікації оголошень необхідно пройти верифікацію продавця", "Seller verification is required to publish listings"));
        tabName = "profile";
        setTimeout(() => toggleVerificationPanel(true), 0);
    }
    document.querySelectorAll(".tab-section").forEach(section => section.classList.remove("active"));
    $(`tab-${tabName}`)?.classList.add("active");
    $("app-screen")?.classList.toggle("profile-mode", tabName === "profile");

    if (btn) {
        document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));
        btn.classList.add("active");
    } else {
        setActiveNavButton(tabName);
    }

    if (tabName !== "catalog") {
        toggleCatalogSearchPanel(false);
        toggleFilters(false);
    }

    if (tabName === "catalog") loadProducts();
    if (tabName === "my-products") loadMyProducts();
    if (tabName === "cart") loadCart();
    if (tabName === "profile") {
        fillProfile();
        toggleProfileEdit(false);
        toggleStatsPanel(false);
        if ($("purchase-history-wrap")) $("purchase-history-wrap").classList.add("hidden");
        if ($("my-reviews-wrap")) $("my-reviews-wrap").classList.add("hidden");
        if ($("verification-wrap")) $("verification-wrap").classList.add("hidden");
        if ($("admin-panel-body")) $("admin-panel-body").classList.add("hidden");
        applyLanguageTexts();
        detectAdminAccess();
        loadStats();
    }
}

function switchCatalogView(view) {
    catalogView = view;
    $("catalog-all-btn")?.classList.toggle("active", view === "all");
    $("catalog-favorites-btn")?.classList.toggle("active", view === "favorites");

    if (view === "favorites") {
        toggleFilters(false);
    }

    loadProducts();
}

function switchMyProductsView(view) {
    myProductsView = view;
    $("my-products-active-btn")?.classList.toggle("active", view === "active");
    $("my-products-requests-btn")?.classList.toggle("active", view === "requests");
    $("my-products-sold-btn")?.classList.toggle("active", view === "sold");
    $("my-products-archived-btn")?.classList.toggle("active", view === "archived");
    loadMyProducts();
}

async function loadStats() {
    if (!currentUser) return;

    try {
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/stats`);
        $("stat-active").textContent = data.active_products ?? 0;
        $("stat-sold").textContent = data.sold_products ?? 0;
        $("stat-archived").textContent = data.archived_products ?? 0;
        $("stat-favorites").textContent = data.favorites ?? 0;
        if ($("profile-quick-active")) $("profile-quick-active").textContent = data.active_products ?? 0;
        if ($("profile-quick-sold")) $("profile-quick-sold").textContent = data.sold_products ?? 0;
        if ($("profile-quick-favorites")) $("profile-quick-favorites").textContent = data.favorites ?? 0;
        $("stat-cart").textContent = data.cart_items ?? 0;
        const pendingEl = $("stat-pending");
        if (pendingEl) pendingEl.textContent = data.pending_requests ?? 0;
        updatePendingRequestsBadge(data.pending_requests ?? 0);
        const purchasesEl = $("stat-purchases");
        if (purchasesEl) purchasesEl.textContent = data.purchase_history ?? 0;
        const purchasePendingEl = $("stat-purchase-pending");
        if (purchasePendingEl) purchasePendingEl.textContent = data.purchase_pending ?? 0;
        updateNotificationsBadge(data.unread_notifications ?? notificationsUnread);
        currentUser = { ...currentUser, sold_products: data.sold_products ?? 0 };
        saveSession(currentUser);
        fillProfile();
    } catch (error) {
        console.error("Load stats error:", error);
    }
}

function orderStatusLabel(status) {
    if (status === "awaiting_buyer_confirmation") return tr("Очікує підтвердження покупця", "Waiting for buyer confirmation");
    if (status === "completed" || status === "approved") return tr("Завершено", "Completed");
    if (status === "disputed") return tr("Спір передано адміністратору", "Dispute sent to admin");
    if (status === "rejected") return tr("Відхилено", "Rejected");
    if (status === "cancelled") return tr("Скасовано", "Cancelled");
    return tr("Очікує відповіді продавця", "Waiting for seller response");
}

function renderBuyerOrderActions(item) {
    if (!item) return "";
    const orderId = Number(item.order_id || 0);
    const sellerId = Number(item.seller_id || 0);
    const actions = [];
    if (item.status === "pending") {
        actions.push(`<button type="button" class="ghost-warning-btn" onclick="event.stopPropagation(); cancelPurchaseRequest(${orderId})">${tr("Скасувати запит", "Cancel request")}</button>`);
    }
    if (item.status === "awaiting_buyer_confirmation") {
        actions.push(`<button type="button" class="approve-btn" onclick="event.stopPropagation(); confirmBuyerReceipt(${orderId})">${tr("Товар отримано", "Item received")}</button>`);
        actions.push(`<button type="button" class="reject-btn" onclick="event.stopPropagation(); reportMissingProduct(${orderId})">${tr("Не отримав товар", "Item not received")}</button>`);
    }
    if (item.can_review) {
        actions.push(`<button type="button" class="approve-btn" data-action="open-review" data-order-id="${orderId}" data-seller-id="${sellerId}">${tr("Залишити відгук", "Leave review")}</button>`);
    }
    if (item.review_rating) {
        actions.push(`<button class="secondary-btn" disabled>${tr("Оцінка", "Rating")}: ${Number(item.review_rating)}/5</button>`);
    }
    return actions.join("");
}

function renderSellerOrderActions(item) {
    if (!item) return "";
    const orderId = Number(item.order_id || 0);
    const buyerId = Number(item.buyer_id || 0);
    const actions = [];
    if (buyerId) {
        actions.push(`<button type="button" class="seller-link-btn request-profile-btn" onclick="event.preventDefault(); event.stopPropagation(); openUserProfile(${buyerId})">${tr("Профіль покупця", "Buyer profile")}</button>`);
    }
    if (item.status === "pending") {
        actions.push(`<button type="button" class="approve-btn request-approve-btn" onclick="event.preventDefault(); event.stopPropagation(); handlePurchaseRequest(${orderId}, true)">${tr("Підтвердити", "Approve")}</button>`);
        actions.push(`<button type="button" class="reject-btn request-reject-btn" onclick="event.preventDefault(); event.stopPropagation(); handlePurchaseRequest(${orderId}, false)">${tr("Відхилити", "Reject")}</button>`);
    }
    if (item.status === "awaiting_buyer_confirmation") {
        actions.push(`<button type="button" class="ghost-warning-btn" onclick="event.preventDefault(); event.stopPropagation(); reportBuyerDelay(${orderId})">${tr("Звернутися до адміністратора", "Contact admin")}</button>`);
    }
    return actions.join("");
}

async function saveProfile() {
    if (!currentUser || isLoading) return;

    const username = $("profile-edit-username")?.value.trim();
    const full_name = $("profile-edit-fullname")?.value.trim();
    const password = $("profile-edit-password")?.value.trim();
    const avatarFile = $("profile-avatar-file")?.files?.[0] || null;

    if (!username) {
        showAlert(tr("Введи тег / username", "Enter tag / username"));
        return;
    }

    try {
        setLoading(true);
        let avatar_url = currentUser.avatar_url || null;
        if (avatarFile) avatar_url = await uploadImageToCloudinary(avatarFile);
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/profile`, {
            method: "PUT",
            body: JSON.stringify({ username, full_name, avatar_url, password: password || null })
        });
        currentUser = { ...currentUser, ...data, avatar_url };
        saveSession(currentUser);
        fillProfile();
        toggleProfileEdit(false);
        showAlert(tr("Профіль оновлено", "Profile updated"));
    } catch (error) {
        showAlert(error.message || tr("Не вдалося оновити профіль", "Failed to update profile"));
    } finally {
        setLoading(false);
    }
}

function getMyProductsDateValue(item, view = myProductsView) {
    if (!item) return 0;
    const saleDate = item.sale_info?.sold_at || item.seller_response_at || null;
    const requestDate = item.latest_request?.created_at || item.created_at || null;
    const baseDate = view === "sold" ? saleDate : requestDate;
    const ts = baseDate ? new Date(baseDate).getTime() : 0;
    return Number.isFinite(ts) ? ts : 0;
}

function filterAndSortMyProducts(items = [], view = myProductsView) {
    const q = String(myProductsSearchQuery || "").trim().toLowerCase();
    let result = Array.isArray(items) ? [...items] : [];

    if (q) {
        result = result.filter(item => {
            const buyerUsername = item.sale_info?.buyer_username || item.buyer_username || "";
            const buyerName = item.sale_info?.buyer_full_name || item.buyer_full_name || "";
            const sellerUsername = item.seller_username || "";
            const fields = [item.title, item.product_title, item.description, item.city, item.category, item.condition, buyerUsername, buyerName, sellerUsername]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return fields.includes(q);
        });
    }

    result.sort((a, b) => {
        if (myProductsSortValue === "oldest") return getMyProductsDateValue(a, view) - getMyProductsDateValue(b, view);
        if (myProductsSortValue === "price_asc") return Number(a.price || a.offered_price || 0) - Number(b.price || b.offered_price || 0);
        if (myProductsSortValue === "price_desc") return Number(b.price || b.offered_price || 0) - Number(a.price || a.offered_price || 0);
        return getMyProductsDateValue(b, view) - getMyProductsDateValue(a, view);
    });

    return result;
}

function syncMyProductsFilterUi() {
    if ($("my-products-search-input")) $("my-products-search-input").value = myProductsSearchQuery;
    if ($("my-products-sort-select")) $("my-products-sort-select").value = myProductsSortValue;
}

function applyMyProductsFilters() {
    myProductsSearchQuery = $("my-products-search-input")?.value?.trim() || "";
    myProductsSortValue = $("my-products-sort-select")?.value || "newest";
    loadMyProducts();
}

async function loadPurchaseHistory() {
    const list = $("purchase-history-list");
    if (!list || !currentUser) return;

    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;

    try {
        const items = await safeFetch(`${API_BASE}/users/${currentUser.id}/purchases`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">${escapeHtml(tr("Історія покупок поки порожня", "Purchase history is empty"))}</div>`;
            return;
        }

        list.innerHTML = items.map(item => `
            <div class="card history-card compact-history-card">
                ${isValidUrl(item.product_image_url) ? `<img class="history-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title)}">` : ``}
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status || "pending")}">${orderStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.product_title || tr("Товар", "Product"))}</h3>
                    <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                    <div class="history-meta">
                        ${item.seller_username ? `<div>${tr("Продавець", "Seller")}: @${escapeHtml(item.seller_username)}</div>` : ``}
                        ${item.seller_full_name ? `<div>${tr("Ім'я продавця", "Seller name")}: ${escapeHtml(item.seller_full_name)}</div>` : ``}
                        <div>${tr("Дата", "Date")}: ${formatDate(item.created_at) || "—"}</div>
                    </div>
                    <div class="card-actions inline-actions compact-actions">
                        ${renderBuyerOrderActions(item)}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка завантаження", "Loading error"))}</div>`;
    }
}

let reviewOrderId = null;
let reviewSellerId = null;
let selectedReportReason = "Шахрайство";
let reviewModalOpenedAt = 0;
let reportModalOpenedAt = 0;
let reviewModalIgnoreBackdropClick = false;
let reportModalIgnoreBackdropClick = false;
let reviewModalIgnoreTimer = null;
let reportModalIgnoreTimer = null;
const MODAL_BACKDROP_GUARD_MS = 400;

async function cancelPurchaseRequest(orderId) {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Скасувати цей запит на покупку?", "Cancel this purchase request?"))) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/cancel?buyer_id=${currentUser.id}`, { method: "DELETE" });
        showAlert(tr("Запит скасовано", "Request cancelled"));
        await loadPurchaseHistory();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося скасувати запит", "Failed to cancel request"));
    } finally {
        setLoading(false);
    }
}

async function confirmBuyerReceipt(orderId) {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Підтвердити, що ви отримали товар? Після цього угоду буде завершено.", "Confirm that you received the item? The deal will be completed."))) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/buyer-confirm?buyer_id=${currentUser.id}`, { method: "POST" });
        showAlert(tr("Угоду завершено", "Deal completed"));
        await loadPurchaseHistory();
        await loadMyProducts();
        await loadProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося підтвердити отримання", "Failed to confirm receipt"));
    } finally {
        setLoading(false);
    }
}

async function reportMissingProduct(orderId) {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Повідомити адміністратору, що товар не отримано? Угоду буде переведено у спір.", "Tell the admin that the item was not received? The deal will be disputed."))) return;
    const comment = prompt(tr("Додатковий коментар для адміністратора (необов'язково)", "Additional comment for admin (optional)"), "") || "";
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/buyer-dispute`, {
            method: "POST",
            body: JSON.stringify({ actor_id: currentUser.id, comment: comment.trim() || null })
        });
        showAlert(tr("Спір передано адміністратору", "Dispute sent to admin"));
        await loadPurchaseHistory();
        await loadMyProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося відкрити спір", "Failed to open dispute"));
    } finally {
        setLoading(false);
    }
}

async function reportBuyerDelay(orderId) {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Передати звернення адміністратору? Угоду буде переведено у спір.", "Send this case to admin? The deal will be disputed."))) return;
    const comment = prompt(tr("Додатковий коментар для адміністратора (необов'язково)", "Additional comment for admin (optional)"), "") || "";
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/seller-dispute`, {
            method: "POST",
            body: JSON.stringify({ actor_id: currentUser.id, comment: comment.trim() || null })
        });
        showAlert(tr("Звернення передано адміністратору", "Case sent to admin"));
        await loadMyProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося передати звернення", "Failed to send case"));
    } finally {
        setLoading(false);
    }
}

function openReviewModal(orderId, sellerId, event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    reviewOrderId = orderId;
    reviewSellerId = sellerId;
    if ($("review-rating")) $("review-rating").value = "5";
    if ($("review-comment")) $("review-comment").value = "";
    const modal = $("review-modal");
    if (!modal) return;
    animateModalOpen("review-modal");
    reviewModalOpenedAt = Date.now();
    reviewModalIgnoreBackdropClick = true;
    if (reviewModalIgnoreTimer) clearTimeout(reviewModalIgnoreTimer);
    reviewModalIgnoreTimer = setTimeout(() => {
        reviewModalIgnoreBackdropClick = false;
        reviewModalIgnoreTimer = null;
    }, MODAL_BACKDROP_GUARD_MS);
    syncBodyScrollLock();
}

function closeReviewModal(event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    reviewModalIgnoreBackdropClick = false;
    if (reviewModalIgnoreTimer) {
        clearTimeout(reviewModalIgnoreTimer);
        reviewModalIgnoreTimer = null;
    }
    animateModalClose("review-modal");
    syncBodyScrollLock();
}

async function submitReview() {
    if (!currentUser || !reviewOrderId || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${reviewOrderId}/review`, {
            method: "POST",
            body: JSON.stringify({
                buyer_id: currentUser.id,
                rating: Number($("review-rating")?.value || 5),
                comment: $("review-comment")?.value.trim() || null
            })
        });
        closeReviewModal();
        showAlert(tr("Відгук збережено", "Review saved"));
        await refreshCurrentUserFromApi();
        fillProfile();
        await loadPurchaseHistory();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося залишити відгук", "Failed to leave review"));
    } finally {
        setLoading(false);
    }
}



function initCreateFormUi() {
    const categorySelect = $("product-category");
    const conditionSelect = $("product-condition");
    const categoryWrap = $("category-chip-group");
    const conditionWrap = $("condition-chip-group");

    if (categorySelect && categoryWrap && !categoryWrap.dataset.ready) {
        const options = Array.from(categorySelect.options)
            .map(option => option.value)
            .filter(Boolean);
        categoryWrap.innerHTML = options.map(value => `
            <button type="button" class="choice-chip" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>
        `).join("");
        categoryWrap.querySelectorAll('.choice-chip').forEach(chip => {
            chip.addEventListener('click', () => setProductCategory(chip.dataset.value || ''));
        });
        categoryWrap.dataset.ready = "1";
    }

    if (conditionSelect && conditionWrap && !conditionWrap.dataset.ready) {
        const options = Array.from(conditionSelect.options)
            .map(option => option.value)
            .filter(Boolean);
        conditionWrap.innerHTML = options.map(value => `
            <button type="button" class="segment-chip" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>
        `).join("");
        conditionWrap.querySelectorAll('.segment-chip').forEach(chip => {
            chip.addEventListener('click', () => setProductCondition(chip.dataset.value || ''));
        });
        conditionWrap.dataset.ready = "1";
    }

    updateCategorySummary();
    syncCreateFormSelections();
}

function syncCreateFormSelections() {
    const selectedCategory = $("product-category")?.value || "";
    const selectedCondition = $("product-condition")?.value || "";

    document.querySelectorAll('#category-chip-group .choice-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.value === selectedCategory);
    });
    document.querySelectorAll('#condition-chip-group .segment-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.value === selectedCondition);
    });
    updateCategorySummary();
}

function setProductCategory(value) {
    const select = $("product-category");
    if (!select) return;
    select.value = value || "";
    syncCreateFormSelections();
    if (value) toggleCategoryPicker(false);
}

function setProductCondition(value) {
    const select = $("product-condition");
    if (!select) return;
    select.value = value || "";
    syncCreateFormSelections();
}

function setQuickCity(city) {
    const input = $("product-city");
    if (!input) return;
    input.value = city || "";
}

function toggleCategoryPicker(forceOpen = null) {
    const wrap = $("category-chip-wrap");
    const arrow = $("category-toggle-arrow");
    const btn = $("category-toggle-btn");
    if (!wrap) return;
    const shouldOpen = forceOpen === null ? wrap.classList.contains("hidden") : Boolean(forceOpen);
    wrap.classList.toggle("hidden", !shouldOpen);
    btn?.classList.toggle("active", shouldOpen);
    if (arrow) arrow.textContent = shouldOpen ? "▲" : "▼";
}

function updateCategorySummary() {
    const value = $("product-category")?.value || "";
    const label = $("category-selected-label");
    if (label) label.textContent = value ? tv(value) : tr("Оберіть категорію", "Choose a category");
}

function updateAvatarPreview(file = null) {
    const preview = $("profile-avatar-preview");
    if (!preview) return;

    const selectedFile = file || $("profile-avatar-file")?.files?.[0] || null;
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
            preview.innerHTML = `<img src="${reader.result}" alt="avatar preview">`;
        };
        reader.readAsDataURL(selectedFile);
        return;
    }

    if (currentUser?.avatar_url && isValidUrl(currentUser.avatar_url)) {
        preview.innerHTML = `<img src="${escapeHtml(currentUser.avatar_url)}" alt="avatar preview">`;
    } else {
        preview.textContent = (currentUser?.full_name || currentUser?.username || "U").trim().charAt(0).toUpperCase();
    }
}

function setProfileAvatarFile(file) {
    const input = $("profile-avatar-file");
    if (!input || !file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    updateAvatarFileLabel({ target: input });
}

function updateAvatarFileLabel(event) {
    const file = event?.target?.files?.[0] || $("profile-avatar-file")?.files?.[0] || null;
    const label = $("profile-avatar-file-name");
    if (label) label.textContent = file ? file.name : tr("Фото вибрано", "Photo selected");
    updateAvatarPreview(file);
}

function initProfileAvatarDropzone() {
    const card = document.querySelector('#profile-edit-wrap .file-picker-card');
    if (!card || card.dataset.dropReady === "1") return;
    card.dataset.dropReady = "1";

    ["dragenter", "dragover"].forEach(type => {
        card.addEventListener(type, (event) => {
            event.preventDefault();
            card.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach(type => {
        card.addEventListener(type, (event) => {
            event.preventDefault();
            card.classList.remove("drag-over");
        });
    });

    card.addEventListener("drop", (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) setProfileAvatarFile(file);
    });
}

function openProductFilePicker() {
    const input = $("product-files");
    if (!input) return;
    input.click();
}

function updateProductFileLabel(files = []) {
    const list = Array.isArray(files) ? files : Array.from(files || []);
    const status = $("image-status");
    const wrap = $("image-preview-wrap");
    const title = document.querySelector('.upload-dropzone-title');
    const subtitle = document.querySelector('.upload-dropzone-subtitle');

    if (status) {
        status.textContent = list.length
            ? tr(`Обрано фото: ${list.length}/10. Перше фото буде обкладинкою.`, `Selected photos: ${list.length}/10. The first photo will be the cover.`)
            : tr("Фото не вибрано. Можна додати до 10 фото.", "No photos selected. You can add up to 10 photos.");
    }

    if (title) {
        title.textContent = list.length
            ? tr(`Додано фото: ${list.length}/10`, `Added photos: ${list.length}/10`)
            : tr("Додати фото товару", "Add product photos");
    }

    if (subtitle) {
        subtitle.textContent = list.length
            ? tr("Можна додавати фото по одному або кілька одразу. Перше фото стане головним у каталозі.", "You can add photos one by one or several at once. The first photo will be the main one in the catalog.")
            : tr("До 10 фото. Можна додавати по одному. Перше фото буде головним у каталозі.", "Up to 10 photos. You can add them one by one. The first photo will be the cover image in the catalog.");
    }

    if (!list.length) {
        wrap?.classList.add("hidden");
    }
}

function renderSelectedProductFiles() {
    const wrap = $("image-preview-wrap");
    const grid = $("image-preview-grid");
    if (!wrap || !grid) return;

    if (!selectedProductFiles.length) {
        grid.innerHTML = "";
        wrap.classList.add("hidden");
        updateProductFileLabel([]);
        return;
    }

    wrap.classList.remove("hidden");
    grid.innerHTML = selectedProductFiles.map((file, index) => {
        const objectUrl = URL.createObjectURL(file);
        return `
            <div class="preview-item ${index === 0 ? 'preview-item-cover' : ''}">
                <img class="preview-thumb" src="${objectUrl}" alt="preview-${index}">
                ${index === 0 ? `<div class="preview-cover-badge">${tr('Обкладинка', 'Cover')}</div>` : ''}
                <button type="button" class="preview-remove-btn" onclick="removeProductPhoto(${index})">×</button>
            </div>
        `;
    }).join("");

    updateProductFileLabel(selectedProductFiles);
}

function removeProductPhoto(index) {
    if (!Array.isArray(selectedProductFiles) || index < 0 || index >= selectedProductFiles.length) return;
    selectedProductFiles.splice(index, 1);
    if (!selectedProductFiles.length && $("product-files")) {
        $("product-files").value = "";
    }
    renderSelectedProductFiles();
}

function syncCreateSectionHeader() {
    const header = $("create-section-header");
    const cancelBtn = $("cancel-edit-btn");
    if (!header) return;
    const shouldShow = Boolean(editingProductId) || Boolean(cancelBtn && !cancelBtn.classList.contains("hidden"));
    header.classList.toggle("hidden", !shouldShow);
}

function resetCreateForm() {
    editingProductId = null;
    editingExistingImages = [];
    selectedProductFiles = [];
    if ($("create-form-title")) $("create-form-title").textContent = tr("Створити оголошення", "Create listing");
    if ($("submit-product-btn")) $("submit-product-btn").textContent = tr("Створити оголошення", "Create listing");
    $("cancel-edit-btn")?.classList.add("hidden");
    syncCreateSectionHeader();
    $("edit-photos-hint")?.classList.add("hidden");
    if ($("product-title")) $("product-title").value = "";
    if ($("product-description")) $("product-description").value = "";
    if ($("product-price")) $("product-price").value = "";
    if ($("product-currency")) $("product-currency").value = "USD";
    if ($("product-category")) $("product-category").value = "";
    if ($("product-condition")) $("product-condition").value = "";
    if ($("product-city")) $("product-city").value = "";
    syncCreateFormSelections();
    updateCategorySummary();
    toggleCategoryPicker(false);
    if ($("product-files")) $("product-files").value = "";
    if ($("image-preview-grid")) $("image-preview-grid").innerHTML = "";
    $("image-preview-wrap")?.classList.add("hidden");
    updateProductFileLabel([]);
}

function renderPreviewUrls(urls = []) {
    const wrap = $("image-preview-wrap");
    const grid = $("image-preview-grid");
    if (!wrap || !grid) return;
    if (!urls.length) {
        wrap.classList.add("hidden");
        grid.innerHTML = "";
        return;
    }
    wrap.classList.remove("hidden");
    grid.innerHTML = urls.map((url, index) => `
        <div class="preview-item ${index === 0 ? 'preview-item-cover' : ''}">
            <img class="preview-thumb" src="${escapeHtml(url)}" alt="preview-${index}">
            ${index === 0 ? `<div class="preview-cover-badge">${tr('Обкладинка', 'Cover')}</div>` : ''}
        </div>
    `).join("");
}

async function startEditProduct(productId) {
    if (!currentUser) return;
    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}?current_user_id=${currentUser.id}`);
        if (Number(product.seller_id) !== Number(currentUser.id)) {
            showAlert(tr("Це не ваше оголошення", "This is not your listing"));
            return;
        }
        editingProductId = product.id;
        editingExistingImages = Array.isArray(product.image_urls) ? product.image_urls.slice() : [];
        selectedProductFiles = [];
        $("create-form-title").textContent = tr("Редагувати оголошення", "Edit listing");
        $("submit-product-btn").textContent = tr("Зберегти зміни", "Save changes");
        $("cancel-edit-btn")?.classList.remove("hidden");
        syncCreateSectionHeader();
        $("edit-photos-hint")?.classList.remove("hidden");
        $("product-title").value = product.title || "";
        $("product-description").value = product.description || "";
        $("product-price").value = product.price || "";
        $("product-currency").value = product.currency || "USD";
        $("product-category").value = product.category || "";
        $("product-condition").value = product.condition || "";
        $("product-city").value = product.city || "";
        syncCreateFormSelections();
        updateCategorySummary();
        toggleCategoryPicker(false);
        if ($("product-files")) $("product-files").value = "";
        renderPreviewUrls(editingExistingImages);
        updateProductFileLabel([]);
        if ($("image-status")) $("image-status").textContent = editingExistingImages.length ? tr(`Зараз фото: ${editingExistingImages.length}`, `Current photos: ${editingExistingImages.length}`) : tr("Фото не вибрано", "No photo selected");
        switchTab("create");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        showAlert(error.message || tr("Не вдалося завантажити оголошення", "Failed to load listing"));
    }
}

function cancelEditProduct() {
    resetCreateForm();
    switchTab("my-products");
}

function handleImagePreview(event) {
    const input = event?.target || $("product-files");
    const newFiles = Array.from(input?.files || []);

    if (!newFiles.length) {
        updateProductFileLabel(selectedProductFiles);
        return;
    }

    const invalidType = newFiles.find(file => !PRODUCT_ALLOWED_IMAGE_TYPES.has(file.type));
    if (invalidType) {
        showAlert(tr("Фото товару має бути у форматі JPG, PNG або WEBP", "Product photos must be JPG, PNG, or WEBP"));
        if (input) input.value = "";
        return;
    }

    const oversized = newFiles.find(file => file.size > PRODUCT_PHOTO_MAX_SIZE);
    if (oversized) {
        showAlert(tr("Максимальний розмір одного фото товару — 8 МБ", "Maximum product photo size is 8 MB"));
        if (input) input.value = "";
        return;
    }

    if (editingExistingImages.length && !selectedProductFiles.length) {
        editingExistingImages = [];
    }

    const merged = selectedProductFiles.slice();
    for (const file of newFiles) {
        const exists = merged.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
        if (!exists) merged.push(file);
    }

    if (merged.length > 10) {
        showAlert(tr("Можна додати максимум 10 фото", "You can add up to 10 photos"));
        if (input) input.value = "";
        return;
    }

    selectedProductFiles = merged;
    if (input) input.value = "";
    renderSelectedProductFiles();
}

async function uploadImageToCloudinary(file) {
    if (!file) {
        throw new Error(tr("Файл не вибрано", "No file selected"));
    }
    if (!PRODUCT_ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error(tr("Фото товару має бути у форматі JPG, PNG або WEBP", "Product photos must be JPG, PNG, or WEBP"));
    }
    if (file.size > PRODUCT_PHOTO_MAX_SIZE) {
        throw new Error(tr("Максимальний розмір одного фото товару — 8 МБ", "Maximum product photo size is 8 MB"));
    }

    if (!CLOUDINARY_CLOUD_NAME) {
        throw new Error(tr("Не налаштовано CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD_NAME is not configured"));
    }

    if (!CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(tr("Не налаштовано CLOUDINARY_UPLOAD_PRESET", "CLOUDINARY_UPLOAD_PRESET is not configured"));
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "telegram-marketplace");

    let response;

    try {
        response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );
    } catch (error) {
        console.error("Cloudinary network error:", error);
        throw new Error(tr("Не вдалося підключитися до Cloudinary", "Failed to connect to Cloudinary"));
    }

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        console.error("Cloudinary JSON parse error:", error);
        throw new Error(tr("Cloudinary повернув некоректну відповідь", "Cloudinary returned an invalid response"));
    }

    if (!response.ok) {
        console.error("Cloudinary error response:", data);
        throw new Error(data?.error?.message || `Cloudinary error ${response.status}`);
    }

    if (!data?.secure_url) {
        console.error("Cloudinary missing secure_url:", data);
        throw new Error(tr("Cloudinary не повернув URL зображення", "Cloudinary did not return an image URL"));
    }

    return data.secure_url;
}

async function safeFetch(url, options = {}) {
    let response;

    const method = (options.method || "GET").toUpperCase();
    const headers = { ...(options.headers || {}) };

    if (method !== "GET" && method !== "HEAD" && !(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    try {
        response = await fetch(url, {
            mode: "cors",
            credentials: "omit",
            cache: "no-store",
            ...options,
            headers
        });
    } catch (error) {
        console.error("Network error:", error);
        throw new Error(tr("Не вдалося підключитися до API", "Failed to connect to API"));
    }

    const rawText = await response.text();
    let data = null;

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch {
            data = rawText;
        }
    }

    if (!response.ok) {
        let detail = `HTTP ${response.status}`;

        if (Array.isArray(data?.detail)) {
            detail = data.detail.map(item => {
                if (typeof item === "string") return item;
                const loc = Array.isArray(item?.loc) ? item.loc.join(".") + ": " : "";
                return `${loc}${item?.msg || JSON.stringify(item)}`;
            }).join(", ");
        } else if (typeof data?.detail === "string") {
            detail = data.detail;
        } else if (typeof data?.message === "string") {
            detail = data.message;
        } else if (typeof data === "string") {
            detail = data;
        }

        throw new Error(detail);
    }

    return data;
}

async function wakeApi() {
    try {
        await fetch(`${API_BASE}/health`, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
            cache: "no-store"
        });
    } catch (error) {
        console.error("Wake API error:", error);
    }
}

function setupAuthScreen() {
    initTelegramWebApp();
    applyLanguageTexts();
    [200, 500, 1000, 1800, 2600].forEach(delay => setTimeout(() => {
        initTelegramWebApp();
        refreshTelegramLoginUi();
    }, delay));
    window.addEventListener("load", () => {
        initTelegramWebApp();
        refreshTelegramLoginUi();
    }, { once: true });

    const remember = $("remember-me");

    if (remember && !localStorage.getItem("remember-me-choice")) {
        remember.checked = true;
    } else if (remember) {
        remember.checked = localStorage.getItem("remember-me-choice") === "1";
    }

    remember?.addEventListener("change", () => {
        localStorage.setItem("remember-me-choice", remember.checked ? "1" : "0");
    });

    try {
        const savedUsername = localStorage.getItem("marketplace_last_username") || "";
        if (savedUsername) {
            if ($("login-username") && !$("login-username").value) $("login-username").value = savedUsername;
            if ($("register-username") && !$("register-username").value) $("register-username").value = savedUsername;
        }
    } catch (error) {
        console.error("Restore username error:", error);
    }

    refreshTelegramLoginUi();
    setTimeout(() => {
        const currentTgUser = getTelegramUserFromEnvironment();
        const initData = getTelegramInitData();
        const hasTelegramShell = Boolean(window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || window.Telegram?.WebView || tg);
        if (hasTelegramShell && !(initData || currentTgUser?.id || currentTgUser?.username)) {
            refreshTelegramLoginUi(true);
        }
    }, 3200);
}

async function registerNewUser() {
    if (isLoading) return;

    const username = $("register-username")?.value.trim();
    const full_name = $("register-fullname")?.value.trim();
    const password = $("register-password")?.value.trim();

    if (!username || !full_name || !password) {
        showAlert(tr("Заповни username, ім\'я і password", "Fill in username, name, and password"));
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        const data = await safeFetch(`${API_BASE}/auth/register`, {
            method: "POST",
            body: JSON.stringify({
                username,
                password,
                full_name,
                telegram_id: telegramUser?.id ? String(telegramUser.id) : null
            })
        });

        currentUser = data;
        saveSession(data);
        try { localStorage.setItem("marketplace_last_username", username); } catch {}

        if ($("register-username")) $("register-username").value = "";
        if ($("register-fullname")) $("register-fullname").value = "";
        if ($("register-password")) $("register-password").value = "";

        showAlert(tr("Реєстрація успішна", "Registration successful"));
        await showApp();
    } catch (error) {
        showAlert(error.message || tr("Помилка реєстрації", "Registration error"));
    } finally {
        setLoading(false);
    }
}

async function loginUser() {
    if (isLoading) return;

    const username = $("login-username")?.value.trim();
    const password = $("login-password")?.value.trim();

    if (!username || !password) {
        showAlert(tr("Введи username і password", "Enter username and password"));
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        const data = await safeFetch(`${API_BASE}/auth/login`, {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        currentUser = data;
        saveSession(data);
        try { localStorage.setItem("marketplace_last_username", username); } catch {}
        if ($("login-password")) $("login-password").value = "";

        showAlert(tr("Вхід успішний", "Sign in successful"));
        await showApp();
    } catch (error) {
        showAlert(error.message || tr("Помилка входу", "Sign in error"));
    } finally {
        setLoading(false);
    }
}

async function loginWithTelegram() {
    if (isLoading) return;

    initTelegramWebApp();
    refreshTelegramLoginUi();

    let parsedUser = getTelegramUserFromEnvironment();
    let initData = getTelegramInitData();
    let telegramId = parsedUser?.id
        || tg?.initDataUnsafe?.user?.id
        || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
        || null;
    const hasTelegramShell = Boolean(window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || window.Telegram?.WebView || tg);

    if ((!telegramId && !initData) || !parsedUser) {
        for (const delay of [350, 800, 1400]) {
            await new Promise(resolve => setTimeout(resolve, delay));
            initTelegramWebApp();
            parsedUser = getTelegramUserFromEnvironment();
            initData = getTelegramInitData();
            telegramId = parsedUser?.id
                || tg?.initDataUnsafe?.user?.id
                || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
                || null;
            if (telegramId || initData || parsedUser?.username) break;
        }
    }

    cacheTelegramState(parsedUser, initData);

    const canTryAuth = Boolean(telegramId || initData || parsedUser?.username || parsedUser?.first_name);
    if (!canTryAuth) {
        if (hasTelegramShell) refreshTelegramLoginUi(true);
        showAlert(hasTelegramShell
            ? tr("Telegram-вхід недоступний у поточному запуску Mini App. Залишив звичайний вхід, а кнопку Telegram тимчасово сховав.", "Telegram sign-in is unavailable in this Mini App launch. Regular sign-in is still available, and the Telegram button has been hidden temporarily.")
            : tr("Відкрийте застосунок саме через кнопку бота в Telegram Mini App", "Open the app using the bot button inside Telegram Mini App"));
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        const data = await safeFetch(`${API_BASE}/auth/telegram`, {
            method: "POST",
            body: JSON.stringify({
                telegram_id: telegramId ? String(telegramId) : null,
                username: parsedUser?.username || null,
                full_name: `${parsedUser?.first_name || ""} ${parsedUser?.last_name || ""}`.trim() || null,
                init_data: initData || null
            })
        });

        currentUser = data;
        saveSession(data);

        showAlert(tr("Вхід через Telegram успішний", "Telegram sign in successful"));
        await showApp();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося увійти через Telegram", "Failed to sign in with Telegram"));
    } finally {
        setLoading(false);
    }
}



function contactSeller(username) {
    const clean = String(username || "").replace(/^@+/, "").trim();
    if (!clean) {
        showAlert(tr("Не вдалося знайти продавця", "Seller not found"));
        return;
    }
    const link = `https://t.me/${clean}`;
    try {
        if (tg?.openTelegramLink) tg.openTelegramLink(link);
        else window.open(link, "_blank");
    } catch {
        window.open(link, "_blank");
    }
}

function renderCardTags(product) {
    const tags = [
        tv(product.category || "Без категорії"),
        tv(product.condition || "Новий"),
        tv(product.city || "Без міста")
    ];

    if (product.status === "sold") tags.push(tr("Продано", "Sold"));
    if (product.status === "archived") tags.push(tr("Архів", "Archive"));

    return `
        <div class="card-tags">
            ${tags.map(tag => { const cls = getConditionTagClass(tag); return `<span class="tag ${cls}">${escapeHtml(tag)}</span>`; }).join("")}
        </div>
    `;
}

function renderImageBlock(product) {
    const imageUrl = Array.isArray(product.image_urls) && product.image_urls.length
        ? product.image_urls[0]
        : (isValidUrl(product.image_url) ? product.image_url : "");

    if (imageUrl) {
        return `
            <div class="catalog-media-frame">
                <img class="card-image catalog-media-img" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.title)}">
            </div>
        `;
    }

    return `
        <div class="catalog-media-frame catalog-media-frame-placeholder">
            <div class="card-image card-image-placeholder catalog-media-placeholder">${escapeHtml(tr("Фото відсутнє", "No photo"))}</div>
        </div>
    `;
}

function renderFavoriteButton(product) {
    if (!currentUser) return "";

    const isOwnProduct = Number(product.seller_id) === Number(currentUser.id);
    if (isOwnProduct) return "";

    return `
        <button
            type="button"
            class="favorite-btn ${product.is_favorite ? "active" : ""}"
            data-favorite-id="${Number(product.id)}"
            data-action="toggle-favorite"
            data-product-id="${Number(product.id)}"
            data-is-favorite="${product.is_favorite ? "true" : "false"}"
            title="${escapeHtml(tr('Обране', 'Favorites'))}"
        >
            ${product.is_favorite ? "♥" : "♡"}
        </button>
    `;
}

function renderCatalogCard(product) {
    const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);
    const views = Number(product.views_count || 0);
    const relativeTime = formatRelativeTime(product.created_at);
    const sellerRating = product.seller_rating ? Number(product.seller_rating).toFixed(1).replace(/\.0$/, '') : '';

    return `
        <div class="card card-clickable compact-list-card catalog-product-card card-enter" onclick="openProductModal(${Number(product.id)})">
            <div class="compact-thumb-wrap catalog-thumb-wrap">
                ${renderImageBlock(product)}
                ${renderFavoriteButton(product)}
            </div>
            <div class="card-body compact-card-body catalog-card-body">
                <div class="compact-card-top catalog-card-top">
                    <h3 class="card-title compact-title">${escapeHtml(product.title)}</h3>
                    <p class="card-price compact-price">${formatPrice(product.price, product.currency)}</p>
                </div>
                <div class="compact-meta-row catalog-meta-row">
                    <span class="tag">${escapeHtml(tv(product.city || "Без міста"))}</span>
                    <span class="tag ${getConditionTagClass(product.condition)}">${escapeHtml(tv(product.condition || "Новий"))}</span>
                    <span class="tag soft-tag">${escapeHtml(relativeTime || formatDate(product.created_at) || "")}</span>
                </div>
                <div class="compact-secondary-row catalog-secondary-row">
                    <span class="muted-meta">👁 ${views}</span>
                    ${sellerRating ? `<span class="muted-meta">⭐ ${escapeHtml(String(sellerRating))}</span>` : ``}
                    ${product.seller_username ? `<span class="muted-meta">@${escapeHtml(product.seller_username)}</span>` : ``}
                </div>
                <p class="card-description compact-desc catalog-desc">${escapeHtml(product.description || "")}</p>
                <div class="card-actions compact-actions compact-actions-grid catalog-actions-row">
                    ${product.seller_username ? `<button class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(product.seller_id)})">${tr('Профіль продавця', 'Seller profile')}</button>` : ""}
                    ${isOwnProduct ? `<button type="button" class="own-product-btn" onclick="event.preventDefault(); event.stopPropagation(); showAlert(tr('Це ваше оголошення', 'This is your listing'))">${tr('Ваш товар', 'Your listing')}</button>` : `<button type="button" class="buy-btn ${product.is_in_cart ? 'cart-added-btn' : ''}" onclick="event.preventDefault(); event.stopPropagation(); ${product.is_in_cart ? "switchTab('cart')" : `addToCart(${Number(product.id)})`}">${product.is_in_cart ? tr('У кошику', 'In cart') : tr('У кошик', 'Add to cart')}</button>`}
                </div>
            </div>
        </div>
    `;
}

function renderMyProductCard(product, view) {
    let actionButton = "";

    if (view === "active") {
        actionButton = `
            <div class="card-actions inline-actions catalog-actions-row">
                <button class="edit-btn" onclick="event.stopPropagation(); startEditProduct(${Number(product.id)})">${tr('Змінити', 'Edit')}</button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct(${Number(product.id)})">${tr('В архів', 'Archive')}</button>
            </div>
        `;
    } else if (view === "sold") {
        actionButton = `<button class="sold-btn" disabled>${tr('Продано', 'Sold')}</button>`;
    } else {
        actionButton = `<div class="card-actions inline-actions catalog-actions-row"><button class="archive-btn" disabled>${escapeHtml(t('archivedState'))}</button><button class="approve-btn" onclick="event.stopPropagation(); restoreArchivedProduct(${Number(product.id)})">${escapeHtml(t('restoreBtn'))}</button></div>`;
    }

    const saleInfo = product.sale_info || null;
    const latestRequest = product.latest_request || null;
    const buyerProfileBtn = saleInfo?.buyer_id
        ? `<button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(saleInfo.buyer_id)})">${tr('Профіль покупця', 'Buyer profile')}</button>`
        : "";

    return `
        <div class="card card-clickable compact-list-card catalog-product-card card-enter" onclick="openProductModal(${Number(product.id)})">
            <div class="compact-thumb-wrap catalog-thumb-wrap">${renderImageBlock(product)}</div>
            <div class="card-body compact-card-body catalog-card-body">
                <div class="compact-card-top catalog-card-top">
                    <h3 class="card-title compact-title">${escapeHtml(product.title)}</h3>
                    <p class="card-price compact-price">${formatPrice(product.price, product.currency)}</p>
                </div>
                <div class="compact-meta-row catalog-meta-row">
                    <span class="tag">${escapeHtml(tv(product.city || ""))}</span>
                    <span class="tag ${getConditionTagClass(product.condition)}">${escapeHtml(tv(product.condition || ""))}</span>
                    <span class="tag soft-tag">${formatRelativeTime(product.created_at) || formatDate(product.created_at) || ""}</span>
                </div>
                <p class="card-description compact-desc catalog-desc">${escapeHtml(product.description || "")}</p>
                <div class="compact-secondary-row catalog-secondary-row my-product-extra-meta my-product-extra-meta-block">
                    <span class="muted-meta">${tr('Створено', 'Created')}: ${escapeHtml(formatDate(product.created_at) || "—")}</span>
                    ${view === "sold" ? `<span class="muted-meta">${tr('Продано', 'Sold')}: ${escapeHtml(formatDate(saleInfo?.sold_at) || "—")}</span>` : ""}
                    ${view === "sold" && saleInfo?.buyer_username ? `<span class="muted-meta">${tr('Покупець', 'Buyer')}: @${escapeHtml(saleInfo.buyer_username)}</span>` : ""}
                    ${view === "sold" && !saleInfo?.buyer_username && saleInfo?.buyer_full_name ? `<span class="muted-meta">${tr('Покупець', 'Buyer')}: ${escapeHtml(saleInfo.buyer_full_name)}</span>` : ""}
                    ${view === "active" && latestRequest?.created_at ? `<span class="muted-meta">${tr('Останній запит', 'Last request')}: ${escapeHtml(formatDate(latestRequest.created_at) || "—")}</span>` : ""}
                    ${view === "active" && latestRequest?.buyer_username ? `<span class="muted-meta">${tr('Запит від', 'Request from')}: @${escapeHtml(latestRequest.buyer_username)}</span>` : ""}
                    ${view === "archived" ? `<span class="muted-meta">${tr('Статус', 'Status')}: ${tr('Архів', 'Archive')}</span>` : ""}
                </div>
                <div class="card-actions compact-actions">${actionButton}</div>
                ${buyerProfileBtn ? `<div class="card-actions compact-actions compact-actions-grid buyer-profile-actions">${buyerProfileBtn}</div>` : ""}
            </div>
        </div>
    `;
}

async function restoreArchivedProduct(productId) {
    if (!currentUser?.id) return;
    try {
        await safeFetch(`${API_BASE}/products/${productId}/restore?user_id=${currentUser.id}`, { method: "POST" });
        showAlert(tr('Оголошення повернуто в каталог', 'Listing returned to catalog'));
        await loadMyProducts();
        await loadProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr('Не вдалося повернути оголошення', 'Failed to return listing'));
    }
}


function renderCatalogSkeleton(count = 4) {
    return Array.from({ length: count }, (_, index) => `
        <div class="card compact-list-card catalog-product-card catalog-skeleton-card" aria-hidden="true">
            <div class="compact-thumb-wrap catalog-thumb-wrap skeleton-thumb shimmer"></div>
            <div class="card-body compact-card-body catalog-card-body">
                <div class="skeleton-line shimmer skeleton-title"></div>
                <div class="skeleton-chip-row">
                    <span class="skeleton-chip shimmer"></span>
                    <span class="skeleton-chip shimmer"></span>
                    <span class="skeleton-chip shimmer"></span>
                </div>
                <div class="skeleton-line shimmer"></div>
                <div class="skeleton-line shimmer skeleton-short"></div>
                <div class="catalog-actions-row">
                    <span class="skeleton-btn shimmer"></span>
                    <span class="skeleton-btn shimmer"></span>
                </div>
            </div>
        </div>
    `).join("");
}

async function loadProducts() {
    const productsList = $("products-list");
    if (!productsList || !currentUser) return;

    productsList.innerHTML = renderCatalogSkeleton();

    try {
        if (catalogView === "favorites") {
            const products = await safeFetch(`${API_BASE}/favorites/${currentUser.id}`);

            if (!Array.isArray(products) || products.length === 0) {
                productsList.innerHTML = `<div class="empty-card">${escapeHtml(tr('В обраному поки нічого немає', 'Favorites are empty'))}</div>`;
                return;
            }

            productsList.innerHTML = products.map(renderCatalogCard).join("");
            return;
        }

        const searchValue = $("search-input")?.value.trim() || "";
        const categoryValue = $("category-filter")?.value || "Усі";
        const cityValue = $("city-filter")?.value || "Усі";
        const conditionValue = $("condition-filter")?.value || "Усі";
        const sortValue = $("sort-filter")?.value || "newest";
        const priceMinValue = $("price-min-filter")?.value.trim() || "";
        const priceMaxValue = $("price-max-filter")?.value.trim() || "";

        const params = new URLSearchParams();
        if (searchValue) params.append("q", searchValue);
        if (categoryValue !== "Усі") params.append("category", categoryValue);
        if (cityValue !== "Усі") params.append("city", cityValue);
        if (conditionValue !== "Усі") params.append("condition", conditionValue);
        if (priceMinValue) params.append("price_min", priceMinValue);
        if (priceMaxValue) params.append("price_max", priceMaxValue);
        params.append("sort", sortValue);
        params.append("current_user_id", String(currentUser.id));

        const products = await safeFetch(`${API_BASE}/products?${params.toString()}`);

        if (!Array.isArray(products) || products.length === 0) {
            productsList.innerHTML = `<div class="empty-card">${escapeHtml(tr('Нічого не знайдено за цими фільтрами', 'Nothing found for these filters'))}</div>`;
            return;
        }

        productsList.innerHTML = products.map(renderCatalogCard).join("");
    } catch (error) {
        console.error("Load products error:", error);
        productsList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("API недоступне", "API is unavailable"))}</div>`;
    }
}

function buildGallery(images, title) {
    const safeImages = Array.isArray(images) ? images.filter(isValidUrl) : [];
    currentModalImages = safeImages;
    currentModalImageIndex = 0;

    if (!safeImages.length) {
        return `<div class="modal-product-image card-image-placeholder">${escapeHtml(tr("Фото відсутнє", "No photo"))}</div>`;
    }

    return `
        <div class="gallery">
            <img id="modal-main-image" class="modal-product-image zoomable-image" src="${escapeHtml(safeImages[0])}" alt="${escapeHtml(title)}" data-action="open-image-viewer" data-image-index="0">
            ${
                safeImages.length > 1
                    ? `
                <div class="gallery-thumbs">
                    ${safeImages.map((img, index) => `
                        <img
                            class="gallery-thumb ${index === 0 ? "active" : ""}"
                            src="${escapeHtml(img)}"
                            alt="thumb"
                            data-action="set-modal-image" data-image-index="${index}"
                        >
                    `).join("")}
                </div>
            `
                    : ""
            }
        </div>
    `;
}

function setModalImage(index) {
    if (!currentModalImages[index]) return;

    currentModalImageIndex = index;
    const main = $("modal-main-image");
    if (main) {
        main.src = currentModalImages[index];
    }

    document.querySelectorAll(".gallery-thumb").forEach((thumb, idx) => {
        thumb.classList.toggle("active", idx === index);
    });
}

function openImageViewer(index = 0) {
    if (!Array.isArray(currentModalImages) || !currentModalImages.length) return;

    currentModalImageIndex = Math.max(0, Math.min(index, currentModalImages.length - 1));

    const viewer = $("image-viewer-modal");
    const viewerImage = $("image-viewer-img");
    const viewerCounter = $("image-viewer-counter");

    if (!viewer || !viewerImage) return;

    viewer.classList.remove("hidden");
    syncBodyScrollLock();
    viewerImage.src = currentModalImages[currentModalImageIndex];

    if (viewerCounter) {
        viewerCounter.textContent = `${currentModalImageIndex + 1} / ${currentModalImages.length}`;
    }

    syncBodyScrollLock();
}

function changeViewerImage(step) {
    if (!Array.isArray(currentModalImages) || !currentModalImages.length) return;
    currentModalImageIndex = (currentModalImageIndex + step + currentModalImages.length) % currentModalImages.length;
    const viewerImage = $("image-viewer-img");
    const viewerCounter = $("image-viewer-counter");
    if (viewerImage) viewerImage.src = currentModalImages[currentModalImageIndex];
    if (viewerCounter) viewerCounter.textContent = `${currentModalImageIndex + 1} / ${currentModalImages.length}`;
}

function closeImageViewer() {
    $("image-viewer-modal")?.classList.add("hidden");
    syncBodyScrollLock();
}

function closeImageViewerOnBackdrop(event) {
    if (event.target?.id === "image-viewer-modal") closeImageViewer();
}

async function openProductModal(productId) {
    const modal = $("product-modal");
    const body = $("product-modal-body");

    if (!modal || !body) return;

    requestAnimationFrame(() => { modal.classList.remove("hidden"); syncBodyScrollLock(); });
    const modalContent = modal.querySelector(".modal-content");
    if (modalContent) {
        modalContent.classList.remove("modal-animate-in");
        requestAnimationFrame(() => modalContent.classList.add("modal-animate-in"));
    }
    body.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;

    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}?current_user_id=${currentUser ? currentUser.id : ""}`);
        const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);
        const views = Number(product.views_count || 0);
        const relativeTime = formatRelativeTime(product.created_at) || formatDate(product.created_at);

        const contactButton = product.seller_telegram_link
            ? `<a class="contact-btn contact-link" href="${escapeHtml(product.seller_telegram_link)}" target="_blank" rel="noopener noreferrer" data-action="contact-seller" data-seller-link="${escapeHtml(product.seller_telegram_link)}">${tr('Написати продавцю', 'Message seller')}</a>`
            : "";

        const primaryAction = isOwnProduct
            ? `<button type="button" class="own-product-btn" data-action="own-product-info">${tr('Ваш товар', 'Your listing')}</button>`
            : `<button type="button" class="buy-btn ${product.is_in_cart ? 'cart-added-btn' : ''}" data-action="${product.is_in_cart ? 'go-cart' : 'buy-product'}" data-product-id="${Number(product.id)}">${product.is_in_cart ? tr('У кошику', 'In cart') : tr('Купити', 'Buy')}</button>`;
        const reportButton = !isOwnProduct ? `<button type="button" class="ghost-warning-btn" data-action="open-report" data-product-id="${Number(product.id)}" data-product-title="${escapeHtml(product.title || '')}">${tr('Поскаржитися', 'Report')}</button>` : "";

        body.innerHTML = `
            <div class="modal-product">
                <div class="card-image-wrap">
                    ${buildGallery(product.image_urls || (product.image_url ? [product.image_url] : []), product.title)}
                    ${renderFavoriteButton(product)}
                </div>
                <div class="modal-product-body">
                    ${renderCardTags(product)}
                    <h3 class="modal-product-title">${escapeHtml(product.title)}</h3>
                    <p class="modal-product-price">${formatPrice(product.price, product.currency)}</p>
                    <div class="modal-inline-meta">
                        <span class="tag soft-tag">👁 ${views} ${tr('переглядів', 'views')}</span>
                        <span class="tag soft-tag">🕒 ${escapeHtml(relativeTime || '—')}</span>
                        ${product.seller_rating ? `<span class="tag soft-tag">⭐ ${escapeHtml(String(product.seller_rating))}</span>` : ``}
                    </div>
                    <p class="modal-product-description">${escapeHtml(product.description || "")}</p>
                    ${product.seller_username ? `<button type="button" class="seller-link-btn seller-profile-btn seller-profile-btn-modal" data-action="open-seller-profile" data-seller-id="${Number(product.seller_id)}">${tr('Профіль продавця', 'Seller profile')}</button>` : ""}
                    ${!isOwnProduct ? `<div class="service-warning-banner">⚠️ ${tr('Сервіс не виступає гарантом угоди та не несе відповідальності за дії продавця. Перед передачею коштів перевірте профіль, рейтинг і відгуки.', 'The service is not a transaction guarantor and is not responsible for the seller’s actions. Check the profile, rating, and reviews before sending money.')}</div>` : ""}
                    <div class="card-actions compact-actions compact-actions-grid details-actions">
                        ${primaryAction}
                        ${!isOwnProduct ? contactButton : ""}
                        ${reportButton}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        body.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка завантаження товару", "Failed to load listing"))}</div>`;
    }
}

function closeProductModal() {
    const modal = $("product-modal");
    const modalContent = modal?.querySelector(".modal-content");
    if (modalContent) modalContent.classList.remove("modal-animate-in");
    modal?.classList.add("hidden");
    syncBodyScrollLock();
}

function closeProductModalOnBackdrop(event) {
    if (event.target?.id === "product-modal") {
        closeProductModal();
    }
}

async function createProduct() {
    if (!currentUser || isLoading) return;
    if (!editingProductId && verificationStatusValue(currentUser) !== "verified") {
        showAlert(tr("Для публікації оголошень необхідно пройти верифікацію продавця", "Seller verification is required to publish listings"));
        switchTab("profile");
        toggleVerificationPanel(true);
        return;
    }

    const title = $("product-title")?.value.trim();
    const description = $("product-description")?.value.trim();
    const price = Number($("product-price")?.value);
    const currency = $("product-currency")?.value || "USD";
    const category = $("product-category")?.value;
    const condition = $("product-condition")?.value;
    const city = $("product-city")?.value;
    const files = selectedProductFiles.slice();

    if (!title || !description || !Number.isFinite(price) || price <= 0 || !category || !condition || !city) {
        showAlert(tr("Заповни назву, опис, ціну, категорію, стан і місто", "Fill in the title, description, price, category, condition, and city"));
        return;
    }
    if (title.length < 2 || title.length > PRODUCT_TITLE_MAX_LENGTH) {
        showAlert(tr("Назва товару має містити від 2 до 80 символів", "Product title must contain 2 to 80 characters"));
        return;
    }
    if (description.length < 5 || description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
        showAlert(tr("Опис товару має містити від 5 до 1500 символів", "Product description must contain 5 to 1500 characters"));
        return;
    }
    if (price > 100000000) {
        showAlert(tr("Ціна занадто велика", "Price is too high"));
        return;
    }

    try {
        setLoading(true);

        let imageUrls = editingExistingImages.slice();
        if (files.length) {
            imageUrls = [];
            if ($("image-status")) $("image-status").textContent = tr(`Завантаження фото: 0/${files.length}`, `Uploading photos: 0/${files.length}`);
            for (let i = 0; i < files.length; i += 1) {
                const uploaded = await uploadImageToCloudinary(files[i]);
                imageUrls.push(uploaded);
                if ($("image-status")) $("image-status").textContent = tr(`Завантаження фото: ${i + 1}/${files.length}`, `Uploading photos: ${i + 1}/${files.length}`);
            }
        }

        if (!imageUrls.length) {
            showAlert(tr("Додай хоча б одне фото товару", "Add at least one product photo"));
            return;
        }

        const payload = {
            seller_id: currentUser.id,
            title,
            description,
            price,
            currency,
            category,
            condition,
            city,
            image_urls: imageUrls,
            image_url: imageUrls[0] || null
        };

        const isEdit = Boolean(editingProductId);
        await safeFetch(isEdit ? `${API_BASE}/products/${editingProductId}` : `${API_BASE}/products`, {
            method: isEdit ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });

        showAlert(isEdit ? tr("Оголошення оновлено", "Listing updated") : tr("Оголошення створено", "Listing created"));
        resetCreateForm();
        switchTab("my-products");
        loadMyProducts();
        loadProducts();
        loadStats();
    } catch (error) {
        showAlert(error.message || tr("Помилка збереження оголошення", "Failed to save listing"));
    } finally {
        setLoading(false);
    }
}

async function loadMyProducts() {
    const list = $("my-products-list");
    const wrap = $("purchase-requests-wrap");
    const requestsList = $("purchase-requests-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    if (wrap) wrap.classList.add("hidden");
    try {
        if (myProductsView === "requests") {
            const [requests, purchases] = await Promise.all([
                safeFetch(`${API_BASE}/users/${currentUser.id}/purchase-requests?status=open`),
                safeFetch(`${API_BASE}/users/${currentUser.id}/purchases`)
            ]);
            const filteredRequests = filterAndSortMyProducts(Array.isArray(requests) ? requests : [], "requests");
            const filteredPurchases = filterAndSortMyProducts(Array.isArray(purchases) ? purchases : [], "requests");
            updatePendingRequestsBadge(Array.isArray(requests) ? requests.filter(item => item.status === "pending").length : 0);
            if (wrap) wrap.classList.remove("hidden");
            if (requestsList) {
                requestsList.innerHTML = filteredRequests.length ? filteredRequests.map(item => `
                    <div class="card compact-list-card request-card request-compact-card">
                        <div class="compact-thumb-wrap request-thumb-wrap">
                            ${isValidUrl(item.product_image_url) ? `<img class="card-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title || 'Товар')}">` : `<div class="request-thumb-placeholder">🛒</div>`}
                        </div>
                        <div class="card-body compact-card-body request-card-body">
                            <div class="compact-card-top request-card-top">
                                <h3 class="card-title compact-title">${escapeHtml(item.product_title || 'Товар')}</h3>
                                <p class="card-price compact-price">${formatPrice(item.offered_price, item.currency)}</p>
                            </div>
                            <div class="compact-meta-row request-pill-row">
                                <span class="status-pill ${escapeHtml(item.status || "pending")} request-status-pill">${orderStatusLabel(item.status)}</span>
                            </div>
                            <div class="request-meta compact-request-meta">
                                <div>${tr("Покупець", "Buyer")}: ${item.buyer_username ? `@${escapeHtml(item.buyer_username)}` : `ID ${item.buyer_id}`}</div>
                                ${item.buyer_full_name ? `<div>${tr("Ім'я", "Name")}: ${escapeHtml(item.buyer_full_name)}</div>` : ""}
                                <div>${tr("Дата", "Date")}: ${formatDate(item.created_at) || '—'}</div>
                            </div>
                            <div class="card-actions request-actions-grid">
                                ${renderSellerOrderActions(item)}
                            </div>
                        </div>
                    </div>
                `).join("") : `<div class="empty-card">${escapeHtml(tr("Нових запитів поки немає", "No new requests yet"))}</div>`;
            }
            list.innerHTML = filteredPurchases.length ? filteredPurchases.map(item => `
                <div class="card history-card compact-history-card">
                    ${isValidUrl(item.product_image_url) ? `<img class="history-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title)}">` : ``}
                    <div class="card-body">
                        <div class="status-pill ${escapeHtml(item.status || 'pending')}">${orderStatusLabel(item.status)}</div>
                        <h3 class="card-title">${escapeHtml(item.product_title || 'Товар')}</h3>
                        <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                        <div class="history-meta">
                            ${item.seller_username ? `<div>${tr("Продавець", "Seller")}: @${escapeHtml(item.seller_username)}</div>` : ``}
                            <div>${tr("Дата", "Date")}: ${formatDate(item.created_at) || '—'}</div>
                        </div>
                        <div class="card-actions inline-actions compact-actions">
                            ${renderBuyerOrderActions(item)}
                        </div>
                    </div>
                </div>
            `).join("") : `<div class="empty-card">${escapeHtml(tr("Ваші покупки поки порожні", "Your purchases are empty"))}</div>`;
            return;
        }
        let url = `${API_BASE}/users/${currentUser.id}/products`;
        if (myProductsView === "sold") url = `${API_BASE}/users/${currentUser.id}/products/sold`;
        if (myProductsView === "archived") url = `${API_BASE}/users/${currentUser.id}/products/archived`;
        const products = await safeFetch(url);
        const filteredProducts = filterAndSortMyProducts(Array.isArray(products) ? products : [], myProductsView);
        if (!filteredProducts.length) {
            list.innerHTML = myProductsView === "active"
                ? `<div class="empty-card">${escapeHtml(tr('У вас поки немає активних оголошень', 'You have no active listings yet'))}</div>`
                : myProductsView === "sold"
                    ? `<div class="empty-card">${escapeHtml(tr('У вас поки немає проданих товарів', 'You have no sold items yet'))}</div>`
                    : `<div class="empty-card">${escapeHtml(tr('Архів порожній', 'Archive is empty'))}</div>`;
            return;
        }
        list.innerHTML = filteredProducts.map(product => renderMyProductCard(product, myProductsView)).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка завантаження", "Loading error"))}</div>`;
    }
}

async function loadPurchaseRequests() {
    return;
}

async function handlePurchaseRequest(orderId, approve) {
    if (!currentUser || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/decision`, {
            method: "POST",
            body: JSON.stringify({ seller_id: currentUser.id, approve })
        });
        showAlert(approve ? tr("Покупку підтверджено", "Purchase approved") : tr("Запит відхилено", "Request rejected"));
        closeProductModal();
        await loadPurchaseRequests();
        await loadMyProducts();
        await loadProducts();
        await loadCart();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося обробити запит", "Failed to process request"));
    } finally {
        setLoading(false);
    }
}

async function deleteProduct(productId) {
    if (!currentUser || isLoading) return;

    if (!confirm(tr("Перенести оголошення в архів?", "Move listing to archive?"))) return;

    try {
        setLoading(true);

        await safeFetch(`${API_BASE}/products/${productId}?user_id=${currentUser.id}`, {
            method: "DELETE"
        });

        showAlert(tr("Оголошення перенесено в архів", "Listing moved to archive"));
        loadMyProducts();
        loadProducts();
        loadCart();
        loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося видалити оголошення", "Failed to archive listing"));
    } finally {
        setLoading(false);
    }
}

async function addToCart(productId) {
    if (!currentUser || isLoading) return;

    try {
        setLoading(true);

        await safeFetch(`${API_BASE}/cart/add`, {
            method: "POST",
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: productId
            })
        });

        showAlert(tr("Товар додано до кошика", "Item added to cart"));
        loadCart();
        loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося додати товар", "Failed to add item"));
    } finally {
        setLoading(false);
    }
}

async function removeFromCart(cartItemId) {
    if (!currentUser || isLoading) return;

    try {
        setLoading(true);

        await safeFetch(`${API_BASE}/cart/items/${cartItemId}?user_id=${currentUser.id}`, {
            method: "DELETE"
        });

        loadCart();
        loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося видалити товар з кошика", "Failed to remove item from cart"));
    } finally {
        setLoading(false);
    }
}

async function loadCart() {
    const cartList = $("cart-list");
    const cartTotal = $("cart-total");
    const buyAllBtn = $("buy-all-btn");
    if (!cartList || !cartTotal || !currentUser) return;

    cartList.innerHTML = `<div class="empty-card">${escapeHtml(t("loading"))}</div>`;

    try {
        const data = await safeFetch(`${API_BASE}/cart/${currentUser.id}`);

        if (!data?.items?.length) {
            cartList.innerHTML = `<div class="empty-card">${escapeHtml(tr("Кошик порожній", "Cart is empty"))}</div>`;
            cartTotal.textContent = renderCartTotals({});
            if (buyAllBtn) buyAllBtn.disabled = true;
            return;
        }

        if (buyAllBtn) buyAllBtn.disabled = false;
        cartTotal.textContent = renderCartTotals(data.totals_by_currency || {});

        cartList.innerHTML = data.items.map(item => `
            <div class="compact-card cart-compact-card">
                <div class="compact-image-wrap">${isValidUrl(item.image_url) ? `<img class="card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">` : `<div class="card-image card-image-placeholder">${tr("Без фото", "No photo")}</div>`}</div>
                <div class="compact-info">
                    <div class="compact-top-row">
                        <h3 class="compact-title">${escapeHtml(item.title)}</h3>
                        <div class="compact-price">${formatPrice(item.price, item.currency)}</div>
                    </div>
                    ${item.seller_username ? `<div class="compact-desc cart-seller-line">${tr("Продавець", "Seller")}: @${escapeHtml(item.seller_username)}</div>` : ""}
                    <div class="card-actions compact-actions cart-card-actions">
                        <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">${tr("Купити", "Buy")}</button>
                        ${item.seller_username ? `<button class="message-btn" onclick="contactSeller('${escapeHtml(item.seller_username)}')">${tr("Написати", "Message")}</button>` : ""}
                        <button class="remove-btn" onclick="removeFromCart(${Number(item.cart_item_id)})">${tr("Видалити", "Delete")}</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        cartList.innerHTML = `<div class="empty-card">${escapeHtml(translateMessage(error.message || tr("Помилка завантаження", "Loading error")))}</div>`;
        if (buyAllBtn) buyAllBtn.disabled = true;
    }
}


async function buyAllFromCart() {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Сервіс не виступає гарантом угоди та не несе відповідальності за дії продавців. Перевірте профілі, рейтинги та відгуки перед передачею коштів. Надіслати запити на покупку для всіх товарів у кошику?", "The service is not a transaction guarantor and is not responsible for sellers' actions. Check profiles, ratings, and reviews before sending money. Send purchase requests for all items in the cart?"))) return;

    try {
        setLoading(true);
        const data = await safeFetch(`${API_BASE}/orders/buy-all?user_id=${currentUser.id}`, { method: "POST" });
        showAlert(currentLanguage === "en" ? `Done. Requests created: ${data?.created ?? 0}` : `Готово. Запитів створено: ${data?.created ?? 0}`);
        closeProductModal();
        await loadCart();
        await loadProducts();
        await loadMyProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося купити всі товари", "Failed to buy all items"));
    } finally {
        setLoading(false);
    }
}

async function buyProduct(productId) {
    if (!currentUser || isLoading) return;
    if (!confirm(tr("Сервіс не виступає гарантом угоди та не несе відповідальності за дії продавця. Перевірте профіль, рейтинг і відгуки перед передачею коштів. Надіслати запит на покупку?", "The service is not a transaction guarantor and is not responsible for the seller's actions. Check the profile, rating, and reviews before sending money. Send a purchase request?"))) return;

    try {
        setLoading(true);

        const data = await safeFetch(`${API_BASE}/orders/buy`, {
            method: "POST",
            body: JSON.stringify({
                buyer_id: currentUser.id,
                product_id: productId
            })
        });

        closeProductModal();

        showAlert(`${tr("Покупку оформлено", "Purchase request sent")}\n${data?.seller_username ? `@${data.seller_username}` : ""}\n${data?.seller_link || ""}`);

        loadCart();
        loadProducts();
        loadMyProducts();
        loadStats();
    } catch (error) {
        showAlert(error.message || tr("Помилка покупки", "Purchase error"));
    } finally {
        setLoading(false);
    }
}

async function toggleFavorite(productId, isFavoriteNow) {
    if (!currentUser || isLoading) return;

    document.querySelectorAll(`[data-favorite-id="${productId}"]`).forEach(btn => {
        btn.classList.add("favorite-pop");
        setTimeout(() => btn.classList.remove("favorite-pop"), 420);
    });

    try {
        setLoading(true);

        if (isFavoriteNow) {
            await safeFetch(`${API_BASE}/favorites?user_id=${currentUser.id}&product_id=${productId}`, {
                method: "DELETE"
            });
        } else {
            await safeFetch(`${API_BASE}/favorites`, {
                method: "POST",
                body: JSON.stringify({
                    user_id: currentUser.id,
                    product_id: productId
                })
            });
        }

        await loadProducts();
        await loadStats();

        const modal = $("product-modal");
        if (modal && !modal.classList.contains("hidden")) {
            await openProductModal(productId);
        }
    } catch (error) {
        showAlert(error.message || tr("Помилка роботи з обраним", "Favorites error"));
    } finally {
        setLoading(false);
    }
}


function toggleStatsPanel(forceState = null) {
    const wrap = $("stats-wrap");
    const btn = $("stats-toggle-btn");
    if (!wrap || !btn) return;
    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
    setProfileMenuButton('stats-toggle-btn', '📊', 'stats', shouldOpen);
}

async function detectAdminAccess() {
    const wrap = $("admin-panel-wrap");
    if (!wrap || !currentUser?.id) return false;
    try {
        const summary = await safeFetch(`${API_BASE}/admin/summary?current_admin_id=${currentUser.id}`);
        currentUser.is_admin = true;
        saveSession(currentUser);
        wrap.classList.remove("hidden");
        renderAdminSummary(summary);
        return true;
    } catch {
        currentUser.is_admin = false;
        saveSession(currentUser);
        wrap.classList.add("hidden");
        return false;
    }
}

function renderAdminSummary(summary) {
    const box = $("admin-summary");
    if (!box || !summary) return;
    box.innerHTML = `
        <div class="stats-grid compact-stats-grid admin-stats-grid">
            <div class="stat-card"><span class="stat-value">${summary.users ?? 0}</span><span class="stat-label">${tr('Користувачі', 'Users')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.banned_users ?? 0}</span><span class="stat-label">${tr('Бан', 'Banned')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.active_products ?? 0}</span><span class="stat-label">${tr('Активні', 'Active')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.orders_pending ?? 0}</span><span class="stat-label">${tr('Запити', 'Requests')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.suggestions_new ?? 0}</span><span class="stat-label">${tr('Ідеї', 'Ideas')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.reports_new ?? 0}</span><span class="stat-label">${tr('Скарги', 'Reports')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.orders_disputed ?? 0}</span><span class="stat-label">${tr('Спори', 'Disputes')}</span></div>
            <div class="stat-card"><span class="stat-value">${summary.verifications_pending ?? 0}</span><span class="stat-label">${tr('Верифікації', 'Verifications')}</span></div>
        </div>`;
}

async function toggleAdminPanel(forceState = null) {
    const body = $("admin-panel-body");
    const btn = $("admin-toggle-btn");
    if (!body || !btn || !currentUser?.id) return;
    const shouldOpen = forceState === null ? body.classList.contains("hidden") : Boolean(forceState);
    body.classList.toggle("hidden", !shouldOpen);
    setProfileMenuButton('admin-toggle-btn', '🛡', 'admin', shouldOpen);
    if (shouldOpen) {
        await loadAdminSummary();
        await loadAdminUsers();
    }
}

function switchAdminTab(tabName) {
    ["users","products","ideas","reports","verifications","logs"].forEach(name => {
        $(`admin-${name}-tab`)?.classList.toggle("hidden", name !== tabName);
        $(`admin-${name}-tab-btn`)?.classList.toggle("active", name === tabName);
    });
    if (tabName === "users") loadAdminUsers();
    if (tabName === "products") loadAdminProducts();
    if (tabName === "ideas") loadAdminIdeas();
    if (tabName === "reports") loadAdminReports();
    if (tabName === "verifications") loadAdminVerifications();
    if (tabName === "logs") loadAdminLogs();
}

async function loadAdminSummary() {
    if (!currentUser?.id) return;
    try {
        const summary = await safeFetch(`${API_BASE}/admin/summary?current_admin_id=${currentUser.id}`);
        renderAdminSummary(summary);
    } catch (error) {
        console.error("Admin summary error:", error);
    }
}

async function loadAdminUsers() {
    if (!currentUser?.id) return;
    const list = $("admin-users-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const q = $("admin-users-search")?.value.trim() || "";
        const items = await safeFetch(`${API_BASE}/admin/users?current_admin_id=${currentUser.id}&q=${encodeURIComponent(q)}`);
        list.innerHTML = items.length ? items.map(item => `
            <div class="card"><div class="card-body">
                <h3 class="card-title">@${escapeHtml(item.username || "")}</h3>
                <p class="card-seller">${escapeHtml(item.full_name || tr("Без імені", "No name"))}</p>
                <div class="request-meta">
                    <div>${tr('Активні', 'Active')}: ${Number(item.active_products || 0)}</div>
                    <div>${tr('Продані', 'Sold')}: ${Number(item.sold_products || 0)}</div>
                    <div>${tr('Статус', 'Status')}: ${item.is_superadmin ? t('superadmin') : item.is_banned ? tr('Заблокований', 'Blocked') : tr('Активний', 'Active')}</div>
                    <div>${tr('Верифікація', 'Verification')}: ${verificationStatusLabel(item.verification_status)}</div>
                </div>
                <div class="card-actions inline-actions admin-grid-3">
                    <button class="secondary-btn" onclick="openUserProfile(${Number(item.id)})">${tr('Профіль', 'Profile')}</button>
                    ${item.is_superadmin ? `<button class="secondary-btn" disabled>${escapeHtml(t('protectedAdmin'))}</button>` : item.is_banned ? `<button class="approve-btn" onclick="adminUnbanUser(${Number(item.id)})">${tr('Розбан', 'Unban')}</button>` : `<button class="reject-btn" onclick="adminBanUser(${Number(item.id)})">${tr('Бан', 'Ban')}</button>`}
                    ${item.is_superadmin ? `<button class="secondary-btn" disabled>${escapeHtml(t('superadmin'))}</button>` : item.is_admin ? `<button class="remove-btn" onclick="adminRemoveAdmin(${Number(item.id)})">${tr('Зняти адмін', 'Remove admin')}</button>` : `<button class="buy-btn" onclick="adminMakeAdmin(${Number(item.id)})">${tr('Дати адмін', 'Make admin')}</button>`}
                </div>
            </div></div>
        `).join("") : `<div class="empty-card">${escapeHtml(tr('Нічого не знайдено', 'Nothing found'))}</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function adminBanUser(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/ban?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}

async function adminUnbanUser(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/unban?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}

async function adminMakeAdmin(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/make-admin?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}

async function adminRemoveAdmin(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/remove-admin?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}

async function loadAdminProducts() {
    if (!currentUser?.id) return;
    const list = $("admin-products-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const q = $("admin-products-search")?.value.trim() || "";
        const items = await safeFetch(`${API_BASE}/admin/products?current_admin_id=${currentUser.id}&q=${encodeURIComponent(q)}`);
        list.innerHTML = items.length ? items.map(item => {
            const createdAt = formatDate(item.created_at) || "—";
            const soldAt = formatDate(item.sold_at || item.sale_info?.sold_at) || "";
            const buyerUsername = item.sale_info?.buyer_username || item.buyer_username || "";
            const buyerId = Number(item.sale_info?.buyer_id || item.buyer_id || 0);
            const reportsCount = Number(item.reports_count || 0);
            const viewsCount = Number(item.views_count || 0);
            const likesCount = Number(item.favorites_count || item.likes_count || 0);
            const imageCount = Array.isArray(item.images) && item.images.length > 1 ? item.images.length - 1 : 0;

            return `
            <div class="card card-clickable compact-list-card catalog-product-card admin-product-card" onclick="openProductModal(${Number(item.id)})">
                <div class="compact-thumb-wrap catalog-thumb-wrap admin-product-thumb">
                    ${renderImageBlock(item)}
                    ${imageCount > 0 ? `<span class="admin-photo-count">+${imageCount}</span>` : ``}
                    ${reportsCount > 0 ? `<span class="admin-report-badge">${tr('Скарг', 'Reports')} ${reportsCount}</span>` : ``}
                </div>
                <div class="card-body compact-card-body catalog-card-body admin-product-body">
                    <div class="compact-card-top catalog-card-top">
                        <h3 class="card-title compact-title">${escapeHtml(item.title || "")}</h3>
                        <p class="card-price compact-price">${formatPrice(item.price, item.currency)}</p>
                    </div>

                    <div class="compact-meta-row catalog-meta-row">
                        <span class="tag">${escapeHtml(tv(item.city || "Без міста"))}</span>
                        <span class="tag ${getConditionTagClass(item.condition)}">${escapeHtml(tv(item.condition || "Новий"))}</span>
                        <span class="tag soft-tag admin-status-tag">${escapeHtml(translateStatusValue(item.status || ""))}</span>
                    </div>

                    <div class="compact-secondary-row catalog-secondary-row admin-secondary-row">
                        ${item.seller_username ? `<span class="muted-meta">${tr('Продавець', 'Seller')}: @${escapeHtml(item.seller_username)}</span>` : ``}
                        <span class="muted-meta">👁 ${viewsCount}</span>
                        <span class="muted-meta">❤ ${likesCount}</span>
                        ${reportsCount > 0 ? `<span class="muted-meta admin-danger-text">⚠ ${reportsCount}</span>` : ``}
                    </div>

                    <p class="card-description compact-desc catalog-desc">${escapeHtml(item.description || "")}</p>

                    <div class="compact-secondary-row catalog-secondary-row my-product-extra-meta my-product-extra-meta-block admin-extra-meta">
                        <span class="muted-meta">${tr('Створено', 'Created')}: ${escapeHtml(createdAt)}</span>
                        ${soldAt ? `<span class="muted-meta">${tr('Продано', 'Sold')}: ${escapeHtml(soldAt)}</span>` : ``}
                        ${buyerUsername ? `<span class="muted-meta">${tr('Покупець', 'Buyer')}: @${escapeHtml(buyerUsername)}</span>` : ``}
                    </div>

                    <div class="card-actions compact-actions compact-actions-grid catalog-actions-row admin-actions-grid">
                        <button type="button" class="secondary-btn admin-open-btn" onclick="event.stopPropagation(); openProductModal(${Number(item.id)})">${tr('Відкрити', 'Open')}</button>
                        ${item.seller_id ? `<button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(item.seller_id)})">${tr('Профіль продавця', 'Seller profile')}</button>` : ``}
                        ${item.status === "archived"
                            ? `<button type="button" class="approve-btn" onclick="event.stopPropagation(); adminRestoreProduct(${Number(item.id)})">${tr('Активувати', 'Activate')}</button>`
                            : `<button type="button" class="remove-btn" onclick="event.stopPropagation(); adminArchiveProduct(${Number(item.id)})">${tr('Архів', 'Archive')}</button>`}
                        <button type="button" class="reject-btn" onclick="event.stopPropagation(); adminDeleteProduct(${Number(item.id)})">${tr('Видалити', 'Delete')}</button>
                    </div>

                    ${buyerId ? `<div class="card-actions compact-actions compact-actions-grid admin-actions-grid admin-buyer-row">
                        <button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${buyerId})">${tr('Профіль покупця', 'Buyer profile')}</button>
                    </div>` : ``}
                </div>
            </div>`;
        }).join("") : `<div class="empty-card">${escapeHtml(tr("Нічого не знайдено", "Nothing found"))}</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function adminArchiveProduct(productId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/products/${productId}/archive?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminProducts();
        await loadProducts();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}

async function adminRestoreProduct(productId) {
    if (!currentUser || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/products/${productId}/restore?current_admin_id=${currentUser.id}`, { method: "POST" });
        showAlert(tr("Оголошення відновлено", "Listing restored"));
        await loadAdminProducts();
        await loadProducts();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося відновити оголошення", "Failed to restore listing"));
    } finally {
        setLoading(false);
    }
}

async function adminDeleteProduct(productId) {
    if (isLoading) return;
    if (!confirm(tr("Видалити оголошення повністю?", "Delete listing permanently?"))) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/products/${productId}?current_admin_id=${currentUser.id}`, { method: "DELETE" });
        await loadAdminSummary();
        await loadAdminProducts();
        await loadProducts();
    } catch (error) { showAlert(error.message || tr("Помилка", "Error")); }
    finally { setLoading(false); }
}


async function toggleIdeasPanel(forceState = null) {
    const wrap = $("ideas-wrap");
    const btn = $("ideas-toggle-btn");
    if (!wrap || !btn) return;
    const shouldOpen = forceState === null ? wrap.classList.contains("hidden") : Boolean(forceState);
    wrap.classList.toggle("hidden", !shouldOpen);
    setProfileMenuButton('ideas-toggle-btn', '💡', 'ideas', shouldOpen);
}

async function submitIdea() {
    if (!currentUser || isLoading) return;
    const title = $("idea-title")?.value.trim() || "";
    const message = $("idea-message")?.value.trim() || "";
    if (!title || !message) {
        showAlert(tr("Заповни назву та опис ідеї", "Fill in the idea title and description"));
        return;
    }
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/suggestions`, {
            method: "POST",
            body: JSON.stringify({ user_id: currentUser.id, title, message })
        });
        $("idea-title").value = "";
        $("idea-message").value = "";
        showAlert(tr("Ідею надіслано", "Idea sent"));
        if (currentUser.is_admin) await loadAdminSummary();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося надіслати ідею", "Failed to send idea"));
    } finally {
        setLoading(false);
    }
}

function setReportReasonOptions(reportType = "listing") {
    const select = $("report-reason");
    if (!select) return;
    const options = reportType === "profile"
        ? ["Шахрайство", "Підозрілий профіль", "Образи або небажана поведінка", "Спам", "Інше"]
        : ["Шахрайство", "Неправдивий опис", "Заборонений товар", "Спам", "Інше"];
    select.innerHTML = options.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(currentLanguage === "en" ? tv(value) : value)}</option>`).join("");
    select.value = options[0];
}

function openReportModal(productId, title = "", event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    const modal = $("report-modal");
    if (!modal) return;
    $("report-type").value = "listing";
    $("report-product-id").value = String(productId || "");
    $("report-target-user-id").value = "";
    $("report-order-id").value = "";
    $("report-title").textContent = title ? `${tr('Скарга на', 'Report for')}: ${title}` : tr("Скарга на оголошення", "Report listing");
    setReportReasonOptions("listing");
    $("report-comment").value = "";
    animateModalOpen("report-modal");
    reportModalOpenedAt = Date.now();
    reportModalIgnoreBackdropClick = true;
    if (reportModalIgnoreTimer) clearTimeout(reportModalIgnoreTimer);
    reportModalIgnoreTimer = setTimeout(() => {
        reportModalIgnoreBackdropClick = false;
        reportModalIgnoreTimer = null;
    }, MODAL_BACKDROP_GUARD_MS);
    syncBodyScrollLock();
}

function openProfileReportModal(userId, username = "", event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    if (!currentUser || Number(userId) === Number(currentUser.id)) return;
    const modal = $("report-modal");
    if (!modal) return;
    $("report-type").value = "profile";
    $("report-product-id").value = "";
    $("report-target-user-id").value = String(userId || "");
    $("report-order-id").value = "";
    $("report-title").textContent = username ? `${tr('Скарга на профіль', 'Report profile')}: @${username}` : tr("Скарга на профіль", "Report profile");
    setReportReasonOptions("profile");
    $("report-comment").value = "";
    animateModalOpen("report-modal");
    reportModalOpenedAt = Date.now();
    reportModalIgnoreBackdropClick = true;
    if (reportModalIgnoreTimer) clearTimeout(reportModalIgnoreTimer);
    reportModalIgnoreTimer = setTimeout(() => {
        reportModalIgnoreBackdropClick = false;
        reportModalIgnoreTimer = null;
    }, MODAL_BACKDROP_GUARD_MS);
    syncBodyScrollLock();
}

function handleReportReasonChange() {
    return;
}

function closeReportModal(event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    reportModalIgnoreBackdropClick = false;
    if (reportModalIgnoreTimer) {
        clearTimeout(reportModalIgnoreTimer);
        reportModalIgnoreTimer = null;
    }
    animateModalClose("report-modal");
    syncBodyScrollLock();
}

function closeReportModalOnBackdrop(event) {
    if (event.target?.id === "report-modal") closeReportModal();
}

async function submitReport() {
    if (!currentUser || isLoading) return;
    const reportType = $("report-type")?.value || "listing";
    const listingId = Number($("report-product-id")?.value || 0) || null;
    const reportedUserId = Number($("report-target-user-id")?.value || 0) || null;
    const orderId = Number($("report-order-id")?.value || 0) || null;
    const reason = $("report-reason")?.value || "Шахрайство";
    const comment = $("report-comment")?.value.trim() || "";
    if (reportType === "listing" && !listingId) {
        showAlert(tr("Оголошення не знайдено", "Listing not found"));
        return;
    }
    if (reportType === "profile" && !reportedUserId) {
        showAlert(tr("Профіль не знайдено", "Profile not found"));
        return;
    }
    if (reason === "Інше" && !comment) {
        showAlert(tr("Опиши свою причину скарги", "Describe your reason for the report"));
        return;
    }
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/reports`, {
            method: "POST",
            body: JSON.stringify({
                reporter_id: currentUser.id,
                report_type: reportType,
                listing_id: listingId,
                reported_user_id: reportedUserId,
                order_id: orderId,
                reason,
                comment: comment || null
            })
        });
        closeReportModal();
        showAlert(tr("Скаргу надіслано", "Report sent"));
        if (currentUser.is_admin) await loadAdminSummary();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося надіслати скаргу", "Failed to send report"));
    } finally {
        setLoading(false);
    }
}

async function loadAdminIdeas() {
    const list = $("admin-ideas-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/suggestions?current_admin_id=${currentUser.id}`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">${escapeHtml(tr("Ідей поки немає", "No ideas yet"))}</div>`;
            return;
        }
        list.innerHTML = items.map(item => `
            <div class="card admin-idea-card">
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status)}">${ideaStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <div class="history-meta">
                        <div>${tr("Від", "From")}: @${escapeHtml(item.username || "user")}</div>
                        <div>${tr("Дата", "Date")}: ${formatDate(item.created_at)}</div>
                    </div>
                    <p class="card-description">${escapeHtml(item.message || "")}</p>
                    <div class="card-actions compact-actions">
                        ${item.status !== "review" && item.status !== "done" ? `<button class="secondary-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'review')">${tr("На розгляді", "In review")}</button>` : ""}
                        ${item.status !== "done" ? `<button class="approve-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'done')">${tr("Виконано", "Done")}</button>` : `<button class="approve-btn" disabled>${tr("Виконано", "Done")}</button>`}
                        ${item.status !== "new" && item.status !== "done" ? `<button class="ghost-warning-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'new')">${tr("Повернути в нові", "Return to new")}</button>` : ""}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function updateSuggestionStatus(id, status) {
    if (!currentUser || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/suggestions/${id}/status?current_admin_id=${currentUser.id}`, {
            method: "POST",
            body: JSON.stringify({ status })
        });
        await loadAdminSummary();
        await loadAdminIdeas();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося оновити статус ідеї", "Failed to update idea status"));
    } finally {
        setLoading(false);
    }
}

function reportTypeLabel(type) {
    if (type === "profile") return tr("Скарга на профіль", "Profile report");
    if (type === "order") return tr("Спір щодо угоди", "Deal dispute");
    return tr("Скарга на оголошення", "Listing report");
}

async function loadAdminReports() {
    const list = $("admin-reports-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/reports?current_admin_id=${currentUser.id}`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">${escapeHtml(tr("Скарг поки немає", "No reports yet"))}</div>`;
            return;
        }
        list.innerHTML = items.map(item => {
            const title = item.report_type === "profile"
                ? `${tr("Профіль", "Profile")}: @${escapeHtml(item.reported_username || "user")}`
                : item.report_type === "order"
                    ? `${tr("Угода", "Deal")} #${Number(item.order_id || 0)} · ${escapeHtml(item.listing_title || tr("Товар", "Product"))}`
                    : escapeHtml(item.listing_title || tr('Оголошення', 'Listing'));
            const orderActions = item.report_type === "order" && item.order_id && item.status !== "done" ? `
                <div class="card-actions compact-actions admin-dispute-actions">
                    <button class="approve-btn" onclick="resolveOrderReport(${Number(item.id)}, 'complete')">${tr("Завершити угоду", "Complete deal")}</button>
                    <button class="reject-btn" onclick="resolveOrderReport(${Number(item.id)}, 'cancel')">${tr("Скасувати угоду", "Cancel deal")}</button>
                    <button class="secondary-btn" onclick="resolveOrderReport(${Number(item.id)}, 'return')">${tr("Повернути покупцю", "Return to buyer")}</button>
                </div>` : "";
            return `
            <div class="card admin-idea-card admin-report-card">
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status)}">${ideaStatusLabel(item.status)}</div>
                    <div class="report-type-label">${reportTypeLabel(item.report_type)}</div>
                    <h3 class="card-title">${title}</h3>
                    <div class="history-meta">
                        <div>${tr("Хто поскаржився", "Reported by")}: @${escapeHtml(item.reporter_username || "user")}</div>
                        ${item.reported_user_id ? `<div>${tr("На кого скарга", "Reported user")}: @${escapeHtml(item.reported_username || "user")}</div>` : ""}
                        ${item.order_id ? `<div>${tr("Угода", "Deal")}: #${Number(item.order_id)} · ${orderStatusLabel(item.order_status)}</div>` : ""}
                        ${item.listing_id ? `<div>${tr("Оголошення", "Listing")}: #${Number(item.listing_id)} ${escapeHtml(item.listing_title || "")}</div>` : ""}
                        <div>${tr("Дата", "Date")}: ${formatDate(item.created_at)}</div>
                        <div>${tr("Причина", "Reason")}: ${escapeHtml(tv(item.reason || ""))}</div>
                    </div>
                    ${item.comment ? `<p class="card-description">${escapeHtml(item.comment)}</p>` : ""}
                    <div class="card-actions compact-actions">
                        ${item.reporter_id ? `<button class="seller-link-btn" onclick="openUserProfile(${Number(item.reporter_id)})">${tr("Профіль скаржника", "Reporter profile")}</button>` : ""}
                        ${item.reported_user_id ? `<button class="seller-link-btn" onclick="openUserProfile(${Number(item.reported_user_id)})">${tr("Профіль користувача", "Reported profile")}</button>` : ""}
                        ${item.listing_id ? `<button class="secondary-btn" onclick="openProductModal(${Number(item.listing_id)})">${tr("Відкрити товар", "Open item")}</button>` : ""}
                    </div>
                    ${orderActions}
                    <div class="card-actions compact-actions">
                        ${item.status !== "review" && item.status !== "done" ? `<button class="secondary-btn" onclick="updateReportStatus(${Number(item.id)}, 'review')">${tr("На розгляді", "In review")}</button>` : ""}
                        ${item.report_type !== "order" ? (item.status !== "done" ? `<button class="approve-btn" onclick="updateReportStatus(${Number(item.id)}, 'done')">${tr("Виконано", "Done")}</button>` : `<button class="approve-btn" disabled>${tr("Виконано", "Done")}</button>`) : ""}
                        ${item.status !== "new" && item.status !== "done" ? `<button class="ghost-warning-btn" onclick="updateReportStatus(${Number(item.id)}, 'new')">${tr("Повернути в нові", "Return to new")}</button>` : ""}
                    </div>
                </div>
            </div>`;
        }).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function updateReportStatus(id, status) {
    if (!currentUser || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/reports/${id}/status?current_admin_id=${currentUser.id}`, {
            method: "POST",
            body: JSON.stringify({ status })
        });
        await loadAdminSummary();
        await loadAdminReports();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося оновити статус скарги", "Failed to update report status"));
    } finally {
        setLoading(false);
    }
}

async function resolveOrderReport(id, action) {
    if (!currentUser || isLoading) return;
    const labels = {
        complete: tr("завершити угоду", "complete the deal"),
        cancel: tr("скасувати угоду", "cancel the deal"),
        return: tr("повернути угоду на підтвердження покупця", "return the deal to buyer confirmation")
    };
    if (!confirm(`${tr("Підтвердити дію", "Confirm action")}: ${labels[action] || action}?`)) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/reports/${id}/resolve?current_admin_id=${currentUser.id}`, {
            method: "POST",
            body: JSON.stringify({ action })
        });
        await loadAdminSummary();
        await loadAdminReports();
        await loadProducts();
        await loadMyProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || tr("Не вдалося застосувати рішення", "Failed to apply decision"));
    } finally {
        setLoading(false);
    }
}

async function loadAdminVerifications() {
    if (!currentUser?.id) return;
    const list = $("admin-verifications-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/verifications?current_admin_id=${currentUser.id}`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">${escapeHtml(tr("Заявок на верифікацію поки немає", "No verification applications yet"))}</div>`;
            return;
        }
        list.innerHTML = items.map(item => {
            const status = item.verification_status || "unverified";
            const canReview = status === "pending";
            return `
            <div class="card admin-verification-card"><div class="card-body">
                <div class="verification-card-top">
                    <div>
                        <h3 class="card-title">@${escapeHtml(item.username || "")}</h3>
                        <p class="card-seller">${escapeHtml(item.verification_full_name || item.full_name || tr("Без імені", "No name"))}</p>
                    </div>
                    <span class="verification-badge ${verificationBadgeClass(status)}">${escapeHtml(verificationStatusLabel(status))}</span>
                </div>
                <div class="request-meta">
                    <div>${tr("Дата народження", "Birth date")}: ${escapeHtml(item.verification_birth_date || "—")}</div>
                    <div>${tr("Подано", "Submitted")}: ${formatDate(item.verification_submitted_at) || "—"}</div>
                    ${item.verification_reviewed_at ? `<div>${tr("Розглянуто", "Reviewed")}: ${formatDate(item.verification_reviewed_at)}</div>` : ""}
                    ${item.verification_rejection_reason ? `<div>${tr("Причина відмови", "Rejection reason")}: ${escapeHtml(item.verification_rejection_reason)}</div>` : ""}
                </div>
                <div class="card-actions inline-actions verification-admin-actions">
                    <button class="secondary-btn" onclick="openUserProfile(${Number(item.user_id)})">${tr("Профіль", "Profile")}</button>
                    ${item.has_front_document ? `<button class="seller-link-btn" onclick="openVerificationDocument(${Number(item.user_id)}, 'front')">${tr("Основне фото", "Main photo")}</button>` : ""}
                    ${item.has_back_document ? `<button class="seller-link-btn" onclick="openVerificationDocument(${Number(item.user_id)}, 'back')">${tr("Друге фото", "Second photo")}</button>` : ""}
                    ${canReview ? `<button class="approve-btn" onclick="adminResolveVerification(${Number(item.user_id)}, 'approve')">${tr("Підтвердити", "Approve")}</button><button class="reject-btn" onclick="adminResolveVerification(${Number(item.user_id)}, 'reject')">${tr("Відхилити", "Reject")}</button>` : ""}
                </div>
            </div></div>`;
        }).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function openVerificationDocument(userId, side) {
    try {
        const data = await safeFetch(`${API_BASE}/admin/verifications/${userId}/document/${encodeURIComponent(side)}?current_admin_id=${currentUser.id}`);
        if (!data?.url) throw new Error(tr("Посилання на документ не отримано", "Document URL was not received"));
        window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
        showAlert(error.message || tr("Не вдалося відкрити документ", "Failed to open document"));
    }
}

async function adminResolveVerification(userId, action) {
    if (!currentUser?.id || isLoading) return;
    let reason = null;
    if (action === "reject") {
        reason = prompt(tr("Вкажіть причину відмови", "Enter rejection reason"), "");
        if (reason === null) return;
        reason = reason.trim();
        if (reason.length < 3) {
            showAlert(tr("Вкажіть причину відмови", "Enter rejection reason"));
            return;
        }
    } else if (!confirm(tr("Підтвердити верифікацію користувача? Фото документів буде видалено після рішення.", "Approve user verification? Document photos will be deleted after the decision."))) {
        return;
    }
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/verifications/${userId}/decision?current_admin_id=${currentUser.id}`, {
            method: "POST",
            body: JSON.stringify({ action, reason })
        });
        await loadAdminSummary();
        await loadAdminVerifications();
        if (Number(userId) === Number(currentUser.id)) {
            await refreshCurrentUserFromApi();
            fillProfile();
        }
    } catch (error) {
        showAlert(error.message || tr("Не вдалося застосувати рішення", "Failed to apply decision"));
    } finally {
        setLoading(false);
    }
}

async function loadAdminLogs() {
    if (!currentUser?.id) return;
    const list = $("admin-logs-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/logs?current_admin_id=${currentUser.id}`);
        list.innerHTML = items.length ? items.map(item => `
            <div class="card"><div class="card-body">
                <div class="status-pill approved">@${escapeHtml(item.admin_username || "admin")}</div>
                <div class="request-meta"><div>${escapeHtml(item.action || "")}</div><div>${formatDate(item.created_at)}</div></div>
            </div></div>`).join("") : `<div class="empty-card">${escapeHtml(tr("Логи порожні", "Logs are empty"))}</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Помилка", "Error"))}</div>`;
    }
}

async function searchSeller() {
    const value = $("seller-search-input")?.value?.trim() || "";
    if (!value) {
        showAlert(tr("Введіть username продавця", "Enter seller username"));
        return;
    }
    try {
        const data = await safeFetch(`${API_BASE}/users/search?username=${encodeURIComponent(value)}`);
        await openUserProfile(Number(data.id));
    } catch (error) {
        showAlert(error.message || tr("Продавця не знайдено", "Seller not found"));
    }
}

function applyBadgeValue(elementId, count) {
    const badge = $(elementId);
    if (!badge) return;
    const value = Number(count || 0);
    badge.textContent = value > 99 ? '99+' : String(value);
    badge.classList.toggle('hidden', value <= 0);
}

function updateNotificationsBadge(count) {
    notificationsUnread = Number(count || 0);
    applyBadgeValue('notifications-badge', notificationsUnread);
    applyBadgeValue('nav-profile-badge', notificationsUnread);
}

function updatePendingRequestsBadge(count) {
    const value = Number(count || 0);
    applyBadgeValue('nav-my-badge', value);
    applyBadgeValue('my-products-requests-badge', value);
}

async function loadNotifications(markAsRead = false) {
    if (!currentUser?.id) return;
    const list = $("notifications-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/notifications`);
        updateNotificationsBadge(data.unread_count || 0);
        const items = Array.isArray(data.items) ? data.items : [];
        list.innerHTML = items.length ? items.map(item => {
            const actionBtn = item.related_product_id
                ? `<button class="secondary-btn section-btn" onclick="openProductModal(${Number(item.related_product_id)})">${tr("Відкрити товар", "Open listing")}</button>`
                : `<button class="secondary-btn section-btn" onclick="switchTab('catalog')">${tr("До каталогу", "To catalog")}</button>`;
            return `
                <div class="card notification-card ${item.is_read ? 'is-read' : 'is-unread'}">
                    <div class="card-body">
                        <div class="notification-head">
                            <div class="notification-icon">${item.type === 'order' ? '📦' : '🔔'}</div>
                            <div class="notification-meta">
                                <div class="notification-title-row">
                                    <h3 class="card-title">${escapeHtml(item.title || tr('Повідомлення', 'Notification'))}</h3>
                                    <span class="status-pill ${item.is_read ? 'approved' : 'pending'}">${item.is_read ? tr('Прочитано', 'Read') : tr('Нове', 'New')}</span>
                                </div>
                                <div class="notification-date">${formatDate(item.created_at) || '—'}</div>
                            </div>
                        </div>
                        <p class="card-description notification-text">${escapeHtml(item.message || '')}</p>
                        <div class="card-actions compact-actions notification-actions">${actionBtn}</div>
                    </div>
                </div>
            `;
        }).join("") : `<div class="empty-card">${escapeHtml(tr("Повідомлень поки немає", "No notifications yet"))}</div>`;
        if (markAsRead && (data.unread_count || 0) > 0) {
            await safeFetch(`${API_BASE}/users/${currentUser.id}/notifications/read-all`, { method: 'POST' });
            updateNotificationsBadge(0);
        }
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr('Не вдалося завантажити повідомлення', 'Failed to load notifications'))}</div>`;
    }
}

function toggleNotificationsPanel() {
    const wrap = $("notifications-wrap");
    if (!wrap) return;
    const open = wrap.classList.contains("hidden");
    wrap.classList.toggle("hidden", !open);
    if (open) loadNotifications(true);
}

async function openUserProfile(userId) {
    const modal = $("user-profile-modal");
    const body = $("user-profile-modal-body");

    if (!modal || !body) return;

    modal.classList.remove("hidden");
    syncBodyScrollLock();
    const modalContent = modal.querySelector(".modal-content");
    if (modalContent) { modalContent.classList.remove("modal-animate-in"); requestAnimationFrame(() => modalContent.classList.add("modal-animate-in")); }
    body.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;

    try {
        const profile = await safeFetch(`${API_BASE}/users/${userId}/public-profile?current_user_id=${currentUser ? currentUser.id : ""}`);

        const avatar = profile.avatar_url
            ? `<img class="user-profile-avatar-img" src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.username || "user")}">`
            : `<div class="user-profile-avatar-fallback">${escapeHtml((profile.full_name || profile.username || "U").charAt(0).toUpperCase())}</div>`;

        const listingsHtml = Array.isArray(profile.listings) && profile.listings.length
            ? profile.listings.map(item => renderCatalogCard(item)).join('')
            : `<div class="empty-card">${escapeHtml(tr('Активних оголошень немає', 'No active listings'))}</div>`;

        body.innerHTML = `
            <div class="seller-profile-shell seller-profile-shell-compact">
                <div class="seller-cover seller-cover-compact"></div>
                <div class="seller-profile-card seller-profile-card-compact">
                    <div class="seller-profile-top seller-profile-top-compact">
                        <div class="user-profile-avatar seller-avatar-large seller-avatar-medium">${avatar}</div>
                        <div class="seller-profile-main seller-profile-main-compact">
                            <h3 class="user-profile-name seller-name-compact">${escapeHtml(profile.full_name || tr("Без імені", "No name"))}</h3>
                            <div class="user-profile-username">@${escapeHtml(profile.username || "")}</div>
                            <div class="seller-badges seller-badges-compact">
                                <span class="seller-badge accent">${escapeHtml(profile.seller_status || getSellerBadgeText(profile.sold_products, profile.rating_count))}</span>
                                <span class="seller-badge verification-badge ${verificationBadgeClass(profile.verification_status)}">${escapeHtml(verificationBadgeLabel(profile.verification_status))}</span>
                                ${profile.rating_count > 0 ? `<span class="seller-badge">⭐ ${escapeHtml(String(profile.rating))} · ${escapeHtml(String(profile.rating_count))}</span>` : ``}
                                ${profile.is_superadmin ? `<span class="seller-badge">${escapeHtml(t('superadmin'))}</span>` : (profile.is_admin ? `<span class="seller-badge">${tr('Адміністратор', 'Administrator')}</span>` : ``)}
                            </div>
                            <div class="seller-registered">${tr('З нами з', 'With us since')} ${formatDate(profile.registered_at) || "—"}</div>
                        </div>
                    </div>

                    <div class="seller-stats-grid seller-stats-grid-compact">
                        <div class="seller-stat"><span class="stat-value">${profile.active_products ?? 0}</span><span class="stat-label">${tr('Активні', 'Active')}</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.sold_products ?? 0}</span><span class="stat-label">${tr('Продані', 'Sold')}</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.bought_products ?? 0}</span><span class="stat-label">${tr('Куплені', 'Bought')}</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.archived_products ?? 0}</span><span class="stat-label">${tr('Архів', 'Archive')}</span></div>
                    </div>

                    <div class="card-actions seller-action-stack seller-action-stack-compact">
                        ${profile.telegram_link
                            ? `<a class="contact-btn contact-link compact-cta-btn" href="${escapeHtml(profile.telegram_link)}" target="_blank" rel="noopener noreferrer">${tr('Написати продавцю', 'Message seller')}</a>`
                            : `<button class="own-product-btn compact-cta-btn" disabled>${tr('Telegram недоступний', 'Telegram unavailable')}</button>`
                        }
                        <button class="secondary-btn full-btn seller-toggle-btn" onclick="toggleSellerSection(${Number(profile.id)}, 'reviews')">${tr('Відгуки', 'Reviews')}</button>
                        <button class="secondary-btn full-btn seller-toggle-btn" onclick="toggleSellerSection(${Number(profile.id)}, 'listings')">${tr('Усі оголошення продавця', "All seller's listings")}</button>
                        ${currentUser && Number(profile.id) !== Number(currentUser.id) ? `<button class="ghost-warning-btn full-btn seller-toggle-btn" onclick="openProfileReportModal(${Number(profile.id)}, '${escapeJs(profile.username || '')}', event)">${tr('Поскаржитися на профіль', 'Report profile')}</button>` : ""}
                    </div>

                    <div id="seller-reviews-wrap" class="seller-section-wrap seller-reviews-wrap hidden"></div>
                    <div id="seller-listings-wrap" class="seller-section-wrap seller-listings-wrap hidden"><div class="cards seller-listings-grid compact-seller-listings">${listingsHtml}</div></div>
                </div>
            </div>
        `;
    } catch (error) {
        body.innerHTML = `<div class="empty-card">${escapeHtml(error.message || tr("Не вдалося завантажити профіль", "Failed to load profile"))}</div>`;
    }
}

async function loadSellerReviews(userId) {
    const wrap = $("seller-reviews-wrap");
    if (!wrap) return;
    wrap.innerHTML = `<div class="empty-card">${escapeHtml(t('loading'))}</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/users/${userId}/reviews`);
        if (!Array.isArray(items) || !items.length) {
            wrap.innerHTML = `<div class="empty-card">${escapeHtml(t('noSellerReviews'))}</div>`;
            wrap.dataset.loaded = "1";
            return;
        }
        wrap.innerHTML = `<div class="cards seller-reviews-list compact-reviews-list">${items.map(item => renderReviewCard(item, false)).join("")}</div>`;
        wrap.dataset.loaded = "1";
    } catch (error) {
        wrap.innerHTML = `<div class="empty-card">${escapeHtml(tr('Не вдалося завантажити відгуки', 'Failed to load reviews'))}</div>`;
    }
}

async function toggleSellerSection(userId, section) {
    const reviewsWrap = $("seller-reviews-wrap");
    const listingsWrap = $("seller-listings-wrap");
    if (!reviewsWrap || !listingsWrap) return;

    if (section === "reviews") {
        const opening = reviewsWrap.classList.contains("hidden");
        listingsWrap.classList.add("hidden");
        reviewsWrap.classList.toggle("hidden", !opening);
        if (opening && !reviewsWrap.dataset.loaded) {
            await loadSellerReviews(userId);
        }
        return;
    }

    if (section === "listings") {
        const opening = listingsWrap.classList.contains("hidden");
        reviewsWrap.classList.add("hidden");
        listingsWrap.classList.toggle("hidden", !opening);
    }
}

function closeUserProfileModal() {
    $("user-profile-modal")?.classList.add("hidden");
    syncBodyScrollLock();
}

function closeUserProfileOnBackdrop(event) {
    if (event.target?.id === "user-profile-modal") closeUserProfileModal();
}

async function initApp() {
    setupAuthScreen();
    syncMyProductsFilterUi();

    $("search-input")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadProducts();
        }
    });
    $("seller-search-input")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchSeller();
        }
    });
    $("my-products-search-input")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            applyMyProductsFilters();
        }
    });
    $("review-modal")?.querySelector(".modal-content")?.addEventListener("click", (event) => event.stopPropagation());
    $("report-modal")?.querySelector(".modal-content")?.addEventListener("click", (event) => event.stopPropagation());
    $("report-reason")?.addEventListener("change", handleReportReasonChange);
    $("product-modal-close")?.addEventListener("click", closeProductModal);
    $("image-viewer-close")?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); closeImageViewer(); });
    $("image-viewer-prev")?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); changeViewerImage(-1); });
    $("image-viewer-next")?.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); changeViewerImage(1); });

    if (loadSession()) {
        await showApp();
        return;
    }

    $("auth-screen")?.classList.remove("hidden");
    $("app-screen")?.classList.add("hidden");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
});

if (typeof switchAuthTab === "function") window.switchAuthTab = switchAuthTab;
if (typeof loginUser === "function") window.loginUser = loginUser;
if (typeof registerNewUser === "function") window.registerNewUser = registerNewUser;
if (typeof loginWithTelegram === "function") window.loginWithTelegram = loginWithTelegram;
if (typeof switchTab === "function") window.switchTab = switchTab;
if (typeof switchCatalogView === "function") window.switchCatalogView = switchCatalogView;
if (typeof switchMyProductsView === "function") window.switchMyProductsView = switchMyProductsView;
if (typeof toggleFilters === "function") window.toggleFilters = toggleFilters;
if (typeof applyMyProductsFilters === "function") window.applyMyProductsFilters = applyMyProductsFilters;
if (typeof loadProducts === "function") window.loadProducts = loadProducts;
if (typeof loadMyProducts === "function") window.loadMyProducts = loadMyProducts;
if (typeof loadCart === "function") window.loadCart = loadCart;
if (typeof toggleIdeasPanel === "function") window.toggleIdeasPanel = toggleIdeasPanel;
if (typeof submitIdea === "function") window.submitIdea = submitIdea;
if (typeof openReportModal === "function") window.openReportModal = openReportModal;
if (typeof handleReportReasonChange === "function") window.handleReportReasonChange = handleReportReasonChange;
if (typeof closeReportModal === "function") window.closeReportModal = closeReportModal;
if (typeof closeReportModalOnBackdrop === "function") window.closeReportModalOnBackdrop = closeReportModalOnBackdrop;
if (typeof submitReport === "function") window.submitReport = submitReport;
if (typeof openProfileReportModal === "function") window.openProfileReportModal = openProfileReportModal;
if (typeof logout === "function") window.logout = logout;
if (typeof saveProfile === "function") window.saveProfile = saveProfile;
if (typeof createProduct === "function") window.createProduct = createProduct;
if (typeof cancelEditProduct === "function") window.cancelEditProduct = cancelEditProduct;
if (typeof handleImagePreview === "function") window.handleImagePreview = handleImagePreview;
if (typeof openProductFilePicker === "function") window.openProductFilePicker = openProductFilePicker;
if (typeof removeProductPhoto === "function") window.removeProductPhoto = removeProductPhoto;
if (typeof closeProductModal === "function") window.closeProductModal = closeProductModal;
if (typeof closeProductModalOnBackdrop === "function") window.closeProductModalOnBackdrop = closeProductModalOnBackdrop;
if (typeof openProductModal === "function") window.openProductModal = openProductModal;
if (typeof deleteProduct === "function") window.deleteProduct = deleteProduct;
if (typeof addToCart === "function") window.addToCart = addToCart;
if (typeof removeFromCart === "function") window.removeFromCart = removeFromCart;
if (typeof contactSeller === "function") window.contactSeller = contactSeller;
if (typeof buyProduct === "function") window.buyProduct = buyProduct;
if (typeof buyAllFromCart === "function") window.buyAllFromCart = buyAllFromCart;
if (typeof toggleFavorite === "function") window.toggleFavorite = toggleFavorite;
if (typeof startEditProduct === "function") window.startEditProduct = startEditProduct;
if (typeof toggleProfileEdit === "function") window.toggleProfileEdit = toggleProfileEdit;
if (typeof toggleVerificationPanel === "function") window.toggleVerificationPanel = toggleVerificationPanel;
if (typeof openVerificationForm === "function") window.openVerificationForm = openVerificationForm;
if (typeof closeVerificationModal === "function") window.closeVerificationModal = closeVerificationModal;
if (typeof closeVerificationModalOnBackdrop === "function") window.closeVerificationModalOnBackdrop = closeVerificationModalOnBackdrop;
if (typeof updateVerificationFileLabels === "function") window.updateVerificationFileLabels = updateVerificationFileLabels;
if (typeof submitVerification === "function") window.submitVerification = submitVerification;
if (typeof togglePurchaseHistory === "function") window.togglePurchaseHistory = togglePurchaseHistory;
if (typeof toggleMyReviews === "function") window.toggleMyReviews = toggleMyReviews;
if (typeof toggleStatsPanel === "function") window.toggleStatsPanel = toggleStatsPanel;
if (typeof toggleAdminPanel === "function") window.toggleAdminPanel = toggleAdminPanel;
if (typeof switchAdminTab === "function") window.switchAdminTab = switchAdminTab;
if (typeof loadAdminUsers === "function") window.loadAdminUsers = loadAdminUsers;
if (typeof loadAdminProducts === "function") window.loadAdminProducts = loadAdminProducts;
if (typeof adminBanUser === "function") window.adminBanUser = adminBanUser;
if (typeof adminUnbanUser === "function") window.adminUnbanUser = adminUnbanUser;
if (typeof adminMakeAdmin === "function") window.adminMakeAdmin = adminMakeAdmin;
if (typeof adminRemoveAdmin === "function") window.adminRemoveAdmin = adminRemoveAdmin;
if (typeof adminArchiveProduct === "function") window.adminArchiveProduct = adminArchiveProduct;
if (typeof cancelPurchaseRequest === "function") window.cancelPurchaseRequest = cancelPurchaseRequest;
if (typeof confirmBuyerReceipt === "function") window.confirmBuyerReceipt = confirmBuyerReceipt;
if (typeof reportMissingProduct === "function") window.reportMissingProduct = reportMissingProduct;
if (typeof reportBuyerDelay === "function") window.reportBuyerDelay = reportBuyerDelay;
if (typeof openReviewModal === "function") window.openReviewModal = openReviewModal;
if (typeof closeReviewModal === "function") window.closeReviewModal = closeReviewModal;
if (typeof submitReview === "function") window.submitReview = submitReview;
if (typeof adminRestoreProduct === "function") window.adminRestoreProduct = adminRestoreProduct;
if (typeof updateSuggestionStatus === "function") window.updateSuggestionStatus = updateSuggestionStatus;
if (typeof updateReportStatus === "function") window.updateReportStatus = updateReportStatus;
if (typeof resolveOrderReport === "function") window.resolveOrderReport = resolveOrderReport;
if (typeof loadAdminVerifications === "function") window.loadAdminVerifications = loadAdminVerifications;
if (typeof openVerificationDocument === "function") window.openVerificationDocument = openVerificationDocument;
if (typeof adminResolveVerification === "function") window.adminResolveVerification = adminResolveVerification;
if (typeof adminDeleteProduct === "function") window.adminDeleteProduct = adminDeleteProduct;
if (typeof openUserProfile === "function") window.openUserProfile = openUserProfile;
if (typeof loadSellerReviews === "function") window.loadSellerReviews = loadSellerReviews;
if (typeof toggleSellerSection === "function") window.toggleSellerSection = toggleSellerSection;
if (typeof toggleSellerSection === "function") window.toggleSellerSection = toggleSellerSection;
if (typeof closeUserProfileModal === "function") window.closeUserProfileModal = closeUserProfileModal;
if (typeof closeUserProfileOnBackdrop === "function") window.closeUserProfileOnBackdrop = closeUserProfileOnBackdrop;
if (typeof setModalImage === "function") window.setModalImage = setModalImage;
if (typeof handlePurchaseRequest === "function") window.handlePurchaseRequest = handlePurchaseRequest;
if (typeof toggleCategoryPicker === "function") window.toggleCategoryPicker = toggleCategoryPicker;
if (typeof updateAvatarFileLabel === "function") window.updateAvatarFileLabel = updateAvatarFileLabel;

const reviewModalEl = $("review-modal");
const reportModalEl = $("report-modal");
const productModalEl = $("product-modal");
reviewModalEl?.querySelector(".modal-content")?.addEventListener("pointerdown", (event) => { event.stopPropagation(); }, true);
reviewModalEl?.querySelector(".modal-content")?.addEventListener("click", (event) => { event.stopPropagation(); }, true);
reportModalEl?.querySelector(".modal-content")?.addEventListener("pointerdown", (event) => { event.stopPropagation(); }, true);
reportModalEl?.querySelector(".modal-content")?.addEventListener("click", (event) => { event.stopPropagation(); }, true);
reviewModalEl?.addEventListener("click", (event) => {
    if (event.target !== reviewModalEl) return;
    if (reviewModalIgnoreBackdropClick) return;
    if (Date.now() - reviewModalOpenedAt < MODAL_BACKDROP_GUARD_MS) return;
    closeReviewModal(event);
}, true);
reportModalEl?.addEventListener("click", (event) => {
    if (event.target !== reportModalEl) return;
    if (reportModalIgnoreBackdropClick) return;
    if (Date.now() - reportModalOpenedAt < MODAL_BACKDROP_GUARD_MS) return;
    closeReportModal(event);
}, true);


function handleProductModalDelegatedClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (!action) return;

    if (actionEl.closest('#product-modal')) {
        event.preventDefault();
        event.stopPropagation();

        if (action === 'set-modal-image') {
            setModalImage(Number(actionEl.dataset.imageIndex || 0));
            return;
        }
        if (action === 'open-image-viewer') {
            openImageViewer(Number(actionEl.dataset.imageIndex || currentModalImageIndex || 0));
            return;
        }
        if (action === 'open-seller-profile') {
            const sellerId = Number(actionEl.dataset.sellerId || 0);
            if (sellerId) openUserProfile(sellerId);
            return;
        }
        if (action === 'buy-product') {
            const productId = Number(actionEl.dataset.productId || 0);
            if (productId) buyProduct(productId);
            return;
        }
        if (action === 'go-cart') {
            switchTab('cart');
            return;
        }
        if (action === 'own-product-info') {
            showAlert(tr('Це ваше оголошення', 'This is your listing'));
            return;
        }
        if (action === 'contact-seller') {
            const link = actionEl.dataset.sellerLink;
            if (link) window.open(link, '_blank');
            return;
        }
    }

    if (action === 'toggle-favorite') {
        event.preventDefault();
        event.stopPropagation();
        const productId = Number(actionEl.dataset.productId || actionEl.dataset.favoriteId || 0);
        const isFavorite = String(actionEl.dataset.isFavorite || '').toLowerCase() === 'true';
        if (productId) toggleFavorite(productId, isFavorite);
        return;
    }

    if (action === 'open-report') {
        event.preventDefault();
        event.stopPropagation();
        safeOpenReport(Number(actionEl.dataset.productId || 0), actionEl.dataset.productTitle || '', event);
        return;
    }
    if (action === 'open-review') {
        event.preventDefault();
        event.stopPropagation();
        safeOpenReview(Number(actionEl.dataset.orderId || 0), Number(actionEl.dataset.sellerId || 0), event);
        return;
    }
    if (action === 'close-report') {
        event.preventDefault();
        event.stopPropagation();
        closeReportModal(event);
        return;
    }
    if (action === 'close-review') {
        event.preventDefault();
        event.stopPropagation();
        closeReviewModal(event);
        return;
    }
    if (action === 'submit-report') {
        event.preventDefault();
        event.stopPropagation();
        submitReport();
        return;
    }
    if (action === 'submit-review') {
        event.preventDefault();
        event.stopPropagation();
        submitReview();
        return;
    }
}

document.addEventListener('click', handleProductModalDelegatedClick, true);

initApp();


if (typeof changeLanguage === "function") window.changeLanguage = changeLanguage;

if (typeof searchSeller === "function") window.searchSeller = searchSeller;
if (typeof toggleNotificationsPanel === "function") window.toggleNotificationsPanel = toggleNotificationsPanel;
if (typeof setProductCategory === "function") window.setProductCategory = setProductCategory;
if (typeof setProductCondition === "function") window.setProductCondition = setProductCondition;
if (typeof setQuickCity === "function") window.setQuickCity = setQuickCity;


if (typeof openImageViewer === "function") window.openImageViewer = openImageViewer;
if (typeof closeImageViewer === "function") window.closeImageViewer = closeImageViewer;
if (typeof closeImageViewerOnBackdrop === "function") window.closeImageViewerOnBackdrop = closeImageViewerOnBackdrop;
if (typeof changeViewerImage === "function") window.changeViewerImage = changeViewerImage;

if (typeof toggleCatalogSearchPanel === "function") window.toggleCatalogSearchPanel = toggleCatalogSearchPanel;
