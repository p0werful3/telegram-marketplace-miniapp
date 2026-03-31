const API_BASE = "https://telegram-marketplace-api.onrender.com";

const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";
const FRONTEND_VERSION = "321";

let tg = null;
let telegramUser = null;
let currentUser = null;
let isLoading = false;
let myProductsView = "active";
let catalogView = "all";
let currentModalImageIndex = 0;
let currentModalImages = [];
let filtersOpen = false;
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
let currentLanguage = localStorage.getItem(APP_LANG_KEY) || "uk";

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
    ru: {
        authLoginTitle: "Войдите или зарегистрируйтесь",
        authLoginTab: "Вход",
        authRegisterTab: "Регистрация",
        loginBtn: "Войти",
        registerBtn: "Зарегистрироваться",
        authDivider: "или",
        rememberTitle: "Запомнить аккаунт",
        rememberSubtitle: "Сохранить вход на этом устройстве",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        fullNamePlaceholder: "Имя",
        tgLogin: "Войти через Telegram",
        tgHintReady: "Быстрый вход через ваш Telegram аккаунт",
        tgHintUnavailable: "Кнопка Telegram временно скрыта — используйте обычный вход",
        appMini: "Маркетплейс в Telegram",
        catalogTitle: "Каталог товаров",
        refresh: "Обновить",
        catalogTab: "Каталог",
        favoritesTab: "Избранное",
        searchPlaceholder: "Поиск товаров...",
        filters: "Фильтры",
        searchBtn: "Искать",
        myProductsTitle: "Мои объявления",
        activeTab: "Активные",
        requestsTab: "Запросы на продажу",
        soldTab: "Проданные",
        archivedTab: "Архив",
        createTitle: "Создать объявление",
        cancelEdit: "Отменить редактирование",
        cartTitle: "Корзина",
        buyAll: "Купить всё",
        profileTitle: "Профиль",
        profileSettings: "Настройки профиля",
        stats: "Статистика", hideStats: "Скрыть статистику",
        purchases: "История покупок", hidePurchases: "Скрыть историю покупок",
        reviews: "Мои отзывы",
        admin: "Админ панель", hideAdmin: "Скрыть админ панель",
        ideas: "Идеи и пожелания", hideIdeas: "Скрыть идеи и пожелания",
        logout: "Сменить аккаунт / Выйти",
        navCatalog: "Каталог", navMine: "Мои", navCart: "Корзина", navProfile: "Профиль",
        rating: "Рейтинг",
        status: "Статус",
        tgOnly: "Работает только внутри Telegram Mini App",
        loading: "Загрузка...",
        noReviews: "У вас пока нет отзывов",
        noSellerReviews: "Отзывов пока нет",
        noComment: "Без комментария",
        buyer: "Покупатель",
        dealAmount: "Сумма сделки",
        item: "Объявление",
        authorProfile: "Профиль автора",
        archivedState: "В архиве",
        restoreBtn: "Вернуть в каталог",
        ratingReviews: "отзывов",
        authLangTitle: "Язык интерфейса",
        superadmin: "Суперадмин",
        protectedAdmin: "Защищённый аккаунт"
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

function syncBodyScrollLock() {
    const hasOpenModal = ["product-modal", "image-viewer-modal", "review-modal", "report-modal", "user-profile-modal"].some((id) => {
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
    setText('.topbar-mini', t('appMini'));
    setText('#tab-catalog .section-header h2', t('catalogTitle'));
    setText('#tab-catalog .catalog-subtabs #catalog-all-btn', t('catalogTab'));
    setText('#tab-catalog .catalog-subtabs #catalog-favorites-btn', t('favoritesTab'));
    const searchInput = $('search-input'); if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    const filtersBtn = $('filters-toggle-btn'); if (filtersBtn && !filtersOpen) filtersBtn.textContent = t('filters');
    const catBtns = document.querySelectorAll('#tab-catalog .section-btn'); if (catBtns[0]) catBtns[0].textContent = t('refresh'); if (catBtns[2]) catBtns[2].textContent = t('searchBtn');
    setText('#tab-my-products .section-header h2', t('myProductsTitle'));
    const mpBtns = document.querySelectorAll('#tab-my-products .subtab-btn'); if (mpBtns[0]) mpBtns[0].textContent = t('activeTab'); if (mpBtns[1]) mpBtns[1].textContent = t('requestsTab'); if (mpBtns[2]) mpBtns[2].textContent = t('soldTab'); if (mpBtns[3]) mpBtns[3].textContent = t('archivedTab');
    setText('#tab-create .section-header h2', t('createTitle'));
    const cancelEditBtn = $('cancel-edit-btn'); if (cancelEditBtn) cancelEditBtn.textContent = t('cancelEdit');
    setText('#tab-cart .section-header h2', t('cartTitle')); const cartRefresh = document.querySelector('#tab-cart .section-btn'); if (cartRefresh) cartRefresh.textContent = t('refresh');
    const buyAllBtn = $('buy-all-btn'); if (buyAllBtn) buyAllBtn.textContent = t('buyAll');
    setText('#tab-profile > h2', t('profileTitle')); setText('#profile-edit-wrap h3', t('profileSettings'));
    const createLabels = document.querySelectorAll('#tab-create label');
    if (createLabels[0]) createLabels[0].textContent = currentLanguage === 'en' ? 'Product title' : currentLanguage === 'ru' ? 'Название товара' : 'Назва товару';
    if (createLabels[1]) createLabels[1].textContent = currentLanguage === 'en' ? 'Description' : currentLanguage === 'ru' ? 'Описание' : 'Опис';
    if (createLabels[2]) createLabels[2].textContent = currentLanguage === 'en' ? 'Price' : currentLanguage === 'ru' ? 'Цена' : 'Ціна';
    if (createLabels[3]) createLabels[3].textContent = currentLanguage === 'en' ? 'Category' : currentLanguage === 'ru' ? 'Категория' : 'Категорія';
    if (createLabels[4]) createLabels[4].textContent = currentLanguage === 'en' ? 'Condition' : currentLanguage === 'ru' ? 'Состояние' : 'Стан товару';
    if (createLabels[5]) createLabels[5].textContent = currentLanguage === 'en' ? 'City' : currentLanguage === 'ru' ? 'Город' : 'Місто';
    if (createLabels[6]) createLabels[6].textContent = currentLanguage === 'en' ? 'Product photos (multiple allowed)' : currentLanguage === 'ru' ? 'Фото товара (можно несколько)' : 'Фото товару (можна кілька)';
    const submitBtn = $('submit-product-btn'); if (submitBtn) submitBtn.textContent = currentLanguage === 'en' ? 'Create listing' : currentLanguage === 'ru' ? 'Создать объявление' : 'Створити оголошення';
    const editHint = $('edit-photos-hint'); if (editHint) editHint.textContent = currentLanguage === 'en' ? 'If you choose new photos, old ones will be replaced.' : currentLanguage === 'ru' ? 'Если выберете новые фото, старые будут заменены.' : 'Якщо вибереш нові фото, старі буде замінено.';
    const statusLabel = document.querySelectorAll('.profile-mini-label')[1]; if (statusLabel) statusLabel.textContent = t('status');
    refreshTelegramLoginUi();
}


function changeLanguage(lang) {
    currentLanguage = ['uk','ru','en'].includes(lang) ? lang : 'uk';
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
        if (diffMin < 1) return "щойно";
        if (diffMin < 60) return `${diffMin} хв тому`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours} год тому`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return "вчора";
        if (diffDays < 30) return `${diffDays} дн. тому`;
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
    if (!count) return "Новий продавець";
    return `⭐ ${getUserAverageRating(user)} · ${count} відгук${count > 1 ? 'ів' : ''}`;
}

function getSellerBadgeText(soldProducts = 0, reviewCount = 0) {
    const sold = Number(soldProducts || 0);
    const reviews = Number(reviewCount || 0);
    if (sold >= 10) return "Топ продавець";
    if (sold >= 3 && reviews >= 3) return "Надійний продавець";
    return "Новий продавець";
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
    if (status === "done") return "Виконано";
    if (status === "review") return "На розгляді";
    return "Нова";
}

function renderCartTotals(totalsByCurrency = {}) {
    const parts = Object.entries(totalsByCurrency)
        .filter(([, value]) => Number(value) > 0)
        .map(([currency, value]) => formatPrice(value, currency));
    return parts.length ? `Разом: ${parts.join(" / ")}` : "Разом: 0$";
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
    const text = String(message || "Сталася помилка");
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

    filtersOpen = forceState === null ? !filtersOpen : Boolean(forceState);

    filtersWrap.classList.toggle("hidden", !filtersOpen);
    toggleBtn.textContent = filtersOpen ? "Сховати фільтри" : "Фільтри";
    toggleBtn.classList.toggle("active", filtersOpen);
}

function fillProfile() {
    if (!currentUser) return;

    const usernameEl = $("profile-username");
    const fullnameEl = $("profile-fullname");
    const avatarEl = $("profile-avatar");

    if (usernameEl) usernameEl.textContent = currentUser.username ? `@${currentUser.username}` : "—";
    if (fullnameEl) fullnameEl.textContent = currentUser.full_name || currentUser.username || "Без імені";
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
    if ($("profile-rating-badge")) {
        $("profile-rating-badge").textContent = getUserRatingLabel(currentUser);
    }
    if ($("profile-rating-value")) {
        $("profile-rating-value").textContent = Number(currentUser.rating_count || 0) > 0 ? `${getUserAverageRating(currentUser)}` : "—";
    }
    if ($("profile-rating-count")) {
        $("profile-rating-count").textContent = `${Number(currentUser.rating_count || 0)} відгуків`;
    }
    if ($("profile-register-date")) {
        $("profile-register-date").textContent = formatDate(currentUser.created_at) || "—";
    }
    if ($("profile-status-value")) {
        $("profile-status-value").textContent = getSellerBadgeText(currentUser.sold_products || 0, currentUser.rating_count || 0);
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
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Не вдалося завантажити відгуки")}</div>`;
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
    document.querySelectorAll(".tab-section").forEach(section => section.classList.remove("active"));
    $(`tab-${tabName}`)?.classList.add("active");

    if (btn) {
        document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));
        btn.classList.add("active");
    } else {
        setActiveNavButton(tabName);
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
    if (status === "approved") return "Підтверджено";
    if (status === "rejected") return "Відхилено";
    if (status === "cancelled") return "Скасовано";
    return "Очікує підтвердження";
}

async function saveProfile() {
    if (!currentUser || isLoading) return;

    const username = $("profile-edit-username")?.value.trim();
    const full_name = $("profile-edit-fullname")?.value.trim();
    const password = $("profile-edit-password")?.value.trim();
    const avatarFile = $("profile-avatar-file")?.files?.[0] || null;

    if (!username) {
        showAlert("Введи тег / username");
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
        showAlert("Профіль оновлено");
    } catch (error) {
        showAlert(error.message || "Не вдалося оновити профіль");
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

    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const items = await safeFetch(`${API_BASE}/users/${currentUser.id}/purchases`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">Історія покупок поки порожня</div>`;
            return;
        }

        list.innerHTML = items.map(item => `
            <div class="card history-card compact-history-card">
                ${isValidUrl(item.product_image_url) ? `<img class="history-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title)}">` : ``}
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status || "pending")}">${orderStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.product_title || "Товар")}</h3>
                    <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                    <div class="history-meta">
                        ${item.seller_username ? `<div>Продавець: @${escapeHtml(item.seller_username)}</div>` : ``}
                        ${item.seller_full_name ? `<div>Ім'я продавця: ${escapeHtml(item.seller_full_name)}</div>` : ``}
                        <div>Дата: ${formatDate(item.created_at) || "—"}</div>
                    </div>
                    <div class="card-actions inline-actions compact-actions">
                        ${item.status === "pending" ? `<button type="button" class="ghost-warning-btn" onclick="event.stopPropagation(); cancelPurchaseRequest(${Number(item.order_id)})">Скасувати запит</button>` : ""}
                        ${item.can_review ? `<button type="button" class="approve-btn review-open-btn" data-order-id="${Number(item.order_id)}" data-seller-id="${Number(item.seller_id || 0)}">Залишити відгук</button>` : ""}
                        ${item.review_rating ? `<button class="secondary-btn" disabled>Оцінка: ${Number(item.review_rating)}/5</button>` : ""}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
    }
}

let reviewOrderId = null;
let reviewSellerId = null;
let selectedReportReason = "Шахрайство";
let reviewModalOpenedAt = 0;
let reportModalOpenedAt = 0;

async function cancelPurchaseRequest(orderId) {
    if (!currentUser || isLoading) return;
    if (!confirm("Скасувати цей запит на покупку?")) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/orders/${orderId}/cancel?buyer_id=${currentUser.id}`, { method: "DELETE" });
        showAlert("Запит скасовано");
        await loadPurchaseHistory();
        await loadStats();
    } catch (error) {
        showAlert(error.message || "Не вдалося скасувати запит");
    } finally {
        setLoading(false);
    }
}

function openReviewModal(orderId, sellerId, event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    reviewOrderId = orderId;
    reviewSellerId = sellerId;
    if ($("review-rating")) $("review-rating").value = "5";
    if ($("review-comment")) $("review-comment").value = "";
    setTimeout(() => {
        $("review-modal")?.classList.remove("hidden");
        reviewModalOpenedAt = Date.now();
        syncBodyScrollLock();
    }, 0);
}

function closeReviewModal(event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    $("review-modal")?.classList.add("hidden");
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
        showAlert("Відгук збережено");
        await refreshCurrentUserFromApi();
        fillProfile();
        await loadPurchaseHistory();
    } catch (error) {
        showAlert(error.message || "Не вдалося залишити відгук");
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
    if (label) label.textContent = value || "Оберіть категорію";
}

function updateAvatarFileLabel(event) {
    const file = event?.target?.files?.[0] || null;
    const label = $("profile-avatar-file-name");
    if (label) label.textContent = file ? file.name : "Файл не вибрано";
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
            ? `Обрано фото: ${list.length}/10. Перше фото буде обкладинкою.`
            : "Фото не вибрано. Можна додати до 10 фото.";
    }

    if (title) {
        title.textContent = list.length
            ? `Додано фото: ${list.length}/10`
            : "Додати фото товару";
    }

    if (subtitle) {
        subtitle.textContent = list.length
            ? "Можна додавати фото по одному або кілька одразу. Перше фото стане головним у каталозі."
            : "До 10 фото. Можна додавати по одному. Перше фото буде головним у каталозі.";
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
                ${index === 0 ? '<div class="preview-cover-badge">Обкладинка</div>' : ''}
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

function resetCreateForm() {
    editingProductId = null;
    editingExistingImages = [];
    selectedProductFiles = [];
    if ($("create-form-title")) $("create-form-title").textContent = "Створити оголошення";
    if ($("submit-product-btn")) $("submit-product-btn").textContent = "Створити оголошення";
    $("cancel-edit-btn")?.classList.add("hidden");
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
            ${index === 0 ? '<div class="preview-cover-badge">Обкладинка</div>' : ''}
        </div>
    `).join("");
}

async function startEditProduct(productId) {
    if (!currentUser) return;
    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}?current_user_id=${currentUser.id}`);
        if (Number(product.seller_id) !== Number(currentUser.id)) {
            showAlert("Це не ваше оголошення");
            return;
        }
        editingProductId = product.id;
        editingExistingImages = Array.isArray(product.image_urls) ? product.image_urls.slice() : [];
        selectedProductFiles = [];
        $("create-form-title").textContent = "Редагувати оголошення";
        $("submit-product-btn").textContent = "Зберегти зміни";
        $("cancel-edit-btn")?.classList.remove("hidden");
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
        if ($("image-status")) $("image-status").textContent = editingExistingImages.length ? `Зараз фото: ${editingExistingImages.length}` : "Фото не вибрано";
        switchTab("create");
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        showAlert(error.message || "Не вдалося завантажити оголошення");
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

    const invalid = newFiles.find(file => !file.type.startsWith("image/"));
    if (invalid) {
        showAlert("Оберіть лише зображення");
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
        showAlert("Можна додати максимум 10 фото");
        if (input) input.value = "";
        return;
    }

    selectedProductFiles = merged;
    if (input) input.value = "";
    renderSelectedProductFiles();
}

async function uploadImageToCloudinary(file) {
    if (!file) {
        throw new Error("Файл не вибрано");
    }

    if (!CLOUDINARY_CLOUD_NAME) {
        throw new Error("Не налаштовано CLOUDINARY_CLOUD_NAME");
    }

    if (!CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Не налаштовано CLOUDINARY_UPLOAD_PRESET");
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
        throw new Error("Не вдалося підключитися до Cloudinary");
    }

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        console.error("Cloudinary JSON parse error:", error);
        throw new Error("Cloudinary повернув некоректну відповідь");
    }

    if (!response.ok) {
        console.error("Cloudinary error response:", data);
        throw new Error(data?.error?.message || `Cloudinary error ${response.status}`);
    }

    if (!data?.secure_url) {
        console.error("Cloudinary missing secure_url:", data);
        throw new Error("Cloudinary не повернув URL зображення");
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
        throw new Error("Не вдалося підключитися до API");
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
        showAlert("Заповни username, ім'я і password");
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

        showAlert("Реєстрація успішна");
        await showApp();
    } catch (error) {
        showAlert(error.message || "Помилка реєстрації");
    } finally {
        setLoading(false);
    }
}

async function loginUser() {
    if (isLoading) return;

    const username = $("login-username")?.value.trim();
    const password = $("login-password")?.value.trim();

    if (!username || !password) {
        showAlert("Введи username і password");
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

        showAlert("Вхід успішний");
        await showApp();
    } catch (error) {
        showAlert(error.message || "Помилка входу");
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
            ? "Telegram-вхід недоступний у поточному запуску Mini App. Залишив звичайний вхід, а кнопку Telegram тимчасово сховав."
            : "Відкрийте застосунок саме через кнопку бота в Telegram Mini App");
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

        showAlert("Вхід через Telegram успішний");
        await showApp();
    } catch (error) {
        showAlert(error.message || "Не вдалося увійти через Telegram");
    } finally {
        setLoading(false);
    }
}



function contactSeller(username) {
    const clean = String(username || "").replace(/^@+/, "").trim();
    if (!clean) {
        showAlert("Не вдалося знайти продавця");
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
        product.category || "Без категорії",
        product.condition || "Новий",
        product.city || "Без міста"
    ];

    if (product.status === "sold") tags.push("Продано");
    if (product.status === "archived") tags.push("Архів");

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
            <div class="card-image card-image-placeholder catalog-media-placeholder">Фото відсутнє</div>
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
            title="Обране"
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
                    <span class="tag">${escapeHtml(product.city || "Без міста")}</span>
                    <span class="tag ${getConditionTagClass(product.condition)}">${escapeHtml(product.condition || "Новий")}</span>
                    <span class="tag soft-tag">${escapeHtml(relativeTime || formatDate(product.created_at) || "")}</span>
                </div>
                <div class="compact-secondary-row catalog-secondary-row">
                    <span class="muted-meta">👁 ${views}</span>
                    ${sellerRating ? `<span class="muted-meta">⭐ ${escapeHtml(String(sellerRating))}</span>` : ``}
                    ${product.seller_username ? `<span class="muted-meta">@${escapeHtml(product.seller_username)}</span>` : ``}
                </div>
                <p class="card-description compact-desc catalog-desc">${escapeHtml(product.description || "")}</p>
                <div class="card-actions compact-actions compact-actions-grid catalog-actions-row">
                    ${product.seller_username ? `<button class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(product.seller_id)})">Профіль продавця</button>` : ""}
                    ${isOwnProduct ? `<button type="button" class="own-product-btn" onclick="event.preventDefault(); event.stopPropagation(); showAlert('Це ваше оголошення')">Ваш товар</button>` : `<button type="button" class="buy-btn ${product.is_in_cart ? 'cart-added-btn' : ''}" onclick="event.preventDefault(); event.stopPropagation(); ${product.is_in_cart ? "switchTab('cart')" : `addToCart(${Number(product.id)})`}">${product.is_in_cart ? 'У кошику' : 'У кошик'}</button>`}
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
                <button class="edit-btn" onclick="event.stopPropagation(); startEditProduct(${Number(product.id)})">Змінити</button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct(${Number(product.id)})">В архів</button>
            </div>
        `;
    } else if (view === "sold") {
        actionButton = `<button class="sold-btn" disabled>Продано</button>`;
    } else {
        actionButton = `<div class="card-actions inline-actions catalog-actions-row"><button class="archive-btn" disabled>${escapeHtml(t('archivedState'))}</button><button class="approve-btn" onclick="event.stopPropagation(); restoreArchivedProduct(${Number(product.id)})">${escapeHtml(t('restoreBtn'))}</button></div>`;
    }

    const saleInfo = product.sale_info || null;
    const latestRequest = product.latest_request || null;
    const buyerProfileBtn = saleInfo?.buyer_id
        ? `<button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(saleInfo.buyer_id)})">Профіль покупця</button>`
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
                    <span class="tag">${escapeHtml(product.city || "")}</span>
                    <span class="tag ${getConditionTagClass(product.condition)}">${escapeHtml(product.condition || "")}</span>
                    <span class="tag soft-tag">${formatRelativeTime(product.created_at) || formatDate(product.created_at) || ""}</span>
                </div>
                <p class="card-description compact-desc catalog-desc">${escapeHtml(product.description || "")}</p>
                <div class="compact-secondary-row catalog-secondary-row my-product-extra-meta my-product-extra-meta-block">
                    <span class="muted-meta">Створено: ${escapeHtml(formatDate(product.created_at) || "—")}</span>
                    ${view === "sold" ? `<span class="muted-meta">Продано: ${escapeHtml(formatDate(saleInfo?.sold_at) || "—")}</span>` : ""}
                    ${view === "sold" && saleInfo?.buyer_username ? `<span class="muted-meta">Покупець: @${escapeHtml(saleInfo.buyer_username)}</span>` : ""}
                    ${view === "sold" && !saleInfo?.buyer_username && saleInfo?.buyer_full_name ? `<span class="muted-meta">Покупець: ${escapeHtml(saleInfo.buyer_full_name)}</span>` : ""}
                    ${view === "active" && latestRequest?.created_at ? `<span class="muted-meta">Останній запит: ${escapeHtml(formatDate(latestRequest.created_at) || "—")}</span>` : ""}
                    ${view === "active" && latestRequest?.buyer_username ? `<span class="muted-meta">Запит від: @${escapeHtml(latestRequest.buyer_username)}</span>` : ""}
                    ${view === "archived" ? `<span class="muted-meta">Статус: Архів</span>` : ""}
                </div>
                <div class="card-actions compact-actions">${actionButton}</div>
                ${buyerProfileBtn ? `<div class="card-actions compact-actions compact-actions-grid">${buyerProfileBtn}</div>` : ""}
            </div>
        </div>
    `;
}

async function restoreArchivedProduct(productId) {
    if (!currentUser?.id) return;
    try {
        await safeFetch(`${API_BASE}/products/${productId}/restore?user_id=${currentUser.id}`, { method: "POST" });
        showAlert(currentLanguage === 'en' ? 'Listing returned to catalog' : currentLanguage === 'ru' ? 'Объявление возвращено в каталог' : 'Оголошення повернуто в каталог');
        await loadMyProducts();
        await loadProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || 'Не вдалося повернути оголошення');
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
                productsList.innerHTML = `<div class="empty-card">В обраному поки нічого немає</div>`;
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
            productsList.innerHTML = `<div class="empty-card">Нічого не знайдено за цими фільтрами</div>`;
            return;
        }

        productsList.innerHTML = products.map(renderCatalogCard).join("");
    } catch (error) {
        console.error("Load products error:", error);
        productsList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "API недоступне")}</div>`;
    }
}

