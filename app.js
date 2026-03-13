const API_BASE = "https://telegram-marketplace-api.onrender.com";

const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";

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

function renderCartTotals(totalsByCurrency = {}) {
    const parts = Object.entries(totalsByCurrency)
        .filter(([, value]) => Number(value) > 0)
        .map(([currency, value]) => formatPrice(value, currency));
    return parts.length ? `Разом: ${parts.join(" / ")}` : "Разом: 0$";
}

function initTelegramWebApp() {
    try {
        tg = window.Telegram?.WebApp || null;

        if (tg) {
            tg.ready();
            tg.expand();
            telegramUser = tg.initDataUnsafe?.user || null;
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
    const text = typeof message === "string"
        ? message
        : (message?.message || JSON.stringify(message) || "Сталася помилка");
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
    const remember = $("remember-me")?.checked;

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
        showApp();
        return true;
    } catch {
        localStorage.removeItem("marketplace_user");
        sessionStorage.removeItem("marketplace_user");
        currentUser = null;
        return false;
    }
}

function logout() {
    localStorage.removeItem("marketplace_user");
    sessionStorage.removeItem("marketplace_user");
    currentUser = null;

    $("app-screen")?.classList.add("hidden");
    $("auth-screen")?.classList.remove("hidden");
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

function showApp() {
    $("auth-screen")?.classList.add("hidden");
    $("app-screen")?.classList.remove("hidden");
    fillProfile();
    resetCreateForm();
    toggleFilters(false);
    switchTab("catalog");
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
    if (tabName !== "create" && editingProductId && btn?.dataset?.tab !== "create") {
        // keep edit state until user saves/cancels explicitly
    }
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
        loadStats();
        loadPurchaseHistory();
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

function fillProfile() {
    if (!currentUser) return;
    $("profile-id").textContent = currentUser.id ?? "—";
    $("profile-telegram-id").textContent = currentUser.telegram_id || "—";
    $("profile-username").textContent = currentUser.username || "—";
    $("profile-fullname").textContent = currentUser.full_name || "—";
    if ($("profile-edit-username")) $("profile-edit-username").value = currentUser.username || "";
    if ($("profile-edit-fullname")) $("profile-edit-fullname").value = currentUser.full_name || "";
    if ($("profile-edit-password")) $("profile-edit-password").value = "";
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
    return "Очікує підтвердження";
}

async function saveProfile() {
    if (!currentUser || isLoading) return;
    const username = $("profile-edit-username")?.value.trim();
    const full_name = $("profile-edit-fullname")?.value.trim();
    const password = $("profile-edit-password")?.value.trim();
    if (!username) {
        showAlert("Введи тег / username");
        return;
    }
    try {
        setLoading(true);
        const data = await safeFetch(`${API_BASE}/users/${currentUser.id}/profile`, {
            method: "PUT",
            body: JSON.stringify({ username, full_name, password: password || null })
        });
        currentUser = data;
        saveSession(data);
        fillProfile();
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
            <div class="card history-card">
                ${isValidUrl(item.product_image_url) ? `<img class="history-image" src="${escapeHtml(item.product_image_url)}" alt="${escapeHtml(item.product_title)}">` : ``}
                <div class="card-body">
                    <div class="status-pill ${escapeHtml(item.status || "pending")}">${orderStatusLabel(item.status)}</div>
                    <h3 class="card-title">${escapeHtml(item.product_title || "Товар")}</h3>
                    <p class="card-price">${formatPrice(item.offered_price, item.currency)}</p>
                    <div class="history-meta">
                        ${item.seller_username ? `<div>Продавець: @${escapeHtml(item.seller_username)}</div>` : ``}
                        ${item.seller_full_name ? `<div>Ім'я продавця: ${escapeHtml(item.seller_full_name)}</div>` : ``}
                        <div>Статус: ${orderStatusLabel(item.status)}</div>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
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
            <img src="${escapeHtml(url)}" alt="preview-${index}">
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
            detail = data.detail
                .map(item => {
                    if (!item) return null;
                    if (typeof item === "string") return item;
                    const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "field";
                    const msg = item.msg || "Некоректне значення";
                    return `${field}: ${msg}`;
                })
                .filter(Boolean)
                .join("
");
        } else if (data && typeof data === "object") {
            if (typeof data.detail === "string") detail = data.detail;
            else if (typeof data.message === "string") detail = data.message;
            else if (data.detail) detail = JSON.stringify(data.detail);
        } else if (typeof data === "string" && data) {
            detail = data;
        }

        throw new Error(detail || `HTTP ${response.status}`);
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

    const tgButton = $("tg-login-btn");
    const remember = $("remember-me");

    if (telegramUser) {
        if (tgButton) tgButton.textContent = "Увійти через Telegram (рекомендується)";
        if (remember) remember.checked = true;
    } else {
        if (tgButton) tgButton.textContent = "Telegram login доступний тільки в Telegram";
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
        showApp();
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
        showApp();
    } catch (error) {
        showAlert(error.message || "Помилка входу");
    } finally {
        setLoading(false);
    }
}

async function loginWithTelegram() {
    if (isLoading) return;

    initTelegramWebApp();

    if (!telegramUser) {
        showAlert("Telegram login доступний тільки всередині Telegram Mini App");
        return;
    }

    if (!telegramUser.username) {
        showAlert("У вашого Telegram акаунта немає username");
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        const data = await safeFetch(`${API_BASE}/auth/telegram`, {
            method: "POST",
            body: JSON.stringify({
                telegram_id: String(telegramUser.id),
                username: telegramUser.username,
                full_name: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim()
            })
        });

        currentUser = data;
        saveSession(data);

        showAlert("Вхід через Telegram успішний");
        showApp();
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
        <div class="card card-clickable" onclick="openProductModal(${Number(product.id)})">
            <div class="card-image-wrap">
                ${renderImageBlock(product)}
                ${renderFavoriteButton(product)}
            </div>
            <div class="card-body">
                ${renderCardTags(product)}
                <h3 class="card-title">${escapeHtml(product.title)}</h3>
                <p class="card-price card-price-large">${formatPrice(product.price, product.currency)}</p>
                <p class="card-description">${escapeHtml(product.description || "")}</p>
                ${product.seller_username ? `<p class="card-seller">Продавець: @${escapeHtml(product.seller_username)}</p>` : ""}
                <div class="card-actions">
                    ${
                        isOwnProduct
                            ? `<button class="own-product-btn" onclick="event.stopPropagation(); showAlert('Це ваше оголошення')">Ваш товар</button>`
                            : `<button class="buy-btn" onclick="event.stopPropagation(); addToCart(${Number(product.id)})">Додати в кошик</button>`
                    }
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
        <div class="card card-clickable" onclick="openProductModal(${Number(product.id)})">
            ${renderImageBlock(product)}
            <div class="card-body">
                ${renderCardTags(product)}
                <h3 class="card-title">${escapeHtml(product.title)}</h3>
                <p class="card-price card-price-large">${formatPrice(product.price, product.currency)}</p>
                <p class="card-description">${escapeHtml(product.description || "")}</p>
                <div class="card-actions">
                    ${actionButton}
                </div>
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
                    ${product.seller_username ? `<p class="card-seller">Продавець: @${escapeHtml(product.seller_username)}</p>` : ""}
                    <div class="card-actions">
                        ${primaryAction}
                        ${!isOwnProduct ? contactButton : ""}
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

    if (!title || title.length < 2) {
        showAlert("Назва товару має бути мінімум 2 символи");
        return;
    }
    if (!description || description.length < 5) {
        showAlert("Опис товару має бути мінімум 5 символів");
        return;
    }
    if (!Number.isFinite(price) || price <= 0) {
        showAlert("Вкажи коректну ціну");
        return;
    }
    if (!category) {
        showAlert("Обери категорію");
        return;
    }
    if (!condition) {
        showAlert("Обери стан товару");
        return;
    }
    if (!city || typeof city !== "string") {
        showAlert("Обери місто");
        return;
    }

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
    if (!cartList || !cartTotal || !currentUser) return;

    cartList.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const data = await safeFetch(`${API_BASE}/cart/${currentUser.id}`);

        if (!data?.items?.length) {
            cartList.innerHTML = `<div class="empty-card">Кошик порожній</div>`;
            cartTotal.textContent = renderCartTotals({});
            return;
        }

        cartTotal.textContent = renderCartTotals(data.totals_by_currency || {});

        cartList.innerHTML = data.items.map(item => `
            <div class="card">
                ${isValidUrl(item.image_url) ? `<img class="card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">` : ""}
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <p class="card-price card-price-large">${formatPrice(item.price, item.currency)}</p>
                    ${item.seller_username ? `<p class="card-seller">Продавець: @${escapeHtml(item.seller_username)}</p>` : ""}
                    <div class="card-actions">
                        <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">Купити</button>
                        <button class="remove-btn" onclick="removeFromCart(${Number(item.cart_item_id)})">Видалити з кошика</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        cartList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
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

async function initApp() {
    setupAuthScreen();

    if (loadSession()) return;

    $("auth-screen")?.classList.remove("hidden");
    $("app-screen")?.classList.add("hidden");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
});

initApp();
