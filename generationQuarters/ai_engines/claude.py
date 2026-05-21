import os
import time
import anthropic

def init_claude():
    """
    Initialiseert de Anthropic Client.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY ontbreekt in omgevingsvariabelen.")

    return anthropic.Anthropic(api_key=api_key)

def call_claude(prompt, model="claude-sonnet-4-6"):
    client = init_claude()
    # Mogelijkheid om model via env te overriden, anders sonnet (beste balans)
    model_name = os.environ.get("CLAUDE_MODEL", model)

    retries = 5
    for i in range(retries):
        try:
            response = client.messages.parse(
                model=model_name,
                max_tokens=20000,
                system="You are a senior React developer. Always respond in pure JSON format.",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                output_config={
                    "format": {
                        "type": "json_schema",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "tags": {"type": "array", "items": {"type": "string"}},
                                "app": {"type": "string"},
                            },
                            "required": ["title", "description", "tags", "app"],
                            "additionalProperties": False,
                        },
                    }
                },
            )

            if response and response.content and response.content[0] and response.content[0].text:
                return response.content[0].text

            raise ValueError(f"Onverwacht response formaat van Claude: {type(response.content)}")

        except Exception as e:
            wait_time = (2 ** i)
            if i == retries - 1:
                print(f"❌ Claude-Engine faalde na {retries} pogingen: {str(e)}")
                raise e
            print(f"⚠️ Claude error, retrying in {wait_time}s... ({e})")
            time.sleep(wait_time)

    return None

def call(prompt, model="claude-sonnet-4-6"):
    return call_claude(prompt, model)
