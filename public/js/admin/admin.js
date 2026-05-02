let editingId = null;
let productsCache = [];
let currentImage = "";
let usersCache = [];
let editingUserId = null;
let editingBannerId = null;
let ordersCache = [];
let currentOrder = null;

console.log("admin.js cargado");

function login() {
  console.log("click en login");

  const userInput = document.getElementById("user");
  const passInput = document.getElementById("pass");

  fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: userInput.value,
      pass: passInput.value
    })
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("panel").style.display = "flex";
      loadProducts();
      loadCategories();
      loadCategoryFilter();
    })
    .catch(() => {
      msg.textContent = "Login incorrecto";
    });
}


function clearFilters(){
  document.getElementById("searchProduct").value = "";
  document.getElementById("filterCategory").value = "all";
  document.getElementById("filterStock").value = "all";
  applyProductFilters();
}


async function addProduct(){

  const fileInput = document.getElementById("image");

  let imageName = "";

  if(fileInput.files.length > 0){

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    const uploadRes = await fetch(
      "/api/admin/upload",
      {
        method:"POST",
        body:formData
      }
    );

    const data = await uploadRes.json();
    imageName = data.filename;

  }

  const product = {
  name: document.getElementById("name").value,
  description: document.getElementById("description").value,
  price_minor: document.getElementById("price_minor").value,
  price_major: document.getElementById("price_major").value,
  category_id: document.getElementById("category").value,
  image: imageName
};

  await fetch("/api/admin/products",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(product)
  });

  showToast("Producto agregado");

  loadProducts();

}


function loadProducts(){

  fetch("/api/products/admin")

  .then(res => res.json())

  .then(products => {

  productsCache = products

  renderProducts(products);

  });



}

function deleteProduct(id){

  if(!confirm("Eliminar producto?")) return;

  fetch("/api/admin/products/" + id,{
    method:"DELETE"
  })

  .then(() => {
    loadProducts();
  });

}

async function editProduct(product){

editingId = product.id
currentImage = product.image

await loadCategoriesSelect()

document.getElementById("name").value = product.name
document.getElementById("code").value = product.code || "";
document.getElementById("description").value = product.description
document.getElementById("price_minor").value = product.price_minor
document.getElementById("price_major").value = product.price_major
document.getElementById("stock").value = product.stock || 0;

const container = document.getElementById("previewContainer");
container.innerHTML = "";

if(product.image){
  const img = document.createElement("img");
  img.className = "previewImage";
  img.src = product.image;
  container.appendChild(img);
}

document.getElementById("category").value = product.category_id

document.getElementById("productModal").style.display = "flex"

}


function renderProducts(products){

  const container = document.getElementById("productList");
  container.innerHTML = "";

  products.forEach((p,index) => {

    const div = document.createElement("div");

    div.className = "productRow";

    div.innerHTML = `

<div class="productCard">

  <div class="imageWrapper">
    <img class="productThumb" src="${p.image}">
    
    <span class="stockBadge ${getStockClass(p.stock)}">
      ${getStockText(p.stock)}
    </span>
  </div>

  <div class="productInfo">

    <strong>${p.name}</strong>

    <span class="productCode">Cod: ${p.code || "-"}</span>

    <span class="desc">${p.description || ""}</span>

    <div class="prices">
      <span>$${p.price_minor}</span>
      <span class="major">$${p.price_major}</span>
    </div>

    <span class="category">${p.category}</span>

  </div>

  <div class="productActions">

    <button class="edit" onclick="editProductById(${p.id})">
      Editar
    </button>

    <!-- 🔥 SWITCH + TEXTO -->
    <div class="visibilityControl">
      
      <label class="switch">
        <input type="checkbox" 
          ${p.visible ? "checked" : ""} 
          onchange="toggleVisibility(${p.id}, this.checked)">
        <span class="slider"></span>
      </label>

      <span class="visibility-label">
        ${p.visible ? "Visible" : "Oculto"}
      </span>

    </div>

    <button class="delete" onclick="deleteProduct(${p.id})">
      Eliminar
    </button>

  </div>

</div>
`;

    container.appendChild(div);

  });

}

