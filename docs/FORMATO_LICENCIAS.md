# Formato de archivos de licencia (.lic)

## Descripción general

Los archivos `.lic` generados por este sistema son documentos JSON firmados digitalmente con el algoritmo **Ed25519**. Contienen la información completa de la licencia (módulos, compañías, permisos) y una firma criptográfica que permite verificar su autenticidad e integridad.

---

## Estructura del archivo `.lic`

```json
{
  "version_licencia": "1.0",
  "algoritmo": "Ed25519",
  "id_llave": "principal-2026",
  "payload": "<base64_standard(canonical_json_bytes)>",
  "firma": "<base64_urlsafe(ed25519_signature)>"
}
```

| Campo             | Tipo   | Descripción                                                   |
|-------------------|--------|---------------------------------------------------------------|
| `version_licencia`| string | Versión del formato del archivo (actualmente `"1.0"`)         |
| `algoritmo`       | string | Algoritmo de firma: siempre `"Ed25519"`                       |
| `id_llave`        | string | Identificador de la llave pública usada (en `dbo.llaves_firma`)|
| `payload`         | string | JSON del payload, codificado en **Base64 estándar**           |
| `firma`           | string | Firma Ed25519 del payload JSON, codificada en **Base64 URL-safe** |

---

## Decodificación del payload

El `payload` es el JSON del payload original serializado de forma **canónica** (`sort_keys=True`, `ensure_ascii=False`) y codificado en Base64 estándar.

### Python

```python
import base64, json

with open("licencia.lic") as f:
    lic = json.load(f)

payload_bytes = base64.b64decode(lic["payload"])
payload = json.loads(payload_bytes.decode("utf-8"))
```

### JavaScript / Node.js

```javascript
const lic = JSON.parse(fs.readFileSync("licencia.lic", "utf8"));
const payload = JSON.parse(Buffer.from(lic.payload, "base64").toString("utf8"));
```

---

## Verificación de la firma

La firma se genera sobre los **bytes del JSON canónico del payload** (el mismo string que se codificó en Base64).

### Python

```python
import base64, json
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key

with open("licencia.lic") as f:
    lic = json.load(f)

# 1. Decodificar el payload (obtenemos los bytes originales)
payload_bytes = base64.b64decode(lic["payload"])

# 2. Cargar la llave pública
with open("keys/public_key.pem", "rb") as f:
    public_key = load_pem_public_key(f.read())

# 3. Decodificar la firma (Base64 URL-safe)
signature = base64.urlsafe_b64decode(lic["firma"])

# 4. Verificar
try:
    public_key.verify(signature, payload_bytes)
    print("✓ Firma válida")
except Exception:
    print("✗ Firma inválida")
```

### Verificación del hash del archivo

El hash SHA-256 del contenido completo del archivo `.lic` (incluida la firma) está almacenado en `dbo.licencia_archivos_generados.hash_archivo`. Permite detectar modificaciones del archivo:

```python
import hashlib

with open("licencia.lic", "r", encoding="utf-8") as f:
    content = f.read()

computed = hashlib.sha256(content.encode("utf-8")).hexdigest()
# Comparar con el valor almacenado en la BD
```

---

## Estructura del payload decodificado

```json
{
  "numero_licencia": "LIC-2026-001",
  "version_payload": "1.0",
  "tipo_licencia": "offline",
  "ambiente": "produccion",
  "fecha_emision": "2026-01-15",
  "emitida_por": "admin",
  "cliente": {
    "id_cliente": 1,
    "nombre": "Empresa ABC S.A."
  },
  "caracteristicas": {
    "cantidad_maxima_usuarios": 50,
    "permite_jobs_segundo_plano": true,
    "permite_api": false
  },
  "modulos": [
    {
      "id_modulo": 3,
      "codigo_modulo": "notificaciones",
      "nombre_modulo": "Notificaciones",
      "descripcion": "Módulo de notificaciones y alertas",
      "tipo_modulo": "funcionalidad",
      "codigo_modulo_padre": "comunicaciones",
      "nombre_modulo_padre": "Comunicaciones",
      "ruta": "/notificaciones",
      "icono": "Bell",
      "orden": 10,
      "requiere_jobs": true,
      "acciones": ["ver", "crear", "envio_correos"],
      "permisos_requeridos": [
        "notificaciones.ver",
        "notificaciones.crear",
        "notificaciones.envio_correos"
      ],
      "cantidad_companias_permitidas": 3,
      "companias": [
        {
          "id_compania": 5,
          "codigo_compania": "CIA001",
          "nombre_compania": "Sucursal Norte",
          "fecha_vencimiento": "2027-01-01",
          "estado": "activo"
        }
      ]
    }
  ],
  "metadata": {
    "generada_en": "2026-01-15T14:32:00Z",
    "zona_horaria": "UTC",
    "observaciones": null
  }
}
```

