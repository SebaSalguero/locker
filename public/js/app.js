let allProducts = [];
let tempUserForPasswordChange = null;
let tempPassword = null;

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
        image: product.image,
        qty: 1
      });
  }

  saveCart(cart);
  updateCartCount();
  animateCart();
  renderCart();
  openCart();

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

  const el = document.getElementById("cartCount");
if (el) el.innerText = total;

}


function renderUserBar() {
  const userBar = document.getElementById("userBar");
  const user = JSON.parse(localStorage.getItem("user"));

  // visitante (no logueado)
  if (!user) {
    userBar.innerHTML = `
      <div class="user-bar">
        

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

    loadBanners();

  } catch(err) {

    console.error("Error cargando productos:", err);

  }

}

function filterProducts() {

  const text = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  if (!text) {
    renderProducts(allProducts);
    return;
  }

  const results = allProducts
    .map(p => {

      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();

      let score = 0;

      if (name.includes(text)) score += 3;
      if (name.startsWith(text)) score += 5;
      if (desc.includes(text)) score += 1;

      return { ...p, score };

    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  renderProducts(results);
}

function filterCategory(cat){

  // si NO estoy en index → redirigir
  if(!document.getElementById("products")){
    window.location.href = `/index.html?category=${cat}`;
    return;
  }

  if(cat === "all"){
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(p => p.category_id === cat);
  renderProducts(filtered);
}

function highlight(text, search) {
  if (!search) return text;

  const regex = new RegExp(`(${search})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function renderProducts(products){

const container = document.getElementById("products");

if (!container) return;

container.innerHTML = "";

products.forEach(p => {

const card = document.createElement("div");

const search = document.getElementById("searchInput").value;

card.className = "product-card";

card.innerHTML = `
<div class="product-image">
  <img src="${p.image}" class="clickable-img">
</div>

<div class="product-info">

<h3>${highlight(p.name, search)}</h3>

<p class="desc">
${highlight(p.description, search)}
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

const imgEl = card.querySelector(".clickable-img");

imgEl.onclick = () => {
  const slug = slugify(p.name);
  window.location.href = `/producto/${slug}-${p.id}`;
};

card.querySelector(".buy-btn").onclick = (e) => {

  const img = card.querySelector("img"); //  imagen del producto

  flyToCart(img);     
  addToCart(p);      

};

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

    // FORZAR CAMBIO DE CONTRASEÑA
    if (data.force_password_change) {

  tempUserForPasswordChange = data;
  tempPassword = password;

  openChangePasswordModal();
  return;
}

    //  GUARDAR USUARIO COMPLETO
    localStorage.setItem("user", JSON.stringify(data));

    showLogin();
    renderUserBar();
    loadProducts();

  } catch (err) {

    console.error(err);
    alert("Error conectando con el servidor");

  }

}

function openChangePasswordModal(){
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("changePasswordModal").classList.add("active");
}

function closeChangePasswordModal(){
  document.getElementById("changePasswordModal").classList.remove("active");
}

async function submitNewPassword(){

  const newPass = document.getElementById("newPassword").value.trim();
  const confirmPass = document.getElementById("confirmPassword").value.trim();

  if(!newPass || !confirmPass){
    alert("Completar ambos campos");
    return;
  }

  if(newPass.length < 4){
    alert("Mínimo 4 caracteres");
    return;
  }

  if(newPass !== confirmPass){
    alert("Las contraseñas no coinciden");
    return;
  }

  try {

    await fetch("/api/users/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: tempUserForPasswordChange.id,
        currentPassword: tempPassword,
        newPassword: newPass
      })
    });

    alert("Contraseña actualizada");

    // guardar usuario ahora sí
    localStorage.setItem("user", JSON.stringify(tempUserForPasswordChange));

    closeChangePasswordModal();
    renderUserBar();
    loadProducts();

  } catch (err) {
    console.error(err);
    alert("Error al cambiar contraseña");
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

  const phone = "5492932618493";

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
  const user = getUser(); 

  if (cart.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  let message = "Pedido desde LOCKER\n\n";

  // 👤 DATOS DEL CLIENTE
  if (user) {
    message += `Cliente: ${user.nombre}\n`;
    message += `Email: ${user.email}\n`;
    if (user.tipo=="mayorista"){
      message += `Tipo: ${user.tipo}\n`;
    }
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

  <img src="${p.image || 'default.png'}" class="cart-img">

  <div class="cart-info">

    <h4>${p.name}</h4>

    <p class="cart-price">$${p.price}</p>

    <div class="cart-controls">

      <button onclick="decreaseQty(${index})">−</button>

      <span>${p.qty}</span>

      <button onclick="increaseQty(${index})">+</button>

    </div>

  </div>

  <div class="cart-right">

    <span class="cart-subtotal">$${subtotal}</span>

    <button class="cart-remove" onclick="removeItem(${index})">
      ✕
    </button>

  </div>

`;

    container.appendChild(item);

  });

  const totalBox = document.createElement("div");

  totalBox.className = "cart-total-box";

  totalBox.innerHTML = `
    <div class="cart-total-line">
      <span>Total</span>
      <strong>$${total}</strong>
    </div>
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
  const menu = document.getElementById("menuCategories");

  nav.innerHTML = ""
  if(menu) menu.innerHTML = ""

  // ===== BOTÓN TODOS =====

  const btnAll = document.createElement("button")
  btnAll.textContent = "Todos"
  btnAll.onclick = () => filterCategory("all")
  nav.appendChild(btnAll)

  if(menu){
    const btnAllMenu = document.createElement("button");
    btnAllMenu.textContent = "Todos";
    btnAllMenu.onclick = () => {
      filterCategory("all");
      toggleMenu();
    };
    menu.appendChild(btnAllMenu);
  }

  // ===== CATEGORÍAS =====

  categories.forEach(cat => {

    // NAV NORMAL
    const btn = document.createElement("button")
    btn.textContent = cat.name
    btn.onclick = () => filterCategory(cat.id)
    nav.appendChild(btn)

    // MENÚ HAMBURGUESA
    if(menu){
      const btnMenu = document.createElement("button");
      btnMenu.textContent = cat.name;
      btnMenu.onclick = () => {
        filterCategory(cat.id);
        toggleMenu();
      };
      menu.appendChild(btnMenu);
    }

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

function toggleMenu(){

  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  menu.classList.toggle("active");
  overlay.classList.toggle("active");

}

function showSuggestions(text) {

  const box = document.getElementById("suggestions");

  if (!text) {
    box.innerHTML = "";
    return;
  }

  const matches = allProducts
    .filter(p =>
      (p.name || "").toLowerCase().includes(text)
    )
    .slice(0, 5);

  box.innerHTML = "";

  matches.forEach(p => {

    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerText = p.name;

    div.onclick = () => {
      document.getElementById("searchInput").value = p.name;
      box.innerHTML = "";
      filterProducts();
    };

    box.appendChild(div);

  });
}

function animateCart() {
  const icon = document.querySelector('.cart-icon');

  if (!icon) return;

  // resetear animación si ya estaba activa
  icon.classList.remove('bump');

  // forzar reflow para reiniciar animación
  void icon.offsetWidth;

  icon.classList.add('bump');

  setTimeout(() => {
    icon.classList.remove('bump');
  }, 400);
}


function flyToCart(imgElement) {

  const cartIcon = document.querySelector(".cart-icon");

  if (!imgElement || !cartIcon) return;

  // posiciones
  const imgRect = imgElement.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();

  // clon de la imagen
  const clone = imgElement.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.top = imgRect.top + "px";
  clone.style.left = imgRect.left + "px";
  clone.style.width = imgRect.width + "px";
  clone.style.height = imgRect.height + "px";
  clone.style.zIndex = 9999;
  clone.style.pointerEvents = "none";
  clone.style.transition = "all 0.7s cubic-bezier(.22,.61,.36,1)";

  document.body.appendChild(clone);

  // destino (centro del carrito)
  const targetX = cartRect.left + cartRect.width / 2 - imgRect.width / 2;
  const targetY = cartRect.top + cartRect.height / 2 - imgRect.height / 2;

  // animación
  requestAnimationFrame(() => {
    clone.style.transform = `
      translate(${targetX - imgRect.left}px, ${targetY - imgRect.top}px)
      scale(0.2)
      rotate(10deg)
    `;
    clone.style.opacity = "0.5";
  });

  // cleanup
  setTimeout(() => {
    clone.remove();
  }, 700);
}



function openProductModal(product){

  const modal = document.getElementById("productModal");

  document.getElementById("modalName").innerText = product.name;
  document.getElementById("modalDesc").innerText = product.description || "";

  document.getElementById("modalPrice").innerText = "$" + getPrice(product);
  document.getElementById("modalOldPrice").innerText =
    "$" + Math.round(product.price_minor * 1.25);

  document.getElementById("modalMainImage").src = product.image;

  // botón agregar
  document.getElementById("modalAddBtn").onclick = () => {
    addToCart(product);
  };

  modal.classList.add("active");
}

function closeProductModal(){
  document.getElementById("productModal").classList.remove("active");
}


function slugify(text){
  return text
    .toLowerCase()
    .normalize("NFD") // saca acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}




let bannerIndex = 1;
let bannerData = [];
let bannerInterval;

async function loadBanners() {
  try {
    const res = await fetch("/api/banners");
    bannerData = await res.json();

    const track = document.getElementById("carouselTrack");
    const dotsContainer = document.getElementById("carouselDots");

    if (!track) return;

    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    const fullData = [
  bannerData[bannerData.length - 1], // último al inicio
  ...bannerData,
  bannerData[0] // primero al final
];

fullData.forEach((b, i) => {

  const slide = document.createElement("div");
  slide.className = "carousel-slide";

  const img = document.createElement("img");
  img.src = b.image_url;

img.onclick = () => {
  if (b.link) {
    const url = b.link.startsWith("http")
      ? b.link
      : "https://" + b.link;

    window.open(url, "_blank");
  }
};

slide.appendChild(img);

  track.appendChild(slide);
});

    updateDots();
    startCarousel();

    addSwipe(); // 🔥 mobile gesture

  } catch (err) {
    console.error("Error cargando banners:", err);
  }
}

function startCarousel() {
  stopCarousel();

  bannerInterval = setInterval(() => {
    bannerIndex++;
    updateCarousel();
  }, 4000);
}

function stopCarousel() {
  clearInterval(bannerInterval);
}

function updateCarousel() {
  const track = document.getElementById("carouselTrack");

  track.style.transition = "transform 0.8s cubic-bezier(0.77,0,0.175,1)";
  track.style.transform = `translateX(-${bannerIndex * 100}%)`;

  // loop infinito
  if (bannerIndex === 0) {
    setTimeout(() => {
      track.style.transition = "none";
      bannerIndex = bannerData.length;
      track.style.transform = `translateX(-${bannerIndex * 100}%)`;
    }, 800);
  }

  if (bannerIndex === bannerData.length + 1) {
    setTimeout(() => {
      track.style.transition = "none";
      bannerIndex = 1;
      track.style.transform = `translateX(-100%)`;
    }, 800);
  }

  updateDots();
}

function goToSlide(i) {
  bannerIndex = i;
  updateCarousel();
}

function updateDots() {
  const dots = document.querySelectorAll("#carouselDots span");

  dots.forEach((d, i) => {
    d.classList.toggle("active", i === bannerIndex);
  });
}


function addSwipe() {
  const carousel = document.querySelector(".carousel");

  let startX = 0;
  let isDragging = false;

  carousel.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    isDragging = true;
    stopCarousel();
  });

  carousel.addEventListener("touchmove", e => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;

    const track = document.getElementById("carouselTrack");
    track.style.transform = `translateX(calc(-${bannerIndex * 100}% - ${diff}px))`;
  });

  carousel.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (diff > 50) {
      bannerIndex++;
    } else if (diff < -50) {
      bannerIndex--;
    }

    updateCarousel();
    startCarousel();
    isDragging = false;
  });
}



document.addEventListener("DOMContentLoaded", () => {

  const cartPanel = document.getElementById("cartPanel");

  const registerModal = document.getElementById("register");

  const input = document.getElementById("searchInput");

  // limpiar al cargar
  if (input) {
    input.value = "";

    setTimeout(() => {
      input.value = "";
    }, 100);
  };

  // limpiar después de que Chrome meta mano
  setTimeout(() => {
    input.value = "";
  }, 100);

  const icon = document.querySelector('.cart-icon');
if(icon){
  icon.classList.add('bump');
  setTimeout(() => {
    icon.classList.remove('bump');
  }, 400);
}

    if (registerModal) {
  registerModal.addEventListener("click", function(e) {
    if (e.target === registerModal) {
      closeRegister();
    }
  });
}

  if (cartPanel) {
    cartPanel.addEventListener("click", function(e){
      e.stopPropagation();
    });
  }

  document.addEventListener("click", function(e){

    if(
      cartPanel &&
      cartPanel.classList.contains("active") &&
      !cartPanel.contains(e.target) &&
      !e.target.closest(".cart-button")
    ){
      closeCart();
  }

});

  renderUserBar();
  if(document.getElementById("products")){
    loadProducts();
  }
  loadCategories();
  updateCartCount();

  window.addEventListener("storage", () => {
  updateCartCount();
  renderCart();
});

  const productModal = document.getElementById("productModal");

  if (productModal) {
    productModal.addEventListener("click", function(e){
      if(e.target === this){
        closeProductModal();
      }
    });
  };




if (input && document.getElementById("products")) {
  input.addEventListener("input", (e) => {
    const text = e.target.value.toLowerCase();
    filterProducts();
    showSuggestions(text);
  });
}

  const modal = document.getElementById("login");

  

  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === modal) {
        showLogin();
      }
    });
  };

  const params = new URLSearchParams(window.location.search);
const search = params.get("search");

if (search) {
  const input = document.getElementById("searchInput");
  input.value = search;
  filterProducts();
}

const changeModal = document.getElementById("changePasswordModal");

if (changeModal) {
  changeModal.addEventListener("click", function(e) {
    if (e.target === changeModal) {
      // NO cerrar → obligar cambio
    }
  });
}

});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeCart();

    const modal = document.getElementById("login");
    if (modal.classList.contains("active")) {
      showLogin();
    }
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


document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-input")) {
    document.getElementById("suggestions").innerHTML = "";
  }
});

const input = document.getElementById("searchInput");

if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = input.value.trim();

      if (!value) return;

      window.location.href = `/index.html?search=${encodeURIComponent(value)}`;
    }
  });
}