async function toggleVisibility(id, visible){

  await fetch("/api/products/" + id + "/visibility", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ visible })
  });

  // 🔥 actualizar SOLO en memoria
  const product = productsCache.find(p => p.id === id);
  if(product){
    product.visible = visible;
  }

  // 🔥 re-render SIN cambiar orden
  renderProducts(productsCache);

  showToast("Visibilidad actualizada");
}

function editProductById(id){
  const product = productsCache.find(p => p.id === id);
  editProduct(product);
}


async function loadCategoryFilter(){

  const res = await fetch("/api/categories");
  const categories = await res.json();

  const select = document.getElementById("filterCategory");

  categories.forEach(c => {
    const option = document.createElement("option");
    option.value = c.name; // usás name porque así viene en products
    option.textContent = c.name;
    select.appendChild(option);
  });

}


function applyProductFilters(){

  const search = document.getElementById("searchProduct").value.toLowerCase();
  const category = document.getElementById("filterCategory").value;
  const stock = document.getElementById("filterStock").value;

  let filtered = productsCache;

  // 🔍 búsqueda
  if(search){
    filtered = filtered.filter(p =>
      (p.name || "").toLowerCase().includes(search) ||
      (p.description || "").toLowerCase().includes(search)
    );
  }

  // 🏷 categoría
  if(category !== "all"){
    filtered = filtered.filter(p => p.category === category);
  }

  // 📦 stock
  if(stock !== "all"){
    filtered = filtered.filter(p => {
      if(stock === "out") return p.stock === 0;
      if(stock === "low") return p.stock > 0 && p.stock < 5;
      if(stock === "ok") return p.stock >= 5;
    });
  }

  renderProducts(filtered);
}


async function loadOrders(){

  const res = await fetch("/api/orders");
  const orders = await res.json();

  ordersCache = orders;

  updateOrderStats(orders);
  renderOrders();
  renderRanking(orders);

}

function updateOrderStats(orders){

  document.getElementById("statTotalOrders").textContent = orders.length;

  const totalSales = orders
    .filter(o => o.status === "vendido")
    .reduce((acc, o) => acc + Number(o.total), 0);

  document.getElementById("statTotalSales").textContent = totalSales;

  document.getElementById("statSold").textContent =
    orders.filter(o => o.status === "vendido").length;

  document.getElementById("statCanceled").textContent =
    orders.filter(o => o.status === "cancelado").length;
}

function renderOrders(){

  const container = document.getElementById("ordersList");
  container.innerHTML = "";

  const search = document.getElementById("searchOrder").value.toLowerCase();
  const statusFilter = document.getElementById("orderStatusFilter").value;

  let filtered = ordersCache;

  // 🔍 buscar cliente
  if(search){
    filtered = filtered.filter(o =>
      (o.customer_name || "").toLowerCase().includes(search) ||
      String(o.id).includes(search) ||
      String(o.total).includes(search)
    );
  }

  // 🎯 filtrar estado
  if(statusFilter !== "all"){
    filtered = filtered.filter(o => o.status === statusFilter);
  }

  filtered.forEach(o => {

    const div = document.createElement("div");
    div.className = "order-card";

    div.innerHTML = `

      <div class="order-header">

        <div>
          <strong>#${o.id}</strong>
          <span>${o.customer_name}</span>
        </div>

        <div>
          <span class="status ${o.status}">${o.status}</span>
          <strong>$${o.total}</strong>
        </div>

      </div>

      <div class="order-body hidden" id="order-${o.id}"></div>

      <div class="order-actions">
        <button onclick="openOrderModal(${o.id})">Ver</button>
        <button class="btn-success" onclick="updateOrderStatus(${o.id}, 'vendido')">
          ✔ Vender
        </button>

        <button class="btn-danger" onclick="updateOrderStatus(${o.id}, 'cancelado')">
          ✖ Cancelar
        </button>
      </div>

    `;

    container.appendChild(div);

  });

}

async function openOrderModal(id){

  const res = await fetch("/api/orders/" + id);
  const order = await res.json();

  currentOrder = order; // 🔥 GUARDAMOS EL PEDIDO

  const modal = document.getElementById("orderModal");
  const content = document.getElementById("orderModalContent");

  content.innerHTML = order.items.map(i => `
    <div class="order-item">
      <img src="${i.image}">
      <div>
        <strong>${i.name}</strong>
        <span>x${i.qty}</span>
      </div>
      <div>$${i.price * i.qty}</div>
    </div>
  `).join("");

  modal.style.display = "flex";
}

