import requests
import json
import time
import base64
from datetime import datetime

# Configurazione
BASE_URL = "http://localhost:8001"  # URL diretto al servizio auth (non tramite API Gateway)
API_PREFIX = "/api/auth"
LOGIN_URL = f"{BASE_URL}{API_PREFIX}/login"
USERS_URL = f"{BASE_URL}{API_PREFIX}/users"
STATS_URL = f"{BASE_URL}{API_PREFIX}/stats"
ACTIVITIES_URL = f"{BASE_URL}{API_PREFIX}/activities"
DEBUG_URL = f"{BASE_URL}/api/debug/token-debug"

# Credenziali valide
USERNAME = "admin"
PASSWORD = "adminpass123"

def login():
    """Effettua login e restituisce il token JWT."""
    print(f"Tentativo di login con {USERNAME}...")
    
    # Form data per OAuth2
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(LOGIN_URL, data=login_data)
    
    # Verifica se il login è riuscito
    if response.status_code == 200:
        token_data = response.json()
        print("Login riuscito!")
        print(f"Token ricevuto (primi 20 caratteri): {token_data.get('access_token', '')[:20]}...")
        return token_data
    else:
        print(f"Errore nel login: {response.status_code}")
        print(response.text)
        return None

def decode_jwt_token(token):
    """Decodifica un token JWT per analizzare il payload."""
    try:
        # Dividi il token nelle sue parti (header, payload, signature)
        parts = token.split('.')
        if len(parts) != 3:
            return "Token non valido: formato errato"
        
        # Decodifica la parte payload (seconda parte)
        # Potrebbe essere necessario aggiungere padding
        payload_part = parts[1]
        if len(payload_part) % 4 != 0:  # Aggiungi padding se necessario
            payload_part += '=' * (4 - len(payload_part) % 4)
        
        payload_bytes = base64.b64decode(payload_part)
        payload = json.loads(payload_bytes.decode('utf-8'))
        return payload
    except Exception as e:
        return f"Errore nella decodifica: {str(e)}"

def test_endpoints(token_data):
    """Testa gli endpoint protetti usando il token di autenticazione."""
    if not token_data or "access_token" not in token_data:
        print("Token non disponibile, impossibile testare gli endpoint.")
        return
    
    # Analizza il token JWT
    access_token = token_data['access_token']
    print("\n--- Analisi del token JWT ---")
    print(f"Token completo: {access_token}")
    payload = decode_jwt_token(access_token)
    print(f"Payload decodificato: {json.dumps(payload, indent=2)}")
    
    # Headers per l'autenticazione - formato standard
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    print(f"\nHeader Authorization: {headers['Authorization']}")
    
    # Test endpoint debug per verificare la validazione del token
    print("\n--- Test endpoint di debug token ---")
    response = requests.get(DEBUG_URL, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        debug_info = response.json()
        print("Info di debug del token:")
        print(json.dumps(debug_info, indent=2))
    else:
        print("Errore:", response.text)
    
    # Test endpoint utenti
    print("\n--- Test endpoint /users ---")
    response = requests.get(USERS_URL, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"Numero di utenti ricevuti: {len(users)}")
        if users:
            print("Primo utente:")
            print(json.dumps(users[0], indent=2))
    else:
        print("Errore:", response.text)
    
    # Test endpoint stats
    print("\n--- Test endpoint /stats ---")
    response = requests.get(STATS_URL, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print("Statistiche:")
        print(json.dumps(stats, indent=2))
    else:
        print("Errore:", response.text)
    
    # Test endpoint activities
    print("\n--- Test endpoint /activities ---")
    response = requests.get(ACTIVITIES_URL, headers=headers)
    print(f"Status code: {response.status_code}")
    if response.status_code == 200:
        activities = response.json()
        print(f"Numero di attività ricevute: {len(activities)}")
        if activities:
            print("Prima attività:")
            print(json.dumps(activities[0], indent=2))
    else:
        print("Errore:", response.text)

if __name__ == "__main__":
    # Effettua login
    token_data = login()
    
    if token_data:
        # Testa gli endpoint
        test_endpoints(token_data)
    else:
        print("Impossibile procedere con i test: login fallito.")
