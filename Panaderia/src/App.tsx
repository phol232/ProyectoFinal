import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Tipos
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  stock: number;
  categoria_id?: number;
  categoria?: {
    id: number;
    nombre: string;
  };
  estado?: string;
}

interface Categoria {
  id: number;
  nombre: string;
  imagenUrl?: string;
  descripcion?: string;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface Usuario {
  id?: number;
  nombre: string;
  apellido?: string;
  email: string;
  password?: string;
}

interface LoginResponse {
  token: string;
}

interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}

interface MetodoPago {
  id: number;
  nombre: string;
  descripcion?: string;
}

// Configuración de API
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8080/api"
    : "https://ce0fdb56-b620-4b5f-b87b-010c5df06e25-00-backend.replit.dev/api";

// Función para obtener el token
const getAuthToken = () => localStorage.getItem("auth_token");

// Función para hacer peticiones autenticadas
const authenticatedRequest = async (url: string, options: any = {}) => {
  const token = getAuthToken();

  console.log("🔑 Token recuperado:", token ? "Token presente" : "Sin token");

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: "include", 
  };

  // SOLO PARA DEBUG: imprime headers y options
  console.log("💥 ENVÍO HEADERS:", headers);
  console.log("💥 ENVÍO OPTIONS:", options);
  console.log("💥 FETCH CONFIG:", config);

  // Si es POST, PUT o PATCH, agregar el body
  if (['POST', 'PUT', 'PATCH'].includes((options.method || '').toUpperCase())) {
    config.body = JSON.stringify(options.data);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log("✅ RESPUESTA FETCH:", { status: response.status, ok: response.ok, data });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Devolver en formato compatible con axios
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    };
  } catch (error) {
    console.error("❌ ERROR FETCH:", error);
    throw error;
  }
};