function generateRemito(){

  if(!currentOrder){
    alert("No hay pedido cargado");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 15;

  // 🧾 HEADER
  doc.setFontSize(18);
  doc.text("REMITO", 105, y, { align: "center" });

  y += 10;

  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, y);
  doc.text(`Pedido #${currentOrder.id}`, 150, y);

  y += 8;

  doc.text(`Cliente: ${currentOrder.customer_name}`, 10, y);

  y += 10;

  // 🔲 LINEA
  doc.line(10, y, 200, y);
  y += 6;

  // 🧱 CABECERA TABLA
  doc.setFontSize(10);
  doc.text("Código", 10, y);
  doc.text("Producto", 40, y);
  doc.text("Cant.", 120, y);
  doc.text("Precio", 140, y);
  doc.text("Total", 170, y);

  y += 4;
  doc.line(10, y, 200, y);
  y += 6;

  // 📦 ITEMS
  currentOrder.items.forEach(i => {

    const total = i.price * i.qty;

    doc.text(String(i.code || "-"), 10, y);
    doc.text(i.name.substring(0, 30), 40, y); // corta nombre largo
    doc.text(String(i.qty), 120, y);
    doc.text(`$${i.price}`, 140, y);
    doc.text(`$${total}`, 170, y);

    y += 6;

    // salto de página si se llena
    if(y > 270){
      doc.addPage();
      y = 20;
    }

  });

  y += 6;
  doc.line(10, y, 200, y);

  y += 10;

  // 💰 TOTAL FINAL
  doc.setFontSize(12);
  doc.text(`TOTAL: $${currentOrder.total}`, 150, y);

  y += 20;

  // ✍️ FIRMA
  doc.setFontSize(10);
  doc.text("Firma:", 10, y);
  doc.line(25, y, 100, y);

  doc.save(`remito_${currentOrder.id}.pdf`);
}

function closeOrderModal(){
  document.getElementById("orderModal").style.display = "none";
}

async function toggleOrder(id){

  const body = document.getElementById("order-" + id);

  if(!body.classList.contains("hidden")){
    body.classList.add("hidden");
    return;
  }

  const res = await fetch("/api/orders/" + id);
  const order = await res.json();

  body.innerHTML = order.items.map(i => `
    <div class="order-item">
      <img src="${i.image}" class="order-img">
      <div>
        <strong>${i.name}</strong>
        <span>x${i.qty}</span>
      </div>
      <div>$${i.price * i.qty}</div>
    </div>
  `).join("");

  body.classList.remove("hidden");

}

function renderRanking(orders){

  const container = document.getElementById("rankingClients");

  const map = {};

  orders.forEach(o => {

    if(!map[o.customer_name]){
      map[o.customer_name] = {
        total: 0,
        count: 0
      };
    }

    if(o.status === "vendido"){
      map[o.customer_name].total += Number(o.total);
      map[o.customer_name].count++;
    }

  });

  const ranking = Object.entries(map)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a,b) => b.total - a.total)
    .slice(0,5);

  container.innerHTML = "";

  ranking.forEach(r => {

    const div = document.createElement("div");

    div.className = "ranking-row";

    div.innerHTML = `
      <strong>${r.name}</strong>
      <span>$${r.total} (${r.count} compras)</span>
    `;

    container.appendChild(div);

  });

}

