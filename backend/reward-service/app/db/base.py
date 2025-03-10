from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Crea l'engine di connessione a PostgreSQL
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# Crea una sessione factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe base per i modelli ORM
Base = declarative_base()

# Funzione di utilità per ottenere una sessione di database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
