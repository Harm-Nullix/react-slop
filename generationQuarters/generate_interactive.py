import subprocess
import sys
import argparse
import os

# Ensure we can import generate_apps and ai_engines even if run from different CWD
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from generate_apps import create_prompt, extract_json, build_project, push_project, cleanup_project

def copy_to_clipboard(text):
    """Copies text to the OS clipboard using pbcopy (macOS)."""
    try:
        process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE)
        process.communicate(text.encode('utf-8'))
    except Exception as e:
        print(f"⚠️ Failed to copy to clipboard: {e}")

def read_from_clipboard():
    """Reads text from the OS clipboard using pbpaste (macOS)."""
    try:
        return subprocess.check_output(['pbpaste']).decode('utf-8')
    except Exception as e:
        print(f"⚠️ Failed to read from clipboard: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Interactive App Generator')
    parser.add_argument('model', nargs='?', default='gemini-3-flash-preview', help='AI Model name')
    parser.add_argument('--no-push', action='store_true', help='Do not push to GitHub (opt-out)')
    parser.add_argument('--no-cleanup', action='store_true', help='Do not cleanup project directory (opt-out)')
    parser.add_argument('--file', help='Read AI response from a file instead of stdin')
    parser.add_argument('--clipboard', action='store_true', help='Read AI response from clipboard (macOS)')
    args = parser.parse_args()

    model = args.model

    # Store original CWD and change to script directory to ensure relative paths work
    original_cwd = os.getcwd()
    os.chdir(script_dir)

    try:
        print(f"🔍 Creating prompt for {model}...")
        prompt = create_prompt(model)
        
        print("📋 Copying prompt to clipboard...")
        copy_to_clipboard(prompt)
        print("✅ Prompt copied! Paste it into your AI and copy the JSON response.")

        if args.file:
            input("\n⌨️ Press Enter once you have copied the AI response to the file...")
            print(f"📄 Reading response from {args.file}...")
            if not os.path.exists(args.file):
                print(f"❌ File not found: {args.file}")
                return
            with open(args.file, 'r') as f:
                raw_response = f.read()
        elif args.clipboard:
            input("\n⌨️ Press Enter once you have copied the AI response to your clipboard...")
            raw_response = read_from_clipboard()
        else:
            print("\n⌨️ Paste the AI JSON response here and press Ctrl+D (Mac/Linux) or Ctrl+Z (Windows) to finish:")
            print("💡 Tip: For large responses, use --file <filename> or --clipboard to avoid terminal truncation.")
            raw_response = sys.stdin.read()
        
        if not raw_response.strip():
            print("🛑 No input received. Exiting.")
            return

        ai_response = extract_json(raw_response)

        if not ai_response:
            print("❌ Could not extract valid JSON from your input.")
            return

        project_dir = None
        try:
            project_dir, branch_name, title = build_project(ai_response, model)
            
            if not args.no_push:
                push_project(project_dir, branch_name, title, model)
            else:
                print("⏭️ Skipping push as requested.")

        except Exception as e:
            print(f"❌ Error during building or pushing: {e}")
            # If build failed, we might still want cleanup
        finally:
            if project_dir and not args.no_cleanup:
                cleanup_project(project_dir)
            elif project_dir:
                print(f"📂 Project directory kept at: {project_dir}")
                
    finally:
        # Restore original CWD
        os.chdir(original_cwd)

if __name__ == "__main__":
    main()