function buildGallery(images, title) {
    const safeImages = Array.isArray(images) ? images.filter(isValidUrl) : [];
    currentModalImages = safeImages;
    currentModalImageIndex = 0;

    if (!safeImages.length) {
        return `<div class="modal-product-image card-image-placeholder">Фото відсутнє</div>`;
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
    body.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}?current_user_id=${currentUser ? currentUser.id : ""}`);
        const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);
        const views = Number(product.views_count || 0);
        const relativeTime = formatRelativeTime(product.created_at) || formatDate(product.created_at);

        const contactButton = product.seller_telegram_link
            ? `<a class="contact-btn contact-link" href="${escapeHtml(product.seller_telegram_link)}" target="_blank" rel="noopener noreferrer" data-action="contact-seller" data-seller-link="${escapeHtml(product.seller_telegram_link)}">Написати продавцю</a>`
            : "";

        const primaryAction = isOwnProduct
            ? `<button type="button" class="own-product-btn" data-action="own-product-info">Ваш товар</button>`
            : `<button type="button" class="buy-btn ${product.is_in_cart ? 'cart-added-btn' : ''}" data-action="${product.is_in_cart ? 'go-cart' : 'buy-product'}" data-product-id="${Number(product.id)}">${product.is_in_cart ? 'У кошику' : 'Купити'}</button>`;
        const reportButton = !isOwnProduct ? `<button type="button" class="ghost-warning-btn report-open-btn" data-product-id="${Number(product.id)}" data-product-title="${escapeHtml(product.title)}">Поскаржитися</button>` : "";

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
                        <span class="tag soft-tag">👁 ${views} переглядів</span>
                        <span class="tag soft-tag">🕒 ${escapeHtml(relativeTime || '—')}</span>
                        ${product.seller_rating ? `<span class="tag soft-tag">⭐ ${escapeHtml(String(product.seller_rating))}</span>` : ``}
                    </div>
                    <p class="modal-product-description">${escapeHtml(product.description || "")}</p>
                    ${product.seller_username ? `<button type="button" class="seller-link-btn seller-profile-btn seller-profile-btn-modal" data-action="open-seller-profile" data-seller-id="${Number(product.seller_id)}">Профіль продавця</button>` : ""}
                    <div class="card-actions compact-actions compact-actions-grid details-actions">
                        ${primaryAction}
                        ${!isOwnProduct ? contactButton : ""}
                        ${reportButton}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        body.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження товару")}</div>`;
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

    const title = $("product-title")?.value.trim();
    const description = $("product-description")?.value.trim();
    const price = Number($("product-price")?.value);
    const currency = $("product-currency")?.value || "USD";
    const category = $("product-category")?.value;
    const condition = $("product-condition")?.value;
    const city = $("product-city")?.value;
    const files = selectedProductFiles.slice();

    if (!title || !description || !Number.isFinite(price) || price <= 0 || !category || !condition || !city) {
        showAlert("Заповни назву, опис, ціну, категорію, стан і місто");
        return;
    }

    try {
        setLoading(true);

        let imageUrls = editingExistingImages.slice();
        if (files.length) {
            imageUrls = [];
            if ($("image-status")) $("image-status").textContent = `Завантаження фото: 0/${files.length}`;
            for (let i = 0; i < files.length; i += 1) {
                const uploaded = await uploadImageToCloudinary(files[i]);
                imageUrls.push(uploaded);
                if ($("image-status")) $("image-status").textContent = `Завантаження фото: ${i + 1}/${files.length}`;
            }
        }

        if (!imageUrls.length) {
            showAlert("Додай хоча б одне фото товару");
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

        showAlert(isEdit ? "Оголошення оновлено" : "Оголошення створено");
        resetCreateForm();
        switchTab("my-products");
        loadMyProducts();
        loadProducts();
        loadStats();
    } catch (error) {
        showAlert(error.message || "Помилка збереження оголошення");
    } finally {
        setLoading(false);
    }
}

async function loadMyProducts() {
    const list = $("my-products-list");
    const wrap = $("purchase-requests-wrap");
    const requestsList = $("purchase-requests-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    if (wrap) wrap.classList.add("hidden");
    try {
        if (myProductsView === "requests") {
            const [requests, purchases] = await Promise.all([
                safeFetch(`${API_BASE}/users/${currentUser.id}/purchase-requests?status=pending`),
                safeFetch(`${API_BASE}/users/${currentUser.id}/purchases`)
            ]);
            const filteredRequests = filterAndSortMyProducts(Array.isArray(requests) ? requests : [], "requests");
            const filteredPurchases = filterAndSortMyProducts(Array.isArray(purchases) ? purchases : [], "requests");
            updatePendingRequestsBadge(Array.isArray(requests) ? requests.length : 0);
            if (wrap) wrap.classList.remove("hidden");
            if (requestsList) {
                requestsList.innerHTML = filteredRequests.length ? filteredRequests.map(item => `
                    <div class="card request-card">
                        <div class="card-body">
                            <div class="status-pill pending">Очікує відповіді</div>
                            <h3 class="card-title">${escapeHtml(item.product_title)}</h3>
                            <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                            <div class="request-meta">
                                <div>Покупець: ${item.buyer_username ? `@${escapeHtml(item.buyer_username)}` : `ID ${item.buyer_id}`}</div>
                                ${item.buyer_full_name ? `<div>Ім'я: ${escapeHtml(item.buyer_full_name)}</div>` : ""}
                                <div>Дата запиту: ${formatDate(item.created_at) || '—'}</div>
                            </div>
                            <div class="card-actions inline-actions">
                                ${item.buyer_id ? `<button type="button" class="seller-link-btn" onclick="event.preventDefault(); event.stopPropagation(); openUserProfile(${Number(item.buyer_id)})">Профіль покупця</button>` : ""}
                                <button type="button" class="approve-btn" onclick="event.preventDefault(); event.stopPropagation(); handlePurchaseRequest(${Number(item.order_id)}, true)">Підтвердити</button>
                                <button type="button" class="reject-btn" onclick="event.preventDefault(); event.stopPropagation(); handlePurchaseRequest(${Number(item.order_id)}, false)">Відхилити</button>
                            </div>
                        </div>
                    </div>
                `).join("") : `<div class="empty-card">Нових запитів поки немає</div>`;
            }
            list.innerHTML = filteredPurchases.length ? filteredPurchases.map(item => `
                <div class="card history-card compact-history-card">
                    ${isValidUrl(item.product_image_url) ? `<img class="history-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title)}">` : ``}
                    <div class="card-body">
                        <div class="status-pill ${escapeHtml(item.status || 'pending')}">${orderStatusLabel(item.status)}</div>
                        <h3 class="card-title">${escapeHtml(item.product_title || 'Товар')}</h3>
                        <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                        <div class="history-meta">
                            ${item.seller_username ? `<div>Продавець: @${escapeHtml(item.seller_username)}</div>` : ``}
                            <div>Дата: ${formatDate(item.created_at) || '—'}</div>
                        </div>
                    </div>
                </div>
            `).join("") : `<div class="empty-card">Ваші покупки поки порожні</div>`;
            return;
        }
        let url = `${API_BASE}/users/${currentUser.id}/products`;
        if (myProductsView === "sold") url = `${API_BASE}/users/${currentUser.id}/products/sold`;
        if (myProductsView === "archived") url = `${API_BASE}/users/${currentUser.id}/products/archived`;
        const products = await safeFetch(url);
        const filteredProducts = filterAndSortMyProducts(Array.isArray(products) ? products : [], myProductsView);
        if (!filteredProducts.length) {
            list.innerHTML = myProductsView === "active" ? `<div class="empty-card">У вас поки немає активних оголошень</div>` : myProductsView === "sold" ? `<div class="empty-card">У вас поки немає проданих товарів</div>` : `<div class="empty-card">Архів порожній</div>`;
            return;
        }
        list.innerHTML = filteredProducts.map(product => renderMyProductCard(product, myProductsView)).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
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
        showAlert(approve ? "Покупку підтверджено" : "Запит відхилено");
        closeProductModal();
        await loadPurchaseRequests();
        await loadMyProducts();
        await loadProducts();
        await loadCart();
        await loadStats();
    } catch (error) {
        showAlert(error.message || "Не вдалося обробити запит");
    } finally {
        setLoading(false);
    }
}

async function deleteProduct(productId) {
    if (!currentUser || isLoading) return;

    if (!confirm("Перенести оголошення в архів?")) return;

    try {
        setLoading(true);

        await safeFetch(`${API_BASE}/products/${productId}?user_id=${currentUser.id}`, {
            method: "DELETE"
        });

        showAlert("Оголошення перенесено в архів");
        loadMyProducts();
        loadProducts();
        loadCart();
        loadStats();
    } catch (error) {
        showAlert(error.message || "Не вдалося видалити оголошення");
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

        showAlert("Товар додано до кошика");
        loadCart();
        loadStats();
    } catch (error) {
        showAlert(error.message || "Не вдалося додати товар");
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
        showAlert(error.message || "Не вдалося видалити товар з кошика");
    } finally {
        setLoading(false);
    }
}

async function loadCart() {
    const cartList = $("cart-list");
    const cartTotal = $("cart-total");
    const buyAllBtn = $("buy-all-btn");
    if (!cartList || !cartTotal || !currentUser) return;

    cartList.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const data = await safeFetch(`${API_BASE}/cart/${currentUser.id}`);

        if (!data?.items?.length) {
            cartList.innerHTML = `<div class="empty-card">Кошик порожній</div>`;
            cartTotal.textContent = renderCartTotals({});
            if (buyAllBtn) buyAllBtn.disabled = true;
            return;
        }

        if (buyAllBtn) buyAllBtn.disabled = false;
        cartTotal.textContent = renderCartTotals(data.totals_by_currency || {});

        cartList.innerHTML = data.items.map(item => `
            <div class="compact-card cart-compact-card">
                <div class="compact-image-wrap">${isValidUrl(item.image_url) ? `<img class="card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">` : `<div class="card-image card-image-placeholder">Без фото</div>`}</div>
                <div class="compact-info">
                    <div class="compact-top-row">
                        <h3 class="compact-title">${escapeHtml(item.title)}</h3>
                        <div class="compact-price">${formatPrice(item.price, item.currency)}</div>
                    </div>
                    ${item.seller_username ? `<div class="compact-desc cart-seller-line">Продавець: @${escapeHtml(item.seller_username)}</div>` : ""}
                    <div class="card-actions compact-actions cart-card-actions">
                        <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">Купити</button>
                        ${item.seller_username ? `<button class="message-btn" onclick="contactSeller('${escapeHtml(item.seller_username)}')">Написати</button>` : ""}
                        <button class="remove-btn" onclick="removeFromCart(${Number(item.cart_item_id)})">Видалити</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        cartList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
        if (buyAllBtn) buyAllBtn.disabled = true;
    }
}


async function buyAllFromCart() {
    if (!currentUser || isLoading) return;
    if (!confirm("Надіслати запит на покупку для всіх товарів у кошику?")) return;

    try {
        setLoading(true);
        const data = await safeFetch(`${API_BASE}/orders/buy-all?user_id=${currentUser.id}`, { method: "POST" });
        showAlert(`Готово. Запитів створено: ${data?.created ?? 0}`);
        closeProductModal();
        await loadCart();
        await loadProducts();
        await loadMyProducts();
        await loadStats();
    } catch (error) {
        showAlert(error.message || "Не вдалося купити всі товари");
    } finally {
        setLoading(false);
    }
}

async function buyProduct(productId) {
    if (!currentUser || isLoading) return;

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

        showAlert(`Покупку оформлено\n${data?.seller_username ? `@${data.seller_username}` : ""}\n${data?.seller_link || ""}`);

        loadCart();
        loadProducts();
        loadMyProducts();
        loadStats();
    } catch (error) {
        showAlert(error.message || "Помилка покупки");
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
        showAlert(error.message || "Помилка роботи з обраним");
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
            <div class="stat-card"><span class="stat-value">${summary.users ?? 0}</span><span class="stat-label">Користувачі</span></div>
            <div class="stat-card"><span class="stat-value">${summary.banned_users ?? 0}</span><span class="stat-label">Бан</span></div>
            <div class="stat-card"><span class="stat-value">${summary.active_products ?? 0}</span><span class="stat-label">Активні</span></div>
            <div class="stat-card"><span class="stat-value">${summary.orders_pending ?? 0}</span><span class="stat-label">Запити</span></div>
            <div class="stat-card"><span class="stat-value">${summary.suggestions_new ?? 0}</span><span class="stat-label">Ідеї</span></div>
            <div class="stat-card"><span class="stat-value">${summary.reports_new ?? 0}</span><span class="stat-label">Скарги</span></div>
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
    ["users","products","ideas","reports","logs"].forEach(name => {
        $(`admin-${name}-tab`)?.classList.toggle("hidden", name !== tabName);
        $(`admin-${name}-tab-btn`)?.classList.toggle("active", name === tabName);
    });
    if (tabName === "users") loadAdminUsers();
    if (tabName === "products") loadAdminProducts();
    if (tabName === "ideas") loadAdminIdeas();
    if (tabName === "reports") loadAdminReports();
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
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    try {
        const q = $("admin-users-search")?.value.trim() || "";
        const items = await safeFetch(`${API_BASE}/admin/users?current_admin_id=${currentUser.id}&q=${encodeURIComponent(q)}`);
        list.innerHTML = items.length ? items.map(item => `
            <div class="card"><div class="card-body">
                <h3 class="card-title">@${escapeHtml(item.username || "")}</h3>
                <p class="card-seller">${escapeHtml(item.full_name || "Без імені")}</p>
                <div class="request-meta">
                    <div>${currentLanguage === 'en' ? 'Active' : currentLanguage === 'ru' ? 'Активные' : 'Активні'}: ${Number(item.active_products || 0)}</div>
                    <div>${currentLanguage === 'en' ? 'Sold' : currentLanguage === 'ru' ? 'Проданные' : 'Продані'}: ${Number(item.sold_products || 0)}</div>
                    <div>${currentLanguage === 'en' ? 'Status' : currentLanguage === 'ru' ? 'Статус' : 'Статус'}: ${item.is_superadmin ? t('superadmin') : item.is_banned ? (currentLanguage === 'en' ? 'Blocked' : currentLanguage === 'ru' ? 'Заблокирован' : 'Заблокований') : (currentLanguage === 'en' ? 'Active' : currentLanguage === 'ru' ? 'Активный' : 'Активний')}</div>
                </div>
                <div class="card-actions inline-actions admin-grid-3">
                    <button class="secondary-btn" onclick="openUserProfile(${Number(item.id)})">${currentLanguage === 'en' ? 'Profile' : currentLanguage === 'ru' ? 'Профиль' : 'Профіль'}</button>
                    ${item.is_superadmin ? `<button class="secondary-btn" disabled>${escapeHtml(t('protectedAdmin'))}</button>` : item.is_banned ? `<button class="approve-btn" onclick="adminUnbanUser(${Number(item.id)})">${currentLanguage === 'en' ? 'Unban' : currentLanguage === 'ru' ? 'Разбан' : 'Розбан'}</button>` : `<button class="reject-btn" onclick="adminBanUser(${Number(item.id)})">${currentLanguage === 'en' ? 'Ban' : currentLanguage === 'ru' ? 'Бан' : 'Бан'}</button>`}
                    ${item.is_superadmin ? `<button class="secondary-btn" disabled>${escapeHtml(t('superadmin'))}</button>` : item.is_admin ? `<button class="remove-btn" onclick="adminRemoveAdmin(${Number(item.id)})">${currentLanguage === 'en' ? 'Remove admin' : currentLanguage === 'ru' ? 'Снять админа' : 'Зняти адмін'}</button>` : `<button class="buy-btn" onclick="adminMakeAdmin(${Number(item.id)})">${currentLanguage === 'en' ? 'Make admin' : currentLanguage === 'ru' ? 'Дать админа' : 'Дати адмін'}</button>`}
                </div>
            </div></div>
        `).join("") : `<div class="empty-card">Нічого не знайдено</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка")}</div>`;
    }
}

async function adminBanUser(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/ban?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || "Помилка"); }
    finally { setLoading(false); }
}

async function adminUnbanUser(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/unban?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || "Помилка"); }
    finally { setLoading(false); }
}

async function adminMakeAdmin(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/make-admin?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || "Помилка"); }
    finally { setLoading(false); }
}

