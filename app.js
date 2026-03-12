const API_BASE = "https://telegram-marketplace-api.onrender.com";

const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";

let tg = null;
let telegramUser = null;
let currentUser = null;
let isLoading = false;
let myProductsView = "active";

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
            console.log("Telegram user:", telegramUser);
        } else {
            telegramUser = null;
            console.log("Telegram WebApp not found");
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
    } catch (error) {
        console.error("Session parse error:", error);
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
        if (button.dataset.tab === tabName) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
}

function showApp() {
    $("auth-screen")?.classList.add("hidden");
    $("app-screen")?.classList.remove("hidden");
    fillProfile();
    switchTab("catalog");
    loadProducts();
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
    if (tabName === "profile") fillProfile();
}

function switchMyProductsView(view) {
    myProductsView = view;

    $("my-products-active-btn")?.classList.toggle("active", view === "active");
    $("my-products-history-btn")?.classList.toggle("active", view === "history");

    loadMyProducts();
}

function fillProfile() {
    if (!currentUser) return;

    $("profile-id").textContent = currentUser.id ?? "—";
    $("profile-telegram-id").textContent = currentUser.telegram_id || "—";
    $("profile-username").textContent = currentUser.username || "—";
    $("profile-fullname").textContent = currentUser.full_name || "—";
}

function handleImagePreview(event) {
    const file = event?.target?.files?.[0];
    const previewWrap = $("image-preview-wrap");
    const preview = $("image-preview");
    const status = $("image-status");

    if (!file) {
        previewWrap?.classList.add("hidden");
        if (preview) preview.src = "";
        if (status) status.textContent = "Фото не вибрано";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showAlert("Оберіть саме зображення");
        event.target.value = "";
        previewWrap?.classList.add("hidden");
        if (preview) preview.src = "";
        if (status) status.textContent = "Фото не вибрано";
        return;
    }

    const objectUrl = URL.createObjectURL(file);

    if (preview) {
        preview.src = objectUrl;
    }

    previewWrap?.classList.remove("hidden");

    if (status) {
        status.textContent = `Вибрано: ${file.name}`;
    }
}

async function uploadImageToCloudinary(file) {
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
        throw new Error("Не вдалося завантажити фото");
    }

    const data = await response.json();

    if (!response.ok) {
        console.error("Cloudinary error:", data);
        throw new Error(data?.error?.message || "Помилка завантаження фото");
    }

    if (!data?.secure_url) {
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
        await fetch(`${API_BASE}/`, {
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

    if (username.length < 3) {
        showAlert("Username має бути мінімум 3 символи");
        return;
    }

    if (password.length < 4) {
        showAlert("Password має бути мінімум 4 символи");
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
        console.error("Register error:", error);
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
        console.error("Login error:", error);
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
        console.error("Telegram login error:", error);
        showAlert(error.message || "Помилка входу через Telegram");
    } finally {
        setLoading(false);
    }
}

function renderCardTags(product) {
    return `
        <div class="card-tags">
            <span class="tag">${escapeHtml(product.category || "Без категорії")}</span>
            <span class="tag">${escapeHtml(product.condition || "Новий")}</span>
        </div>
    `;
}

function renderImageBlock(product) {
    if (isValidUrl(product.image_url)) {
        return `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`;
    }

    return `<div class="card-image card-image-placeholder">Фото відсутнє</div>`;
}

function renderCatalogCard(product) {
    const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);

    return `
        <div class="card card-clickable" onclick="openProductModal(${Number(product.id)})">
            ${renderImageBlock(product)}
            <div class="card-body">
                ${renderCardTags(product)}
                <h3 class="card-title">${escapeHtml(product.title)}</h3>
                <p class="card-price card-price-large">${formatPrice(product.price)}</p>
                <p class="card-description">${escapeHtml(product.description || "")}</p>
                ${
                    product.seller_username
                        ? `<p class="card-seller">Продавець: @${escapeHtml(product.seller_username)}</p>`
                        : ""
                }
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

function renderMyProductCard(product, isHistory = false) {
    return `
        <div class="card">
            ${renderImageBlock(product)}
            <div class="card-body">
                ${renderCardTags(product)}
                <h3 class="card-title">${escapeHtml(product.title)}</h3>
                <p class="card-price card-price-large">${formatPrice(product.price)}</p>
                <p class="card-description">${escapeHtml(product.description || "")}</p>
                <div class="card-actions">
                    ${
                        isHistory
                            ? `<button class="archive-btn" disabled>В архіві</button>`
                            : `<button class="delete-btn" onclick="deleteProduct(${Number(product.id)})">Видалити</button>`
                    }
                </div>
            </div>
        </div>
    `;
}

async function loadProducts() {
    const productsList = $("products-list");
    if (!productsList) return;

    productsList.innerHTML = `<div class="empty-card">Завантаження товарів...</div>`;

    try {
        const searchValue = $("search-input")?.value.trim() || "";
        const categoryValue = $("category-filter")?.value || "Усі";

        const params = new URLSearchParams();
        if (searchValue) params.append("q", searchValue);
        if (categoryValue && categoryValue !== "Усі") params.append("category", categoryValue);

        const url = params.toString()
            ? `${API_BASE}/products?${params.toString()}`
            : `${API_BASE}/products`;

        const products = await safeFetch(url, { method: "GET" });

        if (!Array.isArray(products) || products.length === 0) {
            productsList.innerHTML = `<div class="empty-card">Поки що немає товарів</div>`;
            return;
        }

        productsList.innerHTML = products.map(renderCatalogCard).join("");
    } catch (error) {
        console.error("Load products error:", error);
        productsList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "API недоступне")}</div>`;
    }
}

