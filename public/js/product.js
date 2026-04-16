function getProductId(){

    const path = window.location.pathname;

    const parts = path.split("/");
    const slugId = parts[2]; // producto/slug-id

    const id = slugId.split("-").pop();

    return id;
}

async function loadProduct(){

    const id = getProductId();

    if(!id){
        document.body.innerHTML = "<h2>Producto no encontrado</h2>";
        return;
    }

    try {

        const res = await fetch(`/api/products/${id}`);
        const product = await res.json();

        renderProduct(product);

    } catch(err){
        console.error("Error:", err);
    }
}

function renderProduct(p){

    let currentIndex = 0;

    document.getElementById("name").innerText = p.name;
    document.getElementById("description").innerText = p.description || "";
    document.getElementById("fullDescription").innerText = p.description || "";

    const price = getPrice(p);

    document.getElementById("price").innerText = "$" + price;

    const stock = getStockStatus(p);

    const stockEl = document.createElement("div");
    stockEl.className = "stock " + stock.class;
    stockEl.innerText = stock.text;

    document.querySelector(".buy-box").prepend(stockEl);

    document.getElementById("oldPrice").innerText =
        "$" + Math.round(price * 1.25);

    const mainImage = document.getElementById("mainImage");
    const thumbnails = document.getElementById("thumbnails");

    const dotsContainer = document.getElementById("imageDots");

    const viewer = document.getElementById("fullscreenViewer");
    const viewerImg = document.getElementById("fullscreenImage");
    const closeViewer = document.getElementById("closeViewer");

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // SWIPE EN FULLSCREEN (MOBILE)
let fsStartX = 0;

viewerImg.addEventListener("touchstart", (e) => {
  fsStartX = e.touches[0].clientX;
});

viewerImg.addEventListener("touchend", (e) => {

  let diff = fsStartX - e.changedTouches[0].clientX;

  if(diff > 50){
    currentIndex++;
    if(currentIndex >= images.length) currentIndex = 0;
  }

  if(diff < -50){
    currentIndex--;
    if(currentIndex < 0) currentIndex = images.length - 1;
  }

  const newSrc = images[currentIndex];

  viewerImg.src = newSrc;
  mainImage.src = newSrc;

  result.style.backgroundImage = `url(${newSrc})`;
});


    //Abrir Fullscreen

    mainImage.addEventListener("click", () => {
        viewer.style.display = "flex";
        viewerImg.src = mainImage.src;
    });

    //Cerrar Fullscreen

    closeViewer.onclick = () => {
        viewer.style.display = "none";
    };

    thumbnails.innerHTML = "";

    const images = (p.images && p.images.length > 0)
        ? p.images
        : [p.image];

    mainImage.src = images[currentIndex];

    dotsContainer.innerHTML = "";

images.forEach((_, index) => {
  const dot = document.createElement("span");

  if(index === 0){
    dot.classList.add("active");
  }

  dotsContainer.appendChild(dot);
});

    const lens = document.getElementById("lens");
    const result = document.getElementById("zoomResult");

    const isDesktop = window.innerWidth > 768;

if(isDesktop){

  result.style.backgroundImage = `url(${mainImage.src})`;

  const zoom = 2;

  mainImage.addEventListener("mouseenter", () => {
    lens.style.display = "block";
    result.style.display = "block";
  });

  mainImage.addEventListener("mouseleave", () => {
    lens.style.display = "none";
    result.style.display = "none";
  });

  mainImage.addEventListener("mousemove", moveLens);

  function moveLens(e){

    const rect = mainImage.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const lensWidth = 120;
    const lensHeight = 120;

    x = x - lensWidth / 2;
    y = y - lensHeight / 2;

    if(x < 0) x = 0;
    if(y < 0) y = 0;
    if(x > rect.width - lensWidth) x = rect.width - lensWidth;
    if(y > rect.height - lensHeight) y = rect.height - lensHeight;

    lens.style.left = x + "px";
    lens.style.top = y + "px";

    const fx = x / rect.width;
    const fy = y / rect.height;

    result.style.backgroundSize =
      rect.width * zoom + "px " + rect.height * zoom + "px";

    result.style.backgroundPosition =
      "-" + (fx * rect.width * zoom) + "px -" + (fy * rect.height * zoom) + "px";
  }
}

  

  images.forEach((img, index) => {

    const thumb = document.createElement("img");
    thumb.src = img;

    if(index === 0){
      thumb.style.border = "2px solid #3483fa";
    }

    thumb.onclick = () => {

      mainImage.src = thumb.src;

      document.querySelectorAll("#thumbnails img")
        .forEach(i => i.style.border = "2px solid transparent");

      thumb.style.border = "2px solid #3483fa";

      result.style.backgroundImage = `url(${thumb.src})`;
    };

    thumbnails.appendChild(thumb);
  });

  document.getElementById("addBtn").onclick = () => {
    if(p.stock === 0){
      alert("Sin stock");
      return;
    }
    addToCart(p);
  };

  document.getElementById("buyBtn").onclick = () => {

    if(p.stock === 0){
      alert("Sin stock");
      return;
    }

    const phone = "5492932618493";

    const message = `
    🛒 Pedido directo

    📦 Producto: ${p.name}
    💲 Precio: $${price}

    Quiero comprar este producto.
    `;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
    };

    let startX = 0;

    mainImage.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    mainImage.addEventListener("touchend", (e) => {

        let endX = e.changedTouches[0].clientX;

        let diff = startX - endX;

  // swipe izquierda
    if(diff > 50){
        currentIndex++;
        if(currentIndex >= images.length) currentIndex = 0;
    }

  // swipe derecha
    if(diff < -50){
        currentIndex--;
        if(currentIndex < 0) currentIndex = images.length - 1;
    }

    mainImage.src = images[currentIndex];

    result.style.backgroundImage = `url(${mainImage.src})`;

  // actualizar borde thumbnails
    document.querySelectorAll("#thumbnails img")
        .forEach(i => i.style.border = "2px solid transparent");

    const activeThumb = thumbnails.children[currentIndex];
    if(activeThumb){
        activeThumb.style.border = "2px solid #3483fa";
    }

});

    function showImage(index){
  const newSrc = images[index];

  mainImage.src = newSrc;

  if(result){
    result.style.backgroundImage = `url(${newSrc})`;
  }

  // actualizar thumbnails
  document.querySelectorAll("#thumbnails img")
    .forEach(i => i.style.border = "2px solid transparent");

  const activeThumb = thumbnails.children[index];
  if(activeThumb){
    activeThumb.style.border = "2px solid #3483fa";
  }

  updateDots();
}

nextBtn.onclick = () => {
  currentIndex++;
  if(currentIndex >= images.length) currentIndex = 0;
  showImage(currentIndex);
};

prevBtn.onclick = () => {
  currentIndex--;
  if(currentIndex < 0) currentIndex = images.length - 1;
  showImage(currentIndex);
};

function updateDots(){
  const dots = dotsContainer.children;

  for(let i=0;i<dots.length;i++){
    dots[i].classList.remove("active");
  }

  if(dots[currentIndex]){
    dots[currentIndex].classList.add("active");
  }
}

}

// reutilizo lógica
function getCart(){
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart){
    localStorage.setItem("cart", JSON.stringify(cart));
}

async function shareProduct() {

  const url = window.location.href;
  const title = document.getElementById("name")?.innerText || "Producto";

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Mirá este producto: ${title}`,
        url: url
      });
    } catch (err) {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiado");
    } catch (err) {
      alert("No se pudo copiar");
    }
  }
}





document.addEventListener("DOMContentLoaded", loadProduct);