async function adminRemoveAdmin(userId) {
    if (isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/users/${userId}/remove-admin?current_admin_id=${currentUser.id}`, { method: "POST" });
        await loadAdminSummary();
        await loadAdminUsers();
    } catch (error) { showAlert(error.message || "Помилка"); }
    finally { setLoading(false); }
}

async function loadAdminProducts() {
    if (!currentUser?.id) return;
    const list = $("admin-products-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
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
                    ${reportsCount > 0 ? `<span class="admin-report-badge">Скарг ${reportsCount}</span>` : ``}
                </div>
                <div class="card-body compact-card-body catalog-card-body admin-product-body">
                    <div class="compact-card-top catalog-card-top">
                        <h3 class="card-title compact-title">${escapeHtml(item.title || "")}</h3>
                        <p class="card-price compact-price">${formatPrice(item.price, item.currency)}</p>
                    </div>

                    <div class="compact-meta-row catalog-meta-row">
                        <span class="tag">${escapeHtml(item.city || "Без міста")}</span>
                        <span class="tag ${getConditionTagClass(item.condition)}">${escapeHtml(item.condition || "Новий")}</span>
                        <span class="tag soft-tag admin-status-tag">${escapeHtml(item.status || "")}</span>
                    </div>

                    <div class="compact-secondary-row catalog-secondary-row admin-secondary-row">
                        ${item.seller_username ? `<span class="muted-meta">Продавець: @${escapeHtml(item.seller_username)}</span>` : ``}
                        <span class="muted-meta">👁 ${viewsCount}</span>
                        <span class="muted-meta">❤ ${likesCount}</span>
                        ${reportsCount > 0 ? `<span class="muted-meta admin-danger-text">⚠ ${reportsCount}</span>` : ``}
                    </div>

                    <p class="card-description compact-desc catalog-desc">${escapeHtml(item.description || "")}</p>

                    <div class="compact-secondary-row catalog-secondary-row my-product-extra-meta my-product-extra-meta-block admin-extra-meta">
                        <span class="muted-meta">Створено: ${escapeHtml(createdAt)}</span>
                        ${soldAt ? `<span class="muted-meta">Продано: ${escapeHtml(soldAt)}</span>` : ``}
                        ${buyerUsername ? `<span class="muted-meta">Покупець: @${escapeHtml(buyerUsername)}</span>` : ``}
                    </div>

                    <div class="card-actions compact-actions compact-actions-grid catalog-actions-row admin-actions-grid">
                        <button type="button" class="secondary-btn admin-open-btn" onclick="event.stopPropagation(); openProductModal(${Number(item.id)})">Відкрити</button>
                        ${item.seller_id ? `<button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${Number(item.seller_id)})">Профіль продавця</button>` : ``}
                        ${item.status === "archived"
                            ? `<button type="button" class="approve-btn" onclick="event.stopPropagation(); adminRestoreProduct(${Number(item.id)})">Активувати</button>`
                            : `<button type="button" class="remove-btn" onclick="event.stopPropagation(); adminArchiveProduct(${Number(item.id)})">Архів</button>`}
                        <button type="button" class="reject-btn" onclick="event.stopPropagation(); adminDeleteProduct(${Number(item.id)})">Видалити</button>
                    </div>

                    ${buyerId ? `<div class="card-actions compact-actions compact-actions-grid admin-actions-grid admin-buyer-row">
                        <button type="button" class="seller-link-btn seller-profile-btn" onclick="event.stopPropagation(); openUserProfile(${buyerId})">Профіль покупця</button>
                    </div>` : ``}
                </div>
            </div>`;
        }).join("") : `<div class="empty-card">Нічого не знайдено</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка")}</div>`;
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
    } catch (error) { showAlert(error.message || "Помилка"); }
    finally { setLoading(false); }
}

