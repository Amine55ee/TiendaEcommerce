const API_URL = '../server/api';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('featured-products')) cargarProductos(true);
    if (document.getElementById('catalogo-grid')) cargarProductos(false);
    if (document.getElementById('prod-nombre')) cargarDetalleProducto();
    if (document.getElementById('form-login') || document.getElementById('form-registro')) inicializarAuth();
    if (document.getElementById('tabla-carrito')) cargarCarrito();
    if (document.getElementById('tabla-admin-pedidos')) inicializarAdmin();
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
        contenedor.innerHTML = ''; 

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
    } catch (error) { console.error("Error cargando productos:", error); }
}

async function cargarDetalleProducto() {
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) return document.getElementById('prod-nombre').innerText = "Producto no encontrado";

    try {
        const respuesta = await fetch(`${API_URL}/productos.php?id=${idProducto}`);
        if (!respuesta.ok) throw new Error("Producto no encontrado");

        const prod = await respuesta.json();
        document.getElementById('prod-nombre').innerText = prod.nombre;
        document.getElementById('prod-precio').innerText = `${parseFloat(prod.precio).toFixed(2)} €`;
        
        const imgElement = document.getElementById('prod-img');
        if (imgElement) {
            imgElement.src = `../assets/img/prod-${prod.id_producto}.jpg`;
            imgElement.onerror = () => imgElement.src = '../assets/img/default.jpg';
        }
        document.getElementById('prod-desc').innerText = prod.descripcion || "Sin descripción disponible.";

        // CORRECCIÓN: Botón robusto
        const btnAñadir = document.getElementById('btn-add-cart');
        if (btnAñadir) {
            btnAñadir.onclick = (e) => {
                e.preventDefault();
                agregarAlCarrito(prod.id_producto);
            };
        }
    } catch (error) { document.getElementById('prod-nombre').innerText = "Error al cargar el producto"; }
}

// ==========================================
// 2. AUTENTICACIÓN Y USUARIO
// ==========================================
function inicializarAuth() {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');

    if (formLogin) {
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
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    if (data.usuario.email === 'admin@globalmarket.com') window.location.href = 'dashboard.html';
                    else window.location.href = 'index.html';
                } else {
                    Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: data.mensaje || "Credenciales incorrectas", confirmButtonColor: '#d33' });
                }
            } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo de conexión.' }); }
        });
    }

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datos = {
                accion: 'registro',
                nombre: document.getElementById('reg-nombre').value,
                apellidos: document.getElementById('reg-apellidos').value,
                email: document.getElementById('reg-email').value,
                telefono: document.getElementById('reg-telefono').value,
                contrasena: document.getElementById('reg-contrasena').value,
                direccion: document.getElementById('reg-direccion').value
            };

            try {
                const respuesta = await fetch(`${API_URL}/usuarios.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const data = await respuesta.json();

                if (respuesta.ok) {
                    Swal.fire({ icon: 'success', title: '¡Registro completado!', text: 'Redirigiendo...', showConfirmButton: false, timer: 2000 }).then(() => { window.location.href = 'login.html'; });
                } else {
                    let msj = data.mensaje && data.mensaje.includes("Duplicate entry") ? "Este correo electrónico ya está registrado." : data.mensaje;
                    Swal.fire({ icon: 'warning', title: 'No se pudo registrar', text: msj || 'Error', confirmButtonColor: '#f39c12' });
                }
            } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo de conexión.' }); }
        });
    }
}

function actualizarUIUsuario() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const navLogin = document.getElementById('nav-login');
    const navUser = document.getElementById('nav-user');
    
    if (usuarioLogueado) {
        if (navLogin) navLogin.style.display = 'none';
        if (navUser) navUser.style.display = 'block';
        const spanNombre = document.getElementById('nombre-usuario');
        if (spanNombre) spanNombre.innerText = usuarioLogueado.nombre;

        const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('usuario');
                window.location.href = 'index.html';
            };
        }
    } else {
        if (navLogin) navLogin.style.display = 'block';
        if (navUser) navUser.style.display = 'none';
    }
}

document.addEventListener('click', function(event) {
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('dropdown-content');
    if (menuBtn && dropdown) {
        if (menuBtn.contains(event.target)) dropdown.classList.toggle('show-dropdown');
        else if (!dropdown.contains(event.target)) dropdown.classList.remove('show-dropdown');
    }
});

// ==========================================
// 3. CARRITO Y PAGOS
// ==========================================
async function agregarAlCarrito(idProducto) {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogueado) {
        return Swal.fire({ icon: 'warning', title: 'Acceso requerido', text: 'Debes iniciar sesión.', confirmButtonText: 'Ir a Entrar' }).then(() => { window.location.href = 'login.html'; });
    }

    // Compatibilidad para evitar que el ID se pierda
    const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
    const inputCantidad = document.getElementById('prod-cantidad');
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;

    try {
        const respuesta = await fetch(`${API_URL}/carrito.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: userId, id_producto: idProducto, cantidad: cantidad })
        });
        
        // MAGIA DIAGNÓSTICA: Leer la respuesta cruda del servidor
        const textoServidor = await respuesta.text(); 
        
        try {
            // Intentamos procesarlo como JSON
            const data = JSON.parse(textoServidor);
            if (respuesta.ok) {
                Swal.fire({ icon: 'success', title: '¡Añadido!', text: `Se han añadido ${cantidad} unidad(es) al carrito.`, showConfirmButton: false, timer: 1500 });
            } else {
                Swal.fire('Error al añadir', data.mensaje, 'error');
            }
        } catch (jsonError) {
            // Si el PHP ha fallado, mostramos el error exacto que está oculto
            console.error("Respuesta RAW del servidor:", textoServidor);
            Swal.fire({
                icon: 'error',
                title: 'Error Oculto de PHP',
                html: `<p>El servidor ha fallado por este motivo exacto:</p>
                       <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; text-align: left; font-size: 12px; overflow-x: auto;">
                       ${textoServidor || 'Respuesta vacía del servidor.'}
                       </div>`,
                width: '600px'
            });
        }
    } catch (error) {
        Swal.fire('Error de Red', 'No se ha podido conectar con el archivo carrito.php. Revisa que el servidor Apache esté encendido.', 'error');
    }
}