// Componente Principal
function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    number | null
  >(null);
  const [mostrarLoginModal, setMostrarLoginModal] = useState(false);
  const [mostrarCheckoutModal, setMostrarCheckoutModal] = useState(false);
  const [mostrarSuccessModal, setMostrarSuccessModal] = useState(false);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      // Verificar si hay token guardado
      const token = getAuthToken();
      if (token) {
        // Si hay token guardado, asumimos que el usuario está logueado
        // En un futuro, cuando tengas el endpoint /auth/me, puedes validar el token aquí
        console.log("Token encontrado, usuario previamente logueado");
      }
      await Promise.all([cargarProductos(), cargarCategorias(), cargarMetodosPago()]);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  const cargarProductos = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE}/products`);
      if (response.data && Array.isArray(response.data)) {
        const productosValidos = response.data.filter(
          (p) => p && p.nombre && p.precio !== undefined,
        );
        console.log("Productos cargados:", productosValidos);
        console.log("Primer producto ejemplo:", productosValidos[0]);
        setProductos(productosValidos);
      } else {
        throw new Error("Datos de productos inválidos recibidos del servidor");
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError(
        "Error al conectar con el servidor. Verifica que el backend esté ejecutándose.",
      );
      setProductos([]); // No usar datos de ejemplo
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categorias`);
      if (response.data && Array.isArray(response.data)) {
        const categoriasValidas = response.data.filter((c) => c && c.nombre);
        console.log("Categorías cargadas:", categoriasValidas);
        setCategorias(categoriasValidas);
      } else {
        throw new Error("Datos de categorías inválidos recibidos del servidor");
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setCategorias([]); // No usar datos de ejemplo
    }
  };

  const cargarMetodosPago = async () => {
    try {
      const response = await axios.get(`${API_BASE}/metodos-pago`);
      if (response.data && Array.isArray(response.data)) {
        setMetodosPago(response.data);
      }
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error);
      setMetodosPago([]);
    }
  };

  const agregarAlCarrito = (producto: Producto) => {
    setCart((prevCart) => {
      const existente = prevCart.find(
        (item) => item.producto.id === producto.id,
      );
      if (existente) {
        return prevCart.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [...prevCart, { producto, cantidad: 1 }];
    });
  };

  const eliminarDelCarrito = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.producto.id !== productId),
    );
  };

  const actualizarCantidad = (productId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.producto.id === productId
          ? { ...item, cantidad: nuevaCantidad }
          : item,
      ),
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0,
  );

  const productosFiltrados = productos.filter((producto) => {
    if (!producto || !producto.nombre) return false;
    const coincideBusqueda = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    if (categoriaSeleccionada === null) {
      return coincideBusqueda;
    }
    const coincideCategoria = producto.categoria && producto.categoria.id === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });
  const handlePedir = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    if (!usuario) {
      setMostrarLoginModal(true);
    } else {
      setMostrarCheckoutModal(true);
    }
  };

  const procesarPedido = async (metodoPagoId: number) => {
    if (!usuario?.id) {
      alert("Error: Usuario no identificado. Por favor, inicia sesión nuevamente.");
      logout();
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert("Error: No se encontró token de autenticación. Por favor, inicia sesión nuevamente.");
      logout();
      return;
    }

    try {
      const ventaRequest = {
        clienteId: usuario.id,
        metodoPagoId: metodoPagoId,
        tipoPago: metodosPago.find(m => m.id === metodoPagoId)?.nombre || "efectivo",
        numeroComprobante: `VENTA-${Date.now()}`,
        descuento: 0,
        estado: "pendiente",
        formaEntrega: "local",
        items: cart.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
          descuentoItem: 0,
          tipoPresentacion: "unidad",
        })),
      };

      console.log("=== DEBUG PEDIDO ===");
      console.log("Usuario completo:", usuario);
      console.log("Token:", token);
      console.log("Cliente ID siendo enviado:", usuario.id);
      console.log("Datos del pedido:", ventaRequest);
      console.log("URL del endpoint:", `${API_BASE}/ventas`);

      const response = await authenticatedRequest(`${API_BASE}/ventas`, {
        method: "POST",
        data: ventaRequest,
      });

      console.log("Respuesta exitosa:", response.data);
      setCart([]);
      setMostrarCheckoutModal(false);
      setMostrarSuccessModal(true);
    } catch (error) {
      console.error("Error al procesar pedido:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response?.status === 401 || (error as any).response?.status === 403
      ) {
        alert("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
        logout();
      } else if (
        typeof error === "object" &&
        error !== null &&
        ("code" in error || "message" in error) &&
        ((error as any).code === 'NETWORK_ERROR' || (error as any).message === 'Network Error')
      ) {
        alert("Error de conexión: Asegúrate de que el backend esté ejecutándose en http://localhost:8080");
      } else {
        alert(
          `Error al procesar el pedido: ${
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            (error as any).response?.data?.message
              ? (error as any).response.data.message
              : (typeof error === "object" && error !== null && "message" in error
                  ? (error as any).message
                  : String(error))
          }`
        );
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUsuario(null);
    setCart([]);
  };

  return (
    <Router>
      <div className="app">
        <Header usuario={usuario} onLogout={logout} />

        <Routes>
          <Route
            path="/"
            element={
              <MainPage
                productos={productosFiltrados}
                categorias={categorias}
                agregarAlCarrito={agregarAlCarrito}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                categoriaSeleccionada={categoriaSeleccionada}
                setCategoriaSeleccionada={setCategoriaSeleccionada}
                cart={cart}
                eliminarDelCarrito={eliminarDelCarrito}
                actualizarCantidad={actualizarCantidad}
                total={total}
                handlePedir={handlePedir}
                loading={loading}
                error={error}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <PanelAdmin
                productos={productos}
                cargarProductos={cargarProductos}
              />
            }
          />
        </Routes>

        {mostrarLoginModal && (
          <LoginModal
            onClose={() => setMostrarLoginModal(false)}
            onLogin={setUsuario}
            onSuccess={() => {
              setMostrarLoginModal(false);
              setMostrarCheckoutModal(true);
            }}
          />
        )}

        {mostrarCheckoutModal && usuario && (
          <CheckoutModal
            usuario={usuario}
            cart={cart}
            productos={productos}
            metodosPago={metodosPago}
            onClose={() => setMostrarCheckoutModal(false)}
            onConfirm={procesarPedido}
            agregarAlCarrito={agregarAlCarrito}
            eliminarDelCarrito={eliminarDelCarrito}
            actualizarCantidad={actualizarCantidad}
          />
        )}

        {mostrarSuccessModal && (
          <SuccessModal onClose={() => setMostrarSuccessModal(false)} />
        )}
      </div>
    </Router>
  );
}

// Componente Header
function Header({
  usuario,
  onLogout,
}: {
  usuario: Usuario | null;
  onLogout: () => void;
}) {
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">UPTOWN</span>
        </div>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#about">About us</a>
          <a href="#menu">Menu</a>
          <a href="#contact">Contact us</a>
        </nav>
        <div className="header-right">
          <div className="contact-info">
            <span>📞 +593 32 345 19 30</span>
          </div>
          <UserMenu usuario={usuario} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}

// Componente UserMenu
function UserMenu({
  usuario,
  onLogout,
}: {
  usuario: Usuario | null;
  onLogout: () => void;
}) {
  if (!usuario) {
    return null;
  }

  return (
    <div className="user-menu">
      <span className="user-greeting">
        Hola, {usuario.nombre} {usuario.apellido || ''}
      </span>
      <button className="btn-logout" onClick={onLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}

// Componente Hero Section
function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1>
            Check out our gourmet <span className="highlight">Menu:</span>
          </h1>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">100+</span>
              <span className="stat-label">Daily Dishes</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Professional Chef</span>
            </div>
          </div>
          <button className="btn-learn-more">Learn more</button>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=500&fit=crop"
            alt="Gourmet dish"
          />
        </div>
      </div>
    </section>
  );
}

// Componente Página Principal
function MainPage({
  productos,
  categorias,
  agregarAlCarrito,
  busqueda,
  setBusqueda,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  cart,
  eliminarDelCarrito,
  actualizarCantidad,
  total,
  handlePedir,
  loading,
  error,
}: {
  productos: Producto[];
  categorias: Categoria[];
  agregarAlCarrito: (producto: Producto) => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  categoriaSeleccionada: number | null;
  setCategoriaSeleccionada: (categoria: number | null) => void;
  cart: CartItem[];
  eliminarDelCarrito: (productId: number) => void;
  actualizarCantidad: (productId: number, cantidad: number) => void;
  total: number;
  handlePedir: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="main-page">
      <HeroSection />

      <section className="menu-section" id="menu">
        <div className="container">
          <h2 className="section-title">You may like one of our dishes:</h2>

          {/* Buscador y Filtros */}
          <div className="filters-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="category-filters">
              <button
                className={`filter-btn all-btn ${categoriaSeleccionada === null ? "active" : ""}`}
                onClick={() => {
                  console.log("Seleccionando: Todos");
                  setCategoriaSeleccionada(null);
                }}
              >
                <span className="filter-icon">🍽️</span>
                <span className="filter-text">Todos</span>
              </button>
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  className={`filter-btn category-btn ${categoriaSeleccionada === categoria.id ? "active" : ""}`}
                  onClick={() => {
                    console.log(
                      "Seleccionando categoría:",
                      categoria.id,
                      categoria.nombre,
                    );
                    console.log(
                      "Productos actuales:",
                      productos.map((p) => ({
                        nombre: p.nombre,
                        categoria: p.categoria,
                      })),
                    );
                    setCategoriaSeleccionada(categoria.id);
                  }}
                >
                  <div className="category-image">
                    <img 
                      src={categoria.imagenUrl || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=60&h=60&fit=crop"}
                      alt={categoria.nombre}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=60&h=60&fit=crop";
                      }}
                    />
                  </div>
                  <span className="category-name">{categoria.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}

          {/* Grid de Productos */}
          <div className="productos-grid">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="producto-card loading-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-description"></div>
                    <div className="skeleton-footer">
                      <div className="skeleton-price"></div>
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : productos.length > 0 ? (
              productos.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  agregarAlCarrito={agregarAlCarrito}
                />
              ))
            ) : (
              <div className="no-products">
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Carrito Flotante */}
      {cart.length > 0 && (
        <CartFloating
          cart={cart}
          eliminarDelCarrito={eliminarDelCarrito}
          actualizarCantidad={actualizarCantidad}
          total={total}
          handlePedir={handlePedir}
        />
      )}

      {/* Sección de Testimonios */}
      <TestimonialsSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Componente Tarjeta de Producto
