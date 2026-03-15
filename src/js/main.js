// URL base de la API. Ajustar según la ruta del servidor local (XAMPP/MAMP)
const API_URL = 'http://localhost/GLOBALMARKET/server/api';

document.addEventListener('DOMContentLoaded', () => {
    // Enrutador básico: Detecta en qué página estamos según los elementos del DOM
    if (document.getElementById('featured-products')) {
        cargarProductos(true); // Cargar solo destacados en index.html
    }
    if (document.getElementById('catalogo-grid')) {
        cargarProductos(false); // Cargar todo el catálogo en productos.html
    }
    if (document.getElementById('prod-nombre')) {
        cargarDetalleProducto(); // Cargar detalle de un producto específico
    }
    if (document.getElementById('form-login')) {
        inicializarAuth(); // Configurar eventos de login y registro
    }
    if (document.getElementById('tabla-carrito')) {
        cargarCarrito(); // Mostrar los productos añadidos al carrito
    }

    actualizarUIUsuario();
});

// ==========================================
// 1. GESTIÓN DE PRODUCTOS
// ==========================================

async function cargarProductos(esDestacado) {
    try {
        const respuesta = await fetch(`${API_URL}/productos.php`);
        const productos = await respuesta.json();

        const contenedor = document.getElementById(esDestacado ? 'featured-products' : 'catalogo-grid');
        contenedor.innerHTML = ''; // Limpiar estado de carga

        // Si es destacado, mostrar solo los primeros 4
        const productosAMostrar = esDestacado ? productos.slice(0, 4) : productos;

        productosAMostrar.forEach(prod => {
            const html = `
                <div class="col-md-${esDestacado ? '3' : '4'}">
                    <div class="card h-100 shadow-sm">
                        <img src="../assets/img/prod-${prod.id_producto}.jpg" class="card-img-top" alt="${prod.nombre}">
                        <div class="card-body text-center">
                            <h5 class="card-title">${prod.nombre}</h5>
                            <p class="card-text fw-bold text-primary">${parseFloat(prod.precio).toFixed(2)} €</p>
                            <a href="producto-detalle.html?id=${prod.id_producto}" class="btn ${esDestacado ? 'btn-outline-primary' : 'btn-primary'} w-100">
                                ${esDestacado ? 'Ver Detalles' : 'Comprar'}
                            </a>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += html;
        });
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

async function cargarDetalleProducto() {
    // Obtener el ID de la URL (ej: producto-detalle.html?id=2)
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        document.getElementById('prod-nombre').innerText = "Producto no encontrado";
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/productos.php?id=${idProducto}`);
        if (!respuesta.ok) throw new Error("Producto no encontrado");

        const prod = await respuesta.json();

        document.getElementById('prod-nombre').innerText = prod.nombre;
        document.getElementById('prod-precio').innerText = `${parseFloat(prod.precio).toFixed(2)} €`;
        const imgElement = document.getElementById('prod-img');
        if (imgElement) {
            imgElement.src = `../assets/img/prod-${prod.id_producto}.jpg`;
            // Si no encuentra la imagen, carga la de por defecto
            imgElement.onerror = () => imgElement.src = '../assets/img/default.jpg';
        }
        document.getElementById('prod-desc').innerText = prod.descripcion || "Sin descripción disponible.";

        // Configurar el botón de añadir al carrito
        const btnAñadir = document.querySelector('button.btn-success');
        btnAñadir.onclick = () => agregarAlCarrito(prod.id_producto);

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('prod-nombre').innerText = "Error al cargar el producto";
    }
}

// ==========================================
// 2. AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================

function inicializarAuth() {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = formLogin.querySelector('input[type="email"]').value;
        const contrasena = formLogin.querySelector('input[type="password"]').value;

        try {
            const respuesta = await fetch(`${API_URL}/usuarios.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'login', email, contrasena })
            });
            const data = await respuesta.json();

            if (respuesta.ok) {
                alert("Bienvenido a GlobalMarket");
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.href = 'index.html';
            } else {
                alert(data.mensaje || "Error en credenciales");
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
    });

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = formRegistro.querySelectorAll('input');
        const nombre = inputs[0].value;
        const email = inputs[1].value;
        const contrasena = inputs[2].value;

        try {
            const respuesta = await fetch(`${API_URL}/usuarios.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'registro', nombre, email, contrasena })
            });
            const data = await respuesta.json();

            if (respuesta.ok) {
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                formRegistro.reset();
            } else {
                alert(data.mensaje || "Error al registrar");
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
    });
}

function actualizarUIUsuario() {
    // Si el usuario está logueado, cambiar "Entrar" por "Mi Cuenta / Salir" en la navbar
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const loginLink = document.querySelector('a[href="login.html"]');

    if (usuarioLogueado && loginLink) {
        loginLink.innerHTML = `👤 Hola, ${usuarioLogueado.nombre}`;
        loginLink.href = "#";
        loginLink.onclick = () => {
            if (confirm("¿Deseas cerrar sesión?")) {
                localStorage.removeItem('usuario');
                window.location.reload();
            }
        };
    }
}

// ==========================================
// 3. CARRITO DE COMPRAS
// ==========================================

async function agregarAlCarrito(idProducto) {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));

    if (!usuarioLogueado) {
        alert("Debes iniciar sesión para añadir productos al carrito.");
        window.location.href = 'login.html';
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/carrito.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuarioLogueado.id_usuario,
                id_producto: idProducto
            })
        });

        if (respuesta.ok) {
            alert("Producto añadido al carrito con éxito.");
        } else {
            const data = await respuesta.json();
            alert("Error: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error añadiendo al carrito:", error);
    }
}

async function cargarCarrito() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const tabla = document.getElementById('tabla-carrito');

    if (!usuarioLogueado) {
        tabla.innerHTML = '<tr><td colspan="4" class="text-center">Inicia sesión para ver tu carrito</td></tr>';
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/carrito.php?id_usuario=${usuarioLogueado.id_usuario}`);
        const productosCarrito = await respuesta.json();

        tabla.innerHTML = '';
        let subtotal = 0;

        if (productosCarrito.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" class="text-center">Tu carrito está vacío</td></tr>';
        } else {
            productosCarrito.forEach(prod => {
                subtotal += parseFloat(prod.precio);
                tabla.innerHTML += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="../assets/img/prod-${prod.id_producto}.jpg" width="50" class="me-3 rounded" alt="${prod.nombre}" onerror="this.src='../assets/img/default.jpg'">
                                <span>${prod.nombre}</span>
                            </div>
                        </td>
                        <td><input type="number" class="form-control w-50" value="1" min="1" disabled></td>
                        <td>${parseFloat(prod.precio).toFixed(2)} €</td>
                        <td><button class="btn btn-sm btn-outline-danger">X</button></td>
                    </tr>
                `;
            });
        }

        // Actualizar resumen (asumiendo que los elementos existen en el DOM)
        const resumenElementos = document.querySelectorAll('.card-body .d-flex span:nth-child(2)');
        if (resumenElementos.length >= 3) {
            const envio = subtotal > 0 ? 5.00 : 0;
            resumenElementos[0].innerText = `${subtotal.toFixed(2)} €`;
            resumenElementos[1].innerText = `${envio.toFixed(2)} €`;
            resumenElementos[2].innerText = `${(subtotal + envio).toFixed(2)} €`;
        }

    } catch (error) {
        console.error("Error cargando carrito:", error);
    }
}