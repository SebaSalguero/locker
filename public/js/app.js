let allProducts = [];
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {

  let cart = getCart();

  const price = getPrice(product);

  const existing = cart.find(p => p.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: price,
      qty: 1
    });
  }

  saveCart(cart);
  updateCartCount();

  showToast("Producto agregado al carrito");


}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function getPrice(product) {
  const user = getUser();

  // visitante o minorista
  if (!user || user.tipo === "minorista") {
    return product.price_minor;
  }

  // mayorista
  if (user.tipo === "mayorista") {
    return product.price_major;
  }

  return product.price_minor;
}

function updateCartCount() {

  const cart = getCart();

  let total = 0;

  cart.forEach(p => {
    total += p.qty;
  });

  document.getElementById("cartCount").innerText = total;

}


function renderUserBar() {
  const userBar = document.getElementById("userBar");
  const user = JSON.parse(localStorage.getItem("user"));

  // visitante (no logueado)
  if (!user) {
    userBar.innerHTML = `
      <div class="user-bar">
        <button onclick="showLogin()">Iniciar sesión</button>

      </div>
    `;
    return;
  }

  // usuario logueado
  userBar.innerHTML = `
    <div class="user-bar">
      Hola <strong>${user.nombre}</strong> (${user.tipo})
      <button onclick="logout()">Cerrar sesión</button>
    </div>
  `;
}


function logout() {
  localStorage.removeItem("user");
  location.reload();
}

async function loadProducts() {

  try {

    const res = await fetch("/api/products");
    allProducts = await res.json();
    const products = allProducts;

    const container = document.getElementById("products");

    container.innerHTML = "";

    renderProducts(products);

  } catch(err) {

    console.error("Error cargando productos:", err);

  }

}

function filterProducts(){

  const text = document
  .getElementById("searchInput")
  .value
  .toLowerCase();

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(text) ||
    p.description.toLowerCase().includes(text)
  );

  renderProducts(filtered);

}

function filterCategory(cat){

  if(cat === "all"){
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(p => p.category_id === cat);

  renderProducts(filtered);

}

function renderProducts(products){

const container = document.getElementById("products");

container.innerHTML = "";

products.forEach(p => {

const card = document.createElement("div");

card.className = "product-card";

card.innerHTML = `
<div class="product-image">
<img src="/uploads/${p.image}">
</div>

<div class="product-info">

<h3>${p.name}</h3>

<p class="desc">
${p.description}
</p>

<div class="price">

<span class="old-price">
$${Math.round(p.price_minor * 1.25)}
</span>

<span class="new-price">
$${getPrice(p)}
</span>

</div>

<button class="buy-btn">
Agregar al carrito
</button>

</div>
`;

card.querySelector(".buy-btn").onclick =
() => addToCart(p);

container.appendChild(card);

});

}

function showLogin() {
  const loginBox = document.getElementById("login");
  loginBox.classList.toggle("active");
}



async function login() {

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Completar usuario y contraseña");
    return;
  }

  try {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      alert("Usuario o contraseña incorrectos");
      return;
    }

    const data = await res.json();

    // 🔐 FORZAR CAMBIO DE CONTRASEÑA
    if (data.force_password_change) {

      const newPass = prompt("Debes cambiar tu contraseña. Ingresá una nueva:");

      await fetch("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.id,
          currentPassword: password,
          newPassword: newPass
        })
      });

      alert("Contraseña actualizada. Volvé a iniciar sesión.");
      return;
    }

    // ✅ GUARDAR USUARIO COMPLETO
    localStorage.setItem("user", JSON.stringify(data));

    showLogin();
    renderUserBar();
    loadProducts();

  } catch (err) {

    console.error(err);
    alert("Error conectando con el servidor");

  }

}




function buyProduct(product) {

  const user = getUser();
  const price = getPrice(product);

  const message = `
Pedido desde LOCKER

Producto: ${product.name}
Precio: $${price}
Cliente: ${user ? user.nombre : "Visitante"}
  `;

  const phone = "5492932618493"; // tu numero

  const url =
    "https://wa.me/" +
    phone +
    "?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");
}


function toggleCart(){

  const panel = document.getElementById("cartPanel");

  panel.classList.toggle("active");

  renderCart();

}

function openCart(){

  const panel = document.getElementById("cartPanel");

  panel.classList.add("active");

  renderCart();

}

function closeCart(){

  const panel = document.getElementById("cartPanel");

  panel.classList.remove("active");

}

function sendOrder() {

  const cart = getCart();
  const user = getUser(); // 👈 CLAVE

  if (cart.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  let message = "Pedido desde LOCKER\n\n";

  // 👤 DATOS DEL CLIENTE
  if (user) {
    message += `Cliente: ${user.nombre}\n`;
    message += `Email: ${user.email}\n`;
    message += `Tipo: ${user.tipo}\n`;
    message += `ID: ${user.id}\n\n`;
  } else {
    message += `Cliente: Visitante\n\n`;
  }

  message += "Productos:\n";

  let total = 0;

  cart.forEach(p => {
    message += `- ${p.name} x${p.qty} = $${p.price * p.qty}\n`;
    total += p.price * p.qty;
  });

  message += `\nTOTAL: $${total}`;

  const phone = "5492932618493";

  const url =
    "https://wa.me/" +
    phone +
    "?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");

  localStorage.removeItem("cart");
  updateCartCount();
  closeCart();
}





