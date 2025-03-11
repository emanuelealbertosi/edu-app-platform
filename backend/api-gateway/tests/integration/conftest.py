import pytest
import os
import sys
import requests
from time import sleep

# Aggiungi il percorso alla radice del progetto
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Configurazione per i test di integrazione
@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """
    Setup per i test di integrazione.
    Assicura che i servizi siano in esecuzione prima di eseguire i test.
    """
    # Verifica che l'API Gateway sia in esecuzione
    max_retries = 5
    retry_count = 0
    while retry_count < max_retries:
        try:
            response = requests.get("http://localhost:8000/")
            if response.status_code == 200:
                print("API Gateway è in esecuzione")
                break
        except requests.ConnectionError:
            print(f"API Gateway non è disponibile, riprovo ({retry_count+1}/{max_retries})...")
            sleep(2)  # Attendi 2 secondi prima di riprovare
            retry_count += 1
            
    if retry_count == max_retries:
        pytest.skip("API Gateway non è in esecuzione. Avvia i servizi con docker-compose up prima di eseguire i test di integrazione.")

    # Verifica che il servizio di autenticazione sia in esecuzione
    try:
        response = requests.get("http://localhost:8001/api/auth/health")
        if response.status_code != 200:
            pytest.skip("Auth Service non è in esecuzione. Avvia i servizi con docker-compose up prima di eseguire i test di integrazione.")
    except requests.ConnectionError:
        pytest.skip("Auth Service non è in esecuzione. Avvia i servizi con docker-compose up prima di eseguire i test di integrazione.")
    
    yield  # Esegui i test
    
    # Cleanup dopo i test (se necessario)
    print("Pulizia dopo i test di integrazione")
