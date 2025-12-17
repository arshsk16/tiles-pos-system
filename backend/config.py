import os
from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///tiles.db"
    )
    # Fix for Render/Railway which use postgres:// starting with SQLAlchemy 1.4+
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask sessions
    SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")

    # JWT auth
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "myjwtsecret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)  # Tokens last 7 days
