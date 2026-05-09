"""
Test Gemini API Connection - Modern SDK (2026)
"""
from google import genai

API_KEY = "REDACTED_GEMINI_KEY_2"

# Các model có thể thử
MODELS = [
    "gemini-3-flash-preview",
]

def test_connection():
    client = genai.Client(api_key=API_KEY)
    
    for model_name in MODELS:
        try:
            print(f"Testing model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents="Hello, say hi!"
            )
            print(f"{model_name} works!")
            print(f"Response: {response.text[:100]}...")
            return model_name  # Return first working model
        except Exception as e:
            print(f"{model_name} failed: {e}")
    
    return None

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Gemini API with google-genai SDK")
    print("=" * 50)
    
    working_model = test_connection()
    
    if working_model:
        print(f"\nUse this model in main.py: {working_model}")
    else:
        print("\nNo models work. Check:")
        print("1. pip install google-genai")
        print("2. API key valid at https://aistudio.google.com")
        print("3. Try VPN if in blocked region")
