/*************************************************
 * VARIABLES GLOBALES
 *************************************************/
let regalos = [];
let likes = JSON.parse(localStorage.getItem("likes")) || {};
let filtrosActivos = [];
let escribiendo = false; // ← FIX para evitar duplicación en modal info

/*************************************************
 * REFERENCIAS DEL DOM
 *************************************************/
// Modal de regalos
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalLink = document.getElementById("modal-link");
const modalClose = document.getElementById("modal-close");

// Buscador
const searchBox = document.querySelector(".search-box");
const searchInput = document.getElementById("search");
const suggestionsPanel = document.getElementById("regalos-suggestions");

// Orden
const sortSelect = document.getElementById("sort");

/*************************************************
 * CARGAR JSON
 *************************************************/
fetch("data.json")
  .then(res => res.json())
  .then(data => {
      regalos = data;
      renderRegalos(regalos);
      crearFiltroCategorias(regalos);
  });

/*************************************************
 * RENDER DE TARJETAS
 *************************************************/
function renderRegalos(lista){
    const cont = document.getElementById("gift-container");
    cont.innerHTML = "";

    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "gift-card";

        card.innerHTML = `
            <img src="${item.foto}" class="gift-img" alt="${item.nombre}">
            <div class="title">${item.nombre}</div>
            <div class="description">${item.descripcion}</div>
            <div class="button-area">
                <a href="${item.enlace}" target="_blank" class="btn btn-comprar">Enlace de Compra</a>
                <button class="btn btn-like" data-id="${item.id}">❤️ <span id="likes-${item.id}">${likes[item.id] || 0}</span></button>
            </div>
        `;

        card.addEventListener("click", e=>{
            if(e.target.closest(".btn")) return;
            openModal(item);
        });

        cont.appendChild(card);
    });

    document.querySelectorAll(".btn-like").forEach(btn=>{
        btn.addEventListener("click", ()=>{
            const id = btn.dataset.id;
            likes[id] = (likes[id] || 0) + 1;
            localStorage.setItem("likes", JSON.stringify(likes));
            document.getElementById(`likes-${id}`).textContent = likes[id];
        });
    });
}

/*************************************************
 * MODAL REGALOS
 *************************************************/
