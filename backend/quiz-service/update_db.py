import logging
from sqlalchemy import create_engine, Column, Text
from sqlalchemy.sql import text
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_columns():
    """
    Aggiunge le colonne mancanti alle tabelle
    """
    logger.info("Aggiunta colonne mancanti alle tabelle")
    
    # Create database engine
    engine = create_engine(str(settings.DATABASE_URI))
    
    # Aggiunta della colonna feedback alla tabella quiz_attempts
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN feedback TEXT"))
            conn.commit()
            logger.info("Colonna feedback aggiunta con successo alla tabella quiz_attempts")
    except Exception as e:
        logger.warning(f"Non è stato possibile aggiungere la colonna feedback: {str(e)}")
    
    # Aggiunta della colonna node_uuid alla tabella quizzes
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE quizzes ADD COLUMN node_uuid TEXT"))
            conn.commit()
            logger.info("Colonna node_uuid aggiunta con successo alla tabella quizzes")
    except Exception as e:
        logger.warning(f"Non è stato possibile aggiungere la colonna node_uuid: {str(e)}")
    
    # Copio il valore di path_id in node_uuid per i quiz esistenti
    try:
        with engine.connect() as conn:
            conn.execute(text("UPDATE quizzes SET node_uuid = path_id WHERE path_id IS NOT NULL AND node_uuid IS NULL"))
            conn.commit()
            logger.info("Valori copiati con successo")
    except Exception as e:
        logger.warning(f"Non è stato possibile aggiornare i valori: {str(e)}")

if __name__ == "__main__":
    add_columns() 