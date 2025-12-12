const snowContent = ['&#10052;', '&#10053;', '&#10054;']; // Copos de nieve

/*************************************************
 * JSONBIN CONFIG (likes compartidos online)
 *************************************************/
const JSONBIN_ID = "693c7f6f43b1c97be9ea065f"; 
const JSONBIN_KEY = "$2a$10$Lqe8Q.P0OOjNwkMLCP9i1OiAw./IipSOWULFjPzQxtLItqRjKFxHm";

/*************************************************
 * VARIABLES GLOBALES
 *************************************************/
let regalos = [];
let likes = {};
let filtrosActivos = [];
let escribiendo = false;

/*************************************************
 * REFERENCIAS DOM
 *************************************************/
// Modal producto
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalLink = document.getElementById("modal-link");
const modalClose = document.getElementById("modal-close");

// Modal info
const infoBtn = document.getElementById("openInfoModal");
const infoModal = document.getElementById("infoModal");
const infoClose = document.getElementById("closeInfoModal");
const infoCloseBtn = document.getElementById("closeInfoBtn");
const modalinfoTitle = document.getElementById("modalinfoTitle");

// Buscador
const searchBox = document.querySelector(".search-box");
const searchInput = document.getElementById("search");
const suggestionsPanel = document.getElementById("regalos-suggestions");

// Orden
const sortSelect = document.getElementById("sort");

/*************************************************
 * FUNCIONES ONLINE JSONBIN
 *************************************************/

// Cargar likes online
async function cargarLikesOnline() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
            headers: { "X-Master-Key": JSONBIN_KEY }
        });

        const data = await res.json();
        likes = data.record.likes || {};

        console.log("LIKES ONLINE CARGADOS:", likes);
    } catch (error) {
        console.error("Error cargando likes:", error);
    }
}

// Guardar likes online
async function guardarLikesOnline() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_KEY
            },
            body: JSON.stringify({ likes })
        });

        console.log("LIKES GUARDADOS ONLINE");
    } catch (error) {
        console.error("Error guardando likes:", error);
    }
}

/*************************************************
 * CARGAR JSON PRINCIPAL
 *************************************************/
async function iniciarApp() {
    await cargarLikesOnline();

    const res = await fetch("data.json");
    regalos = await res.json();

    renderRegalos(regalos);
    crearFiltroCategorias(regalos);
}

iniciarApp();

/*************************************************
 * RENDER TARJETAS
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

        // Abrir modal de producto
        card.addEventListener("click", e => {
            if (e.target.closest(".btn")) return;
            openModal(item);
        });

        cont.appendChild(card);
    });

    // Like
    document.querySelectorAll(".btn-like").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            likes[id] = (likes[id] || 0) + 1;
            document.getElementById(`likes-${id}`).textContent = likes[id];

            await guardarLikesOnline();
        });
    });
}

/*************************************************
 * MODAL PRODUCTO
 *************************************************/
function openModal(item) {
    modalImg.src = item.foto;
    modalTitle.textContent = item.nombre;
    modalDescription.textContent = item.descripcion;
    modalLink.href = item.enlace;

    modal.style.display = "flex";
    void modal.offsetWidth;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }, 250);
}

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
});

/*************************************************
 * BUSCADOR CON SUGERENCIAS
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
            <img src="${item.foto}">
            <span>${item.nombre}</span>
        `;

        div.addEventListener("click", () => {
            searchInput.value = item.nombre;
            suggestionsPanel.classList.remove("show");
            aplicarFiltros();
        });

        suggestionsPanel.appendChild(div);
    });

    suggestionsPanel.classList.add("show");
}

searchInput.addEventListener("input", e => {
    const texto = e.target.value.toLowerCase().trim();

    let filtrados = regalos.filter(r =>
        r.nombre.toLowerCase().includes(texto) ||
        r.descripcion.toLowerCase().includes(texto)
    );

    if (filtrosActivos.length > 0){
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
    actualizarSugerencias(filtrados);
});

document.addEventListener("click", e => {
    if (!searchBox.contains(e.target))
        suggestionsPanel.classList.remove("show");
});

/*************************************************
 * FILTROS
 *************************************************/
function crearFiltroCategorias(lista){
    const container = document.createElement("div");
    container.id = "filter-tags";

    Object.assign(container.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "center",
        margin: "20px 0"
    });

    document.body.insertBefore(container, document.getElementById("gift-container"));

    const categorias = [...new Set(lista.map(r => r.categoria).filter(Boolean))];

    categorias.forEach(cat => {
        const tag = document.createElement("div");
        tag.className = "filter-tag";
        tag.textContent = cat;

        Object.assign(tag.style, {
            padding: "8px 15px",
            borderRadius: "25px",
            background: "#2c1c1c",
            color: "#fff",
            cursor: "pointer",
            transition: "0.3s"
        });

        tag.addEventListener("click", () => {
            if (filtrosActivos.includes(cat)) {
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

    if (filtrosActivos.length > 0){
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
}

/*************************************************
 * ORDEN
 *************************************************/
sortSelect.addEventListener("change", e => {
    let copia = [...regalos];

    if (e.target.value === "likes")
        copia.sort((a,b) => (likes[b.id]||0) - (likes[a.id]||0));

    if (e.target.value === "nombre")
        copia.sort((a,b) => a.nombre.localeCompare(b.nombre));

    renderRegalos(copia);
});

/*************************************************
 * MODAL INFO
 *************************************************/
function typeWriter(element, text, i = 0) {
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

infoBtn.addEventListener("click", () => {
    infoModal.style.display = "flex";
    void infoModal.offsetWidth;
    infoModal.classList.add("show");

    modalinfoTitle.textContent = "";
    escribiendo = false;

    typeWriter(modalinfoTitle, "Mensaje Reyes Magos ✨");
    document.body.style.overflow = "hidden";
});

function cerrarInfoModal(){
    infoModal.classList.remove("show");

    setTimeout(() => {
        infoModal.style.display = "none";
        modalinfoTitle.textContent = "";
        escribiendo = false;
    }, 250);

    document.body.style.overflow = "auto";
}

infoClose.addEventListener("click", cerrarInfoModal);
infoCloseBtn.addEventListener("click", cerrarInfoModal);

infoModal.addEventListener("click", e => {
    if (e.target === infoModal) cerrarInfoModal();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && infoModal.classList.contains("show"))
        cerrarInfoModal();
});

const snowContainer = document.getElementById('snow-container');
const snowflakeCount = 40;
const snowflakes = [];

for (let i = 0; i < snowflakeCount; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.innerHTML = snowContent[Math.floor(Math.random() * snowContent.length)];
    flake.style.left = Math.random() * window.innerWidth + 'px';
    flake.style.top = Math.random() * window.innerHeight + 'px';
    flake.speed = 1 + Math.random() * 2;
    flake.wind = Math.random() * 1 - 0.5;
    snowContainer.appendChild(flake);
    snowflakes.push(flake);
}

function animateSnow() {
    snowflakes.forEach(flake => {
        let top = parseFloat(flake.style.top);
        let left = parseFloat(flake.style.left);
        top += flake.speed;
        left += flake.wind;
        if (top > window.innerHeight) top = -20; 
        if (left > window.innerWidth) left = 0;
        if (left < 0) left = window.innerWidth;
        flake.style.top = top + 'px';
        flake.style.left = left + 'px';
    });
    requestAnimationFrame(animateSnow);
}

animateSnow();