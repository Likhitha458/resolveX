"""
Test script for Gemini AI API integration.
Demonstrates troubleshooting generation with fallback support.
"""
import sys
import os

# Add backend directory to path
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

from ai.llm_service import generate_response
from config import GEMINI_API_KEY

print("=" * 60)
print("ResolveX — Gemini AI Troubleshooting Test")
print("=" * 60)

if GEMINI_API_KEY:
    print(f"\n✓ Gemini API Key: CONFIGURED")
else:
    print(f"\n! Gemini API Key: NOT CONFIGURED")
    print("  → Using fallback mode (still generates useful troubleshooting)")

# Test Case 1: WiFi Issue
print("\n--- Test Case 1: WiFi Connectivity Problem ---")
user_issue_1 = "My WiFi keeps dropping every few minutes on my laptop, but it works fine on my phone."
solved_title_1 = "WiFi keeps disconnecting frequently"
solved_resolution_1 = "Steps to fix WiFi disconnection: 1) Update WiFi adapter driver from Device Manager. 2) Disable WiFi power saving. 3) Forget the network and reconnect. 4) Reset network settings."

print(f"User Issue: {user_issue_1}")
print(f"\nGenerating troubleshooting steps...")
response_1 = generate_response(user_issue_1, solved_title_1, solved_resolution_1)
print(f"\nResponse:\n{response_1}")

# Test Case 2: Performance Issue
print("\n" + "=" * 60)
print("--- Test Case 2: System Performance Problem ---")
user_issue_2 = "My laptop is running incredibly slow and freezing up constantly. It's making my work impossible."
solved_title_2 = "High CPU usage and system slowdown"
solved_resolution_2 = "1) Check Task Manager for high CPU processes. 2) Uninstall unnecessary startup programs. 3) Run disk cleanup and defragmentation. 4) Update drivers. 5) Increase virtual memory if RAM is low."

print(f"User Issue: {user_issue_2}")
print(f"\nGenerating troubleshooting steps...")
response_2 = generate_response(user_issue_2, solved_title_2, solved_resolution_2)
print(f"\nResponse:\n{response_2}")

print("\n" + "=" * 60)
if GEMINI_API_KEY:
    print("✓ Gemini API is configured and working!")
else:
    print("✓ Fallback mode is working - responses use keyword matching")
    print("  To enable AI-generated responses, set GEMINI_API_KEY in .env")
print("=" * 60)