function ProductoCard({
  producto,
  agregarAlCarrito,
}: {
  producto: Producto;
  agregarAlCarrito: (producto: Producto) => void;
}) {
  return (
    <div className="producto-card">
      <div className="producto-imagen-container">
        <img
          src={
            producto.imagenUrl ||
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"
          }
          alt={producto.nombre}
          className="producto-imagen"
        />
      </div>
      <div className="producto-info">
        <h3>{producto.nombre}</h3>
        <p className="producto-descripcion">{producto.descripcion}</p>
        <div className="producto-footer">
          <span className="precio">${producto.precio.toFixed(2)}</span>
          <button
            onClick={() => agregarAlCarrito(producto)}
            className="btn-add-to-cart"
            disabled={producto.stock === 0}
          >
            {producto.stock === 0 ? "Sin Stock" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Carrito Flotante
function CartFloating({
  cart,
  eliminarDelCarrito,
  actualizarCantidad,
  total,
  handlePedir,
}: {
  cart: CartItem[];
  eliminarDelCarrito: (productId: number) => void;
  actualizarCantidad: (productId: number, cantidad: number) => void;
  total: number;
  handlePedir: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className={`cart-floating ${expanded ? "expanded" : ""}`}>
      <div className="cart-header" onClick={() => setExpanded(!expanded)}>
        <span>🛒 {totalItems} items</span>
        <span>${total.toFixed(2)}</span>
        <span className="expand-icon">{expanded ? "↓" : "↑"}</span>
      </div>

      {expanded && (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.producto.id} className="cart-item">
                <img src={item.producto.imagenUrl} alt={item.producto.nombre} />
                <div className="item-info">
                  <span className="item-name">{item.producto.nombre}</span>
                  <span className="item-price">
                    ${item.producto.precio.toFixed(2)}
                  </span>
                </div>
                <div className="item-controls">
                  <button
                    onClick={() =>
                      actualizarCantidad(item.producto.id, item.cantidad - 1)
                    }
                  >
                    -
                  </button>
                  <span>{item.cantidad}</span>
                  <button
                    onClick={() =>
                      actualizarCantidad(item.producto.id, item.cantidad + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => eliminarDelCarrito(item.producto.id)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="btn-pedir" onClick={handlePedir}>
            Pedir - ${total.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}

// Componente Modal de Login
function LoginModal({
  onClose,
  onLogin,
  onSuccess,
}: {
  onClose: () => void;
  onLogin: (usuario: Usuario) => void;
  onSuccess: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });

        console.log("Respuesta del login:", response.data);

        // Guardar el token - puede venir como 'token' o directamente como string
        const token = response.data.token || response.data;
        if (token && typeof token === 'string') {
          localStorage.setItem("auth_token", token);
          console.log("Token guardado exitosamente");
        } else {
          console.warn("No se recibió token válido del backend:", response.data);
        }

        console.log("Datos completos del usuario del backend:", response.data);
        onLogin({
          id: response.data.id || response.data.usuario?.id, 
          nombre: response.data.nombre || response.data.usuario?.nombre || formData.email.split("@")[0],
          apellido: response.data.apellido || response.data.usuario?.apellido,
          email: formData.email,
        });
      } else {
        const registerData: RegisterRequest = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
        };
        const response = await axios.post(
          `${API_BASE}/auth/register`,
          registerData,
        );

        // Si el registro devuelve token, guardarlo
        if (response.data.token) {
          localStorage.setItem("auth_token", response.data.token);
        }

        onLogin({
          id: response.data.id,
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          email: response.data.email,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error en autenticación:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        (error as any).response !== null &&
        "status" in (error as any).response &&
        (error as any).response.status === 400
      ) {
        alert("Credenciales inválidas o email ya registrado");
      } else {
        alert("Error en la autenticación");
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`Login con ${provider} no implementado. Use email y contraseña.`);
  };

  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <div className="modal-content">
          <h2>{isLogin ? "Iniciar Sesión" : "Registrarse"}</h2>
          <p>Para completar tu pedido</p>

          {isLogin && (
            <>
              <div className="social-login">
                <button
                  className="social-btn google"
                  onClick={() => handleSocialLogin("Google")}
                >
                  <span>G</span> Continuar con Google
                </button>
                <button
                  className="social-btn facebook"
                  onClick={() => handleSocialLogin("Facebook")}
                >
                  <span>f</span> Continuar con Facebook
                </button>
              </div>

              <div className="divider">
                <span>o</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    setFormData({ ...formData, apellido: e.target.value })
                  }
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button type="submit" className="submit-btn">
              {isLogin ? "Iniciar Sesión" : "Registrarse"}
            </button>
          </form>

          <p className="toggle-form">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="link-btn"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente Testimonios
function TestimonialsSection() {
  return (
    <section className="testimonials">
      <div className="container">
        <h2>What people say about us</h2>
        <div className="testimonials-grid">
          <div className="testimonial">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>
              "I liked it very much, I will come back soon, really amazing food"
            </p>
            <div className="author">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
                alt="Ivan Petrov"
              />
              <span>Ivan Petrov</span>
            </div>
          </div>
          <div className="testimonial">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>
              "I loved it so very much, I will come back soon, really taste
              food"
            </p>
            <div className="author">
              <img
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face"
                alt="Pepa Petrov"
              />
              <span>Pepa Petrov</span>
            </div>
          </div>
          <div className="testimonial">
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p>
              "I liked it very much, I will come back soon, really taste food"
            </p>
            <div className="author">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                alt="Ivan Petrov"
              />
              <span>Ivan Petrov</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente Footer
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="contact-section">
            <h3>Contact to us:</h3>
            <p>Contact us to at a convenient way</p>
            <div className="contact-info">
              <p>
                <strong>Phone:</strong> +593 32 345 19 30
              </p>
              <p>
                <strong>Schedule:</strong> 9:00 - 20:00 daily
              </p>
            </div>
            <button className="btn-request-call">Request a call</button>
          </div>

          <div className="contact-form">
            <h4>Enter your contact:</h4>
            <form>
              <input type="text" placeholder="Name" />
              <input type="tel" placeholder="Your phone number" />
              <textarea placeholder="Enter message:"></textarea>
              <button type="submit">Send</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo">
            <span className="logo-icon">🍽️</span>
            <span>UPTOWN</span>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>About us</h4>
              <a href="#">Story</a>
              <a href="#">Menu</a>
              <a href="#">Team</a>
            </div>
            <div className="link-group">
              <h4>Services</h4>
              <a href="#">Delivery</a>
              <a href="#">Booking</a>
              <a href="#">Catering</a>
            </div>
            <div className="link-group">
              <h4>Schedule</h4>
              <p>Mo - Su: 9:00 - 20:00</p>
              <div className="social-links">
                <span>📘</span>
                <span>📷</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Componente Modal de Checkout
function CheckoutModal({
  usuario,
  cart,
  productos,
  metodosPago,
  onClose,
  onConfirm,
  agregarAlCarrito,
  eliminarDelCarrito,
  actualizarCantidad,
}: {
  usuario: Usuario;
  cart: CartItem[];
  productos: Producto[];
  metodosPago: MetodoPago[];
  onClose: () => void;
  onConfirm: (metodoPagoId: number) => void;
  agregarAlCarrito: (producto: Producto) => void;
  eliminarDelCarrito: (productId: number) => void;
  actualizarCantidad: (productId: number, cantidad: number) => void;
}) {
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<number | null>(null);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const subtotal = cart.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const productosFiltrados = busquedaProducto.length > 0 
    ? productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) &&
        producto.stock > 0
      ).slice(0, 5)
    : [];

  const handlePagar = () => {
    if (!metodoPagoSeleccionado) {
      alert("Por favor selecciona un método de pago");
      return;
    }
    onConfirm(metodoPagoSeleccionado);
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="checkout-content">
          <h2>Confirmar Pedido</h2>
          <div className="cliente-info">
            <h3>Cliente: {usuario.nombre} {usuario.apellido || ''}</h3>
            <p>{usuario.email}</p>
          </div>

          <div className="checkout-main">
            <div className="checkout-column">
              <div className="checkout-section">
                <h3>Agregar productos</h3>

                <div className="product-search">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    className="search-input"
                  />
                  {productosFiltrados.length > 0 && (
                    <div className="products-dropdown">
                      {productosFiltrados.map(producto => (
                        <div 
                          key={producto.id} 
                          className="dropdown-item"
                          onClick={() => {
                            agregarAlCarrito(producto);
                            setBusquedaProducto("");
                          }}
                        >
                          <img src={producto.imagenUrl} alt={producto.nombre} />
                          <div className="item-info">
                            <span>{producto.nombre}</span>
                            <span>${producto.precio.toFixed(2)}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              agregarAlCarrito(producto);
                              setBusquedaProducto("");
                            }}
                            className="btn-add-small"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="checkout-section">
                <h3>Productos en tu pedido</h3>

                <div className="cart-items-checkout">
                  {cart.map(item => (
                    <div key={item.producto.id} className="checkout-item">
                      <img src={item.producto.imagenUrl} alt={item.producto.nombre} />
                      <div className="item-details">
                        <h4>{item.producto.nombre}</h4>
                        <p>${item.producto.precio.toFixed(2)} c/u</p>
                      </div>
                      <div className="quantity-controls">
                        <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}>+</button>
                      </div>
                      <div className="item-total">
                        ${(item.producto.precio * item.cantidad).toFixed(2)}
                      </div>
                      <button 
                        onClick={() => eliminarDelCarrito(item.producto.id)}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna 2: Resumen y pago */}
            <div className="checkout-column">
              <div className="checkout-section">
                <h3>Resumen del Pedido</h3>
                <div className="price-summary">
                  <div className="price-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>IGV (18%):</span>
                    <span>${igv.toFixed(2)}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="checkout-section">
                <h3>Método de Pago</h3>
                <select 
                  className="payment-select"
                  value={metodoPagoSeleccionado || ""}
                  onChange={(e) => setMetodoPagoSeleccionado(Number(e.target.value))}
                >
                  <option value="">Seleccionar método de pago</option>
                  {metodosPago.map(metodo => (
                    <option key={metodo.id} value={metodo.id}>
                      {metodo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="checkout-footer">
                <button 
                  className="btn-pagar-checkout"
                  onClick={handlePagar}
                  disabled={!metodoPagoSeleccionado || cart.length === 0}
                >
                  Pagar ${total.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Modal de Éxito
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="success-modal">
        <div className="success-content">
          <div className="success-icon">✅</div>
          <h2>¡Venta Registrada!</h2>
          <p>Gracias por tu preferencia</p>
          <p className="success-message">Tu pedido ha sido procesado exitosamente.</p>
          <button className="btn-success-close" onClick={onClose}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Panel de Administración (simplificado)
function PanelAdmin({
  productos,
  cargarProductos,
}: {
  productos: Producto[];
  cargarProductos: () => void;
}) {
  return (
    <div className="panel-admin">
      <div className="container">
        <h1>Panel de Administración</h1>
        <div className="admin-content">
          <p>Panel de administración para gestionar productos y pedidos.</p>
          <div className="productos-list">
            {productos.map((producto) => (
              <div key={producto.id} className="admin-producto">
                <span>{producto.nombre}</span>
                <span>${producto.precio}</span>
                <span>Stock: {producto.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;