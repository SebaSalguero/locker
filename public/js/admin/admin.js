let editingId = null;
let productsCache = [];
let currentImage = "";
let usersCache = [];
let editingUserId = null;
let editingBannerId = null;

console.log("admin.js cargado");

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btnLogin")
    .addEventListener("click", login);
});

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
      loadCategories()
    })
    .catch(() => {
      msg.textContent = "Login incorrecto";
    });
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

  fetch("/api/products")

  .then(res => res.json())

  .then(products => {

  productsCache = products

  const container = document.getElementById("productList");

  container.innerHTML = "";

  products.forEach((p,index) => {

      const div = document.createElement("div");

div.className = "productRow";

div.innerHTML = `

<img class="productThumb" src="${p.image}">

<div class="productInfo">

<strong>${p.name}</strong>

<span>${p.description}</span>

<span>Minorista: $${p.price_minor}</span>

<span>Mayorista: $${p.price_major}</span>

<span>Categoría: ${p.category}</span>

</div>

<div class="productActions">

<button onclick="editProductByIndex(${index})">✏️</button>

<button onclick="deleteProduct(${p.id})">
🗑
</button>

</div>

`;

      container.appendChild(div);

    });

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
document.getElementById("description").value = product.description
document.getElementById("price_minor").value = product.price_minor
document.getElementById("price_major").value = product.price_major

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
  formData.append("description", document.getElementById("description").value);
  formData.append("price_minor", document.getElementById("price_minor").value);
  formData.append("price_major", document.getElementById("price_major").value);
  formData.append("category_id", Number(document.getElementById("category").value));

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

  
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("active");
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
        <button onclick="approveUser(${u.id})">✔</button>
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

  const formData = new FormData();
  if (file) formData.append("image", file);
  formData.append("link", link);

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
        <span>${b.link || "Sin link"}</span>
      </div>

      <div class="productActions">
        <button onclick="openBannerModalByIndex(${index})">✏️</button>
        <button onclick="deleteBanner(${b.id})">🗑</button>
      </div>
    `;

    container.appendChild(div);
  });

  window.bannersCache = banners; // 🔥 guardás en memoria
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
  document.getElementById("bannerModal").classList.remove("hidden");

  const preview = document.getElementById("bannerPreview");
  preview.innerHTML = ""; // limpiar siempre

  if (banner) {
    editingBannerId = banner.id;

    document.getElementById("modalTitle").innerText = "Editar banner";
    document.getElementById("bannerLink").value = banner.link || "";

    // 🔥 ACA VA LO QUE ME PREGUNTASTE
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

    preview.innerHTML = "";
  }
}

function closeBannerModal() {
  document.getElementById("bannerModal").classList.add("hidden");
}



document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnLogin")
    .addEventListener("click", login);

  const toggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

});

document.addEventListener("click", (e) => {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.getElementById("menuToggle");

  if(
    sidebar.classList.contains("active") &&
    !sidebar.contains(e.target) &&
    e.target !== toggle
  ){
    sidebar.classList.remove("active");
  }
});

document.getElementById("bannerImage").addEventListener("change", e => {

  const container = document.getElementById("bannerPreview");
  container.innerHTML = "";

  const file = e.target.files[0];

  if(file){
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "100%";
    img.style.borderRadius = "8px";

    container.appendChild(img);
  }
});


