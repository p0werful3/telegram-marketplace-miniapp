const API_URL = "https://dana-unmechanised-carlita.ngrok-free.dev";

const tg = window.Telegram.WebApp;
tg.expand();

let user = tg.initDataUnsafe.user;

async function loadProducts() {
    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();

    const container = document.getElementById("products");
    container.innerHTML = "";

    products.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img class="card-image" src="${p.image_url}">
            <div class="card-body">
                <span class="card-category">${p.category}</span>
                <h3 class="card-title">${p.title}</h3>
                <p class="card-description">${p.description}</p>
                <div class="card-price">${p.price}$</div>
                <button class="buy-btn" onclick="addToCart(${p.id})">
                    Додати в кошик
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function createProduct() {
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const price = document.getElementById("price").value;
    const category = document.getElementById("category").value;
    const image = document.getElementById("image").value;

    await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            description,
            price,
            category,
            image_url: image,
            telegram_id: user.id,
            username: user.username
        })
    });

    alert("Оголошення створено!");
    loadProducts();
}

let cart = [];

function addToCart(id) {
    cart.push(id);
    alert("Товар додано в кошик");
}

function showProfile() {
    document.getElementById("tg_id").innerText = user.id;
    document.getElementById("username").innerText = user.username;
    document.getElementById("name").innerText = user.first_name;
}

loadProducts();
showProfile();