async function updateOrderStatus(id, status){

  await fetch("/api/orders/" + id + "/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  showToast("Estado actualizado");

  loadOrders();
}



document.getElementById("image").addEventListener("change", e => {

  const container = document.getElementById("previewContainer");
  container.innerHTML = "";

  const files = e.target.files;

  for(let i = 0; i < files.length; i++){

    const img = document.createElement("img");
    img.className = "previewImage";
    img.src = URL.createObjectURL(files[i]);

    container.appendChild(img);
  }

});

function openProductModal(){

  editingId = null

  document.getElementById("name").value=""
  document.getElementById("code").value = "";
  document.getElementById("description").value=""
  document.getElementById("price_minor").value=""
  document.getElementById("price_major").value=""
  document.getElementById("image").value=""
  document.getElementById("previewContainer").innerHTML = "";

  loadCategoriesSelect()

  document.getElementById("productModal").style.display="flex"

}

function closeProductModal(){

  document.getElementById("productModal").style.display = "none";

}

async function saveProduct() {
  const fileInput = document.getElementById("image");
  const formData = new FormData();

  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append("images", fileInput.files[i]);
  }

  formData.append("name", document.getElementById("name").value);
  formData.append("code", document.getElementById("code").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("price_minor", document.getElementById("price_minor").value);
  formData.append("price_major", document.getElementById("price_major").value);
  formData.append("category_id", Number(document.getElementById("category").value));
  formData.append("stock", document.getElementById("stock").value);

  try {
    const url = editingId
      ? "/api/admin/products/" + editingId
      : "/api/admin/products";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      body: formData
    });

    const data = await res.json();
    console.log("RESP:", data);

    if (!res.ok) {
      throw new Error("Error en servidor");
    }

    showToast(editingId ? "Producto actualizado" : "Producto creado");

    closeProductModal();
    loadProducts();

  } catch (err) {
    console.error(err);
    alert("Error real al guardar producto");
  }

  editingId = null;
}

async function loadCategoriesList(){

  const res = await fetch("/api/categories")

  const categories = await res.json()

  const select = document.getElementById("category")

  select.innerHTML = ""

  categories.forEach(c => {

    const option = document.createElement("option")

    option.value = c.id
    option.textContent = c.name

    select.appendChild(option)

  })

}

function showSection(section){

  document.querySelectorAll(".section").forEach(s=>{
    s.style.display="none"
  });

  document.getElementById(section+"Section").style.display="block";

  if(section === "categories"){
    loadCategoriesList();
  }

  if(section === "users"){
    loadUsers();
  }

  if(section === "banners"){
  loadBanners();
  }

  if(section === "orders"){
  loadOrders();
  }

  if(section === "reports"){
  loadOrders(); //
  }

  toggleMenu(true);
  
}

async function loadCategories(){

const res = await fetch("/api/categories")

const categories = await res.json()

const container = document.getElementById("categoryList")

container.innerHTML = ""

categories.forEach(cat => {

const div = document.createElement("div")

div.className = "categoryRow"

div.innerHTML = `
<span>${cat.name}</span>

<div class="categoryActions">

<button onclick="deleteCategory(${cat.id})">🗑</button>

</div>
`

container.appendChild(div)

})

}

async function createCategory(){

const name = document.getElementById("newCategoryName").value

if(!name){
alert("Ingrese nombre de categoría")
return
}

await fetch("/api/categories",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify({name})

})

document.getElementById("newCategoryName").value=""

loadCategories()

}

async function deleteCategory(id){

if(!confirm("Eliminar categoría?")) return

await fetch("/api/categories/"+id,{
method:"DELETE"
})

loadCategories()

}

async function loadCategoriesSelect(){

const res = await fetch("/api/categories")

const categories = await res.json()

const select = document.getElementById("category")

select.innerHTML = ""

categories.forEach(cat => {

const option = document.createElement("option")

option.value = cat.id
option.textContent = cat.name

select.appendChild(option)

})

}

function editProductByIndex(index){

const product = productsCache[index]

editProduct(product)

}

async function loadUsers(){

  const res = await fetch("/api/users");
  const users = await res.json();

  console.log("USERS:", users);

  usersCache = users;

  updateStats(users);
  renderUsers();
}

function renderUsers(){

  const search = document.getElementById("searchUser").value.toLowerCase();
  const filter = document.getElementById("filterStatus").value;

  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";

  let filtered = usersCache;

  // 🔍 BUSQUEDA
  if(search){
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  }

  // 🎯 FILTRO
  if(filter === "active"){
    filtered = filtered.filter(u => u.approved);
  }

  if(filter === "pending"){
    filtered = filtered.filter(u => !u.approved);
  }

  // 🧱 RENDER
  filtered.forEach(u => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge role">${u.role}</span></td>
      <td>
        <span class="badge ${u.approved ? "active" : "inactive"}">
          ${u.approved ? "Activo" : "Pendiente"}
        </span>
      </td>
      <td>
        <button onclick="editUserById(${u.id})">✏️</button>
        <button onclick="deleteUser(${u.id})">🗑</button>
        <button onclick="resetPassword(${u.id})">🔑 Reset </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

}

function updateStats(users){

  document.getElementById("totalUsers").textContent = users.length;

  document.getElementById("activeUsers").textContent =
    users.filter(u => u.approved).length;

  document.getElementById("pendingUsers").textContent =
    users.filter(u => !u.approved).length;

}

async function resetPassword(userId) {

  const confirmReset = confirm("¿Resetear contraseña a 123456?");

  if (!confirmReset) return;

  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: "PUT"
  });

  const data = await res.json();

  if (data.success) {
    alert("Contraseña reseteada a: 123456");
  } else {
    alert("Error al resetear");
  }
}

