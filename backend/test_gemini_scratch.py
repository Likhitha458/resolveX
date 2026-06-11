import sys
import os

# Add backend directory to path
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

# Set the environment variable to ensure it's loaded
os.environ["GEMINI_API_KEY"] = "AIzaSyCyyXRqararM9RkfO5GNxKJsOYoy1IDxVo"

from ai.llm_service import generate_response

user_issue = "My WiFi keeps dropping every few minutes on my laptop, but it works fine on my phone."
solved_title = "WiFi keeps disconnecting frequently"
solved_resolution = "Steps to fix WiFi disconnection: 1) Update WiFi adapter driver from Device Manager. 2) Disable WiFi power saving. 3) Forget the network and reconnect. 4) Reset network settings."

print("Calling Gemini API...")
response = generate_response(user_issue, solved_title, solved_resolution)
print("\n--- Gemini AI Response ---")
print(response)
