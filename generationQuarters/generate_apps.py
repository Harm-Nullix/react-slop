import os
import json
import requests
import subprocess
import datetime
import shutil
import re
from pathlib import Path
from ai_engines import gemini, claude

from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURATIE ---
REPO_URL = "https://github.com/Harm-Nullix/react-slop.git"
BRANCHES_JSON_URL = "https://harm-nullix.github.io/react-slop/branches.json"
MASTER_PROMPT_FILE = "masterPrompt.md"
GENERATION_DIR = Path("./quarters")

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def get_existing_apps():
    try:
        r = requests.get(f"{BRANCHES_JSON_URL}?t={datetime.datetime.now().timestamp()}")
        return r.json()
    except:
        return []

def extract_json(text):
    if not text:
        return None
    try:
        # Stap 1: Verwijder markdown code blocks als die er zijn
        clean_text = re.sub(r'```json\s*|```', '', text).strip()

        # Stap 2: Zoek de eerste { en de laatste }
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')

        if start_idx != -1 and end_idx != -1:
            json_str = clean_text[start_idx:end_idx + 1]
            return json.loads(json_str)

        return json.loads(clean_text)
    except Exception as e:
        print(f"❌ JSON Parse Error: {e}")
        return None

def call_ai(model, prompt):
    print(f"🤖 Calling {model}...")

    m_lower = model.lower()
    if "gemini" in m_lower:
        raw_response = gemini.call(prompt, model)

    elif "claude" in m_lower:
        raw_response = claude.call(prompt, model)
    else:
        print(f"❌ Model {model} niet ondersteund.")
        return None

    if raw_response:
        return extract_json(raw_response)

    return None

def run_git(args, cwd=None):
    subprocess.run(["git"] + args, cwd=cwd, check=True)

def generate_app(model):
    existing_apps = get_existing_apps()
    existing_titles = ", ".join([a['title'] for a in existing_apps if a.get('title')])

    with open(MASTER_PROMPT_FILE, 'r') as f:
        master_prompt = f.read()

    full_prompt = f"""
    {master_prompt}

    BELANGRIJK: Deze apps bestaan al, maak iets TOTAAL anders:
    [{existing_titles}]

    TAGKEUZES: Kies maximaal 3/4 tags (inclusief je eigen model {model})
    Ze moeten gaan over waar de app inhoudelijk over gaat.
    Als er al tags zijn die erop lijken, gebruik die tag dan om dubbeling/soortgelijke tags te voorkomen.

    GEEF UITSLUITEND JSON TERUG IN DIT FORMAT:
    {{
      "title": "string",
      "description": "string",
      "tags": ["tag1", "tag2"],
      "app": "volledige inhoud van App.tsx als string"
    }}
    """

    # AI aanroepen
    ai_response = call_ai(model, full_prompt)

    if not ai_response:
        print(f"🛑 Generatie mislukt voor {model}. Overslaan...")

        return

    title = ai_response.get('title', 'Untitled App')
    slug = slugify(title)
    branch_name = f"gen/{datetime.date.today().strftime('%Y/%m/%d')}/{model.lower()}/{slug}"

    project_dir = GENERATION_DIR / slug
    os.makedirs(project_dir, exist_ok=True)

    print(f"🚀 Generating: {title} on branch {branch_name}")

    try:
        # 1. Clone repo naar tijdelijke map
        run_git(["clone", "--depth", "1", REPO_URL, "."], cwd=project_dir)

        # 2. Maak nieuwe branch
        run_git(["checkout", "-b", branch_name], cwd=project_dir)

        # 3. Update package.json
        pkg_path = project_dir / "package.json"
        pkg = json.loads(pkg_path.read_text())
        pkg["name"] = slug
        pkg["title"] = title
        pkg["description"] = ai_response['description']
        pkg["tags"] = ai_response['tags']
        pkg_path.write_text(json.dumps(pkg, indent=2))

        # 4. Update App.tsx
        app_path = project_dir / "src" / "App.tsx"
        app_path.write_text(ai_response['app'])

        # 5. Push naar GitHub
        run_git(["add", "."], cwd=project_dir)
        run_git(["commit", "-m", f"AI Build: {title} (by {model})"], cwd=project_dir)
        run_git(["push", "origin", branch_name], cwd=project_dir)

        print(f"✅ Succesfully deployed {title}!")
        

    finally:
        if project_dir.exists():
            print(f"🧹 Cleaning up directory: {project_dir}")
            # shutil.rmtree verwijdert de map inclusief alle bestanden en .git folder
            shutil.rmtree(project_dir)

if __name__ == "__main__":
    import sys
    model_arg = sys.argv[1] if len(sys.argv) > 1 else "gemini-3-flash-preview"
    generate_app(model_arg)
