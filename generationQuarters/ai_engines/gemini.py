from google import genai
import os
import time
import json
from datetime import datetime

def init_gemini():
    """
    Initialiseert de nieuwe Google GenAI Client.
    """
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY ontbreekt in omgevingsvariabelen.")

    # De nieuwe SDK gebruikt een Client object
    return genai.Client(api_key=api_key)

def call_gemini(prompt, model="gemini-3-flash-preview"):
    client = init_gemini()
    model_name = os.environ.get("GEMINI_MODEL", model)

    retries = 5
    for i in range(retries):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                }
            )

            if response and response.text:
                return response.text
            raise ValueError("Lege response van Gemini.")

        except Exception as e:
            wait_time = (2 ** i)
            if i == retries - 1:
                print(f"❌ AI-Engine faalde na {retries} pogingen: {str(e)}")
                raise e
            time.sleep(wait_time)

    return None

def call(prompt, model="gemini-3-flash-preview"):
    return call_gemini(prompt, model)