async function adminRestoreProduct(productId) {
    if (!currentUser || isLoading) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/products/${productId}/restore?current_admin_id=${currentUser.id}`, { method: "POST" });
        showAlert("Оголошення відновлено");
        await loadAdminProducts();
        await loadProducts();
    } catch (error) {
        showAlert(error.message || "Не вдалося відновити оголошення");
    } finally {
        setLoading(false);
    }
}

async function adminDeleteProduct(productId) {
    if (isLoading) return;
    if (!confirm("Видалити оголошення повністю?")) return;
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/admin/products/${productId}?current_admin_id=${currentUser.id}`, { method: "DELETE" });
        await loadAdminSummary();
        await loadAdminProducts();
        await loadProducts();
    } catch (error) { showAlert(error.message || "Помилка"); }
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
        showAlert("Заповни назву та опис ідеї");
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
        showAlert("Ідею надіслано");
        if (currentUser.is_admin) await loadAdminSummary();
    } catch (error) {
        showAlert(error.message || "Не вдалося надіслати ідею");
    } finally {
        setLoading(false);
    }
}

function openReportModal(productId, title = "", event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const modal = $("report-modal");
    if (!modal) return;
    $("report-product-id").value = String(productId || "");
    $("report-title").textContent = title ? `Скарга на: ${title}` : "Скарга на оголошення";
    $("report-reason").value = "Шахрайство";
    $("report-comment").value = "";
    $("report-custom-reason-wrap")?.classList.add("hidden");
    setTimeout(() => {
        modal.classList.remove("hidden");
        reportModalOpenedAt = Date.now();
        syncBodyScrollLock();
    }, 0);
}

