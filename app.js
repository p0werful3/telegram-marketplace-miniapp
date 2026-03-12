const API_BASE = "https://telegram-marketplace-api.onrender.com";

let tg = null;
let telegramUser = null;
let currentUser = null;

function initTelegramWebApp() {
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
}

function showAlert(message) {
    if (tg) tg.showAlert(message);
    else alert(message);
}

async function parseApiResponse(response) {
    const rawText = await response.text();

    try {
        return rawText ? JSON.parse(rawText) : {};
    } catch {
        return {
            detail: rawText || `HTTP ${response.status}`
        };
    }
}

function saveSession(user) {
    const remember = document.getElementById("remember-me")?.checked;
    if (remember) {
        localStorage.setItem("marketplace_user", JSON.stringify(user));
    }
}

function loadSession() {
    const saved = localStorage.getItem("marketplace_user");
    if (saved) {
        currentUser = JSON.parse(saved);
        showApp();
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem("marketplace_user");
    currentUser = null;
    document.getElementById("app-screen").classList.add("hidden");
    document.getElementById("auth-screen").classList.remove("hidden");
}

function showApp() {
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("app-screen").classList.remove("hidden");
    fillProfile();
    loadProducts();
}

function switchAuthTab(tabName, btn) {
    document.querySelectorAll(".auth-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".auth-panel").forEach(panel => panel.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`auth-${tabName}`).classList.add("active");
}

function switchTab(tabName, btn) {
    document.querySelectorAll(".tab-section").forEach(section => section.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(button => button.classList.remove("active"));

    document.getElementById(`tab-${tabName}`).classList.add("active");
    btn.classList.add("active");

    if (tabName === "catalog") loadProducts();
    if (tabName === "cart") loadCart();
    if (tabName === "profile") fillProfile();
    if (tabName === "create") loadMyProducts();
}

function fillProfile() {
    if (!currentUser) return;
    document.getElementById("profile-id").textContent = currentUser.id;
    document.getElementById("profile-telegram-id").textContent = currentUser.telegram_id || "—";
    document.getElementById("profile-username").textContent = currentUser.username;
    document.getElementById("profile-fullname").textContent = currentUser.full_name || "—";
}

async function wakeApi() {
    try {
        await fetch(`${API_BASE}/`, {
            method: "GET",
            mode: "cors",
            credentials: "omit"
        });
    } catch (e) {
        console.error("Wake API error:", e);
    }
}

async function registerNewUser() {
    const username = document.getElementById("register-username").value.trim();
    const full_name = document.getElementById("register-fullname").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if (!username || !password) {
        showAlert("Введи username і password");
        return;
    }

    try {
        await wakeApi();

        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password,
                full_name,
                telegram_id: telegramUser?.id ? String(telegramUser.id) : null
            })
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Помилка реєстрації");
            return;
        }

        currentUser = data;
        saveSession(data);
        showAlert("Реєстрація успішна");
        showApp();
    } catch (error) {
        console.error(error);
        showAlert("API недоступне: " + error.message);
    }
}

async function loginUser() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) {
        showAlert("Введи username і password");
        return;
    }

    try {
        await wakeApi();

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Помилка входу");
            return;
        }

        currentUser = data;
        saveSession(data);
        showAlert("Вхід успішний");
        showApp();
    } catch (error) {
        console.error(error);
        showAlert("API недоступне: " + error.message);
    }
}

async function loginWithTelegram(showSuccess = true) {
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
        await wakeApi();

        const response = await fetch(`${API_BASE}/auth/telegram`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: String(telegramUser.id),
                username: telegramUser.username,
                full_name: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim()
            })
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Помилка входу через Telegram");
            return false;
        }

        currentUser = data;
        saveSession(data);
        if (showSuccess) showAlert("Вхід через Telegram успішний");
        showApp();
        return true;
    } catch (error) {
        console.error(error);
        showAlert("API недоступне: " + error.message);
        return false;
    }
}

async function autoLoginTelegram() {
    if (!telegramUser) return false;
    if (!telegramUser.username) return false;
    return await loginWithTelegram(false);
}

