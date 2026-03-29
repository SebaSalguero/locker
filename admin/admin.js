function login() {
  fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
    .then(res => res.json())
    .then(user => {
      if (user.role !== "admin") {
        msg.innerText = "No autorizado";
        return;
      }

      localStorage.setItem("admin", "true");
      location.href = "panel.html";
    });
}
if (!localStorage.getItem("admin") && location.pathname.includes("panel")) {
  location.href = "login.html";
}

const form = document.getElementById("productForm");

if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();

    const data = new FormData(form);

    fetch("http://localhost:3000/api/products", {
      method: "POST",
      body: data
    })
      .then(res => res.json())
      .then(() => {
        status.innerText = "Producto agregado correctamente";
        form.reset();
      });
  });
}

