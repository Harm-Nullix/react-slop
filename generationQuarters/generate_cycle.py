import subprocess
import time

# MODELS = ["claude-haiku-4-5", "gemini-flash-latest"]
MODELS = ["claude-sonnet-4-6", "gemini-flash-latest"]
# MODELS = ["claude-opus-4-7", "gemini-pro-latest"]
# MODELS = ["gemini-pro-latest"]
# MODELS = ["gemini-flash-latest"]
# MODELS = ["claude-haiku-4-5"]
# MODELS = ["claude-sonnet-4-6"]

def run_cycle():
    for model in MODELS:
        print(f"\n--- STARTING GENERATION WITH {model} ---")
        try:
            subprocess.run(["python3", "generate_apps.py", model], check=True)
        except Exception as e:
            print(f"❌ Error with {model}: {e}")

        # Even pauze tussen de modellen voor de GitHub API / Rate limits
        time.sleep(10)

if __name__ == "__main__":
    run_cycle()