function setupAuthScreen() {
    initTelegramWebApp();

    const tgButton = document.getElementById("tg-login-btn");
    const remember = document.getElementById("remember-me");

    if (telegramUser) {
        if (tgButton) tgButton.textContent = "Увійти через Telegram";
        if (remember) remember.checked = true;
    } else {
        if (tgButton) tgButton.textContent = "Telegram login доступний тільки в Telegram";
    }
}

async function loadProducts() {
    const productsList = document.getElementById("products-list");
    const searchValue = document.getElementById("search-input")?.value?.trim() || "";
    const categoryValue = document.getElementById("category-filter")?.value || "Усі";

    productsList.innerHTML = `<div class="empty-card">Завантаження товарів...</div>`;

    try {
        let url = `${API_BASE}/products`;
        const params = new URLSearchParams();

        if (searchValue) params.append("q", searchValue);
        if (categoryValue !== "Усі") params.append("category", categoryValue);
        if ([...params.keys()].length > 0) url += `?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            credentials: "omit"
        });
        const products = await parseApiResponse(response);

        if (!response.ok) {
            productsList.innerHTML = `<div class="empty-card">${products.detail || "Помилка завантаження товарів"}</div>`;
            return;
        }

        if (!products.length) {
            productsList.innerHTML = `<div class="empty-card">Поки що немає товарів</div>`;
            return;
        }

        productsList.innerHTML = "";

        products.forEach(product => {
            const image = product.image_url
                ? `<img class="card-image" src="${product.image_url}" alt="${product.title}">`
                : `<div class="card-image"></div>`;

            const sellerText = product.seller_username
                ? `@${product.seller_username}`
                : (product.seller_name || "Невідомий продавець");

            const contactButton = product.seller_telegram_link
                ? `<a href="${product.seller_telegram_link}" target="_blank"><button class="contact-btn">Написати продавцю</button></a>`
                : "";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                ${image}
                <div class="card-body">
                    <div class="card-category">${product.category}</div>
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-description">${product.description}</p>
                    <p class="card-price">${product.price}$</p>
                    <p class="card-seller">Продавець: ${sellerText}</p>
                    <div class="card-actions">
                        <button class="buy-btn" onclick="addToCart(${product.id})">Додати в кошик</button>
                        ${contactButton}
                    </div>
                </div>
            `;
            productsList.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        productsList.innerHTML = `<div class="empty-card">API недоступне</div>`;
    }
}

async function createProduct() {
    if (!currentUser) {
        showAlert("Спочатку увійди в акаунт");
        return;
    }

    const title = document.getElementById("product-title").value.trim();
    const description = document.getElementById("product-description").value.trim();
    const priceRaw = document.getElementById("product-price").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const image_url = document.getElementById("product-image").value.trim();
    const price = Number(priceRaw);

    if (!title || !description || !priceRaw || !category) {
        showAlert("Заповни всі обов'язкові поля");
        return;
    }

    if (Number.isNaN(price) || price <= 0) {
        showAlert("Вкажи коректну ціну більше 0");
        return;
    }

    try {
        await wakeApi();

        const response = await fetch(`${API_BASE}/products`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                seller_id: Number(currentUser.id),
                title,
                description,
                price,
                category,
                image_url: image_url || null
            })
        });

        const data = await parseApiResponse(response);
        console.log("createProduct response:", response.status, data);

        if (!response.ok) {
            showAlert(data.detail || data.message || `Не вдалося створити оголошення (HTTP ${response.status})`);
            return;
        }

        document.getElementById("product-title").value = "";
        document.getElementById("product-description").value = "";
        document.getElementById("product-price").value = "";
        document.getElementById("product-category").value = "";
        document.getElementById("product-image").value = "";

        showAlert("Оголошення створено");
        loadProducts();
        loadMyProducts();
    } catch (error) {
        console.error(error);
        showAlert("Помилка підключення до API: " + error.message);
    }
}