function increaseQty(index){

  const cart = getCart();

  cart[index].qty++;

  saveCart(cart);

  renderCart();
  updateCartCount();

}

function decreaseQty(index){

  const cart = getCart();

  if(cart[index].qty > 1){
    cart[index].qty--;
  }

  saveCart(cart);

  renderCart();
  updateCartCount();

}

function removeItem(index){

  const cart = getCart();

  cart.splice(index,1);

  saveCart(cart);

  renderCart();
  updateCartCount();

}

function renderCart(){

  const cart = getCart();

  const container = document.getElementById("cartItemsPanel");

  container.innerHTML = "";

  let total = 0;

  if(cart.length === 0){

    container.innerHTML = "<p>El carrito está vacío</p>";

    return;

  }

  cart.forEach((p,index)=>{

    const subtotal = p.price * p.qty;

    total += subtotal;

    const item = document.createElement("div");

    item.className = "cart-item";

    item.innerHTML = `

      <div>

        <strong>${p.name}</strong>

        <div class="cart-controls">

          <button onclick="decreaseQty(${index})">-</button>

          <span>${p.qty}</span>

          <button onclick="increaseQty(${index})">+</button>

          <button onclick="removeItem(${index})">🗑</button>

        </div>

      </div>

      <div>$${subtotal}</div>

    `;

    container.appendChild(item);

  });

  const totalBox = document.createElement("div");

  totalBox.className = "cart-total";

  totalBox.innerHTML = `

    <hr>

    <strong>Total: $${total}</strong>

  `;

  container.appendChild(totalBox);

}

function showToast(message){

const toast = document.getElementById("toast");

toast.innerText = message;

toast.classList.add("show");

setTimeout(()=>{
  toast.classList.remove("show");
},2000);

}

async function loadCategories(){

const res = await fetch("/api/categories")
const categories = await res.json()

const nav = document.getElementById("categoriesNav")

nav.innerHTML = ""

// botón TODOS
const btnAll = document.createElement("button")
btnAll.textContent = "Todos"
btnAll.onclick = () => filterCategory("all")

nav.appendChild(btnAll)

// categorías de la base de datos
categories.forEach(cat => {

const btn = document.createElement("button")

btn.textContent = cat.name

btn.onclick = () => filterCategory(cat.id)

nav.appendChild(btn)

})

}

function openRegister() {
  document.getElementById("login").classList.remove("active");
  document.getElementById("register").classList.add("active");
}

function closeRegister() {
  document.getElementById("register").classList.remove("active");
}

async function register() {

  const nombre = document.getElementById("regNombre").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPass").value;

  if (!nombre || !email || !password) {
    alert("Completar todos los campos");
    return;
  }

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      nombre,
      email,
      password,
      tipo:'minorista' })
  });

  if (res.ok) {
    const user = await res.json();

    // guardamos sesión automáticamente
    localStorage.setItem("user", JSON.stringify(user));

    closeRegister();        // cerrar modal
    renderUserBar();        // actualizar UI
    loadProducts();         // actualizar precios
    showToast("Cuenta creada y sesión iniciada");
  } else {
    alert("Error al registrarse");
  }

}

// cerrar modal clickeando el fondo oscuro






document.addEventListener("DOMContentLoaded", () => {

  const cartPanel = document.getElementById("cartPanel");

  const registerModal = document.getElementById("register");

  const input = document.getElementById("searchInput");

  // limpiar al cargar
  input.value = "";

  // limpiar después de que Chrome meta mano
  setTimeout(() => {
    input.value = "";
  }, 100);

    registerModal.addEventListener("click", function(e) {
      if (e.target === registerModal) {
      closeRegister();
      }
    });

  cartPanel.addEventListener("click", function(e){
    e.stopPropagation();
  });

  document.addEventListener("click", function(e){

    if(
      cartPanel.classList.contains("active") &&
      !cartPanel.contains(e.target) &&
      !e.target.closest(".cart-button")
    ){
      closeCart();
  }

});

  renderUserBar();
  loadProducts();
  loadCategories();
  updateCartCount();

  document
  .getElementById("searchInput")
  .addEventListener("input", filterProducts);

  const modal = document.getElementById("login");

  

  modal.addEventListener("click", function(e) {
    if (e.target === modal) {
      showLogin();
    }
  });

});

document.addEventListener("keydown", function (e) {

  if (e.key === "Escape") {

    closeCart();

  }

});

document.addEventListener("keydown", function (e) {

  const modal = document.getElementById("login");

  if (e.key === "Escape" && modal.classList.contains("active")) {
    showLogin();
  }

});

window.showLogin = showLogin;
window.login = login;
window.logout = logout;
window.filterCategory = filterCategory;

// LOGIN con tecla ENTER
document.addEventListener("keydown", function (e) {

  const modal = document.getElementById("login");

  // solo si el modal está abierto
  if (!modal.classList.contains("active")) return;


  // si presiona ENTER
  if (e.key === "Enter") {
    login();
  }
});

