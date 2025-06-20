CREATE DATABASE bd_panaderia;
USE bd_panaderia;

-- Tabla: clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    dni VARCHAR(20),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'Otro'),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    comentarios TEXT
);

-- Tabla: categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo ENUM('pan', 'pastel', 'galleta', 'otros'),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imagen_url VARCHAR(255),
    popularidad INT DEFAULT 0,
    destacado BOOLEAN DEFAULT FALSE,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    codigo_categoria VARCHAR(20),
    orden INT,
    observaciones TEXT
);

-- Tabla: productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT,
    stock INT DEFAULT 0,
    imagen_url VARCHAR(255),
    peso DECIMAL(10,2),
    tiempo_preparacion INT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    codigo_producto VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla: ingredientes
CREATE TABLE ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(20), -- gramos, litros, unidades
    stock_actual DECIMAL(10,2),
    stock_minimo DECIMAL(10,2),
    proveedor VARCHAR(100),
    costo_unitario DECIMAL(10,2),
    fecha_ultimo_ingreso DATE,
    ubicacion_almacen VARCHAR(100),
    codigo_barras VARCHAR(30),
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    observaciones TEXT
);

-- Tabla: productos_ingredientes (recetas)
CREATE TABLE productos_ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(20),
    orden_preparacion INT,
    tipo_uso ENUM('base', 'decoración', 'relleno'),
    tiempo_aplicacion INT,
    es_opcional BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    creado_por VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id) ON DELETE CASCADE
);

-- Tabla: ventas
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    tipo_pago ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'otro'),
    numero_comprobante VARCHAR(50),
    igv DECIMAL(10,2),
    descuento DECIMAL(10,2),
    estado ENUM('completado', 'pendiente', 'cancelado'),
    observaciones TEXT,
    empleado_id INT,
    forma_entrega ENUM('recojo', 'delivery'),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla: detalle_venta
CREATE TABLE detalle_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    descripcion TEXT,
    descuento_item DECIMAL(10,2),
    tipo_presentacion VARCHAR(50),
    codigo_item VARCHAR(30),
    observaciones TEXT,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla: empleados
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    usuario VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'vendedor', 'repostero'),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_ingreso DATE,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    observaciones TEXT
);
