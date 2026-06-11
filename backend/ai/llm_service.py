"""
LLM Service for generating human-friendly troubleshooting responses.
Uses Google Gemini or falls back to raw resolution text.
"""

from config import GEMINI_API_KEY, GEMINI_MODEL


def generate_response(user_issue: str, solved_title: str, solved_resolution: str) -> str:
    """
    Generate a friendly, conversational troubleshooting response using LLM.
    Falls back to raw resolution text if no API key is configured.
    """
    if not GEMINI_API_KEY:
        return _format_fallback(solved_title, solved_resolution)

    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)

        prompt = f"""You are a professional IT support assistant. A user has an issue and a similar resolved case exists.

User's Issue: {user_issue}

Resolved Case — Title: {solved_title}
Resolution: {solved_resolution}

Write a short, professional fix in 2–3 bullet points. Rules:
- Be direct and actionable. No greetings or fluff.
- Each bullet must be a single, clear action step.
- Max 15 words per bullet.
- Do NOT mention the knowledge base or previous tickets.
- Use plain bullet points (•), not numbers."""

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        
        return response.text.strip()

    except Exception as e:
        print(f"[LLM] Error calling Gemini: {e}")
        return _format_fallback(solved_title, solved_resolution)


def _format_fallback(title: str, resolution: str) -> str:
    """Format resolution text as a readable fallback when LLM is unavailable."""
    return f"Based on a similar issue (\"{title}\"), here's a recommended solution:\n\n{resolution}"
