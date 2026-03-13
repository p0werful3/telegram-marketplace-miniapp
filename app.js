const API_BASE = "https://telegram-marketplace-api.onrender.com";

const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";
const FRONTEND_VERSION = "211";

let tg = null;
let telegramUser = null;
let currentUser = null;
let isLoading = false;
let myProductsView = "active";
let catalogView = "all";
let currentModalImageIndex = 0;
let currentModalImages = [];
let filtersOpen = false;
let editingProductId = null;
let editingExistingImages = [];

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
        tg = window.Telegram?.WebApp || window.parent?.Telegram?.WebApp || null;

        if (tg) {
            tg.ready();
            tg.expand();
            telegramUser = tg.initDataUnsafe?.user || parseTelegramUserFromInitData(tg.initData) || null;
        } else {
            telegramUser = null;
        }
    } catch (error) {
        console.error("Telegram init error:", error);
        tg = null;
        telegramUser = null;
    }
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
        const rating = Number(currentUser.rating_count) > 0 ? `⭐ ${(Number(currentUser.rating_sum || 0) / Number(currentUser.rating_count || 1)).toFixed(1)} · ${currentUser.rating_count} відгук.` : "Новий продавець";
        $("profile-rating-badge").textContent = rating;
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
    btn.textContent = shouldOpen ? "Сховати історію покупок" : "Історія покупок";

    if (shouldOpen) await loadPurchaseHistory();
}