async function approveUser(id){

  await fetch("/api/admin/approve-user/" + id,{
    method:"PUT"
  });

  showToast("Usuario aprobado");
  loadUsers();
}

async function deleteUser(id){

  if(!confirm("Eliminar usuario?")) return;

  await fetch("/api/admin/users/" + id,{
    method:"DELETE"
  });

  showToast("Usuario eliminado","error");
  loadUsers();
}

function showToast(message, type="success"){

  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(()=>{
    toast.remove();
  },3000);
}

function editUser(user){

  editingUserId = user.id;

  document.getElementById("editName").value = user.name;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editRole").value = user.role;
  document.getElementById("editApproved").value = user.approved ? "1" : "0";

  document.getElementById("userModal").style.display = "flex";
}

async function saveUser(){

  const user = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    role: document.getElementById("editRole").value,
    approved: document.getElementById("editApproved").value
  };
  const validRoles = ["administrador","minorista","mayorista"];
  if(!validRoles.includes(user.role)){
  showToast("Rol inválido","error");
  return;
  }else{
    await fetch("/api/admin/users/" + editingUserId,{
      method:"PUT",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(user)
    });

    showToast("Usuario actualizado");
}
  

  closeUserModal();
  loadUsers();
}

function closeUserModal(){
  document.getElementById("userModal").style.display = "none";
}

function editUserById(id){
  const user = usersCache.find(u => u.id === id);
  editUser(user);
}


// ==========================
//  BANNERS
// ==========================

async function saveBanner() {
  const file = document.getElementById("bannerImage").files[0];
  const link = document.getElementById("bannerLink").value;
  const action = document.getElementById("bannerAction").value;

  const formData = new FormData();

  if (file) formData.append("image", file);

  formData.append("action", action);
  if (action === "link" && link) {
    formData.append("link", link);
  }

  if (editingBannerId) {
    await fetch(`/api/banners/${editingBannerId}`, {
      method: "PUT",
      body: formData
    });
  } else {
    await fetch("/api/banners", {
      method: "POST",
      body: formData
    });
  }

  closeBannerModal();
  loadBanners();
}

function toggleBannerLink(){
  const action = document.getElementById("bannerAction").value;
  const linkContainer = document.getElementById("linkContainer");

  if(action === "link"){
    linkContainer.style.display = "flex";
  }else{
    linkContainer.style.display = "none";
  }
}

// 🔥 Cargar banners

function renderBanners(banners) {
  const container = document.getElementById("bannerList");
  container.innerHTML = "";

  banners.forEach((b, index) => {

    const div = document.createElement("div");
    div.className = "productRow";

    div.innerHTML = `
      <img class="productThumb" src="${b.image_url}">

      <div class="productInfo">
        <span>${b.action_type || "none"}</span>
        <span>${b.link || "Sin link"}</span>
      </div>

      <div class="productActions">
        <button class="edit" onclick="openBannerModalByIndex(${index})">Editar</button>
        <button class="delete" onclick="deleteBanner(${b.id})">Eliminar</button>
      </div>
    `;

    container.appendChild(div);
  });

  window.bannersCache = banners;
}

function openBannerModalByIndex(index){
  const banner = window.bannersCache[index];
  openBannerModal(banner);
}

// eliminar
async function deleteBanner(id){

  if(!confirm("Eliminar banner?")) return;

  await fetch("/api/banners/" + id,{
    method:"DELETE"
  });

  showToast("Banner eliminado","error");

  loadBanners();
}


