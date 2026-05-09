"""
Test Gemini API - thử các model names khác nhau để tìm cái đúng
"""
from google import genai
import sys

# Thử cả 2 API keys
KEYS = {
    "root/.env":       "REDACTED_GEMINI_KEY_2",
}

# Các model names có thể dùng được (2026)
MODELS = [
    "gemini-3-flash-preview",
]

def test_key(label, api_key):
    print(f"\n{'='*50}")
    print(f"Testing key from: {label}")
    print(f"   Key: ...{api_key[-8:]}")
    print(f"{'='*50}")
    
    client = genai.Client(api_key=api_key)
    
    # List available models
    try:
        models = list(client.models.list())
        gemini3_models = [m.name for m in models if 'gemini-3' in m.name or 'gemini-2' in m.name]
        print(f"\nAvailable Gemini 2/3 models ({len(gemini3_models)} found):")
        for m in gemini3_models[:10]:
            print(f"   - {m}")
    except Exception as e:
        print(f"Cannot list models: {e}")
        return
    
    # Try specific models
    for model in MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents="Say: OK"
            )
            print(f"\nSUCCESS with model: {model}")
            print(f"   Response: {response.text[:100]}")
            break
        except Exception as e:
            err = str(e)[:80]
            print(f"{model}: {err}")

for label, key in KEYS.items():
    test_key(label, key)

print("\n\nDone!")