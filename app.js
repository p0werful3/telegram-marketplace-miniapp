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

function formatPrice(price) {
    const num = Number(price);
    return Number.isFinite(num) ? `${num}$` : `${price}$`;
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
    } catch (error) {
        console.error("Load stats error:", error);
    }
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
        const detail =
            (data && typeof data === "object" && (data.detail || data.message)) ||
            (typeof data === "string" && data) ||
            `HTTP ${response.status}`;

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
                <p class="card-price card-price-large">${formatPrice(product.price)}</p>
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
        actionButton = `<button class="delete-btn" onclick="event.stopPropagation(); deleteProduct(${Number(product.id)})">В архів</button>`;
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
                <p class="card-price card-price-large">${formatPrice(product.price)}</p>
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
            : `<button class="buy-btn" onclick="addToCart(${Number(product.id)})">Додати в кошик</button>`;

        body.innerHTML = `
            <div class="modal-product">
                <div class="card-image-wrap">
                    ${buildGallery(product.image_urls || (product.image_url ? [product.image_url] : []), product.title)}
                    ${renderFavoriteButton(product)}
                </div>
                <div class="modal-product-body">
                    ${renderCardTags(product)}
                    <h3 class="modal-product-title">${escapeHtml(product.title)}</h3>
                    <p class="modal-product-price">${formatPrice(product.price)}</p>
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
    const rawPrice = String($("product-price")?.value || "").trim();
    const price = Number(rawPrice);
    const category = $("product-category")?.value.trim();
    const condition = $("product-condition")?.value.trim();
    const city = $("product-city")?.value.trim();
    const files = Array.from($("product-files")?.files || []);
    const imageStatus = $("image-status");

    if (!title || !description || !category || !condition || !city || !rawPrice) {
        showAlert("Заповни всі обов'язкові поля");
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        showAlert("Вкажи коректну ціну");
        return;
    }

    if (files.length > 10) {
        showAlert("Максимум 10 фото");
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        let imageUrls = [];

        if (files.length) {
            if (imageStatus) imageStatus.textContent = `Завантаження фото 0/${files.length}...`;

            for (let i = 0; i < files.length; i += 1) {
                const file = files[i];

                if (file.size > 10 * 1024 * 1024) {
                    throw new Error(`Фото "${file.name}" більше 10MB`);
                }

                const url = await uploadImageToCloudinary(file);
                imageUrls.push(url);

                if (imageStatus) {
                    imageStatus.textContent = `Завантаження фото ${i + 1}/${files.length}...`;
                }
            }

            if (imageStatus) imageStatus.textContent = "Фото успішно завантажено";
        }

        await safeFetch(`${API_BASE}/products`, {
            method: "POST",
            body: JSON.stringify({
                seller_id: currentUser.id,
                title,
                description,
                price,
                category,
                condition,
                city,
                image_url: imageUrls[0] || null,
                image_urls: imageUrls
            })
        });

        $("product-title").value = "";
        $("product-description").value = "";
        $("product-price").value = "";
        $("product-category").value = "";
        $("product-condition").value = "";
        $("product-city").value = "";
        if ($("product-files")) $("product-files").value = "";

        $("image-preview-wrap")?.classList.add("hidden");
        if ($("image-preview-grid")) $("image-preview-grid").innerHTML = "";
        if (imageStatus) imageStatus.textContent = "Фото не вибрано";

        showAlert("Оголошення створено");
        myProductsView = "active";
        switchTab("my-products");
        loadProducts();
        loadMyProducts();
        loadStats();
    } catch (error) {
        console.error("Create product error:", error);
        if (imageStatus) imageStatus.textContent = error.message || "Помилка завантаження фото";
        showAlert(error.message || "Не вдалося створити оголошення");
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
            list.innerHTML =
                myProductsView === "active"
                    ? `<div class="empty-card">У вас поки немає активних оголошень</div>`
                    : myProductsView === "sold"
                      ? `<div class="empty-card">У вас поки немає проданих товарів</div>`
                      : `<div class="empty-card">Архів порожній</div>`;
            return;
        }

        list.innerHTML = products.map(product => renderMyProductCard(product, myProductsView)).join("");
    } catch (error) {
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
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
            cartTotal.textContent = "Разом: 0$";
            return;
        }

        cartTotal.textContent = `Разом: ${data.total}$`;

        cartList.innerHTML = data.items.map(item => `
            <div class="card">
                ${isValidUrl(item.image_url) ? `<img class="card-image" src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}">` : ""}
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <p class="card-price card-price-large">${escapeHtml(item.price)}$</p>
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
