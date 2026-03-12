const API_BASE = "https://telegram-marketplace-api.onrender.com";


const CLOUDINARY_CLOUD_NAME = "dw2vkc5ew";
const CLOUDINARY_UPLOAD_PRESET = "telegram_marketplace_unsigned";;

let tg = null;
let telegramUser = null;
let currentUser = null;
let isLoading = false;

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
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === "PASTE_CLOUD_NAME_HERE") {
        throw new Error("Не налаштовано CLOUDINARY_CLOUD_NAME");
    }

    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === "PASTE_UPLOAD_PRESET_HERE") {
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

        const products = await safeFetch(url, {
            method: "GET"
        });

        if (!Array.isArray(products) || products.length === 0) {
            productsList.innerHTML = `<div class="empty-card">Поки що немає товарів</div>`;
            return;
        }

        productsList.innerHTML = products.map(product => {
            const imageBlock = isValidUrl(product.image_url)
                ? `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`
                : "";

            const sellerBlock = product.seller_username
                ? `<p class="card-seller">Продавець: @${escapeHtml(product.seller_username)}</p>`
                : "";

            return `
                <div class="card">
                    ${imageBlock}
                    <div class="card-body">
                        <div class="card-category">${escapeHtml(product.category)}</div>
                        <h3 class="card-title">${escapeHtml(product.title)}</h3>
                        <p class="card-description">${escapeHtml(product.description)}</p>
                        <p class="card-price">${escapeHtml(product.price)}$</p>
                        ${sellerBlock}
                        <button class="buy-btn" onclick="addToCart(${Number(product.id)})">Додати в кошик</button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Load products error:", error);
        productsList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "API недоступне")}</div>`;
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
    const file = $("product-file")?.files?.[0] || null;
    const imageStatus = $("image-status");

    if (!title || !description || !category || !rawPrice) {
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
                image_url: imageUrl
            })
        });

        $("product-title").value = "";
        $("product-description").value = "";
        $("product-price").value = "";
        $("product-category").value = "";
        $("product-file").value = "";

        const previewWrap = $("image-preview-wrap");
        const preview = $("image-preview");

        if (previewWrap) previewWrap.classList.add("hidden");
        if (preview) preview.src = "";
        if (imageStatus) imageStatus.textContent = "Фото не вибрано";

        showAlert("Оголошення створено");
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
        const products = await safeFetch(`${API_BASE}/users/${currentUser.id}/products`, {
            method: "GET"
        });

        if (!Array.isArray(products) || products.length === 0) {
            list.innerHTML = `<div class="empty-card">У вас поки немає оголошень</div>`;
            return;
        }

        list.innerHTML = products.map(product => {
            const imageBlock = isValidUrl(product.image_url)
                ? `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`
                : "";

            return `
                <div class="card">
                    ${imageBlock}
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(product.title)}</h3>
                        <p class="card-description">${escapeHtml(product.description || "")}</p>
                        <p class="card-price">${escapeHtml(product.price)}$</p>
                        <div class="card-category">${escapeHtml(product.category || "")}</div>
                        <button class="delete-btn" onclick="deleteProduct(${Number(product.id)})">Видалити</button>
                    </div>
                </div>
            `;
        }).join("");
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

        showAlert("Оголошення видалено");
        loadMyProducts();
        loadProducts();
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
                    <p class="card-price">${escapeHtml(item.price)}$</p>
                    <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">Купити</button>
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

        showAlert(
            `Покупку оформлено\n${data?.seller_username ? `@${data.seller_username}` : ""}\n${data?.seller_link || ""}`
        );

        loadCart();
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

initApp();

