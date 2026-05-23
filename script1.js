const BASE_URL = "https://fuerza-g-grupo-1-samira.onrender.com";

const inputGrupo    = document.getElementById("campo-grupo");
const selectNombre  = document.getElementById("campo-nombre");
const inputVidaUtil = document.getElementById("campo-vidautil");
const textareaObs   = document.getElementById("campo-obs");
const tbody         = document.getElementById("tabla-body");

const btnNuevo      = document.getElementById("btn-nuevo");
const btnModificar  = document.getElementById("btn-modificar");
const btnGuardar    = document.getElementById("btn-guardar");
const btnEliminar   = document.getElementById("btn-eliminar");
const btnDeshacer   = document.getElementById("btn-deshacer");
const btnSalir      = document.getElementById("btn-salir");

let grupos = [];
let filaSeleccionada  = null;
let grupoSeleccionado = null;
let modoFormulario    = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarGrupos();
    bloquearFormulario(true);
});

function bloquearFormulario(bloquear) {
    inputGrupo.disabled    = bloquear;
    selectNombre.disabled  = bloquear;
    inputVidaUtil.disabled = bloquear;
    textareaObs.disabled   = bloquear;
}

function limpiarFormulario() {
    inputGrupo.value    = "";
    selectNombre.selectedIndex = 0;
    inputVidaUtil.value = "";
    textareaObs.value   = "";
}

function cargarEnFormulario(item) {
    inputGrupo.value    = item.partida ?? "";
    inputVidaUtil.value = item.gestion ?? "";
    textareaObs.value   = "";

    let encontrado = false;
    for (let opt of selectNombre.options) {
        if (opt.textContent === item.descrip) {
            opt.selected = true;
            encontrado = true;
            break;
        }
    }
    if (!encontrado) {
        const opt = document.createElement("option");
        opt.value = item.descrip;
        opt.textContent = item.descrip;
        opt.selected = true;
        selectNombre.appendChild(opt);
    }
}

async function cargarGrupos() {
    try {
        const res = await fetch(`${BASE_URL}/api/objgasto`);
        if (!res.ok) throw new Error("Error " + res.status);
        grupos = await res.json();
        renderizarTabla(grupos);
        llenarSelect(grupos);
    } catch (e) {
        mostrarMensaje("No se pudo conectar con el servidor.", "error");
    }
}

function llenarSelect(lista) {
    selectNombre.innerHTML = "<option value=''>-- Seleccione --</option>";
    lista.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.partida;
        opt.textContent = g.descrip ?? "";
        selectNombre.appendChild(opt);
    });
}

function renderizarTabla(lista) {
    tbody.innerHTML = "";
    const totalFilas = Math.max(lista.length, 9);

    for (let i = 0; i < totalFilas; i++) {
        const tr = document.createElement("tr");
        if (i < lista.length) {
            const g = lista[i];
            tr.innerHTML = `
                <td>${g.partida ?? ""}</td>
                <td>${g.descrip ?? ""}</td>
            `;
            tr.style.cursor = "pointer";
            tr.addEventListener("click", () => seleccionarFila(tr, g));
        } else {
            tr.innerHTML = `<td>&nbsp;</td><td></td>`;
        }
        tbody.appendChild(tr);
    }
}

function seleccionarFila(tr, grupo) {
    tbody.querySelectorAll("tr").forEach(r => r.classList.remove("seleccionado"));
    tr.classList.add("seleccionado");
    filaSeleccionada  = tr;
    grupoSeleccionado = grupo;
    cargarEnFormulario(grupo);
    modoFormulario = null;
}

btnNuevo.addEventListener("click", () => {
    modoFormulario    = "nuevo";
    grupoSeleccionado = null;
    filaSeleccionada  = null;
    tbody.querySelectorAll("tr").forEach(r => r.classList.remove("seleccionado"));
    limpiarFormulario();
    bloquearFormulario(false);
    inputGrupo.focus();
});

btnModificar.addEventListener("click", () => {
    if (!grupoSeleccionado) {
        mostrarMensaje("Selecciona una fila primero.", "error");
        return;
    }
    modoFormulario = "modificar";
    bloquearFormulario(false);
    inputGrupo.disabled = true;
    selectNombre.focus();
    mostrarMensaje("Edita y presiona Guardar.", "info");
});

btnGuardar.addEventListener("click", async () => {
    const partida = inputGrupo.value.trim();
    const descrip = selectNombre.options[selectNombre.selectedIndex]?.textContent?.trim() ?? "";
    const gestion = parseInt(inputVidaUtil.value) || new Date().getFullYear();

    if (!partida || !descrip || descrip === "-- Seleccione --") {
        mostrarMensaje("Grupo y Nombre son obligatorios.", "error");
        return;
    }

    const datos = { partida, descrip, gestion };

    try {
        let res;
        if (modoFormulario === "nuevo") {
            res = await fetch(`${BASE_URL}/api/objgasto`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
            });
        } else if (modoFormulario === "modificar" && grupoSeleccionado) {
            res = await fetch(`${BASE_URL}/api/objgasto/${grupoSeleccionado.partida}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos),
            });
        } else {
            mostrarMensaje("Presiona Nuevo o Modificar primero.", "error");
            return;
        }

        if (!res.ok) throw new Error("Error " + res.status);

        mostrarMensaje(
            modoFormulario === "nuevo" ? "Guardado correctamente." : "Actualizado correctamente.",
            "ok"
        );
        modoFormulario    = null;
        grupoSeleccionado = null;
        bloquearFormulario(true);
        limpiarFormulario();
        await cargarGrupos();

    } catch (e) {
        mostrarMensaje("Error al guardar: " + e.message, "error");
    }
});

btnEliminar.addEventListener("click", async () => {
    if (!grupoSeleccionado) {
        mostrarMensaje("Selecciona una fila primero.", "error");
        return;
    }
    if (!confirm(`¿Eliminar el grupo "${grupoSeleccionado.partida}"?`)) return;

    try {
        const res = await fetch(`${BASE_URL}/api/objgasto/${grupoSeleccionado.partida}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error " + res.status);
        mostrarMensaje("Eliminado correctamente.", "ok");
        grupoSeleccionado = null;
        filaSeleccionada  = null;
        bloquearFormulario(true);
        limpiarFormulario();
        await cargarGrupos();
    } catch (e) {
        mostrarMensaje("Error al eliminar: " + e.message, "error");
    }
});

btnDeshacer.addEventListener("click", () => {
    modoFormulario    = null;
    grupoSeleccionado = null;
    filaSeleccionada  = null;
    limpiarFormulario();
    bloquearFormulario(true);
    tbody.querySelectorAll("tr").forEach(r => r.classList.remove("seleccionado"));
});

btnSalir.addEventListener("click", () => {
    if (confirm("¿Deseas salir?")) {
        window.location.href = "index.html";
    }
});

function mostrarMensaje(texto, tipo) {
    document.getElementById("msg-alerta")?.remove();
    const div = document.createElement("div");
    div.id = "msg-alerta";
    div.textContent = texto;
    div.classList.add("msg-alerta");
    if (tipo === "ok")    div.classList.add("msg-ok");
    if (tipo === "error") div.classList.add("msg-error");
    if (tipo === "info")  div.classList.add("msg-info");
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}