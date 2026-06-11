import sys
import os

# Add backend directory to sys.path to import AIEngine / config
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

from ai.ai_engine import AIEngine

engine = AIEngine()
print("Initializing AI Engine...")
engine.initialize()

test_cases = [
    "I am having trouble logging in. The system says invalid password.",
    "The internet is down and I have a critical meeting in 10 minutes. Please help immediately!",
    "This system is absolute garbage! I hate it and it is unacceptable that it fails constantly.",
    "Can you please help me configure my printer?",
]

print("\n--- Sentiment Test ---")
for text in test_cases:
    res = engine.sentiment_pipeline(text[:512])[0]
    print(f"Text: '{text}'")
    print(f"  Raw: {res}")
    sentiment = engine.analyze_sentiment(text)
    priority = engine.calculate_priority(text, sentiment)
    category = engine.classify_category(text)
    print(f"  Category: {category}")
    print(f"  Sentiment: {sentiment}")
    print(f"  Priority: {priority}")
    print()
