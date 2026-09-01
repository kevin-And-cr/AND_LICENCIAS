"""
Script para crear el usuario administrador inicial.

Uso:
    cd backend
    python scripts/crear_admin.py

    O con argumentos:
    python scripts/crear_admin.py --usuario admin --correo admin@andtools.com --password MiClave123
"""
import sys
import argparse
from pathlib import Path

# Asegura que el directorio raíz del backend esté en el path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Carga el .env antes de importar settings
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from sqlalchemy import text
from app.core.config import settings
from app.db.session import SessionLocal
from app.core.security import hash_password


def crear_admin(usuario: str, correo: str, password: str) -> None:
    db = SessionLocal()
    try:
        # Verificar si el usuario ya existe
        resultado = db.execute(
            text("SELECT id FROM dbo.usuarios WHERE nombre_usuario = :u"),
            {"u": usuario},
        ).fetchone()

        if resultado:
            print(f"[!] El usuario '{usuario}' ya existe (id={resultado[0]}). No se creó nada.")
            return

        password_hash = hash_password(password)

        # Insertar usuario
        nuevo_usuario = db.execute(
            text("""
                INSERT INTO dbo.usuarios (nombre_usuario, correo, password_hash, estado)
                OUTPUT INSERTED.id
                VALUES (:u, :c, :h, 'activo')
            """),
            {"u": usuario, "c": correo, "h": password_hash},
        ).fetchone()

        usuario_id = nuevo_usuario[0]

        # Obtener rol administrador
        rol = db.execute(
            text("SELECT id FROM dbo.roles WHERE codigo = 'administrador'"),
        ).fetchone()

        if not rol:
            print("[!] No se encontró el rol 'administrador'. Ejecutá primero el schema.sql.")
            db.rollback()
            return

        rol_id = rol[0]

        # Asignar rol
        db.execute(
            text("""
                INSERT INTO dbo.usuario_roles (usuario_id, rol_id)
                VALUES (:uid, :rid)
            """),
            {"uid": usuario_id, "rid": rol_id},
        )

        db.commit()
        print(f"[✓] Usuario '{usuario}' creado con id={usuario_id} y rol 'administrador' asignado.")
        print(f"    Correo : {correo}")
        print(f"    Estado : activo")

    except Exception as e:
        db.rollback()
        print(f"[✗] Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crea el usuario administrador inicial.")
    parser.add_argument("--usuario",  default="admin",               help="Nombre de usuario (default: admin)")
    parser.add_argument("--correo",   default="admin@andtools.com",  help="Correo electrónico")
    parser.add_argument("--password", default="Admin1234!",          help="Contraseña (cambiala luego)")
    args = parser.parse_args()

    print(f"Creando usuario administrador en: {settings.DB_HOST}/{settings.DB_NAME}")
    crear_admin(args.usuario, args.correo, args.password)
