let orders = [];

function getUser(){
  return JSON.parse(localStorage.getItem("user"));
}

function goHome(){
  window.location.href = "/";
}

async function loadMyOrders(){

  const user = getUser();

  if(!user){
    alert("Tenés que iniciar sesión");
    window.location.href = "/";
    return;
  }

  const res = await fetch("/api/orders/my/" + user.id);
  orders = await res.json();

  renderOrders();
}

function renderOrders(){

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "";

  const filter = document.getElementById("filterStatus").value;

  let filtered = orders;

  if(filter !== "all"){
    filtered = filtered.filter(o => o.status === filter);
  }

  if(filtered.length === 0){
    container.innerHTML = "<p>No tenés pedidos todavía</p>";
    return;
  }

  filtered.forEach(o => {

    const div = document.createElement("div");
    div.className = "order-card";

    div.innerHTML = `

      <div class="order-top">

        <div>
          <strong>Pedido #${o.id}</strong>
          <span>${formatDate(o.created_at)}</span>
        </div>

        <div class="status ${o.status}">
          ${formatStatus(o.status)}
        </div>

      </div>

      <div class="order-products" id="items-${o.id}">
        Cargando productos...
      </div>

      <div class="order-footer">
        <strong>Total: $${o.total}</strong>

        ${
          o.status === "pendiente"
          ? `<button onclick="reorder(${o.id})">Repetir pedido</button>`
          : ""
        }
      </div>

    `;

    container.appendChild(div);

    loadOrderItems(o.id);

  });

}

async function loadOrderItems(orderId){

  const res = await fetch("/api/orders/" + orderId);
  const order = await res.json();

  const container = document.getElementById("items-" + orderId);

  container.innerHTML = order.items.map(i => `
    <div class="order-item">

      <img src="${i.image}" />

      <div class="info">
        <strong>${i.name}</strong>
        <span>Cantidad: ${i.qty}</span>
      </div>

      <div class="price">
        $${i.price * i.qty}
      </div>

    </div>
  `).join("");

}

function formatStatus(status){

  const map = {
    pendiente: "Pendiente",
    en_proceso: "En preparación",
    enviado: "En camino",
    vendido: "Entregado",
    cancelado: "Cancelado"
  };

  return map[status] || status;

}

function formatDate(date){
  return new Date(date).toLocaleDateString();
}

function reorder(orderId){
  alert("Después lo conectamos al carrito 😉");
}

document.getElementById("filterStatus")
  .addEventListener("change", renderOrders);

document.addEventListener("DOMContentLoaded", loadMyOrders);