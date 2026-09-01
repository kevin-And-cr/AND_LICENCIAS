
/*
=========================================================
 SISTEMA ADMINISTRADOR / GENERADOR DE LICENCIAS
 Archivo único de creación de base de datos: schema.sql
 Motor: SQL Server

 IMPORTANTE:
 - Este archivo NO levanta SQL Server.
 - SQL Server debe existir previamente en el servidor.
 - Ejecutar este script dentro de la base de datos objetivo.
 - Todas las tablas y campos están en español.
 - Este archivo es la fuente principal editable del esquema.
=========================================================

 USO SUGERIDO:
 1. Crear manualmente la base de datos, por ejemplo:
      CREATE DATABASE LicenciasDB;
 2. Seleccionar la base:
      USE LicenciasDB;
 3. Ejecutar este archivo completo en SQL Server Management Studio
    o Azure Data Studio.
=========================================================
*/

SET NOCOUNT ON;
GO

/* =====================================================
   1. TABLAS DE SEGURIDAD / AUTENTICACIÓN
===================================================== */

IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios (
        id INT IDENTITY(1,1) NOT NULL,
        nombre_usuario NVARCHAR(100) NOT NULL,
        correo NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(500) NOT NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_usuarios_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_usuarios_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_usuarios PRIMARY KEY (id),
        CONSTRAINT UQ_usuarios_nombre_usuario UNIQUE (nombre_usuario),
        CONSTRAINT UQ_usuarios_correo UNIQUE (correo),
        CONSTRAINT CK_usuarios_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
    );
END
GO

IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.roles (
        id INT IDENTITY(1,1) NOT NULL,
        codigo NVARCHAR(80) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(500) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_roles_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_roles_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_roles PRIMARY KEY (id),
        CONSTRAINT UQ_roles_codigo UNIQUE (codigo),
        CONSTRAINT CK_roles_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

IF OBJECT_ID('dbo.permisos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.permisos (
        id INT IDENTITY(1,1) NOT NULL,
        codigo NVARCHAR(150) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(500) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_permisos_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_permisos_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_permisos PRIMARY KEY (id),
        CONSTRAINT UQ_permisos_codigo UNIQUE (codigo),
        CONSTRAINT CK_permisos_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

IF OBJECT_ID('dbo.usuario_roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuario_roles (
        id INT IDENTITY(1,1) NOT NULL,
        usuario_id INT NOT NULL,
        rol_id INT NOT NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_usuario_roles_creado_en DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_usuario_roles PRIMARY KEY (id),
        CONSTRAINT UQ_usuario_roles_usuario_rol UNIQUE (usuario_id, rol_id),
        CONSTRAINT FK_usuario_roles_usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id),
        CONSTRAINT FK_usuario_roles_roles FOREIGN KEY (rol_id) REFERENCES dbo.roles(id)
    );
END
GO

IF OBJECT_ID('dbo.rol_permisos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.rol_permisos (
        id INT IDENTITY(1,1) NOT NULL,
        rol_id INT NOT NULL,
        permiso_id INT NOT NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_rol_permisos_creado_en DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_rol_permisos PRIMARY KEY (id),
        CONSTRAINT UQ_rol_permisos_rol_permiso UNIQUE (rol_id, permiso_id),
        CONSTRAINT FK_rol_permisos_roles FOREIGN KEY (rol_id) REFERENCES dbo.roles(id),
        CONSTRAINT FK_rol_permisos_permisos FOREIGN KEY (permiso_id) REFERENCES dbo.permisos(id)
    );
END
GO


/* =====================================================
   2. CLIENTES Y COMPAÑÍAS
===================================================== */

IF OBJECT_ID('dbo.clientes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.clientes (
        id INT IDENTITY(1,1) NOT NULL,
        nombre NVARCHAR(200) NOT NULL,
        identificacion NVARCHAR(100) NULL,
        correo_contacto NVARCHAR(255) NULL,
        telefono_contacto NVARCHAR(50) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_clientes_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_clientes_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_clientes PRIMARY KEY (id),
        CONSTRAINT CK_clientes_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

IF OBJECT_ID('dbo.companias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.companias (
        id INT IDENTITY(1,1) NOT NULL,
        cliente_id INT NOT NULL,
        codigo_compania NVARCHAR(80) NOT NULL,
        nombre_compania NVARCHAR(200) NOT NULL,
        identificacion NVARCHAR(100) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_companias_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_companias_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_companias PRIMARY KEY (id),
        CONSTRAINT FK_companias_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id),
        CONSTRAINT UQ_companias_cliente_codigo UNIQUE (cliente_id, codigo_compania),
        CONSTRAINT CK_companias_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO


/* =====================================================
   3. MÓDULOS PADRE / HIJO
===================================================== */

IF OBJECT_ID('dbo.modulos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.modulos (
        id INT IDENTITY(1,1) NOT NULL,
        codigo NVARCHAR(150) NOT NULL,
        nombre NVARCHAR(200) NOT NULL,
        descripcion NVARCHAR(1000) NULL,
        modulo_padre_id INT NULL,
        tipo_modulo NVARCHAR(30) NOT NULL,
        ruta NVARCHAR(300) NULL,
        icono NVARCHAR(100) NULL,
        orden INT NOT NULL CONSTRAINT DF_modulos_orden DEFAULT (0),
        requiere_jobs BIT NOT NULL CONSTRAINT DF_modulos_requiere_jobs DEFAULT (0),
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_modulos_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_modulos_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_modulos PRIMARY KEY (id),
        CONSTRAINT UQ_modulos_codigo UNIQUE (codigo),
        CONSTRAINT FK_modulos_padre FOREIGN KEY (modulo_padre_id) REFERENCES dbo.modulos(id),
        CONSTRAINT CK_modulos_tipo CHECK (tipo_modulo IN ('contenedor', 'funcionalidad')),
        CONSTRAINT CK_modulos_estado CHECK (estado IN ('activo', 'inactivo')),
        CONSTRAINT CK_modulos_orden CHECK (orden >= 0)
    );
END
GO

IF OBJECT_ID('dbo.modulo_acciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.modulo_acciones (
        id INT IDENTITY(1,1) NOT NULL,
        modulo_id INT NOT NULL,
        codigo_accion NVARCHAR(80) NOT NULL,
        nombre_accion NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(500) NULL,
        permiso_generado NVARCHAR(250) NOT NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_modulo_acciones_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_modulo_acciones_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_modulo_acciones PRIMARY KEY (id),
        CONSTRAINT FK_modulo_acciones_modulos FOREIGN KEY (modulo_id) REFERENCES dbo.modulos(id),
        CONSTRAINT UQ_modulo_acciones_modulo_accion UNIQUE (modulo_id, codigo_accion),
        CONSTRAINT UQ_modulo_acciones_permiso_generado UNIQUE (permiso_generado),
        CONSTRAINT CK_modulo_acciones_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO

IF OBJECT_ID('dbo.modulo_configuraciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.modulo_configuraciones (
        id INT IDENTITY(1,1) NOT NULL,
        modulo_id INT NOT NULL,
        clave NVARCHAR(150) NOT NULL,
        valor NVARCHAR(MAX) NULL,
        tipo_dato NVARCHAR(30) NOT NULL CONSTRAINT DF_modulo_configuraciones_tipo_dato DEFAULT ('texto'),
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_modulo_configuraciones_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_modulo_configuraciones_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_modulo_configuraciones PRIMARY KEY (id),
        CONSTRAINT FK_modulo_configuraciones_modulos FOREIGN KEY (modulo_id) REFERENCES dbo.modulos(id),
        CONSTRAINT UQ_modulo_configuraciones_modulo_clave UNIQUE (modulo_id, clave),
        CONSTRAINT CK_modulo_configuraciones_tipo_dato CHECK (tipo_dato IN ('texto', 'numero', 'booleano', 'json', 'fecha')),
        CONSTRAINT CK_modulo_configuraciones_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO


/* =====================================================
   4. LICENCIAS
===================================================== */

IF OBJECT_ID('dbo.licencias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.licencias (
        id INT IDENTITY(1,1) NOT NULL,
        cliente_id INT NOT NULL,
        numero_licencia NVARCHAR(80) NOT NULL,
        fecha_emision DATE NULL,
        estado NVARCHAR(30) NOT NULL CONSTRAINT DF_licencias_estado DEFAULT ('borrador'),
        tipo_licencia NVARCHAR(30) NOT NULL CONSTRAINT DF_licencias_tipo DEFAULT ('offline'),
        ambiente NVARCHAR(30) NOT NULL CONSTRAINT DF_licencias_ambiente DEFAULT ('produccion'),
        cantidad_maxima_usuarios INT NOT NULL CONSTRAINT DF_licencias_max_usuarios DEFAULT (1),
        permite_jobs_segundo_plano BIT NOT NULL CONSTRAINT DF_licencias_jobs DEFAULT (0),
        permite_api BIT NOT NULL CONSTRAINT DF_licencias_api DEFAULT (0),
        observaciones NVARCHAR(1000) NULL,
        creado_por INT NOT NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_licencias_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_licencias PRIMARY KEY (id),
        CONSTRAINT FK_licencias_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id),
        CONSTRAINT FK_licencias_usuarios FOREIGN KEY (creado_por) REFERENCES dbo.usuarios(id),
        CONSTRAINT UQ_licencias_numero UNIQUE (numero_licencia),
        CONSTRAINT CK_licencias_estado CHECK (estado IN ('borrador', 'activa', 'revocada', 'expirada', 'inactiva')),
        CONSTRAINT CK_licencias_tipo CHECK (tipo_licencia IN ('offline', 'hibrida', 'online')),
        CONSTRAINT CK_licencias_ambiente CHECK (ambiente IN ('desarrollo', 'pruebas', 'produccion')),
        CONSTRAINT CK_licencias_max_usuarios CHECK (cantidad_maxima_usuarios > 0)
    );
END
GO

IF OBJECT_ID('dbo.licencia_modulos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.licencia_modulos (
        id INT IDENTITY(1,1) NOT NULL,
        licencia_id INT NOT NULL,
        modulo_id INT NOT NULL,
        cantidad_maxima_companias INT NOT NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_licencia_modulos_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_licencia_modulos PRIMARY KEY (id),
        CONSTRAINT FK_licencia_modulos_licencias FOREIGN KEY (licencia_id) REFERENCES dbo.licencias(id),
        CONSTRAINT FK_licencia_modulos_modulos FOREIGN KEY (modulo_id) REFERENCES dbo.modulos(id),
        CONSTRAINT UQ_licencia_modulos_licencia_modulo UNIQUE (licencia_id, modulo_id),
        CONSTRAINT CK_licencia_modulos_max_companias CHECK (cantidad_maxima_companias > 0)
    );
END
GO

IF OBJECT_ID('dbo.licencia_modulo_companias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.licencia_modulo_companias (
        id INT IDENTITY(1,1) NOT NULL,
        licencia_modulo_id INT NOT NULL,
        compania_id INT NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_licencia_modulo_companias_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_licencia_modulo_companias_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_licencia_modulo_companias PRIMARY KEY (id),
        CONSTRAINT FK_licencia_modulo_companias_licencia_modulos FOREIGN KEY (licencia_modulo_id) REFERENCES dbo.licencia_modulos(id),
        CONSTRAINT FK_licencia_modulo_companias_companias FOREIGN KEY (compania_id) REFERENCES dbo.companias(id),
        CONSTRAINT UQ_licencia_modulo_companias_modulo_compania UNIQUE (licencia_modulo_id, compania_id),
        CONSTRAINT CK_licencia_modulo_companias_estado CHECK (estado IN ('activo', 'inactivo'))
    );
END
GO


/* =====================================================
   5. LLAVES E HISTORIAL DE ARCHIVOS GENERADOS
===================================================== */

IF OBJECT_ID('dbo.llaves_firma', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.llaves_firma (
        id INT IDENTITY(1,1) NOT NULL,
        id_llave NVARCHAR(100) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        algoritmo NVARCHAR(50) NOT NULL CONSTRAINT DF_llaves_firma_algoritmo DEFAULT ('Ed25519'),
        ruta_llave_publica NVARCHAR(500) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_llaves_firma_estado DEFAULT ('activo'),
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_llaves_firma_creado_en DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2(0) NULL,

        CONSTRAINT PK_llaves_firma PRIMARY KEY (id),
        CONSTRAINT UQ_llaves_firma_id_llave UNIQUE (id_llave),
        CONSTRAINT CK_llaves_firma_estado CHECK (estado IN ('activo', 'inactivo', 'rotada')),
        CONSTRAINT CK_llaves_firma_algoritmo CHECK (algoritmo IN ('Ed25519'))
    );
END
GO

IF OBJECT_ID('dbo.licencia_archivos_generados', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.licencia_archivos_generados (
        id INT IDENTITY(1,1) NOT NULL,
        licencia_id INT NOT NULL,
        version_licencia NVARCHAR(30) NOT NULL,
        algoritmo NVARCHAR(50) NOT NULL,
        id_llave NVARCHAR(100) NOT NULL,
        nombre_archivo NVARCHAR(255) NOT NULL,
        contenido_firmado NVARCHAR(MAX) NOT NULL,
        hash_archivo NVARCHAR(128) NOT NULL,
        generado_por INT NOT NULL,
        generado_en DATETIME2(0) NOT NULL CONSTRAINT DF_licencia_archivos_generados_generado_en DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_licencia_archivos_generados PRIMARY KEY (id),
        CONSTRAINT FK_licencia_archivos_generados_licencias FOREIGN KEY (licencia_id) REFERENCES dbo.licencias(id),
        CONSTRAINT FK_licencia_archivos_generados_usuarios FOREIGN KEY (generado_por) REFERENCES dbo.usuarios(id),
        CONSTRAINT FK_licencia_archivos_generados_llaves FOREIGN KEY (id_llave) REFERENCES dbo.llaves_firma(id_llave),
        CONSTRAINT UQ_licencia_archivos_generados_hash UNIQUE (hash_archivo)
    );
END
GO


/* =====================================================
   6. AUDITORÍA
===================================================== */

IF OBJECT_ID('dbo.auditoria_eventos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.auditoria_eventos (
        id BIGINT IDENTITY(1,1) NOT NULL,
        usuario_id INT NULL,
        accion NVARCHAR(150) NOT NULL,
        entidad NVARCHAR(150) NULL,
        entidad_id NVARCHAR(100) NULL,
        descripcion NVARCHAR(2000) NULL,
        ip_origen NVARCHAR(80) NULL,
        user_agent NVARCHAR(500) NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_auditoria_eventos_creado_en DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_auditoria_eventos PRIMARY KEY (id),
        CONSTRAINT FK_auditoria_eventos_usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id)
    );
END
GO


/* =====================================================
   7. ÍNDICES
===================================================== */

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_companias_cliente_id' AND object_id = OBJECT_ID('dbo.companias'))
    CREATE INDEX IX_companias_cliente_id ON dbo.companias(cliente_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_modulos_modulo_padre_id' AND object_id = OBJECT_ID('dbo.modulos'))
    CREATE INDEX IX_modulos_modulo_padre_id ON dbo.modulos(modulo_padre_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_modulos_tipo_estado' AND object_id = OBJECT_ID('dbo.modulos'))
    CREATE INDEX IX_modulos_tipo_estado ON dbo.modulos(tipo_modulo, estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licencias_cliente_id' AND object_id = OBJECT_ID('dbo.licencias'))
    CREATE INDEX IX_licencias_cliente_id ON dbo.licencias(cliente_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licencias_estado' AND object_id = OBJECT_ID('dbo.licencias'))
    CREATE INDEX IX_licencias_estado ON dbo.licencias(estado);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licencia_modulos_licencia_id' AND object_id = OBJECT_ID('dbo.licencia_modulos'))
    CREATE INDEX IX_licencia_modulos_licencia_id ON dbo.licencia_modulos(licencia_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licencia_modulo_companias_licencia_modulo_id' AND object_id = OBJECT_ID('dbo.licencia_modulo_companias'))
    CREATE INDEX IX_licencia_modulo_companias_licencia_modulo_id ON dbo.licencia_modulo_companias(licencia_modulo_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_licencia_archivos_generados_licencia_id' AND object_id = OBJECT_ID('dbo.licencia_archivos_generados'))
    CREATE INDEX IX_licencia_archivos_generados_licencia_id ON dbo.licencia_archivos_generados(licencia_id, generado_en DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_auditoria_eventos_creado_en' AND object_id = OBJECT_ID('dbo.auditoria_eventos'))
    CREATE INDEX IX_auditoria_eventos_creado_en ON dbo.auditoria_eventos(creado_en DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_auditoria_eventos_entidad' AND object_id = OBJECT_ID('dbo.auditoria_eventos'))
    CREATE INDEX IX_auditoria_eventos_entidad ON dbo.auditoria_eventos(entidad, entidad_id);
GO


/* =====================================================
   8. TRIGGERS PARA actualizado_en
===================================================== */

IF OBJECT_ID('dbo.trg_usuarios_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_usuarios_actualizado_en
ON dbo.usuarios
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.usuarios t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_roles_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_roles_actualizado_en
ON dbo.roles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.roles t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_permisos_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_permisos_actualizado_en
ON dbo.permisos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.permisos t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_clientes_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_clientes_actualizado_en
ON dbo.clientes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.clientes t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_companias_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_companias_actualizado_en
ON dbo.companias
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.companias t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_modulos_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_modulos_actualizado_en
ON dbo.modulos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.modulos t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_modulo_acciones_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_modulo_acciones_actualizado_en
ON dbo.modulo_acciones
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.modulo_acciones t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_modulo_configuraciones_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_modulo_configuraciones_actualizado_en
ON dbo.modulo_configuraciones
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.modulo_configuraciones t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_licencias_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_licencias_actualizado_en
ON dbo.licencias
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.licencias t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_licencia_modulos_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_licencia_modulos_actualizado_en
ON dbo.licencia_modulos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.licencia_modulos t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_licencia_modulo_companias_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_licencia_modulo_companias_actualizado_en
ON dbo.licencia_modulo_companias
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.licencia_modulo_companias t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO

IF OBJECT_ID('dbo.trg_llaves_firma_actualizado_en', 'TR') IS NULL
EXEC('
CREATE TRIGGER dbo.trg_llaves_firma_actualizado_en
ON dbo.llaves_firma
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
    SET actualizado_en = SYSUTCDATETIME()
    FROM dbo.llaves_firma t
    INNER JOIN inserted i ON t.id = i.id;
END
');
GO


/* =====================================================
   9. DATOS INICIALES MÍNIMOS
===================================================== */

IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE codigo = 'administrador')
BEGIN
    INSERT INTO dbo.roles (codigo, nombre, descripcion)
    VALUES ('administrador', 'Administrador', 'Rol con acceso administrativo completo.');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE codigo = 'operador')
BEGIN
    INSERT INTO dbo.roles (codigo, nombre, descripcion)
    VALUES ('operador', 'Operador', 'Rol operativo con acceso limitado.');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.permisos WHERE codigo = 'sistema.administrar')
BEGIN
    INSERT INTO dbo.permisos (codigo, nombre, descripcion)
    VALUES ('sistema.administrar', 'Administrar sistema', 'Permite administrar configuraciones generales del sistema.');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.permisos WHERE codigo = 'licencias.generar')
BEGIN
    INSERT INTO dbo.permisos (codigo, nombre, descripcion)
    VALUES ('licencias.generar', 'Generar licencias', 'Permite generar archivos de licencia firmados.');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.permisos WHERE codigo = 'licencias.descargar')
BEGIN
    INSERT INTO dbo.permisos (codigo, nombre, descripcion)
    VALUES ('licencias.descargar', 'Descargar licencias', 'Permite descargar archivos de licencia generados.');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.rol_permisos rp
               INNER JOIN dbo.roles r ON rp.rol_id = r.id
               INNER JOIN dbo.permisos p ON rp.permiso_id = p.id
               WHERE r.codigo = 'administrador' AND p.codigo = 'sistema.administrar')
BEGIN
    INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
    SELECT r.id, p.id
    FROM dbo.roles r
    CROSS JOIN dbo.permisos p
    WHERE r.codigo = 'administrador'
      AND p.codigo = 'sistema.administrar';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.rol_permisos rp
               INNER JOIN dbo.roles r ON rp.rol_id = r.id
               INNER JOIN dbo.permisos p ON rp.permiso_id = p.id
               WHERE r.codigo = 'administrador' AND p.codigo = 'licencias.generar')
BEGIN
    INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
    SELECT r.id, p.id
    FROM dbo.roles r
    CROSS JOIN dbo.permisos p
    WHERE r.codigo = 'administrador'
      AND p.codigo = 'licencias.generar';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.rol_permisos rp
               INNER JOIN dbo.roles r ON rp.rol_id = r.id
               INNER JOIN dbo.permisos p ON rp.permiso_id = p.id
               WHERE r.codigo = 'administrador' AND p.codigo = 'licencias.descargar')
BEGIN
    INSERT INTO dbo.rol_permisos (rol_id, permiso_id)
    SELECT r.id, p.id
    FROM dbo.roles r
    CROSS JOIN dbo.permisos p
    WHERE r.codigo = 'administrador'
      AND p.codigo = 'licencias.descargar';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.llaves_firma WHERE id_llave = 'principal-2026')
BEGIN
    INSERT INTO dbo.llaves_firma (id_llave, nombre, algoritmo, ruta_llave_publica)
    VALUES ('principal-2026', 'Llave principal 2026', 'Ed25519', NULL);
END
GO


/* =====================================================
   10. VISTAS DE APOYO
===================================================== */

IF OBJECT_ID('dbo.vw_modulos_arbol', 'V') IS NULL
EXEC('
CREATE VIEW dbo.vw_modulos_arbol AS
SELECT
    hijo.id AS modulo_id,
    hijo.codigo AS codigo_modulo,
    hijo.nombre AS nombre_modulo,
    hijo.descripcion AS descripcion_modulo,
    hijo.tipo_modulo,
    hijo.ruta,
    hijo.icono,
    hijo.orden,
    hijo.requiere_jobs,
    hijo.estado AS estado_modulo,
    padre.id AS modulo_padre_id,
    padre.codigo AS codigo_modulo_padre,
    padre.nombre AS nombre_modulo_padre,
    padre.estado AS estado_modulo_padre
FROM dbo.modulos hijo
LEFT JOIN dbo.modulos padre
    ON hijo.modulo_padre_id = padre.id;
');
GO

IF OBJECT_ID('dbo.vw_licencia_detalle', 'V') IS NULL
EXEC('
CREATE VIEW dbo.vw_licencia_detalle AS
SELECT
    l.id AS licencia_id,
    l.numero_licencia,
    l.estado AS estado_licencia,
    l.tipo_licencia,
    l.ambiente,
    c.id AS cliente_id,
    c.nombre AS nombre_cliente,
    lm.id AS licencia_modulo_id,
    m.id AS modulo_id,
    m.codigo AS codigo_modulo,
    m.nombre AS nombre_modulo,
    m.tipo_modulo,
    mp.codigo AS codigo_modulo_padre,
    mp.nombre AS nombre_modulo_padre,
    lm.cantidad_maxima_companias,
    comp.id AS compania_id,
    comp.codigo_compania,
    comp.nombre_compania,
    lmc.fecha_vencimiento,
    lmc.estado AS estado_compania_licenciada
FROM dbo.licencias l
INNER JOIN dbo.clientes c
    ON l.cliente_id = c.id
LEFT JOIN dbo.licencia_modulos lm
    ON l.id = lm.licencia_id
LEFT JOIN dbo.modulos m
    ON lm.modulo_id = m.id
LEFT JOIN dbo.modulos mp
    ON m.modulo_padre_id = mp.id
LEFT JOIN dbo.licencia_modulo_companias lmc
    ON lm.id = lmc.licencia_modulo_id
LEFT JOIN dbo.companias comp
    ON lmc.compania_id = comp.id;
');
GO

/*
=========================================================
 REGLAS QUE DEBEN VALIDARSE EN BACKEND
=========================================================

 Algunas reglas son más seguras y claras en servicios del backend:

 1. No permitir crear módulo tipo funcionalidad sin padre.
 2. No permitir crear funcionalidad debajo de otra funcionalidad.
 3. No permitir licenciar módulos tipo contenedor.
 4. No permitir licenciar módulo hijo si su padre está inactivo.
 5. No permitir asignar compañías de otro cliente a una licencia.
 6. No permitir exceder cantidad_maxima_companias.
 7. No permitir generar licencia sin módulos.
 8. No permitir generar licencia sin compañías por módulo.
 9. Construir payload firmado únicamente desde datos validados.
 10. No guardar llave privada en base de datos.
 11. Crear usuario administrador inicial desde script Python con hash seguro.
=========================================================
*/
