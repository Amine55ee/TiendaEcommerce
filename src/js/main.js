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
                        <img src="../assets/img/prod-${prod.id_producto}.jpg" class="card-img-top" alt="${prod.nombre}" onerror="this.src='../assets/img/default.jpg'">
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
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const loginLink = document.querySelector('a[href="login.html"]');

    if (usuarioLogueado && loginLink) {
        loginLink.innerHTML = `👤 Hola, ${usuarioLogueado.nombre}`;
        loginLink.href = "#";
        loginLink.onclick = (e) => {
            e.preventDefault();
            // Menú rápido de gestión de cuenta simulado con prompt
            const accion = prompt("Gestión de tu cuenta:\n\n1. Cambiar tu nombre\n2. Eliminar cuenta definitivamente\n3. Cerrar Sesión\n\nIntroduce el número de la opción (1, 2 o 3):");
            
            if (accion === "1") {
                const nuevoNombre = prompt("Introduce tu nuevo nombre:", usuarioLogueado.nombre);
                if (nuevoNombre && nuevoNombre.trim() !== "" && nuevoNombre !== usuarioLogueado.nombre) {
                    modificarPerfil(usuarioLogueado, nuevoNombre);
                }
            } else if (accion === "2") {
                if (confirm("⚠️ ¿Seguro que deseas ELIMINAR tu cuenta? Perderás el acceso a GlobalMarket. Esta acción no se puede deshacer.")) {
                    eliminarPerfil(usuarioLogueado.id_usuario);
                }
            } else if (accion === "3") {
                localStorage.removeItem('usuario');
                window.location.reload();
            }
        };
    }
}

// Función para aplicar el UPDATE al servidor
async function modificarPerfil(usuario, nuevoNombre) {
    try {
        const respuesta = await fetch(`${API_URL}/usuarios.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_usuario: usuario.id_usuario, 
                nombre: nuevoNombre,
                apellidos: usuario.apellidos || '',
                telefono: usuario.telefono || '',
                direccion: usuario.direccion || ''
            })
        });
        const data = await respuesta.json();
        
        if (respuesta.ok) {
            alert("Tu nombre ha sido actualizado con éxito.");
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            window.location.reload();
        } else {
            alert("Error: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
}

// Función para aplicar el DELETE al servidor
async function eliminarPerfil(idUsuario) {
    try {
        const respuesta = await fetch(`${API_URL}/usuarios.php?id=${idUsuario}`, {
            method: 'DELETE'
        });
        const data = await respuesta.json();
        
        if (respuesta.ok) {
            alert("Cuenta eliminada correctamente. ¡Hasta pronto!");
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
        } else {
            alert("No se pudo eliminar: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
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

    // Leer la cantidad del input (si existe, de lo contrario asume 1)
    const inputCantidad = document.getElementById('prod-cantidad');
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;

    try {
        const respuesta = await fetch(`${API_URL}/carrito.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_usuario: usuarioLogueado.id_usuario, 
                id_producto: idProducto,
                cantidad: cantidad // Enviar la cantidad a la API
            })
        });
        
        if (respuesta.ok) {
            alert(`Se han añadido ${cantidad} unidad(es) al carrito con éxito.`);
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
                // Multiplicar el precio por la cantidad real del carrito
                subtotal += parseFloat(prod.precio) * parseInt(prod.cantidad);
                
                tabla.innerHTML += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="../assets/img/prod-${prod.id_producto}.jpg" width="50" class="me-3 rounded" alt="${prod.nombre}" onerror="this.src='../assets/img/default.jpg'">
                                <span>${prod.nombre}</span>
                            </div>
                        </td>
                        <td>
                            <div class="input-group input-group-sm" style="width: 110px;">
                                <button class="btn btn-outline-secondary" onclick="modificarCantidadCarrito(${prod.id_producto}, ${prod.cantidad - 1})">-</button>
                                <input type="text" class="form-control text-center" value="${prod.cantidad}" readonly>
                                <button class="btn btn-outline-secondary" onclick="modificarCantidadCarrito(${prod.id_producto}, ${prod.cantidad + 1})">+</button>
                            </div>
                        </td>
                        <td>${parseFloat(prod.precio).toFixed(2)} €</td>
                        <td><button class="btn btn-sm btn-outline-danger" onclick="eliminarProductoCarrito(${prod.id_producto})">X</button></td>
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

// Funciones para modificar y eliminar productos del carrito
async function modificarCantidadCarrito(idProducto, nuevaCantidad) {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    
    // Si la cantidad baja a 0, se elimina el producto directamente
    if (nuevaCantidad <= 0) {
        return eliminarProductoCarrito(idProducto);
    }

    try {
        await fetch(`${API_URL}/carrito.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuarioLogueado.id_usuario,
                id_producto: idProducto,
                cantidad: nuevaCantidad
            })
        });
        cargarCarrito(); // Recargar la tabla para mostrar los nuevos totales
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
    }
}

async function eliminarProductoCarrito(idProducto) {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    
    if(confirm("¿Seguro que deseas quitar este producto del carrito?")) {
        try {
            await fetch(`${API_URL}/carrito.php?id_usuario=${usuarioLogueado.id_usuario}&id_producto=${idProducto}`, {
                method: 'DELETE'
            });
            cargarCarrito(); // Recargar la tabla para reflejar el borrado
        } catch (error) {
            console.error("Error al eliminar producto:", error);
        }
    }
}