function openModal(item) {
    modalImg.src = item.foto;
    modalTitle.textContent = item.nombre;
    modalDescription.textContent = item.descripcion;
    modalLink.href = item.enlace;

    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    setTimeout(()=>{
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 250);
}

modalClose.addEventListener("click", closeModal);
window.addEventListener("click", e => {
    if(e.target === modal) closeModal();
});

/*************************************************
 * SUGERENCIAS PREMIUM
 *************************************************/
function actualizarSugerencias(lista){
    suggestionsPanel.innerHTML = "";

    if (searchInput.value.trim() === "") {
        suggestionsPanel.classList.remove("show");
        return;
    }

    if (lista.length === 0){
        const empty = document.createElement("div");
        empty.textContent = "No se encontraron resultados";
        empty.className = "suggestion empty";
        suggestionsPanel.appendChild(empty);
        suggestionsPanel.classList.add("show");
        return;
    }

    lista.forEach(item => {
        const div = document.createElement("div");
        div.className = "suggestion";

        div.innerHTML = `
            <img src="${item.foto}" alt="${item.nombre}">
            <span>${item.nombre}</span>
        `;

        div.addEventListener("click", ()=>{
            searchInput.value = item.nombre;
            suggestionsPanel.classList.remove("show");
            aplicarFiltros();
        });

        suggestionsPanel.appendChild(div);
    });

    suggestionsPanel.classList.add("show");
}

/*************************************************
 * EVENTOS DEL BUSCADOR
 *************************************************/
searchInput.addEventListener("input", e=>{
    const texto = e.target.value.trim().toLowerCase();

    let filtrados = regalos.filter(r => 
        r.nombre.toLowerCase().includes(texto) || 
        r.descripcion.toLowerCase().includes(texto)
    );

    if(filtrosActivos.length > 0){
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
    actualizarSugerencias(filtrados);
});

// Ocultar sugerencias
document.addEventListener("click", e=>{
    if(!searchBox.contains(e.target)){
        suggestionsPanel.classList.remove("show");
    }
});

/*************************************************
 * FILTROS POR CATEGORÍA
 *************************************************/
function crearFiltroCategorias(lista){
    const container = document.createElement("div");
    container.id = "filter-tags";
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "10px";
    container.style.justifyContent = "center";
    container.style.margin = "20px 0";

    document.body.insertBefore(container, document.getElementById("gift-container"));

    const categorias = [...new Set(lista.map(r => r.categoria).filter(Boolean))];

    categorias.forEach(cat => {
        const tag = document.createElement("div");
        tag.className = "filter-tag";
        tag.textContent = cat;
        tag.style.padding = "8px 15px";
        tag.style.borderRadius = "25px";
        tag.style.background = "#2c1c1c";
        tag.style.color = "#fff";
        tag.style.cursor = "pointer";
        tag.style.transition = "0.3s";

        tag.addEventListener("click", ()=>{
            if(filtrosActivos.includes(cat)){
                filtrosActivos = filtrosActivos.filter(f => f !== cat);
                tag.style.background = "#2c1c1c";
            } else {
                filtrosActivos.push(cat);
                tag.style.background = "#ff4b5c";
            }
            aplicarFiltros();
        });

        container.appendChild(tag);
    });
}

function aplicarFiltros(){
    const texto = searchInput.value.toLowerCase();

    let filtrados = regalos.filter(r => 
        r.nombre.toLowerCase().includes(texto) ||
        r.descripcion.toLowerCase().includes(texto)
    );

    if(filtrosActivos.length > 0){
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
}

/*************************************************
 * ORDENAR
 *************************************************/
sortSelect.addEventListener("change", e=>{
    let copia = [...regalos];

    if(e.target.value === "likes") 
        copia.sort((a,b)=>(likes[b.id]||0)-(likes[a.id]||0));

    if(e.target.value === "nombre") 
        copia.sort((a,b)=>a.nombre.localeCompare(b.nombre));

    renderRegalos(copia);
});

/*************************************************
 * BOTÓN RESET LIKES
 *************************************************/
const resetBtn = document.createElement("button");
resetBtn.textContent = "Reiniciar Likes";

Object.assign(resetBtn.style, {
    position:"fixed",
    top:"20px",
    right:"20px",
    padding:"10px 15px",
    zIndex:"10000",
    background:"#ff4b5c",
    color:"#fff",
    border:"none",
    borderRadius:"10px",
    cursor:"pointer"
});

document.body.appendChild(resetBtn);

resetBtn.addEventListener("click", ()=>{
    likes = {};
    localStorage.setItem("likes", JSON.stringify(likes));
    aplicarFiltros();
});

/*************************************************
 * MODAL INFO (MENSAJE REYES MAGOS)
 *************************************************/
const infoBtn = document.getElementById('openInfoModal');
const infoModal = document.getElementById('infoModal');
const infoClose = document.getElementById('closeInfoModal');
const infoCloseBtn = document.getElementById('closeInfoBtn');
const modalinfoTitle = document.getElementById('modalinfoTitle');

/*************** ABRIR ***************/
function abrirInfo() {
    infoModal.classList.add('show');
    modalinfoTitle.textContent = "";
    typeWriter(modalinfoTitle, "Mensaje Reyes Magos ✨");
}

infoBtn.addEventListener('click', abrirInfo);
infoBtn.addEventListener('touchstart', abrirInfo, { passive: true });

/*************** EFECTO ESCRITURA — FIX ***************/
function typeWriter(element, text, i = 0) {
    if (escribiendo) return;

    escribiendo = true;
    element.textContent = "";

    function escribir() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(escribir, 50);
        } else {
            escribiendo = false;
        }
    }

    escribir();
}

/*************** CERRAR ***************/
function cerrarInfoModal(){
    infoModal.classList.remove("show");
    modalinfoTitle.textContent = "";
    escribiendo = false;
}

infoClose.addEventListener('click', cerrarInfoModal);
infoCloseBtn.addEventListener('click', cerrarInfoModal);

infoModal.addEventListener('click', e => {
    if (e.target === infoModal) cerrarInfoModal();
});