function handleReportReasonChange() {
    const reason = $("report-reason")?.value || "Шахрайство";
    $("report-custom-reason-wrap")?.classList.toggle("hidden", reason !== "Інше");
}

function closeReportModal(event = null) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    $("report-modal")?.classList.add("hidden");
    syncBodyScrollLock();
}

function closeReportModalOnBackdrop(event) {
    if (event.target?.id === "report-modal") closeReportModal();
}

async function submitReport() {
    if (!currentUser || isLoading) return;
    const listingId = Number($("report-product-id")?.value || 0);
    let reason = $("report-reason")?.value || "Шахрайство";
    const comment = $("report-comment")?.value.trim() || "";
    if (!listingId) {
        showAlert("Оголошення не знайдено");
        return;
    }
    if (reason === "Інше" && !comment) {
        showAlert("Опиши свою причину скарги");
        return;
    }
    try {
        setLoading(true);
        await safeFetch(`${API_BASE}/reports`, {
            method: "POST",
            body: JSON.stringify({
                reporter_id: currentUser.id,
                listing_id: listingId,
                reason,
                comment: comment || null
            })
        });
        closeReportModal();
        showAlert("Скаргу надіслано");
        if (currentUser.is_admin) await loadAdminSummary();
    } catch (error) {
        showAlert(error.message || "Не вдалося надіслати скаргу");
    } finally {
        setLoading(false);
    }
}

