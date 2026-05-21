import subprocess
import time

MODELS = ["claude-haiku-4-5", "gemini-3-flash-preview"]
# MODELS = ["claude-sonnet-4-6", "gemini-3-flash-preview"]
# MODELS = ["gemini-3-flash-preview"]
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
