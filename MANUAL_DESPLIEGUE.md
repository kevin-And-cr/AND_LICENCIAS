# Manual de despliegue — AND Tools Administrador

## Requisitos del servidor

| Requisito | Versión mínima |
|---|---|
| Sistema operativo | Windows Server 2019 / Ubuntu 20.04 LTS |
| Docker Desktop (Windows) o Docker Engine (Linux) | 24+ |
| Docker Compose | v2+ (incluido en Docker Desktop) |
| SQL Server | 2019 o superior (puede ser Express) |
| RAM | 2 GB mínimo para los contenedores |

---

## Paso 1 — Instalar Docker

**Windows:**
1. Descargar Docker Desktop desde https://www.docker.com/products/docker-desktop
2. Instalar y reiniciar el sistema
3. Verificar: abrir PowerShell y ejecutar `docker --version`

**Linux (Ubuntu):**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar
docker --version
```

---

## Paso 2 — Recibir los archivos del sistema

Recibirás una carpeta comprimida con esta estructura:
```
AND_TOOLS_ADMINISTRADOR/
├── docker-compose.prod.yml
├── backend/
│   ├── .env.example          ← copiar a .env y configurar
│   ├── keys/
│   │   ├── private_key.pem   ← SECRETO, no compartir
│   │   └── public_key.pem
│   └── scripts/
│       └── crear_admin.py
├── frontend/
└── schema.sql
```

---

## Paso 3 — Configurar la base de datos SQL Server

1. Abrir SQL Server Management Studio (SSMS) o Azure Data Studio
2. Crear una base de datos nueva:
   ```sql
   CREATE DATABASE and_tools;
   ```
3. Ejecutar el archivo `schema.sql` completo sobre esa base de datos
4. Crear un usuario SQL con permisos:
   ```sql
   CREATE LOGIN and_user WITH PASSWORD = 'TuPasswordSeguro123!';
   USE and_tools;
   CREATE USER and_user FOR LOGIN and_user;
   ALTER ROLE db_owner ADD MEMBER and_user;
   ```

---

## Paso 4 — Configurar el archivo .env del backend

1. Copiar `backend/.env.example` → `backend/.env`
2. Editar `backend/.env` con los datos reales:

```env
# ─── Base de datos ────────────────────────────────────────────────────────────
DB_HOST=host.docker.internal   # Si SQL Server está en el mismo servidor Windows
# DB_HOST=192.168.1.100        # Usar IP si SQL Server está en otro servidor
DB_PORT=1433
DB_NAME=and_tools
DB_USER=and_user
DB_PASSWORD=TuPasswordSeguro123!

# ─── JWT (cambiar obligatoriamente) ──────────────────────────────────────────
JWT_SECRET_KEY=GenerarUnSecretoLargoAqui1234567890abcdef
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ─── Llaves de firma ─────────────────────────────────────────────────────────
ED25519_PRIVATE_KEY_PATH=./keys/private_key.pem
ED25519_PUBLIC_KEY_PATH=./keys/public_key.pem

# ─── App ─────────────────────────────────────────────────────────────────────
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=false
CORS_ORIGINS=http://TU_IP_O_DOMINIO
```

> **Nota sobre DB_HOST:**
> - Si SQL Server está instalado en el **mismo servidor** que Docker → usar `host.docker.internal` (Windows/Mac) o la IP de la red Docker en Linux.
> - Si está en **otro servidor** → usar la IP de red de ese servidor.

---

## Paso 5 — Levantar el sistema

Abrir PowerShell o terminal en la carpeta `AND_TOOLS_ADMINISTRADOR` y ejecutar:

```powershell
docker-compose -f docker-compose.prod.yml up -d --build
```

Esto descargará las imágenes base (solo la primera vez), compilará el sistema y lo dejará corriendo.

Para ver los logs en tiempo real:
```powershell
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Paso 6 — Crear el usuario administrador inicial

Una sola vez, ejecutar:

```powershell
docker exec -it and_backend python scripts/crear_admin.py
```

Sigue las instrucciones en pantalla para crear el usuario administrador.

---

## Paso 7 — Acceder al sistema

Abrir el navegador y entrar a:

```
http://IP_DEL_SERVIDOR
```

(o `http://localhost` si accedes desde el mismo servidor)

---

## Gestión del sistema

### Detener el sistema
```powershell
docker-compose -f docker-compose.prod.yml down
```

### Actualizar a una nueva versión
```powershell
# 1. Reemplazar los archivos con la nueva versión
# 2. Ejecutar:
docker-compose -f docker-compose.prod.yml up -d --build
```

### Ver logs del backend
```powershell
docker logs and_backend -f
```

### Ver logs del frontend (Nginx)
```powershell
docker logs and_frontend -f
```

---

## Solución de problemas frecuentes

| Problema | Solución |
|---|---|
| No conecta a SQL Server | Verificar `DB_HOST` en `.env`. En Windows usar `host.docker.internal`. Verificar que SQL Server acepte conexiones TCP (puerto 1433 habilitado en firewall) |
| Puerto 80 ocupado | Cambiar `"80:80"` por `"8080:80"` en `docker-compose.prod.yml` y acceder como `http://IP:8080` |
| Error "permission denied" en Linux | Ejecutar `sudo chmod 600 backend/keys/private_key.pem` |
| Contenedor no arranca | Ejecutar `docker logs and_backend` para ver el error específico |

---

## Seguridad importante

- El archivo `backend/keys/private_key.pem` es la llave maestra de firma de licencias. **Nunca compartirlo.**
- Cambiar `JWT_SECRET_KEY` por un valor único y aleatorio en cada instalación.
- Habilitar HTTPS en producción usando un proxy inverso como Nginx o Caddy frente a los contenedores.
