/*************************************************
 * VARIABLES GLOBALES
 *************************************************/
let regalos = [];
let likes = JSON.parse(localStorage.getItem("likes")) || {};
let filtrosActivos = [];

/*************************************************
 * REFERENCIAS DOM
 *************************************************/
// Modal principal
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalLink = document.getElementById("modal-link");
const modalClose = document.getElementById("modal-close");

// Modal Info
const infoModal = document.getElementById("infoModal");
const infoBtn = document.getElementById("openInfoModal");
const infoClose = document.getElementById("closeInfoModal");
const infoCloseBtn = document.getElementById("closeInfoBtn");
const infoTitle = document.getElementById("modalinfoTitle");

// Buscador
const searchInput = document.getElementById("search");
const searchBox = document.querySelector(".search-box");
const suggestionsPanel = document.getElementById("regalos-suggestions");

// Orden
const sortSelect = document.getElementById("sort");

/*************************************************
 * FIX MOVIL — UTILIDAD ÚNICA
 *************************************************/
function addSafeClickListener(element, handler) {
    let locked = false;

    element.addEventListener("click", e => {
        if (locked) return;
        locked = true;
        handler(e);
        setTimeout(() => locked = false, 350);
    });
}

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
 * RENDER TARJETAS
 *************************************************/
function renderRegalos(lista) {
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
                <button class="btn btn-like" data-id="${item.id}">
                    ❤️ <span id="likes-${item.id}">${likes[item.id] || 0}</span>
                </button>
            </div>
        `;

        // Abrir modal al tocar tarjeta
        addSafeClickListener(card, e => {
            if (e.target.closest(".btn")) return;
            openModal(item);
        });

        cont.appendChild(card);
    });

    // Likes
    document.querySelectorAll(".btn-like").forEach(btn => {
        addSafeClickListener(btn, () => {
            const id = btn.dataset.id;
            likes[id] = (likes[id] || 0) + 1;
            localStorage.setItem("likes", JSON.stringify(likes));
            document.getElementById(`likes-${id}`).textContent = likes[id];
        });
    });
}

/*************************************************
 * MODAL PRINCIPAL
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

addSafeClickListener(modalClose, closeModal);

modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
});

/*************************************************
 * MODAL INFO
 *************************************************/
addSafeClickListener(infoBtn, () => {
    infoTitle.textContent = ""; // Reset
    infoModal.classList.add("show");
    typeWriter(infoTitle, "Mensaje de Víctor ✨");
});

addSafeClickListener(infoClose, () => {
    infoModal.classList.remove("show");
    infoTitle.textContent = "";
});

addSafeClickListener(infoCloseBtn, () => {
    infoModal.classList.remove("show");
    infoTitle.textContent = "";
});

infoModal.addEventListener("click", e => {
    if (e.target === infoModal) {
        infoModal.classList.remove("show");
        infoTitle.textContent = "";
    }
});

/*************************************************
 * ANIMACIÓN TYPEWRITER
 *************************************************/
function typeWriter(element, text, i = 0) {
    if (i < text.length) {
        element.textContent += text.charAt(i);
        setTimeout(() => typeWriter(element, text, i + 1), 50);
    }
}

/*************************************************
 * SUGERENCIAS PREMIUM
 *************************************************/
function actualizarSugerencias(lista) {
    suggestionsPanel.innerHTML = "";

    if (searchInput.value.trim() === "") {
        suggestionsPanel.classList.remove("show");
        return;
    }

    if (lista.length === 0) {
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

        addSafeClickListener(div, () => {
            searchInput.value = item.nombre;
            suggestionsPanel.classList.remove("show");
            aplicarFiltros();
        });

        suggestionsPanel.appendChild(div);
    });

    suggestionsPanel.classList.add("show");
}

searchInput.addEventListener("input", e => {
    const texto = e.target.value.trim().toLowerCase();

    let filtrados = regalos.filter(r =>
        r.nombre.toLowerCase().includes(texto) ||
        r.descripcion.toLowerCase().includes(texto)
    );

    if (filtrosActivos.length > 0) {
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
    actualizarSugerencias(filtrados);
});

// Ocultar sugerencias al click fuera
document.addEventListener("click", e => {
    if (!searchBox.contains(e.target)) {
        suggestionsPanel.classList.remove("show");
    }
});

/*************************************************
 * FILTROS POR CATEGORÍA
 *************************************************/
function crearFiltroCategorias(lista) {
    const container = document.createElement("div");
    container.id = "filter-tags";
    container.className = "tags-container";
    document.body.insertBefore(container, document.getElementById("gift-container"));

    const categorias = [...new Set(lista.map(r => r.categoria).filter(Boolean))];

    categorias.forEach(cat => {
        const tag = document.createElement("div");
        tag.className = "filter-tag";
        tag.textContent = cat;

        addSafeClickListener(tag, () => {
            if (filtrosActivos.includes(cat)) {
                filtrosActivos = filtrosActivos.filter(f => f !== cat);
                tag.classList.remove("active");
            } else {
                filtrosActivos.push(cat);
                tag.classList.add("active");
            }
            aplicarFiltros();
        });

        container.appendChild(tag);
    });
}

function aplicarFiltros() {
    const texto = searchInput.value.toLowerCase();

    let filtrados = regalos.filter(r =>
        r.nombre.toLowerCase().includes(texto) ||
        r.descripcion.toLowerCase().includes(texto)
    );

    if (filtrosActivos.length > 0) {
        filtrados = filtrados.filter(r => filtrosActivos.includes(r.categoria));
    }

    renderRegalos(filtrados);
}

/*************************************************
 * ORDENAR
 *************************************************/
addSafeClickListener(sortSelect, () => {
    let copia = [...regalos];

    if (sortSelect.value === "likes") {
        copia.sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
    }
    if (sortSelect.value === "nombre") {
        copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    renderRegalos(copia);
});

/*************************************************
 * BOTÓN REINICIAR LIKES
 *************************************************/
const resetBtn = document.createElement("button");
resetBtn.textContent = "Reiniciar Likes";
resetBtn.className = "reset-likes";

addSafeClickListener(resetBtn, () => {
    likes = {};
    localStorage.setItem("likes", JSON.stringify(likes));
    aplicarFiltros();
});

document.body.appendChild(resetBtn);