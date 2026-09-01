from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List
import urllib.parse


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Base de datos SQL Server
    DB_HOST: str
    DB_PORT: int = 1433
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    @property
    def DATABASE_URL(self) -> str:
        # Sin puerto en SERVER= el driver ODBC negocia el protocolo automáticamente
        # (shared memory para conexiones locales, TCP para remotas)
        odbc = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={self.DB_HOST};"
            f"DATABASE={self.DB_NAME};"
            f"UID={self.DB_USER};"
            f"PWD={self.DB_PASSWORD};"
            f"TrustServerCertificate=yes;"
        )
        return f"mssql+pyodbc:///?odbc_connect={urllib.parse.quote_plus(odbc)}"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Firma digital ED25519
    ED25519_PRIVATE_KEY_PATH: str = "./keys/private_key.pem"
    ED25519_PUBLIC_KEY_PATH: str = "./keys/public_key.pem"

    # Aplicación
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