---

## Formato de permisos

Los permisos siguen el patrón:

```
<codigo_modulo>.<codigo_accion>
```

Ejemplos:
- `notificaciones.ver`
- `notificaciones.envio_correos`
- `reportes.exportar_pdf`

Están pre-calculados y almacenados en `dbo.modulo_acciones.permiso_generado`.

---

## Flujo de construcción del menú (LicenseManager pseudocódigo)

```python
class LicenseManager:
    def __init__(self, lic_path: str):
        with open(lic_path) as f:
            lic = json.load(f)
        self._verify(lic)          # lanza excepción si firma inválida
        payload_bytes = base64.b64decode(lic["payload"])
        self.payload = json.loads(payload_bytes)

    def _verify(self, lic):
        public_key = self._load_public_key(lic["id_llave"])
        payload_bytes = base64.b64decode(lic["payload"])
        signature = base64.urlsafe_b64decode(lic["firma"])
        public_key.verify(signature, payload_bytes)   # lanza si inválida

    def get_modulos_para_compania(self, codigo_compania: str) -> list:
        """Retorna módulos donde la compañía tiene acceso activo y vigente."""
        resultado = []
        hoy = date.today().isoformat()
        for mod in self.payload["modulos"]:
            for cia in mod["companias"]:
                if (
                    cia["codigo_compania"] == codigo_compania
                    and cia["estado"] == "activo"
                    and cia["fecha_vencimiento"] >= hoy
                ):
                    resultado.append(mod)
                    break
        return resultado

    def tiene_permiso(self, compania: str, permiso: str) -> bool:
        for mod in self.get_modulos_para_compania(compania):
            if permiso in mod["permisos_requeridos"]:
                return True
        return False
```

---

## Estados de una licencia

| Estado    | Descripción                                               |
|-----------|-----------------------------------------------------------|
| `borrador`| Recién creada, aún no generada. Se puede editar libremente.|
| `activa`  | Archivo generado al menos una vez. Operativa.            |
| `revocada`| Revocada permanentemente. No se puede regenerar.         |
| `expirada`| Vencida por tiempo (gestionado externamente).            |
| `inactiva`| Desactivada temporalmente. Se puede reactivar.           |

---

## Advertencia para licencias offline

En licencias de tipo `offline`, la revocación **no se propaga automáticamente** al sistema cliente. El archivo `.lic` físico debe ser eliminado o reemplazado en el sistema donde está instalado.

Se recomienda:
1. Generar una nueva licencia con estado diferente o con companías eliminadas.
2. Distribuir el nuevo `.lic` al cliente.
3. El cliente debe reemplazar el archivo y reiniciar el sistema.

---

## Tabla de referencia de la base de datos

| Tabla                           | Propósito                                                |
|---------------------------------|----------------------------------------------------------|
| `dbo.licencias`                 | Datos base de cada licencia                             |
| `dbo.licencia_modulos`          | Módulos asignados a la licencia                         |
| `dbo.licencia_modulo_companias` | Compañías asignadas por módulo con fecha de vencimiento |
| `dbo.modulos`                   | Catálogo de módulos del sistema                         |
| `dbo.modulo_acciones`           | Acciones y permisos de cada módulo                      |
| `dbo.llaves_firma`              | Registro de llaves públicas Ed25519                     |
| `dbo.licencia_archivos_generados`| Historial de archivos `.lic` generados                 |