async function loadAdminIdeas() {
    const list = $("admin-ideas-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/suggestions?current_admin_id=${currentUser.id}`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">Ідей поки немає</div>`;
            return;
        }
        list.innerHTML = items.map(item => `
            <div class="card admin-idea-card">
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status)}">${ideaStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <div class="history-meta">
                        <div>Від: @${escapeHtml(item.username || "user")}</div>
                        <div>Дата: ${formatDate(item.created_at)}</div>
                    </div>
                    <p class="card-description">${escapeHtml(item.message || "")}</p>
                    <div class="card-actions compact-actions">
                        ${item.status !== "review" && item.status !== "done" ? `<button class="secondary-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'review')">На розгляді</button>` : ""}
                        ${item.status !== "done" ? `<button class="approve-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'done')">Виконано</button>` : `<button class="approve-btn" disabled>Виконано</button>`}
                        ${item.status !== "new" && item.status !== "done" ? `<button class="ghost-warning-btn" onclick="updateSuggestionStatus(${Number(item.id)}, 'new')">Повернути в нові</button>` : ""}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка")}</div>`;
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
        showAlert(error.message || "Не вдалося оновити статус ідеї");
    } finally {
        setLoading(false);
    }
}

async function loadAdminReports() {
    const list = $("admin-reports-list");
    if (!list || !currentUser) return;
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/reports?current_admin_id=${currentUser.id}`);
        if (!Array.isArray(items) || !items.length) {
            list.innerHTML = `<div class="empty-card">Скарг поки немає</div>`;
            return;
        }
        list.innerHTML = items.map(item => `
            <div class="card admin-idea-card">
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status)}">${ideaStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.listing_title || 'Оголошення')}</h3>
                    <div class="history-meta">
                        <div>Від: @${escapeHtml(item.reporter_username || "user")}</div>
                        <div>Дата: ${formatDate(item.created_at)}</div>
                        <div>Причина: ${escapeHtml(item.reason || "")}</div>
                    </div>
                    ${item.comment ? `<p class="card-description">${escapeHtml(item.comment)}</p>` : ""}
                    <div class="card-actions compact-actions">
                        ${item.status !== "review" && item.status !== "done" ? `<button class="secondary-btn" onclick="updateReportStatus(${Number(item.id)}, 'review')">На розгляді</button>` : ""}
                        ${item.status !== "done" ? `<button class="approve-btn" onclick="updateReportStatus(${Number(item.id)}, 'done')">Виконано</button>` : `<button class="approve-btn" disabled>Виконано</button>`}
                        ${item.status !== "new" && item.status !== "done" ? `<button class="ghost-warning-btn" onclick="updateReportStatus(${Number(item.id)}, 'new')">Повернути в нові</button>` : ""}
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка")}</div>`;
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
        showAlert(error.message || "Не вдалося оновити статус скарги");
    } finally {
        setLoading(false);
    }
}