async function showApp() {
    $("auth-screen")?.classList.add("hidden");
    $("app-screen")?.classList.remove("hidden");

    fillProfile();
    toggleProfileEdit(false);
    toggleStatsPanel(false);

    if ($("purchase-history-wrap")) $("purchase-history-wrap").classList.add("hidden");
    if ($("purchase-history-toggle-btn")) $("purchase-history-toggle-btn").textContent = "Історія покупок";
    if ($("admin-panel-body")) $("admin-panel-body").classList.add("hidden");

    resetCreateForm();
    toggleFilters(false);
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
        if ($("purchase-history-toggle-btn")) $("purchase-history-toggle-btn").textContent = "Історія покупок";
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
        const purchasesEl = $("stat-purchases");
        if (purchasesEl) purchasesEl.textContent = data.purchase_history ?? 0;
        const purchasePendingEl = $("stat-purchase-pending");
        if (purchasePendingEl) purchasePendingEl.textContent = data.purchase_pending ?? 0;
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
                        ${item.status === "pending" ? `<button class="ghost-warning-btn" onclick="cancelPurchaseRequest(${Number(item.order_id)})">Скасувати запит</button>` : ""}
                        ${item.can_review ? `<button class="approve-btn" onclick="openReviewModal(${Number(item.order_id)}, ${Number(item.seller_id || 0)})">Залишити відгук</button>` : ""}
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

function openReviewModal(orderId, sellerId) {
    reviewOrderId = orderId;
    reviewSellerId = sellerId;
    if ($("review-rating")) $("review-rating").value = "5";
    if ($("review-comment")) $("review-comment").value = "";
    $("review-modal")?.classList.remove("hidden");
}

function closeReviewModal() {
    $("review-modal")?.classList.add("hidden");
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

function resetCreateForm() {
    editingProductId = null;
    editingExistingImages = [];
    $("create-form-title").textContent = "Створити оголошення";
    $("submit-product-btn").textContent = "Створити оголошення";
    $("cancel-edit-btn")?.classList.add("hidden");
    $("edit-photos-hint")?.classList.add("hidden");
    $("product-title").value = "";
    $("product-description").value = "";
    $("product-price").value = "";
    $("product-currency").value = "USD";
    $("product-category").value = "";
    $("product-condition").value = "";
    $("product-city").value = "";
    $("product-files").value = "";
    $("image-preview-grid").innerHTML = "";
    $("image-preview-wrap").classList.add("hidden");
    $("image-status").textContent = "Фото не вибрано";
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
        <div class="preview-item">
            <img class="preview-thumb" src="${escapeHtml(url)}" alt="preview-${index}">
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
        $("product-files").value = "";
        renderPreviewUrls(editingExistingImages);
        $("image-status").textContent = editingExistingImages.length ? `Зараз фото: ${editingExistingImages.length}` : "Фото не вибрано";
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
    const files = Array.from(event?.target?.files || []);
    const wrap = $("image-preview-wrap");
    const grid = $("image-preview-grid");
    const status = $("image-status");

    if (!files.length) {
        wrap?.classList.add("hidden");
        if (grid) grid.innerHTML = "";
        if (status) status.textContent = "Фото не вибрано";
        return;
    }

    const invalid = files.find(file => !file.type.startsWith("image/"));
    if (invalid) {
        showAlert("Оберіть лише зображення");
        event.target.value = "";
        wrap?.classList.add("hidden");
        if (grid) grid.innerHTML = "";
        if (status) status.textContent = "Фото не вибрано";
        return;
    }

    if (files.length > 10) {
        showAlert("Можна вибрати максимум 10 фото");
        event.target.value = "";
        wrap?.classList.add("hidden");
        if (grid) grid.innerHTML = "";
        if (status) status.textContent = "Фото не вибрано";
        return;
    }

    if (grid) {
        grid.innerHTML = files.map(file => {
            const objectUrl = URL.createObjectURL(file);
            return `<img class="preview-thumb" src="${objectUrl}" alt="preview">`;
        }).join("");
    }

    wrap?.classList.remove("hidden");

    if (status) {
        status.textContent = `Вибрано фото: ${files.length}`;
    }
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
    setTimeout(initTelegramWebApp, 400);

    const tgButton = $("tg-login-btn");
    const remember = $("remember-me");

    if (remember && !localStorage.getItem("remember-me-choice")) {
        remember.checked = true;
    } else if (remember) {
        remember.checked = localStorage.getItem("remember-me-choice") === "1";
    }

    remember?.addEventListener("change", () => {
        localStorage.setItem("remember-me-choice", remember.checked ? "1" : "0");
    });

    if (tgButton) {
        tgButton.textContent = "Увійти через Telegram";
        const canUseTelegramLogin = Boolean(telegramUser || tg?.initData);
        tgButton.disabled = !canUseTelegramLogin;
        tgButton.classList.toggle("tg-ready", canUseTelegramLogin);
        tgButton.classList.toggle("tg-disabled", !canUseTelegramLogin);
    }

    const hint = $("tg-login-hint");
    if (hint) {
        hint.textContent = (telegramUser || tg?.initData)
            ? "Швидкий вхід через ваш Telegram акаунт"
            : "Працює лише всередині Telegram Mini App";
    }
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

        $("register-username").value = "";
        $("register-fullname").value = "";
        $("register-password").value = "";

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
        $("login-password").value = "";

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

    const parsedUser = telegramUser || parseTelegramUserFromInitData(tg?.initData);
    const telegramId = parsedUser?.id || tg?.initDataUnsafe?.user?.id || null;

    if (!telegramId && !tg?.initData) {
        showAlert("Telegram login доступний тільки всередині Telegram Mini App");
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
                init_data: tg?.initData || null
            })
        });

        currentUser = data;
        saveSession(data);

        showAlert("Вхід через Telegram успішний");
        await showApp();
    } catch (error) {
        showAlert(error.message || "Помилка входу через Telegram");
    } finally {
        setLoading(false);
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
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
    `;
}

function renderImageBlock(product) {
    if (Array.isArray(product.image_urls) && product.image_urls.length) {
        return `<img class="card-image" src="${escapeHtml(product.image_urls[0])}" alt="${escapeHtml(product.title)}">`;
    }

    if (isValidUrl(product.image_url)) {
        return `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`;
    }

    return `<div class="card-image card-image-placeholder">Фото відсутнє</div>`;
}

function renderFavoriteButton(product) {
    if (!currentUser) return "";

    const isOwnProduct = Number(product.seller_id) === Number(currentUser.id);
    if (isOwnProduct) return "";

    return `
        <button
            class="favorite-btn ${product.is_favorite ? "active" : ""}"
            onclick="event.stopPropagation(); toggleFavorite(${Number(product.id)}, ${product.is_favorite ? "true" : "false"})"
            title="Обране"
        >
            ${product.is_favorite ? "♥" : "♡"}
        </button>
    `;
}

function renderCatalogCard(product) {
    const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);

    return `
        <div class="card card-clickable compact-list-card" onclick="openProductModal(${Number(product.id)})">
            <div class="compact-thumb-wrap">
                ${renderImageBlock(product)}
                ${renderFavoriteButton(product)}
            </div>
            <div class="card-body compact-card-body">
                <div class="compact-card-top">
                    <h3 class="card-title compact-title">${escapeHtml(product.title)}</h3>
                    <p class="card-price compact-price">${formatPrice(product.price, product.currency)}</p>
                </div>
                <div class="compact-meta-row">
                    <span class="tag">${escapeHtml(product.city || "Без міста")}</span>
                    <span class="tag">${escapeHtml(product.condition || "Новий")}</span>
                    <span class="tag soft-tag">${formatDate(product.created_at) || ""}</span>
                </div>
                <p class="card-description compact-desc">${escapeHtml(product.description || "")}</p>
                <div class="card-actions compact-actions">
                    ${product.seller_username ? `<button class="seller-link-btn" onclick="event.stopPropagation(); openUserProfile(${Number(product.seller_id)})">Профіль</button>` : ""}
                    ${isOwnProduct ? `<button class="own-product-btn" onclick="event.stopPropagation(); showAlert('Це ваше оголошення')">Ваш товар</button>` : `<button class="buy-btn" onclick="event.stopPropagation(); addToCart(${Number(product.id)})">У кошик</button>`}
                </div>
            </div>
        </div>
    `;
}

function renderMyProductCard(product, view) {
    let actionButton = "";

    if (view === "active") {
        actionButton = `
            <div class="card-actions inline-actions">
                <button class="edit-btn" onclick="event.stopPropagation(); startEditProduct(${Number(product.id)})">Змінити</button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct(${Number(product.id)})">В архів</button>
            </div>
        `;
    } else if (view === "sold") {
        actionButton = `<button class="sold-btn" disabled>Продано</button>`;
    } else {
        actionButton = `<button class="archive-btn" disabled>В архіві</button>`;
    }

    return `
        <div class="card card-clickable compact-list-card" onclick="openProductModal(${Number(product.id)})">
            <div class="compact-thumb-wrap">${renderImageBlock(product)}</div>
            <div class="card-body compact-card-body">
                <div class="compact-card-top">
                    <h3 class="card-title compact-title">${escapeHtml(product.title)}</h3>
                    <p class="card-price compact-price">${formatPrice(product.price, product.currency)}</p>
                </div>
                <div class="compact-meta-row">
                    <span class="tag">${escapeHtml(product.city || "")}</span>
                    <span class="tag">${escapeHtml(product.condition || "")}</span>
                    <span class="tag soft-tag">${formatDate(product.created_at) || ""}</span>
                </div>
                <p class="card-description compact-desc">${escapeHtml(product.description || "")}</p>
                <div class="card-actions compact-actions">${actionButton}</div>
            </div>
        </div>
    `;
}

async function loadProducts() {
    const productsList = $("products-list");
    if (!productsList || !currentUser) return;

    productsList.innerHTML = `<div class="empty-card">Завантаження товарів...</div>`;

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
            <img id="modal-main-image" class="modal-product-image" src="${escapeHtml(safeImages[0])}" alt="${escapeHtml(title)}">
            ${
                safeImages.length > 1
                    ? `
                <div class="gallery-thumbs">
                    ${safeImages.map((img, index) => `
                        <img
                            class="gallery-thumb ${index === 0 ? "active" : ""}"
                            src="${escapeHtml(img)}"
                            alt="thumb"
                            onclick="event.stopPropagation(); setModalImage(${index})"
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

async function openProductModal(productId) {
    const modal = $("product-modal");
    const body = $("product-modal-body");

    if (!modal || !body) return;

    modal.classList.remove("hidden");
    body.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}?current_user_id=${currentUser ? currentUser.id : ""}`);
        const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);

        const contactButton = product.seller_telegram_link
            ? `<a class="contact-btn contact-link" href="${escapeHtml(product.seller_telegram_link)}" target="_blank" rel="noopener noreferrer">Написати продавцю</a>`
            : "";

        const primaryAction = isOwnProduct
            ? `<button class="own-product-btn" onclick="showAlert('Це ваше оголошення')">Ваш товар</button>`
            : `<button class="buy-btn" onclick="buyProduct(${Number(product.id)})">Купити</button>`;
        const reportButton = !isOwnProduct ? `<button class="ghost-warning-btn" onclick="openReportModal(${Number(product.id)}, '${escapeHtml(product.title)}')">Поскаржитися</button>` : "";

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
                    <p class="modal-product-description">${escapeHtml(product.description || "")}</p>
                    ${product.seller_username ? `<button class="seller-link-btn" onclick="event.stopPropagation(); openUserProfile(${Number(product.seller_id)})">Профіль продавця</button>` : ""}
                    <div class="card-actions compact-actions">
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
    $("product-modal")?.classList.add("hidden");
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
    const files = $("product-files")?.files || [];

    try {
        setLoading(true);

        let imageUrls = editingExistingImages.slice();
        if (files.length) {
            imageUrls = [];
            $("image-status").textContent = `Завантаження фото: 0/${files.length}`;
            for (let i = 0; i < files.length; i += 1) {
                const uploaded = await uploadImageToCloudinary(files[i]);
                imageUrls.push(uploaded);
                $("image-status").textContent = `Завантаження фото: ${i + 1}/${files.length}`;
            }
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
    if (!list || !currentUser) return;

    list.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        let url = `${API_BASE}/users/${currentUser.id}/products`;

        if (myProductsView === "sold") url = `${API_BASE}/users/${currentUser.id}/products/sold`;
        if (myProductsView === "archived") url = `${API_BASE}/users/${currentUser.id}/products/archived`;

        const products = await safeFetch(url);

        if (!Array.isArray(products) || products.length === 0) {
            await loadPurchaseRequests();
            list.innerHTML =
                myProductsView === "active"
                    ? `<div class="empty-card">У вас поки немає активних оголошень</div>`
                    : myProductsView === "sold"
                      ? `<div class="empty-card">У вас поки немає проданих товарів</div>`
                      : `<div class="empty-card">Архів порожній</div>`;
            return;
        }

        list.innerHTML = products.map(product => renderMyProductCard(product, myProductsView)).join("");
        await loadPurchaseRequests();
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
    }
}

async function loadPurchaseRequests() {
    const wrap = $("purchase-requests-wrap");
    const list = $("purchase-requests-list");
    if (!wrap || !list || !currentUser || myProductsView !== "active") {
        wrap?.classList.add("hidden");
        return;
    }
    try {
        const requests = await safeFetch(`${API_BASE}/users/${currentUser.id}/purchase-requests?status=pending`);
        if (!Array.isArray(requests) || !requests.length) {
            wrap.classList.add("hidden");
            list.innerHTML = "";
            return;
        }
        wrap.classList.remove("hidden");
        list.innerHTML = requests.map(item => `
            <div class="card request-card">
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.product_title)}</h3>
                    <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                    <div class="request-meta">
                        <div>Покупець: ${item.buyer_username ? `@${escapeHtml(item.buyer_username)}` : `ID ${item.buyer_id}`}</div>
                        ${item.buyer_full_name ? `<div>Ім'я: ${escapeHtml(item.buyer_full_name)}</div>` : ""}
                    </div>
                    <div class="card-actions inline-actions">
                        <button class="approve-btn" onclick="handlePurchaseRequest(${Number(item.order_id)}, true)">Так</button>
                        <button class="reject-btn" onclick="handlePurchaseRequest(${Number(item.order_id)}, false)">Ні</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        wrap.classList.add("hidden");
    }
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
    btn.textContent = shouldOpen ? "Сховати статистику" : "Статистика";
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
    btn.textContent = shouldOpen ? "Сховати адмін панель" : "Адмін панель";
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
                    <div>Активні: ${Number(item.active_products || 0)}</div>
                    <div>Продані: ${Number(item.sold_products || 0)}</div>
                    <div>Статус: ${item.is_banned ? "Заблокований" : "Активний"}</div>
                </div>
                <div class="card-actions inline-actions admin-grid-3">
                    <button class="secondary-btn" onclick="openUserProfile(${Number(item.id)})">Профіль</button>
                    ${item.is_banned ? `<button class="approve-btn" onclick="adminUnbanUser(${Number(item.id)})">Розбан</button>` : `<button class="reject-btn" onclick="adminBanUser(${Number(item.id)})">Бан</button>`}
                    ${item.is_admin ? `<button class="remove-btn" onclick="adminRemoveAdmin(${Number(item.id)})">Зняти адмін</button>` : `<button class="buy-btn" onclick="adminMakeAdmin(${Number(item.id)})">Дати адмін</button>`}
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
        list.innerHTML = items.length ? items.map(item => `
            <div class="compact-card">
                <div class="compact-image-wrap">${renderImageBlock(item)}</div>
                <div class="compact-info">
                    <div class="compact-top-row"><h3 class="compact-title">${escapeHtml(item.title)}</h3><div class="compact-price">${formatPrice(item.price, item.currency)}</div></div>
                    <div class="compact-meta">${escapeHtml(item.status || "")}</div>
                    <div class="compact-desc">Продавець: @${escapeHtml(item.seller_username || "")}</div>
                    <div class="card-actions inline-actions admin-grid-3 compact-actions">
                        <button class="secondary-btn" onclick="openUserProfile(${Number(item.seller_id)})">Продавець</button>
                        ${item.status === "archived" ? `<button class="approve-btn" onclick="adminRestoreProduct(${Number(item.id)})">Відновити</button>` : `<button class="remove-btn" onclick="adminArchiveProduct(${Number(item.id)})">Архів</button>`}
                        <button class="reject-btn" onclick="adminDeleteProduct(${Number(item.id)})">Видалити</button>
                    </div>
                </div>
            </div>`).join("") : `<div class="empty-card">Нічого не знайдено</div>`;
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
    btn.textContent = shouldOpen ? "Сховати ідеї та побажання" : "Ідеї та побажання";
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

function openReportModal(productId, title = "") {
    const modal = $("report-modal");
    if (!modal) return;
    $("report-product-id").value = String(productId || "");
    $("report-title").textContent = title ? `Скарга на: ${title}` : "Скарга на оголошення";
    $("report-reason").value = "Шахрайство";
    $("report-comment").value = "";
    $("report-custom-reason-wrap")?.classList.add("hidden");
    modal.classList.remove("hidden");
}

function handleReportReasonChange() {
    const reason = $("report-reason")?.value || "Шахрайство";
    $("report-custom-reason-wrap")?.classList.toggle("hidden", reason !== "Інше");
}

function closeReportModal() {
    $("report-modal")?.classList.add("hidden");
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

async function openUserProfile(userId) {
    const modal = $("user-profile-modal");
    const body = $("user-profile-modal-body");

    if (!modal || !body) return;

    modal.classList.remove("hidden");
    body.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const profile = await safeFetch(`${API_BASE}/users/${userId}/public-profile`);

        const avatar = profile.avatar_url
            ? `<img class="user-profile-avatar-img" src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.username || "user")}">`
            : `<div class="user-profile-avatar-fallback">${escapeHtml((profile.full_name || profile.username || "U").charAt(0).toUpperCase())}</div>`;

        body.innerHTML = `
            <div class="seller-profile-shell">
                <div class="seller-cover"></div>
                <div class="seller-profile-card">
                    <div class="seller-profile-top">
                        <div class="user-profile-avatar seller-avatar-large">${avatar}</div>
                        <div class="seller-profile-main">
                            <h3 class="user-profile-name">${escapeHtml(profile.full_name || "Без імені")}</h3>
                            <div class="user-profile-username">@${escapeHtml(profile.username || "")}</div>
                            <div class="seller-badges">
                                <span class="seller-badge">${profile.rating_count > 0 ? `⭐ ${escapeHtml(String(profile.rating))} · ${escapeHtml(String(profile.rating_count))} відгуків` : "Новий продавець"}</span>
                                ${profile.is_admin ? `<span class="seller-badge accent">Адміністратор</span>` : ``}
                            </div>
                        </div>
                    </div>

                    <div class="seller-stats-grid">
                        <div class="seller-stat"><span class="stat-value">${profile.active_products ?? 0}</span><span class="stat-label">Активні</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.sold_products ?? 0}</span><span class="stat-label">Продані</span></div>
                        <div class="seller-stat"><span class="stat-value">${profile.archived_products ?? 0}</span><span class="stat-label">Архів</span></div>
                    </div>

                    <div class="card-actions seller-action-stack">
                        ${profile.telegram_link
                            ? `<a class="contact-btn contact-link" href="${escapeHtml(profile.telegram_link)}" target="_blank" rel="noopener noreferrer">Написати продавцю</a>`
                            : `<button class="own-product-btn" disabled>Telegram недоступний</button>`
                        }
                        <button class="secondary-btn full-btn" onclick="loadSellerReviews(${Number(profile.id)})">Відгуки</button>
                    </div>

                    <div id="seller-reviews-wrap" class="seller-reviews-wrap"></div>
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
    wrap.innerHTML = `<div class="empty-card">Завантаження відгуків...</div>`;
    try {
        const items = await safeFetch(`${API_BASE}/users/${userId}/reviews`);
        if (!Array.isArray(items) || !items.length) {
            wrap.innerHTML = `<div class="empty-card">Відгуків поки немає</div>`;
            return;
        }
        wrap.innerHTML = `<div class="cards">${items.map(item => `
            <div class="card"><div class="card-body">
                <div class="status-pill approved">${Number(item.rating)}/5</div>
                <h4 class="card-title">${escapeHtml(item.buyer_full_name || item.buyer_username || 'Покупець')}</h4>
                <p class="card-description">${escapeHtml(item.comment || 'Без коментаря')}</p>
                <div class="history-meta"><div>${formatDate(item.created_at)}</div></div>
            </div></div>
        `).join("")}</div>`;
    } catch (error) {
        wrap.innerHTML = `<div class="empty-card">Не вдалося завантажити відгуки</div>`;
    }
}

function closeUserProfileModal() {
    $("user-profile-modal")?.classList.add("hidden");
}

function closeUserProfileOnBackdrop(event) {
    if (event.target?.id === "user-profile-modal") closeUserProfileModal();
}

async function initApp() {
    setupAuthScreen();

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
if (typeof closeProductModal === "function") window.closeProductModal = closeProductModal;
if (typeof closeProductModalOnBackdrop === "function") window.closeProductModalOnBackdrop = closeProductModalOnBackdrop;
if (typeof openProductModal === "function") window.openProductModal = openProductModal;
if (typeof deleteProduct === "function") window.deleteProduct = deleteProduct;
if (typeof addToCart === "function") window.addToCart = addToCart;
if (typeof removeFromCart === "function") window.removeFromCart = removeFromCart;
if (typeof buyProduct === "function") window.buyProduct = buyProduct;
if (typeof buyAllFromCart === "function") window.buyAllFromCart = buyAllFromCart;
if (typeof toggleFavorite === "function") window.toggleFavorite = toggleFavorite;
if (typeof startEditProduct === "function") window.startEditProduct = startEditProduct;
if (typeof toggleProfileEdit === "function") window.toggleProfileEdit = toggleProfileEdit;
if (typeof togglePurchaseHistory === "function") window.togglePurchaseHistory = togglePurchaseHistory;
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
if (typeof closeUserProfileModal === "function") window.closeUserProfileModal = closeUserProfileModal;
if (typeof closeUserProfileOnBackdrop === "function") window.closeUserProfileOnBackdrop = closeUserProfileOnBackdrop;
if (typeof setModalImage === "function") window.setModalImage = setModalImage;
if (typeof handlePurchaseRequest === "function") window.handlePurchaseRequest = handlePurchaseRequest;

initApp();

