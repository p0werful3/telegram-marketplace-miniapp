const API_BASE = "https://telegram-marketplace-api.onrender.com";

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
        if (tg?.showAlert) tg.showAlert(text);
        else alert(text);
    } catch {
        alert(text);
    }
}

function setLoading(state) {
    isLoading = state;
    document.querySelectorAll("button").forEach(btn => {
        if (btn.dataset.noDisable === "true") return;
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

    switchAuthTab("login", document.querySelector(".auth-tab.active") || document.querySelector(".auth-tab"));
}

function showApp() {
    $("auth-screen")?.classList.add("hidden");
    $("app-screen")?.classList.remove("hidden");
    fillProfile();
    switchToTab("catalog");
    loadProducts();
}

function switchAuthTab(tabName, btn = null) {
    document.querySelectorAll(".auth-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".auth-panel").forEach(panel => panel.classList.remove("active"));

    const targetPanel = $(`auth-${tabName}`);
    if (targetPanel) targetPanel.classList.add("active");

    if (btn) {
        btn.classList.add("active");
    } else {
        const autoBtn = Array.from(document.querySelectorAll(".auth-tab")).find(el =>
            el.textContent.toLowerCase().includes(tabName === "login" ? "вхід" : "реєстрац")
        );
        if (autoBtn) autoBtn.classList.add("active");
    }
}

function switchToTab(tabName) {
    document.querySelectorAll(".tab-section").forEach(section => section.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));

    const section = $(`tab-${tabName}`);
    if (section) section.classList.add("active");

    const navBtn = Array.from(document.querySelectorAll(".nav-btn")).find(btn =>
        btn.getAttribute("onclick")?.includes(`'${tabName}'`)
    );
    if (navBtn) navBtn.classList.add("active");
}

function switchTab(tabName, btn) {
    document.querySelectorAll(".tab-section").forEach(section => section.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));

    $(`tab-${tabName}`)?.classList.add("active");
    btn?.classList.add("active");

    if (tabName === "catalog") loadProducts();
    if (tabName === "cart") loadCart();
    if (tabName === "profile") fillProfile();
    if (tabName === "create") loadMyProducts();
}

function fillProfile() {
    if (!currentUser) return;

    $("profile-id").textContent = currentUser.id ?? "—";
    $("profile-telegram-id").textContent = currentUser.telegram_id || "—";
    $("profile-username").textContent = currentUser.username || "—";
    $("profile-fullname").textContent = currentUser.full_name || "—";
}

async function safeFetch(url, options = {}) {
    let response;

    try {
        response = await fetch(url, {
            mode: "cors",
            credentials: "omit",
            cache: "no-store",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        console.error("Network error:", error);
        throw new Error("Не вдалося підключитися до API. Перевір backend, HTTPS і CORS.");
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

async function loginWithTelegram(showSuccess = true) {
    if (isLoading) return false;

    initTelegramWebApp();

    if (!telegramUser) {
        showAlert("Telegram login доступний тільки всередині Telegram Mini App");
        return false;
    }

    if (!telegramUser.username) {
        showAlert("У вашого Telegram акаунта немає username");
        return false;
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

        if (showSuccess) showAlert("Вхід через Telegram успішний");
        showApp();
        return true;
    } catch (error) {
        console.error("Telegram login error:", error);
        showAlert(error.message || "Помилка входу через Telegram");
        return false;
    } finally {
        setLoading(false);
    }
}

async function loadProducts() {
    const productsList = $("products-list");
    const searchValue = $("search-input")?.value?.trim() || "";
    const categoryValue = $("category-filter")?.value || "Усі";

    if (!productsList) return;

    productsList.innerHTML = `<div class="empty-card">Завантаження товарів...</div>`;

    try {
        let url = `${API_BASE}/products`;
        const params = new URLSearchParams();

        if (searchValue) params.append("q", searchValue);
        if (categoryValue !== "Усі") params.append("category", categoryValue);
        if ([...params.keys()].length > 0) url += `?${params.toString()}`;

        const products = await safeFetch(url, { method: "GET", headers: {} });

        if (!Array.isArray(products) || products.length === 0) {
            productsList.innerHTML = `<div class="empty-card">Поки що немає товарів</div>`;
            return;
        }

        productsList.innerHTML = "";

        products.forEach(product => {
            const image = product.image_url && isValidUrl(product.image_url)
                ? `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`
                : `<div class="card-image"></div>`;

            const sellerText = product.seller_username
                ? `@${escapeHtml(product.seller_username)}`
                : escapeHtml(product.seller_name || "Невідомий продавець");

            const contactButton = product.seller_telegram_link && isValidUrl(product.seller_telegram_link)
                ? `<a href="${escapeHtml(product.seller_telegram_link)}" target="_blank" rel="noopener noreferrer"><button class="contact-btn">Написати продавцю</button></a>`
                : "";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                ${image}
                <div class="card-body">
                    <div class="card-category">${escapeHtml(product.category)}</div>
                    <h3 class="card-title">${escapeHtml(product.title)}</h3>
                    <p class="card-description">${escapeHtml(product.description)}</p>
                    <p class="card-price">${escapeHtml(product.price)}$</p>
                    <p class="card-seller">Продавець: ${sellerText}</p>
                    <div class="card-actions">
                        <button class="buy-btn" onclick="addToCart(${Number(product.id)})">Додати в кошик</button>
                        ${contactButton}
                    </div>
                </div>
            `;
            productsList.appendChild(card);
        });
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
    const priceRaw = $("product-price")?.value.trim();
    const category = $("product-category")?.value.trim();
    const image_url = $("product-image")?.value.trim();

    if (!title || !description || !priceRaw || !category) {
        showAlert("Заповни всі обов'язкові поля");
        return;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
        showAlert("Вкажи коректну ціну");
        return;
    }

    if (image_url && !isValidUrl(image_url)) {
        showAlert("URL зображення некоректний");
        return;
    }

    try {
        setLoading(true);
        await wakeApi();

        await safeFetch(`${API_BASE}/products`, {
            method: "POST",
            body: JSON.stringify({
                seller_id: currentUser.id,
                title,
                description,
                price,
                category,
                image_url: image_url || null
            })
        });

        $("product-title").value = "";
        $("product-description").value = "";
        $("product-price").value = "";
        $("product-category").value = "";
        $("product-image").value = "";

        showAlert("Оголошення створено");
        loadProducts();
        loadMyProducts();
    } catch (error) {
        console.error("Create product error:", error);
        showAlert(error.message || "Не вдалося створити оголошення");
    } finally {
        setLoading(false);
    }
}

async function loadMyProducts() {
    if (!currentUser) return;

    const list = $("my-products-list");
    if (!list) return;

    list.innerHTML = `<div class="empty-card">Завантаження ваших оголошень...</div>`;

    try {
        const products = await safeFetch(`${API_BASE}/users/${currentUser.id}/products`, {
            method: "GET",
            headers: {}
        });

        if (!Array.isArray(products) || products.length === 0) {
            list.innerHTML = `<div class="empty-card">У вас поки немає оголошень</div>`;
            return;
        }

        list.innerHTML = "";

        products.forEach(product => {
            const image = product.image_url && isValidUrl(product.image_url)
                ? `<img class="card-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}">`
                : `<div class="card-image"></div>`;

            const status = product.is_active ? "Активне" : "Неактивне";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                ${image}
                <div class="card-body">
                    <div class="card-category">${escapeHtml(product.category)}</div>
                    <h3 class="card-title">${escapeHtml(product.title)}</h3>
                    <p class="card-description">${escapeHtml(product.description)}</p>
                    <p class="card-price">${escapeHtml(product.price)}$</p>
                    <p class="card-seller">Статус: ${escapeHtml(status)}</p>
                    ${product.is_active ? `<button class="delete-btn" onclick="deleteProduct(${Number(product.id)})">Видалити оголошення</button>` : ""}
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error("Load my products error:", error);
        list.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "API недоступне")}</div>`;
    }
}

async function deleteProduct(productId) {
    if (!currentUser) return;
    if (isLoading) return;

    try {
        setLoading(true);

        await safeFetch(`${API_BASE}/products/${productId}?user_id=${currentUser.id}`, {
            method: "DELETE",
            headers: {}
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
    if (!currentUser) return;

    const cartList = $("cart-list");
    const cartTotal = $("cart-total");

    if (!cartList || !cartTotal) return;

    cartList.innerHTML = `<div class="empty-card">Завантаження кошика...</div>`;
    cartTotal.textContent = "Разом: 0$";

    try {
        const data = await safeFetch(`${API_BASE}/cart/${currentUser.id}`, {
            method: "GET",
            headers: {}
        });

        if (!data?.items?.length) {
            cartList.innerHTML = `<div class="empty-card">Кошик порожній</div>`;
            cartTotal.textContent = "Разом: 0$";
            return;
        }

        cartList.innerHTML = "";
        cartTotal.textContent = `Разом: ${data.total}$`;

        data.items.forEach(item => {
            const linkButton = item.seller_link && isValidUrl(item.seller_link)
                ? `<a href="${escapeHtml(item.seller_link)}" target="_blank" rel="noopener noreferrer"><button class="contact-btn">Написати продавцю</button></a>`
                : "";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(item.title)}</h3>
                    <p class="card-price">${escapeHtml(item.price)}$</p>
                    <div class="card-actions">
                        <button class="buy-btn" onclick="buyProduct(${Number(item.product_id)})">Купити та отримати контакти продавця</button>
                        ${linkButton}
                    </div>
                </div>
            `;
            cartList.appendChild(card);
        });
    } catch (error) {
        console.error("Load cart error:", error);
        cartList.innerHTML = `<div class="empty-card">${escapeHtml(error.message || "API недоступне")}</div>`;
    }
}

async function buyProduct(productId) {
    if (!currentUser) return;
    if (isLoading) return;

    try {
        setLoading(true);

        const data = await safeFetch(`${API_BASE}/orders/buy`, {
            method: "POST",
            body: JSON.stringify({
                buyer_id: currentUser.id,
                product_id: productId
            })
        });

        let message = "Покупку оформлено.\n\n";
        if (data?.seller_username) message += `Telegram продавця: @${data.seller_username}\n`;
        if (data?.seller_link) message += `Посилання: ${data.seller_link}`;

        showAlert(message.trim());
        loadCart();
    } catch (error) {
        console.error("Buy product error:", error);
        showAlert(error.message || "Помилка покупки");
    } finally {
        setLoading(false);
    }
}

function bindEnterKeys() {
    $("login-password")?.addEventListener("keydown", e => {
        if (e.key === "Enter") loginUser();
    });

    $("register-password")?.addEventListener("keydown", e => {
        if (e.key === "Enter") registerNewUser();
    });

    $("search-input")?.addEventListener("keydown", e => {
        if (e.key === "Enter") loadProducts();
    });
}

async function initApp() {
    setupAuthScreen();
    bindEnterKeys();

    if (loadSession()) return;

    $("auth-screen")?.classList.remove("hidden");
    $("app-screen")?.classList.add("hidden");
}

initApp();