async function openProductModal(productId) {
    const modal = $("product-modal");
    const body = $("product-modal-body");

    if (!modal || !body) return;

    modal.classList.remove("hidden");
    body.innerHTML = `<div class="empty-card">Завантаження...</div>`;

    try {
        const product = await safeFetch(`${API_BASE}/products/${productId}`, { method: "GET" });
        const isOwnProduct = currentUser && Number(product.seller_id) === Number(currentUser.id);

        const imageBlock = isValidUrl(product.image_url)
            ? `<img class="modal-product-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`
            : `<div class="modal-product-image card-image-placeholder">Фото відсутнє</div>`;

        const contactButton = product.seller_telegram_link
            ? `<a class="contact-btn contact-link" href="${escapeHtml(product.seller_telegram_link)}" target="_blank" rel="noopener noreferrer">Написати продавцю</a>`
            : "";

        const primaryAction = isOwnProduct
            ? `<button class="own-product-btn" onclick="showAlert('Це ваше оголошення')">Ваш товар</button>`
            : `<button class="buy-btn" onclick="addToCart(${Number(product.id)})">Додати в кошик</button>`;

        body.innerHTML = `
            <div class="modal-product">
                ${imageBlock}
                <div class="modal-product-body">
                    ${renderCardTags(product)}
                    <h3 class="modal-product-title">${escapeHtml(product.title)}</h3>
                    <p class="modal-product-price">${formatPrice(product.price)}</p>
                    <p class="modal-product-description">${escapeHtml(product.description || "")}</p>
                    ${
                        product.seller_username
                            ? `<p class="card-seller">Продавець: @${escapeHtml(product.seller_username)}</p>`
                            : ""
                    }
                    <div class="card-actions">
                        ${primaryAction}
                        ${!isOwnProduct ? contactButton : ""}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Open product modal error:", error);
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
    if (!currentUser) {
        showAlert("Спочатку увійди в акаунт");
        return;
    }

    if (isLoading) return;

    const title = $("product-title")?.value.trim();
    const description = $("product-description")?.value.trim();
    const rawPrice = String($("product-price")?.value || "").trim();
    const price = Number(rawPrice);
    const category = $("product-category")?.value.trim();
    const condition = $("product-condition")?.value.trim();
    const file = $("product-file")?.files?.[0] || null;
    const imageStatus = $("image-status");

    if (!title || !description || !category || !condition || !rawPrice) {
        showAlert("Заповни всі обов'язкові поля");
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        showAlert("Вкажи коректну ціну");
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        let imageUrl = null;

        if (file) {
            if (imageStatus) imageStatus.textContent = "Завантаження фото...";
            imageUrl = await uploadImageToCloudinary(file);
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
                image_url: imageUrl
            })
        });

        $("product-title").value = "";
        $("product-description").value = "";
        $("product-price").value = "";
        $("product-category").value = "";
        $("product-condition").value = "";
        if ($("product-file")) $("product-file").value = "";

        const previewWrap = $("image-preview-wrap");
        const preview = $("image-preview");

        if (previewWrap) previewWrap.classList.add("hidden");
        if (preview) preview.src = "";
        if (imageStatus) imageStatus.textContent = "Фото не вибрано";

        showAlert("Оголошення створено");
        myProductsView = "active";
        switchTab("my-products");
        loadProducts();
        loadMyProducts();
    } catch (error) {
        console.error("Create product error:", error);
        if (imageStatus) imageStatus.textContent = "Помилка завантаження фото";
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
        const url = myProductsView === "history"
            ? `${API_BASE}/users/${currentUser.id}/products/history`
            : `${API_BASE}/users/${currentUser.id}/products`;

        const products = await safeFetch(url, { method: "GET" });

        if (!Array.isArray(products) || products.length === 0) {
            list.innerHTML = myProductsView === "history"
                ? `<div class="empty-card">Історія оголошень порожня</div>`
                : `<div class="empty-card">У вас поки немає активних оголошень</div>`;
            return;
        }

        list.innerHTML = products
            .map(product => renderMyProductCard(product, myProductsView === "history"))
            .join("");
    } catch (error) {
        console.error("Load my products error:", error);
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
    }
}

async function deleteProduct(productId) {
    if (!currentUser) return;
    if (isLoading) return;

    try {
        setLoading(true);
        await wakeApi();

        await safeFetch(`${API_BASE}/products/${productId}?user_id=${currentUser.id}`, {
            method: "DELETE"
        });

        showAlert("Оголошення перенесено в історію");
        loadMyProducts();
        loadProducts();
        loadCart();
    } catch (error) {
        console.error("Delete product error:", error);
        showAlert(error.message || "Не вдалося видалити оголошення");
    } finally {
        setLoading(false);
    }
}

async function addToCart(productId) {
    if (!currentUser) {
        showAlert("Спочатку увійди в акаунт");
        return;
    }

    if (isLoading) return;

    try {
        setLoading(true);
        await wakeApi();

        await safeFetch(`${API_BASE}/cart/add`, {
            method: "POST",
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: productId
            })
        });

        showAlert("Товар додано до кошика");
        loadCart();
    } catch (error) {
        console.error("Add to cart error:", error);
        showAlert(error.message || "Не вдалося додати товар");
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
        const data = await safeFetch(`${API_BASE}/cart/${currentUser.id}`, {
            method: "GET"
        });

        if (!data?.items?.length) {
            cartList.innerHTML = `<div class="empty-card">Кошик порожній</div>`;
            cartTotal.textContent = "Разом: 0$";
            return;
        }

        cartTotal.textContent = `Разом: ${data.total}$`;

        cartList.innerHTML = data.items.map(item => `
            <div class="card">
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <p class="card-price card-price-large">${escapeHtml(item.price)}$</p>
                    ${
                        item.seller_username
                            ? `<p class="card-seller">Продавець: @${escapeHtml(item.seller_username)}</p>`
                            : ""
                    }
                    <div class="card-actions">
                        <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">Купити</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Load cart error:", error);
        cartList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "Помилка завантаження")}</div>`;
    }
}

async function buyProduct(productId) {
    if (!currentUser) return;
    if (isLoading) return;

    try {
        setLoading(true);
        await wakeApi();

        const data = await safeFetch(`${API_BASE}/orders/buy`, {
            method: "POST",
            body: JSON.stringify({
                buyer_id: currentUser.id,
                product_id: productId
            })
        });

        closeProductModal();

        showAlert(
            `Покупку оформлено\n${data?.seller_username ? `@${data.seller_username}` : ""}\n${data?.seller_link || ""}`
        );

        loadCart();
        loadProducts();
        loadMyProducts();
    } catch (error) {
        console.error("Buy product error:", error);
        showAlert(error.message || "Помилка покупки");
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
    if (event.key === "Escape") {
        closeProductModal();
    }
});

initApp();