async function loadAdminLogs() {
    if (!currentUser?.id) return;
    const list = $("admin-logs-list");
    if (!list) return;
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/admin/logs?current_admin_id=${currentUser.id}`);
        list.innerHTML = items.length ? items.map(item => `
            <div class="card"><div class="card-body">
                <div class="status-pill approved">@${escapeHtml(item.admin_username || "admin")}</div>
                <div class="request-meta"><div>${escapeHtml(item.action || "")}</div><div>${formatDate(item.created_at)}</div></div>
            </div></div>`).join("") : `<div class="empty-card">Логи порожні</div>`;
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка")}</div>`;
    }
}

async function searchSeller() {
    const value = $("seller-search-input")?.value?.trim() || "";
    if (!value) {
        showAlert("Введіть username продавця");
        return;
    }
    try {
        const data = await safeFetch(`${API_BASE}/users/search?username=${encodeURIComponent(value)}`);
        await openUserProfile(Number(data.id));
    } catch (error) {
        showAlert(error.message || "Продавця не знайдено");
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
    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;
    try {
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/notifications`);
        updateNotificationsBadge(data.unread_count || 0);
        const items = Array.isArray(data.items) ? data.items : [];
        list.innerHTML = items.length ? items.map(item => {
            const actionBtn = item.related_product_id
                ? `<button class="secondary-btn section-btn" onclick="openProductModal(${Number(item.related_product_id)})">Відкрити товар</button>`
                : `<button class="secondary-btn section-btn" onclick="switchTab('catalog')">До каталогу</button>`;
            return `
                <div class="card notification-card ${item.is_read ? 'is-read' : 'is-unread'}">
                    <div class="card-body">
                        <div class="notification-head">
                            <div class="notification-icon">${item.type === 'order' ? '📦' : '🔔'}</div>
                            <div class="notification-meta">
                                <div class="notification-title-row">
                                    <h3 class="card-title">${escapeHtml(item.title || 'Повідомлення')}</h3>
                                    <span class="status-pill ${item.is_read ? 'approved' : 'pending'}">${item.is_read ? 'Прочитано' : 'Нове'}</span>
                                </div>
                                <div class="notification-date">${formatDate(item.created_at) || '—'}</div>
                            </div>
                        </div>
                        <p class="card-description notification-text">${escapeHtml(item.message || '')}</p>
                        <div class="card-actions compact-actions notification-actions">${actionBtn}</div>
                    </div>
                </div>
            `;
        }).join("") : `<div class="empty-card">Повідомлень поки немає</div>`;
        if (markAsRead && (data.unread_count || 0) > 0) {
            await safeFetch(`${API_BASE}/users/${currentUser.id}/notifications/read-all`, { method: 'POST' });
            updateNotificationsBadge(0);
        }
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || 'Не вдалося завантажити повідомлення')}</div>`;
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
    body.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const profile = await safeFetch(`${API_BASE}/users/${userId}/public-profile?current_user_id=${currentUser ? currentUser.id : ""}`);

        const avatar = profile.avatar_url
            ? `<img class="user-profile-avatar-img" src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.username || "user")}">`
            : `<div class="user-profile-avatar-fallback">${escapeHtml((profile.full_name || profile.username || "U").charAt(0).toUpperCase())}</div>`;

        const listingsHtml = Array.isArray(profile.listings) && profile.listings.length
            ? profile.listings.map(item => renderCatalogCard(item)).join('')
            : `<div class="empty-card">Активних оголошень немає</div>`;

        body.innerHTML = `
            <div class="seller-profile-shell seller-profile-shell-compact">
                <div class="seller-cover seller-cover-compact"></div>
                <div class="seller-profile-card seller-profile-card-compact">
                    <div class="seller-profile-top seller-profile-top-compact">
                        <div class="user-profile-avatar seller-avatar-large seller-avatar-medium">${avatar}</div>
                        <div class="seller-profile-main seller-profile-main-compact">
                            <h3 class="user-profile-name seller-name-compact">${escapeHtml(profile.full_name || "Без імені")}</h3>
                            <div class="user-profile-username">@${escapeHtml(profile.username || "")}</div>
                            <div class="seller-badges seller-badges-compact">
                                <span class="seller-badge accent">${escapeHtml(profile.seller_status || getSellerBadgeText(profile.sold_products, profile.rating_count))}</span>
                                ${profile.rating_count > 0 ? `<span class="seller-badge">⭐ ${escapeHtml(String(profile.rating))} · ${escapeHtml(String(profile.rating_count))}</span>` : ``}
                                ${profile.is_superadmin ? `<span class="seller-badge">${escapeHtml(t('superadmin'))}</span>` : (profile.is_admin ? `<span class="seller-badge">${currentLanguage === 'en' ? 'Administrator' : currentLanguage === 'ru' ? 'Администратор' : 'Адміністратор'}</span>` : ``)}
                            </div>
                            <div class="seller-registered">З нами з ${formatDate(profile.registered_at) || "—"}</div>
                        </div>
                    </div>

                    <div class="seller-stats-grid seller-stats-grid-compact">
                        <div class="seller-stat"><span class="stat-value">${profile.active_products ?? 0}</span><span class="stat-label">Активні</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.sold_products ?? 0}</span><span class="stat-label">Продані</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.bought_products ?? 0}</span><span class="stat-label">Куплені</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.archived_products ?? 0}</span><span class="stat-label">Архів</span></div>
                    </div>

                    <div class="card-actions seller-action-stack seller-action-stack-compact">
                        ${profile.telegram_link
                            ? `<a class="contact-btn contact-link compact-cta-btn" href="${escapeHtml(profile.telegram_link)}" target="_blank" rel="noopener noreferrer">Написати продавцю</a>`
                            : `<button class="own-product-btn compact-cta-btn" disabled>Telegram недоступний</button>`
                        }
                        <button class="secondary-btn full-btn seller-toggle-btn" onclick="toggleSellerSection(${Number(profile.id)}, 'reviews')">Відгуки</button>
                        <button class="secondary-btn full-btn seller-toggle-btn" onclick="toggleSellerSection(${Number(profile.id)}, 'listings')">Усі оголошення продавця</button>
                    </div>

                    <div id="seller-reviews-wrap" class="seller-section-wrap seller-reviews-wrap hidden"></div>
                    <div id="seller-listings-wrap" class="seller-section-wrap seller-listings-wrap hidden"><div class="cards seller-listings-grid compact-seller-listings">${listingsHtml}</div></div>
                </div>
            </div>
        `;
    } catch (error) {
        body.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Не вдалося завантажити профіль")}</div>`;
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
        wrap.innerHTML = `<div class="empty-card">Не вдалося завантажити відгуки</div>`;
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
if (typeof openReviewModal === "function") window.openReviewModal = openReviewModal;
if (typeof closeReviewModal === "function") window.closeReviewModal = closeReviewModal;
if (typeof submitReview === "function") window.submitReview = submitReview;
if (typeof adminRestoreProduct === "function") window.adminRestoreProduct = adminRestoreProduct;
if (typeof updateSuggestionStatus === "function") window.updateSuggestionStatus = updateSuggestionStatus;
if (typeof updateReportStatus === "function") window.updateReportStatus = updateReportStatus;
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
    if (Date.now() - reviewModalOpenedAt < 250) return;
    closeReviewModal(event);
}, true);
reportModalEl?.addEventListener("click", (event) => {
    if (event.target !== reportModalEl) return;
    if (Date.now() - reportModalOpenedAt < 250) return;
    closeReportModal(event);
}, true);

document.addEventListener("pointerdown", (event) => {
    if (event.target.closest('.review-open-btn') || event.target.closest('.report-open-btn')) {
        event.stopPropagation();
    }
}, true);

document.addEventListener("click", (event) => {
    const reviewBtn = event.target.closest(".review-open-btn");
    if (reviewBtn) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        const orderId = Number(reviewBtn.dataset.orderId || 0);
        const sellerId = Number(reviewBtn.dataset.sellerId || 0);
        if (orderId) setTimeout(() => openReviewModal(orderId, sellerId), 0);
        return;
    }

    const reportBtn = event.target.closest(".report-open-btn");
    if (reportBtn) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        const productId = Number(reportBtn.dataset.productId || 0);
        const title = reportBtn.dataset.productTitle || "";
        if (productId) setTimeout(() => openReportModal(productId, title), 0);
        return;
    }
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
            showAlert('Це ваше оголошення');
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