async function cargarCarrito() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const tabla = document.getElementById('tabla-carrito');

    if (!usuarioLogueado) return tabla.innerHTML = '<tr><td colspan="4" class="text-center py-4">Inicia sesión para ver tu carrito</td></tr>';

    try {
        const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
        // VACUNA ANTI-CACHÉ: Obliga al navegador a traer datos frescos siempre
        const urlSegura = `${API_URL}/carrito.php?id_usuario=${userId}&t=${Date.now()}`;
        
        const respuesta = await fetch(urlSegura);
        const productosCarrito = await respuesta.json();
        
        tabla.innerHTML = '';
        let subtotal = 0;

        if (!productosCarrito || productosCarrito.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" class="text-center py-4">Tu carrito está vacío</td></tr>';
        } else {
            productosCarrito.forEach(prod => {
                subtotal += parseFloat(prod.precio) * parseInt(prod.cantidad);
                tabla.innerHTML += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="../assets/img/prod-${prod.id_producto}.jpg" width="50" class="me-3 rounded" onerror="this.src='../assets/img/default.jpg'">
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
                        <td><button class="btn btn-sm btn-outline-danger" onclick="eliminarProductoCarrito(${prod.id_producto})"><i class="fas fa-trash"></i></button></td>
                    </tr>`;
            });
        }

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

async function modificarCantidadCarrito(idProducto, nuevaCantidad) {
    if (nuevaCantidad <= 0) return eliminarProductoCarrito(idProducto);
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
    try {
        await fetch(`${API_URL}/carrito.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: userId, id_producto: idProducto, cantidad: nuevaCantidad })
        });
        cargarCarrito();
    } catch (error) { console.error("Error:", error); }
}

async function eliminarProductoCarrito(idProducto) {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
    Swal.fire({
        title: '¿Quitar producto?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await fetch(`${API_URL}/carrito.php?id_usuario=${userId}&id_producto=${idProducto}`, { method: 'DELETE' });
            cargarCarrito();
            Swal.fire({ icon: 'success', title: 'Eliminado', showConfirmButton: false, timer: 1000 });
        }
    });
}

async function procesarPago() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogueado) return window.location.href = 'login.html';
    const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
    
    const tabla = document.getElementById('tabla-carrito');
    if (!tabla || tabla.innerHTML.trim() === '' || tabla.innerHTML.includes('Tu carrito está vacío')) return Swal.fire('Carrito vacío', 'Añade productos antes de pagar.', 'info');

    const { value: formValues } = await Swal.fire({
        title: '🔒 Pasarela de Pago Seguro',
        html: `<input id="swal-card" class="form-control mb-2" placeholder="0000 0000 0000 0000" maxlength="16">
               <div class="row"><div class="col-6"><input id="swal-date" class="form-control" placeholder="MM/AA"></div>
               <div class="col-6"><input id="swal-cvv" class="form-control" placeholder="123" type="password"></div></div>`,
        showCancelButton: true, confirmButtonText: 'Confirmar Pago', cancelButtonText: 'Cancelar', confirmButtonColor: '#198754',
        preConfirm: () => {
            if (!document.getElementById('swal-card').value || !document.getElementById('swal-date').value || !document.getElementById('swal-cvv').value) {
                Swal.showValidationMessage('Complete los datos bancarios');
            }
            return true;
        }
    });

    if (formValues) {
        Swal.fire({ title: 'Procesando pago...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const respuesta = await fetch(`${API_URL}/carrito.php`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: userId, accion: 'pagar' })
            });
            const data = await respuesta.json();
            if (respuesta.ok) {
                Swal.fire({ icon: 'success', title: '¡Pago Completado!', text: 'Pedido en preparación.', confirmButtonColor: '#198754' }).then(() => window.location.href = 'mis-pedidos.html');
            } else Swal.fire('Error', data.mensaje, 'error');
        } catch (error) { Swal.fire('Error', 'Fallo al conectar', 'error'); }
    }
}

