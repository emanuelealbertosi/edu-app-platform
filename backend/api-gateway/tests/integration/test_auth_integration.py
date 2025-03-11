import pytest
import requests
import json
from datetime import datetime, timedelta

# URL dell'API Gateway in locale
API_GATEWAY_URL = "http://localhost:8000"

# URL di autenticazione
LOGIN_URL = f"{API_GATEWAY_URL}/api/auth/login"
REGISTER_URL = f"{API_GATEWAY_URL}/api/auth/register"

# URL dei servizi
# Path Service
PATH_CATEGORIES_URL = f"{API_GATEWAY_URL}/api/paths/categories"
PATH_TEMPLATES_URL = f"{API_GATEWAY_URL}/api/paths/templates"

# Quiz Service
QUIZ_TEMPLATES_URL = f"{API_GATEWAY_URL}/api/quiz/templates"
QUESTION_TEMPLATES_URL = f"{API_GATEWAY_URL}/api/quiz/question-templates"

# Reward Service
REWARD_CATEGORIES_URL = f"{API_GATEWAY_URL}/api/rewards/categories"
REWARDS_URL = f"{API_GATEWAY_URL}/api/rewards"

# Credenziali di test
TEST_ADMIN = {
    "email": "admin.test@example.com",
    "password": "testpassword123",
    "first_name": "Admin",
    "last_name": "Test"
}

TEST_PARENT = {
    "email": "parent.test@example.com",
    "password": "testpassword123",
    "first_name": "Parent",
    "last_name": "Test"
}

TEST_STUDENT = {
    "email": "student.test@example.com",
    "password": "testpassword123",
    "first_name": "Student",
    "last_name": "Test"
}

@pytest.fixture(scope="module")
def admin_token():
    """Ottiene un token di autenticazione per un utente admin"""
    try:
        # Prima prova a fare login
        response = requests.post(
            LOGIN_URL,
            json={"email": TEST_ADMIN["email"], "password": TEST_ADMIN["password"]}
        )
        
        # Se l'utente non esiste, registralo come admin
        if response.status_code == 401 or response.status_code == 404:
            # Registrazione admin
            response = requests.post(
                REGISTER_URL,
                json={
                    **TEST_ADMIN,
                    "role": "admin"  # Specifica il ruolo admin
                }
            )
            
            # Fai login dopo la registrazione
            response = requests.post(
                LOGIN_URL,
                json={"email": TEST_ADMIN["email"], "password": TEST_ADMIN["password"]}
            )
        
        # Verifica che il login sia riuscito
        assert response.status_code == 200, f"Login fallito: {response.text}"
        data = response.json()
        
        # Assicurati che il token di accesso sia presente
        assert "access_token" in data, "Token di accesso non trovato nella risposta"
        
        return data["access_token"]
    except Exception as e:
        pytest.fail(f"Errore durante l'autenticazione dell'admin: {e}")

@pytest.fixture(scope="module")
def parent_token():
    """Ottiene un token di autenticazione per un utente parent"""
    try:
        # Prima prova a fare login
        response = requests.post(
            LOGIN_URL,
            json={"email": TEST_PARENT["email"], "password": TEST_PARENT["password"]}
        )
        
        # Se l'utente non esiste, registralo come parent
        if response.status_code == 401 or response.status_code == 404:
            # Registrazione parent
            response = requests.post(
                REGISTER_URL,
                json={
                    **TEST_PARENT,
                    "role": "parent"  # Specifica il ruolo parent
                }
            )
            
            # Fai login dopo la registrazione
            response = requests.post(
                LOGIN_URL,
                json={"email": TEST_PARENT["email"], "password": TEST_PARENT["password"]}
            )
        
        # Verifica che il login sia riuscito
        assert response.status_code == 200, f"Login fallito: {response.text}"
        data = response.json()
        
        # Assicurati che il token di accesso sia presente
        assert "access_token" in data, "Token di accesso non trovato nella risposta"
        
        return data["access_token"]
    except Exception as e:
        pytest.fail(f"Errore durante l'autenticazione del parent: {e}")

@pytest.fixture(scope="module")
def student_token():
    """Ottiene un token di autenticazione per un utente student"""
    try:
        # Prima prova a fare login
        response = requests.post(
            LOGIN_URL,
            json={"email": TEST_STUDENT["email"], "password": TEST_STUDENT["password"]}
        )
        
        # Se l'utente non esiste, registralo come studente
        if response.status_code == 401 or response.status_code == 404:
            # Registrazione studente
            response = requests.post(
                REGISTER_URL,
                json={
                    **TEST_STUDENT,
                    "role": "student"  # Specifica il ruolo studente
                }
            )
            
            # Fai login dopo la registrazione
            response = requests.post(
                LOGIN_URL,
                json={"email": TEST_STUDENT["email"], "password": TEST_STUDENT["password"]}
            )
        
        # Verifica che il login sia riuscito
        assert response.status_code == 200, f"Login fallito: {response.text}"
        data = response.json()
        
        # Assicurati che il token di accesso sia presente
        assert "access_token" in data, "Token di accesso non trovato nella risposta"
        
        return data["access_token"]
    except Exception as e:
        pytest.fail(f"Errore durante l'autenticazione dello studente: {e}")