async function loadMyProducts() {
    if (!currentUser) return;

    const list = document.getElementById("my-products-list");
    list.innerHTML = `<div class="empty-card">Завантаження ваших оголошень...</div>`;

    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}/products`, {
            method: "GET",
            mode: "cors",
            credentials: "omit"
        });
        const products = await parseApiResponse(response);

        if (!response.ok) {
            list.innerHTML = `<div class="empty-card">${products.detail || "Помилка завантаження"}</div>`;
            return;
        }

        if (!products.length) {
            list.innerHTML = `<div class="empty-card">У вас поки немає оголошень</div>`;
            return;
        }

        list.innerHTML = "";

        products.forEach(product => {
            const image = product.image_url
                ? `<img class="card-image" src="${product.image_url}" alt="${product.title}">`
                : `<div class="card-image"></div>`;

            const status = product.is_active ? "Активне" : "Неактивне";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                ${image}
                <div class="card-body">
                    <div class="card-category">${product.category}</div>
                    <h3 class="card-title">${product.title}</h3>
                    <p class="card-description">${product.description}</p>
                    <p class="card-price">${product.price}$</p>
                    <p class="card-seller">Статус: ${status}</p>
                    ${product.is_active ? `<button class="delete-btn" onclick="deleteProduct(${product.id})">Видалити оголошення</button>` : ""}
                </div>
            `;
            list.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        list.innerHTML = `<div class="empty-card">API недоступне</div>`;
    }
}

async function deleteProduct(productId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/products/${productId}?user_id=${currentUser.id}`, {
            method: "DELETE",
            mode: "cors",
            credentials: "omit"
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Не вдалося видалити оголошення");
            return;
        }

        showAlert("Оголошення видалено");
        loadMyProducts();
        loadProducts();
    } catch (error) {
        console.error(error);
        showAlert("Помилка підключення до API");
    }
}

async function addToCart(productId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/cart/add`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: productId
            })
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Не вдалося додати товар");
            return;
        }

        showAlert("Товар додано до кошика");
    } catch (error) {
        console.error(error);
        showAlert("Помилка підключення до API");
    }
}

async function loadCart() {
    if (!currentUser) return;

    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");

    cartList.innerHTML = `<div class="empty-card">Завантаження кошика...</div>`;
    cartTotal.textContent = "Разом: 0$";

    try {
        const response = await fetch(`${API_BASE}/cart/${currentUser.id}`, {
            method: "GET",
            mode: "cors",
            credentials: "omit"
        });
        const data = await parseApiResponse(response);

        if (!response.ok) {
            cartList.innerHTML = `<div class="empty-card">${data.detail || "Помилка завантаження кошика"}</div>`;
            return;
        }

        if (!data.items.length) {
            cartList.innerHTML = `<div class="empty-card">Кошик порожній</div>`;
            cartTotal.textContent = "Разом: 0$";
            return;
        }

        cartList.innerHTML = "";
        cartTotal.textContent = `Разом: ${data.total}$`;

        data.items.forEach(item => {
            const linkButton = item.seller_link
                ? `<a href="${item.seller_link}" target="_blank"><button class="contact-btn">Написати продавцю</button></a>`
                : "";

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-price">${item.price}$</p>
                    <div class="card-actions">
                        <button class="buy-btn" onclick="buyProduct(${item.product_id})">Купити та отримати контакти продавця</button>
                        ${linkButton}
                    </div>
                </div>
            `;
            cartList.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        cartList.innerHTML = `<div class="empty-card">API недоступне</div>`;
    }
}

async function buyProduct(productId) {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/orders/buy`, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                buyer_id: currentUser.id,
                product_id: productId
            })
        });

        const data = await parseApiResponse(response);

        if (!response.ok) {
            showAlert(data.detail || "Помилка покупки");
            return;
        }

        let message = "Покупку оформлено.\n\n";
        if (data.seller_username) message += `Telegram продавця: @${data.seller_username}\n`;
        if (data.seller_link) message += `Посилання: ${data.seller_link}`;

        showAlert(message);
        loadCart();
    } catch (error) {
        console.error(error);
        showAlert("Не вдалося виконати покупку");
    }
}

async function initApp() {
    setTimeout(async () => {
        setupAuthScreen();

        if (loadSession()) return;

        if (telegramUser) {
            await autoLoginTelegram();
        }
    }, 400);
}

initApp();