// ==========================================
// 4. PERFIL E HISTORIAL
// ==========================================
function inicializarPerfil() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogueado) return window.location.href = 'login.html';

    document.getElementById('perfil-nombre').value = usuarioLogueado.nombre || '';
    document.getElementById('perfil-apellidos').value = usuarioLogueado.apellidos || '';
    document.getElementById('perfil-email').value = usuarioLogueado.email || '';
    document.getElementById('perfil-telefono').value = usuarioLogueado.telefono || '';
    document.getElementById('perfil-direccion').value = usuarioLogueado.direccion || '';

    const form = document.getElementById('form-perfil');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
            try {
                const respuesta = await fetch(`${API_URL}/usuarios.php`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id_usuario: userId, 
                        nombre: document.getElementById('perfil-nombre').value,
                        apellidos: document.getElementById('perfil-apellidos').value,
                        telefono: document.getElementById('perfil-telefono').value,
                        direccion: document.getElementById('perfil-direccion').value
                    })
                });
                const data = await respuesta.json();
                if (respuesta.ok) {
                    Swal.fire({ icon: 'success', title: 'Perfil Actualizado', confirmButtonColor: '#198754' }).then(() => {
                        localStorage.setItem('usuario', JSON.stringify(data.usuario));
                        window.location.reload();
                    });
                } else Swal.fire('Error', data.mensaje, 'error');
            } catch (error) { Swal.fire('Error', 'No se pudo conectar', 'error'); }
        };
    }
}

async function cargarHistorialPedidos() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogueado) return window.location.href = 'login.html';
    const contenedor = document.getElementById('contenedor-pedidos');
    const userId = usuarioLogueado.id_usuario || usuarioLogueado.id;
    
    try {
        const respuesta = await fetch(`${API_URL}/carrito.php?id_usuario=${userId}&historial=true&t=${Date.now()}`);
        if (respuesta.ok) {
            const pedidos = await respuesta.json();
            if (pedidos.length === 0) return contenedor.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fas fa-box-open fa-3x mb-3 text-secondary"></i><br><h5>Aún no has realizado ningún pedido.</h5></td></tr>`;
            contenedor.innerHTML = '';
            pedidos.forEach(p => {
                contenedor.innerHTML += `<tr><td class="ps-4 fw-bold">#${p.id_pedido}</td><td>${new Date(p.fecha_pedido).toLocaleDateString('es-ES')}</td>
                <td class="fw-bold">${parseFloat(p.total).toFixed(2)} €</td><td><span class="badge bg-success">${p.estado_pedido}</span></td>
                <td class="text-center"><button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button></td></tr>`;
            });
        }
    } catch (error) { contenedor.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Error de carga</td></tr>`; }
}

// ==========================================
// 5. ADMIN DASHBOARD
// ==========================================
function cerrarSesionAdmin() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

async function inicializarAdmin() {
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogueado || usuarioLogueado.email !== 'admin@globalmarket.com') {
        return Swal.fire({ icon: 'error', title: 'Acceso Restringido', confirmButtonColor: '#d33', allowOutsideClick: false }).then(() => window.location.href = 'index.html');
    }

    try {
        const respuesta = await fetch(`${API_URL}/admin.php`);
        if (!respuesta.ok) throw new Error("Error en el servidor");
        
        const data = await respuesta.json();
        document.getElementById('admin-ventas').innerText = `${parseFloat(data.ingresos || 0).toFixed(2)} €`;
        document.getElementById('admin-pedidos-count').innerText = data.pedidos_count || 0;
        document.getElementById('admin-usuarios').innerText = data.usuarios_count || 0;

        const tbody = document.getElementById('tabla-admin-pedidos');
        if (data.ultimos_pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">Aún no hay pedidos registrados.</td></tr>`;
        } else {
            tbody.innerHTML = '';
            data.ultimos_pedidos.forEach(p => {
                let badgeClass = (p.estado_pedido === 'Pendiente') ? 'bg-warning text-dark' : 'bg-success';
                tbody.innerHTML += `<tr><td class="ps-4 fw-bold text-secondary">#${p.id_pedido}</td><td><i class="fas fa-user-circle"></i> ${p.nombre} ${p.apellidos}</td>
                <td>${new Date(p.fecha_pedido).toLocaleDateString('es-ES')}</td><td class="fw-bold text-primary">${parseFloat(p.total).toFixed(2)} €</td>
                <td><span class="badge ${badgeClass}">${p.estado_pedido}</span></td></tr>`;
            });
        }
    } catch (error) {
        document.getElementById('tabla-admin-pedidos').innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger fw-bold"><i class="fas fa-exclamation-triangle"></i> Fallo de conexión o archivo admin.php no detectado.</td></tr>`;
    }
}