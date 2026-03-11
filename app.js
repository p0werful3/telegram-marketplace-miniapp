const API_BASE = " https://dana-unmechanised-carlita.ngrok-free.dev";

const tg = window.Telegram?.WebApp || null;
if (tg) {
    tg.expand();
}

let telegramUser = tg?.initDataUnsafe?.user || {
    id: 999999999,
    username: "local_test_user",
    first_name: "Local",
    last_name: "User"
};

const currentUser = {
    telegram_id: String(telegramUser.id),
    username: telegramUser.username || null,
    full_name: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim() || "Telegram User"
};

function showAlert(message) {
    if (tg) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

function switchTab(tabName, btn) {
    document.querySelectorAll(".tab-section").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById(`tab-${tabName}`).classList.add("active");
    btn.classList.add("active");

    if (tabName === "catalog") loadProducts();
    if (tabName === "cart") loadCart();
    if (tabName === "profile") fillProfile();
}

function fillProfile() {
    document.getElementById("profile-telegram-id").textContent = currentUser.telegram_id;
    document.getElementById("profile-username").textContent = currentUser.username ? `@${currentUser.username}` : "Немає username";
    document.getElementById("profile-fullname").textContent = currentUser.full_name;
}

async function registerUser() {
    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentUser)
        });

        if (!response.ok) {
            showAlert("Помилка реєстрації");
            return;
        }

        document.getElementById("profile-status").textContent = "Зареєстровано";
        fillProfile();
        showAlert("Користувача зареєстровано");
    } catch (error) {
        console.error(error);
        showAlert("Не вдалося підключитися до API");
    }
}

async function registerUserSilently() {
    try {
        await fetch(`${API_BASE}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentUser)
        });
    } catch (error) {
        console.error(error);
    }
}

async function loadProducts() {
    const productsList = document.getElementById("products-list");
    productsList.innerHTML = `<div class="empty-card">Завантаження товарів...</div>`;

    try {
        const response = await fetch(`${API_BASE}/products`);
        const products = await response.json();

        if (!response.ok) {
            productsList.innerHTML = `<div class="empty-card">Помилка завантаження товарів</div>`;
            return;
        }

        if (!products.length) {
            productsList.innerHTML = `<div class="empty-card">Поки що немає товарів</div>`;
            return;
        }

        productsList.innerHTML = "";

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "card";

            const image = product.image_url
                ? `<img class="card-image" src="${product.image_url}" alt="${product.title}">`
                : `<div class="card-image"></div>`;

            const sellerText = product.seller_username
                ? `@${product.seller_username}`
                : (product.seller_name || "Невідомий продавець");

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
    const title = document.getElementById("product-title").value.trim();
    const description = document.getElementById("product-description").value.trim();
    const price = document.getElementById("product-price").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const image_url = document.getElementById("product-image").value.trim();

    if (!title || !description || !price || !category) {
        showAlert("Заповни всі обов'язкові поля");
        return;
    }

    try {
        await registerUserSilently();

        const response = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                seller_telegram_id: currentUser.telegram_id,
                title,
                description,
                price: Number(price),
                category,
                image_url: image_url || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.detail || "Не вдалося створити оголошення");
            return;
        }

        document.getElementById("product-title").value = "";
        document.getElementById("product-description").value = "";
        document.getElementById("product-price").value = "";
        document.getElementById("product-category").value = "";
        document.getElementById("product-image").value = "";

        showAlert("Оголошення створено");
        loadProducts();
    } catch (error) {
        console.error(error);
        showAlert("Помилка підключення до API");
    }
}

async function addToCart(productId) {
    try {
        await registerUserSilently();

        const response = await fetch(`${API_BASE}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_telegram_id: currentUser.telegram_id,
                product_id: productId
            })
        });

        const data = await response.json();

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
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");

    cartList.innerHTML = `<div class="empty-card">Завантаження кошика...</div>`;
    cartTotal.textContent = "Разом: 0$";

    try {
        await registerUserSilently();

        const response = await fetch(`${API_BASE}/cart/${currentUser.telegram_id}`);
        const data = await response.json();

        if (!response.ok) {
            cartList.innerHTML = `<div class="empty-card">Помилка завантаження кошика</div>`;
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
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-price">${item.price}$</p>
                    <div class="card-actions">
                        <button class="contact-btn" onclick="buyProduct(${item.product_id})">Купити та отримати контакти продавця</button>
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
    try {
        await registerUserSilently();

        const response = await fetch(`${API_BASE}/orders/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                buyer_telegram_id: currentUser.telegram_id,
                product_id: productId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.detail || "Помилка покупки");
            return;
        }

        let message = "Покупку оформлено.\n\n";

        if (data.seller_username) {
            message += `Telegram продавця: @${data.seller_username}\n`;
        } else {
            message += "У продавця немає username\n";
        }

        if (data.seller_link) {
            message += `Посилання: ${data.seller_link}`;
        }

        showAlert(message);
        loadCart();
    } catch (error) {
        console.error(error);
        showAlert("Не вдалося виконати покупку");
    }
}

fillProfile();
loadProducts();