function openBannerModal(banner = null) {
  const modal = document.getElementById("bannerModal");

  modal.classList.remove("hidden");
  modal.style.display = "flex";

  const preview = document.getElementById("bannerPreview");
  preview.innerHTML = "";

  if (banner) {
    editingBannerId = banner.id;

    document.getElementById("modalTitle").innerText = "Editar banner";
    document.getElementById("bannerLink").value = banner.link || "";

    document.getElementById("bannerAction").value = banner.action_type || "none";
    toggleBannerLink();

    if (banner.image_url) {
      preview.innerHTML = `
        <img src="${banner.image_url}" 
          style="width:100%; border-radius:8px;">
      `;
    }

  } else {
    editingBannerId = null;

    document.getElementById("modalTitle").innerText = "Agregar banner";
    document.getElementById("bannerLink").value = "";
    document.getElementById("bannerImage").value = "";

    document.getElementById("bannerAction").value = "none";
    toggleBannerLink();
  }
}

function closeBannerModal() {
  const modal = document.getElementById("bannerModal");

  modal.style.display = "none";
}

async function loadBanners(){
  const res = await fetch("/api/banners");
  const banners = await res.json();

  renderBanners(banners);
}

function getStockClass(stock){
  if(stock === 0) return "out";
  if(stock < 5) return "low";
  return "ok";
}

function getStockText(stock){
  if(stock === 0) return "Sin stock";
  if(stock < 5) return "Poco stock";
  return "En stock";
}

function loadTopClients(){

  const container = document.getElementById("reportContent");

  const map = {};

  ordersCache.forEach(o => {

    if(o.status !== "vendido") return;

    if(!map[o.customer_name]){
      map[o.customer_name] = {
        total: 0,
        count: 0
      };
    }

    map[o.customer_name].total += Number(o.total);
    map[o.customer_name].count++;

  });

  const ranking = Object.entries(map)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a,b) => b.total - a.total)
    .slice(0,10);

  container.innerHTML = "<h3>Top 10 Clientes</h3>";

  ranking.forEach(r => {
    container.innerHTML += `
      <div class="ranking-row">
        <strong>${r.name}</strong>
        <span>$${r.total} (${r.count} compras)</span>
      </div>
    `;
  });

}


function loadTopProducts(){

  const container = document.getElementById("reportContent");

  const map = {};

  ordersCache.forEach(o => {

    if(o.status !== "vendido") return;

    o.items.forEach(i => {

      if(!map[i.name]){
        map[i.name] = {
          qty: 0,
          total: 0
        };
      }

      map[i.name].qty += i.qty;
      map[i.name].total += i.price * i.qty;

    });

  });

  const ranking = Object.entries(map)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a,b) => b.qty - a.qty)
    .slice(0,10);

  container.innerHTML = `
    <div class="reportBox">
      <h3>Top 10 Productos</h3>
    </div>
  `;

  ranking.forEach(p => {
    container.innerHTML += `
      <div class="ranking-row">
        <strong>${p.name}</strong>
        <span>${p.qty} vendidos ($${p.total})</span>
      </div>
    `;
  });

}

function toggleMenu(forceClose = false){
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("menuToggle");

  if(forceClose){
    sidebar.classList.remove("active");
    toggle.classList.remove("active");
    return;
  }

  sidebar.classList.toggle("active");
  toggle.classList.toggle("active");
}

window.addEventListener("click", (e) => {
  const modal = document.getElementById("orderModal");

  if(e.target === modal){
    modal.style.display = "none";
  }
});



document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnLogin")
    .addEventListener("click", login);

  const toggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

});

document.addEventListener("click", (e) => {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("menuToggle");

  if(
    sidebar.classList.contains("active") &&
    !sidebar.contains(e.target) &&
    !toggle.contains(e.target)
  ){
    toggleMenu(true); // cierra TODO (sidebar + icono)
  }
});

document.getElementById("bannerImage").addEventListener("change", e => {

  const container = document.getElementById("bannerPreview");
  container.innerHTML = "";

  const file = e.target.files[0];

  if(file){
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    

    container.appendChild(img);
  } else{
    container.innerHTML = "<span style='color:#999'>Vista previa</span>";
  }
});

document.getElementById("searchOrder").addEventListener("input", renderOrders);
document.getElementById("orderStatusFilter")
  .addEventListener("change", renderOrders);


