#!/usr/bin/env python3
"""
Script di test per verificare gli endpoint stats e activities direttamente,
bypassando l'autenticazione per scopi di verifica.
"""
import asyncio
import sys
import os
import sys

# Aggiungiamo il percorso corrente al PYTHONPATH per rendere disponibili i moduli dell'app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.repositories.user_repository import UserRepository
from app.api.endpoints.auth import get_stats, get_activities

async def test_stats_endpoint():
    """Testa l'endpoint di statistiche di sistema."""
    print("Test dell'endpoint /api/auth/stats...")
    db = SessionLocal()
    try:
        # Recupera le statistiche direttamente
        stats = await get_stats(db=db)
        print("Statistiche di sistema:")
        print(f"Totale utenti: {stats.totalUsers}")
        print(f"Studenti attivi: {stats.activeStudents}")
        print(f"Genitori attivi: {stats.activeParents}")
        return True
    except Exception as e:
        print(f"Errore durante il test dell'endpoint stats: {e}")
        return False
    finally:
        db.close()

async def test_activities_endpoint():
    """Testa l'endpoint delle attività di amministrazione."""
    print("\nTest dell'endpoint /api/auth/activities...")
    db = SessionLocal()
    try:
        # Recupera le attività direttamente
        activities = await get_activities(db=db)
        print(f"Attività recuperate: {len(activities)}")
        for i, activity in enumerate(activities[:3]):  # Mostra solo le prime 3 attività
            print(f"Attività {i+1}:")
            print(f"  ID: {activity.id}")
            print(f"  Utente: {activity.username} (ID: {activity.userId})")
            print(f"  Ruolo: {activity.userRole}")
            print(f"  Azione: {activity.action}")
            print(f"  Data: {activity.timestamp}")
            if activity.details:
                print(f"  Dettagli: {activity.details}")
        return True
    except Exception as e:
        print(f"Errore durante il test dell'endpoint activities: {e}")
        return False
    finally:
        db.close()

async def test_user_repository():
    """Testa direttamente il repository utenti."""
    print("\nTest diretto UserRepository.get_user_statistics...")
    db = SessionLocal()
    try:
        stats = UserRepository.get_user_statistics(db)
        print("Statistiche dal repository:")
        print(f"Totale utenti: {stats['total_users']}")
        print(f"Studenti attivi: {stats['active_students']}")
        print(f"Genitori attivi: {stats['active_parents']}")
        return True
    except Exception as e:
        print(f"Errore durante il test del repository: {e}")
        return False
    finally:
        db.close()

async def main():
    """Funzione principale che esegue tutti i test."""
    success = True
    
    # Test del repository
    if not await test_user_repository():
        success = False
    
    # Test degli endpoint
    if not await test_stats_endpoint():
        success = False
    
    if not await test_activities_endpoint():
        success = False
    
    if success:
        print("\n✅ Tutti i test sono stati completati con successo!")
        return 0
    else:
        print("\n❌ Alcuni test sono falliti. Controlla i dettagli sopra.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
