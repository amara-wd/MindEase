
import os
import traceback
from dotenv import load_dotenv
from google import genai

print("Step 1: Loading environment file...")
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY", "").strip()

print("Step 2: Checking API key...")
print("API key loaded:", bool(api_key))
print("API key length:", len(api_key))

if not api_key:
    print("ERROR: API key was not loaded.")
else:
    try:
        print("Step 3: Creating Gemini client...")
        client = genai.Client(api_key=api_key)

        print("Step 4: Sending test message...")
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents="Reply with: MindEase Gemini test successful."
        )

        print("SUCCESS: Gemini responded.")
        print("Response:", response.text)

    except Exception:
        print("GEMINI TEST FAILED. Full error:")
        traceback.print_exc()