def test_path_service_authentication(admin_token, parent_token, student_token):
    """Test per verificare che l'autenticazione funzioni con il path-service"""
    # 1. Admin deve poter accedere a tutte le risorse
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    # Test accesso admin alle categorie di percorsi
    response = requests.get(PATH_CATEGORIES_URL, headers=headers_admin)
    assert response.status_code == 200, f"Admin non può accedere alle categorie di percorsi: {response.text}"
    
    # Test creazione categoria percorsi (solo admin)
    category_data = {
        "name": f"Test Category {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "Categoria creata durante i test di integrazione"
    }
    response = requests.post(PATH_CATEGORIES_URL, json=category_data, headers=headers_admin)
    assert response.status_code in [200, 201], f"Admin non può creare categorie di percorsi: {response.text}"
    
    # 2. Parent deve poter visualizzare ma non creare certe risorse
    headers_parent = {"Authorization": f"Bearer {parent_token}"}
    
    # Test accesso parent alle categorie di percorsi (sola lettura)
    response = requests.get(PATH_CATEGORIES_URL, headers=headers_parent)
    assert response.status_code == 200, f"Parent non può visualizzare le categorie di percorsi: {response.text}"
    
    # 3. Student deve avere accesso limitato
    headers_student = {"Authorization": f"Bearer {student_token}"}
    
    # Test accesso student alle categorie di percorsi (sola lettura)
    response = requests.get(PATH_CATEGORIES_URL, headers=headers_student)
    assert response.status_code == 200, f"Student non può visualizzare le categorie di percorsi: {response.text}"

def test_quiz_service_authentication(admin_token, parent_token, student_token):
    """Test per verificare che l'autenticazione funzioni con il quiz-service"""
    # 1. Admin deve poter accedere a tutte le risorse
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    # Test accesso admin ai quiz templates
    response = requests.get(QUIZ_TEMPLATES_URL, headers=headers_admin)
    assert response.status_code == 200, f"Admin non può accedere ai quiz templates: {response.text}"
    
    # 2. Parent deve poter visualizzare ma non creare certe risorse
    headers_parent = {"Authorization": f"Bearer {parent_token}"}
    
    # Test accesso parent ai quiz templates (sola lettura)
    response = requests.get(QUIZ_TEMPLATES_URL, headers=headers_parent)
    assert response.status_code == 200, f"Parent non può visualizzare i quiz templates: {response.text}"
    
    # 3. Student deve avere accesso limitato
    headers_student = {"Authorization": f"Bearer {student_token}"}
    
    # Test accesso student ai quiz templates (sola lettura)
    response = requests.get(QUIZ_TEMPLATES_URL, headers=headers_student)
    assert response.status_code == 200, f"Student non può visualizzare i quiz templates: {response.text}"

def test_reward_service_authentication(admin_token, parent_token, student_token):
    """Test per verificare che l'autenticazione funzioni con il reward-service"""
    # 1. Admin deve poter accedere a tutte le risorse
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    # Test accesso admin alle categorie di rewards
    response = requests.get(REWARD_CATEGORIES_URL, headers=headers_admin)
    assert response.status_code == 200, f"Admin non può accedere alle categorie di rewards: {response.text}"
    
    # Test creazione categoria rewards (solo admin)
    category_data = {
        "name": f"Test Reward Category {datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "Categoria di ricompense creata durante i test di integrazione"
    }
    response = requests.post(REWARD_CATEGORIES_URL, json=category_data, headers=headers_admin)
    assert response.status_code in [200, 201], f"Admin non può creare categorie di ricompense: {response.text}"
    
    # 2. Parent deve poter visualizzare ma non creare certe risorse
    headers_parent = {"Authorization": f"Bearer {parent_token}"}
    
    # Test accesso parent alle categorie di ricompense (sola lettura)
    response = requests.get(REWARD_CATEGORIES_URL, headers=headers_parent)
    assert response.status_code == 200, f"Parent non può visualizzare le categorie di ricompense: {response.text}"
    
    # 3. Student deve avere accesso limitato
    headers_student = {"Authorization": f"Bearer {student_token}"}
    
    # Test accesso student alle categorie di ricompense (sola lettura)
    response = requests.get(REWARD_CATEGORIES_URL, headers=headers_student)
    assert response.status_code == 200, f"Student non può visualizzare le categorie di ricompense: {response.text}"

def test_unauthorized_access():
    """Test per verificare che gli endpoint protetti rifiutino accessi non autorizzati"""
    # Richieste senza token di autenticazione
    response = requests.get(PATH_CATEGORIES_URL)
    assert response.status_code in [401, 403], f"Accesso alle categorie di percorsi senza autenticazione dovrebbe essere negato: {response.status_code}"
    
    response = requests.get(QUIZ_TEMPLATES_URL)
    assert response.status_code in [401, 403], f"Accesso ai quiz templates senza autenticazione dovrebbe essere negato: {response.status_code}"
    
    response = requests.get(REWARD_CATEGORIES_URL)
    assert response.status_code in [401, 403], f"Accesso alle categorie di ricompense senza autenticazione dovrebbe essere negato: {response.status_code}"
    
    # Token non valido
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    headers = {"Authorization": f"Bearer {invalid_token}"}
    
    response = requests.get(PATH_CATEGORIES_URL, headers=headers)
    assert response.status_code in [401, 403], f"Accesso con token non valido dovrebbe essere negato: {response.status_code}"

if __name__ == "__main__":
    pytest.main(["-xvs", __file__])
