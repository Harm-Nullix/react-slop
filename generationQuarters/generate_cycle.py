import subprocess
import time

# MODELS = ["gemini-3-flash-preview", "claude-3-5-sonnet-20240620"]
MODELS = ["claude-haiku-4-5", "gemini-3-flash-preview"]

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
