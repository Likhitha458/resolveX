"""
Model Accuracy Testing for ResolveX
Tests: Sentiment Analysis, Category Classification, Embeddings
"""
import sys
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

from transformers import pipeline
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
from datetime import datetime

print("=" * 80)
print("ResolveX — Model Accuracy Testing & Evaluation")
print("=" * 80)

# ═══════════════════════════════════════════════════════════════
# 1. SENTIMENT ANALYSIS MODEL TESTING
# ═══════════════════════════════════════════════════════════════

print("\n[1] SENTIMENT ANALYSIS MODEL - DistilBERT")
print("-" * 80)

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
)

# Test datasets with ground truth labels
sentiment_test_cases = [
    # Angry/Frustrated cases
    ("I'm absolutely furious! This system keeps crashing and nobody helps!", "NEGATIVE"),
    ("This is completely unacceptable! I've been waiting for 3 days with no response!", "NEGATIVE"),
    ("My computer is broken and I can't work at all! This is ridiculous!", "NEGATIVE"),
    
    # Neutral cases
    ("I need help resetting my password.", "NEUTRAL"),
    ("Can you help me update my email address?", "NEUTRAL"),
    ("My WiFi is not working. I need support.", "NEUTRAL"),
    
    # Satisfied/Positive cases
    ("Great support! The issue was fixed quickly.", "POSITIVE"),
    ("Thank you for resolving this so efficiently!", "POSITIVE"),
    ("Perfect! Everything is working now. Much appreciated!", "POSITIVE"),
]

sentiment_correct = 0
sentiment_results = []

for text, expected in sentiment_test_cases:
    result = sentiment_pipeline(text)
    predicted_label = result[0]["label"]  # NEGATIVE or POSITIVE
    confidence = result[0]["score"]
    
    # Map to our sentiment categories
    if predicted_label == "NEGATIVE":
        sentiment_map = "NEGATIVE"
    else:
        sentiment_map = "POSITIVE"
    
    is_correct = (sentiment_map == expected)
    if is_correct:
        sentiment_correct += 1
    
    sentiment_results.append({
        "text": text[:60] + "...",
        "expected": expected,
        "predicted": sentiment_map,
        "confidence": round(confidence, 3),
        "correct": is_correct
    })
    
    status = "✓" if is_correct else "✗"
    print(f"{status} Expected: {expected:8} | Predicted: {sentiment_map:8} | Confidence: {confidence:.3f}")

sentiment_accuracy = (sentiment_correct / len(sentiment_test_cases)) * 100
print(f"\n✓ Sentiment Analysis Accuracy: {sentiment_accuracy:.1f}% ({sentiment_correct}/{len(sentiment_test_cases)})")

# ═══════════════════════════════════════════════════════════════
# 2. CATEGORY CLASSIFICATION MODEL TESTING
# ═══════════════════════════════════════════════════════════════

print("\n[2] CATEGORY CLASSIFICATION MODEL - Keyword Matching")
print("-" * 80)

CATEGORIES = ["technical", "billing", "account", "network", "software", "hardware"]

keyword_map = {
    "billing": ["invoice", "charge", "payment", "refund", "subscription", "billing", "price", "cost"],
    "account": ["login", "password", "account", "sign in", "locked", "access", "profile", "authentication"],
    "network": ["wifi", "internet", "vpn", "network", "dns", "connection", "bandwidth", "firewall"],
    "hardware": ["hard drive", "screen", "monitor", "keyboard", "mouse", "battery", "fan", "usb"],
    "software": ["install", "update", "crash", "error", "application", "windows", "office", "excel"],
    "technical": ["freeze", "bsod", "boot", "startup", "performance", "slow", "memory", "webcam"],
}

category_test_cases = [
    ("My WiFi keeps disconnecting every few minutes", "network"),
    ("I can't log into my account, getting locked out", "account"),
    ("Excel keeps crashing when I open large files", "software"),
    ("My laptop is running incredibly slow", "technical"),
    ("I was overcharged on my billing statement", "billing"),
    ("My monitor screen has dead pixels", "hardware"),
    ("Internet connection is very unstable", "network"),
    ("Can't remember my password to sign in", "account"),
    ("Windows keeps freezing and booting slowly", "technical"),
    ("Want to request a refund for subscription", "billing"),
]

def classify_text(text):
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORIES}
    for category, keywords in keyword_map.items():
        for kw in keywords:
            if kw in text_lower:
                scores[category] += 1
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best
    return "technical"

category_correct = 0
category_results = []

for text, expected in category_test_cases:
    predicted = classify_text(text)
    is_correct = (predicted == expected)
    if is_correct:
        category_correct += 1
    
    category_results.append({
        "text": text[:60] + "...",
        "expected": expected,
        "predicted": predicted,
        "correct": is_correct
    })
    
    status = "✓" if is_correct else "✗"
    print(f"{status} Expected: {expected:10} | Predicted: {predicted:10} | {text[:50]}...")

category_accuracy = (category_correct / len(category_test_cases)) * 100
print(f"\n✓ Category Classification Accuracy: {category_accuracy:.1f}% ({category_correct}/{len(category_test_cases)})")

# ═══════════════════════════════════════════════════════════════
# 3. EMBEDDING MODEL TESTING (Semantic Similarity)
# ═══════════════════════════════════════════════════════════════

print("\n[3] EMBEDDING MODEL - Sentence Transformers (all-MiniLM-L6-v2)")
print("-" * 80)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Test semantic similarity
similarity_test_cases = [
    ("My WiFi is not working", "Internet connection is down", True),  # Should be similar
    ("Password reset needed", "Can't log into my account", True),  # Should be similar
    ("Excel file is corrupted", "My application keeps crashing", False),  # Should not be similar
    ("Monitor is broken", "Screen has dead pixels", True),  # Should be similar
]

similarity_correct = 0
similarity_results = []

for text1, text2, should_be_similar in similarity_test_cases:
    embed1 = embedding_model.encode(text1)
    embed2 = embedding_model.encode(text2)
    similarity = cosine_similarity([embed1], [embed2])[0][0]
    
    # If similarity > 0.6, consider them similar
    is_similar = similarity > 0.6
    is_correct = (is_similar == should_be_similar)
    
    if is_correct:
        similarity_correct += 1
    
    similarity_results.append({
        "text1": text1,
        "text2": text2,
        "expected_similar": should_be_similar,
        "predicted_similar": is_similar,
        "similarity_score": round(float(similarity), 3),
        "correct": is_correct
    })
    
    status = "✓" if is_correct else "✗"
    expected_text = "SIMILAR" if should_be_similar else "DIFFERENT"
    predicted_text = "SIMILAR" if is_similar else "DIFFERENT"
    print(f"{status} {predicted_text:8} (score: {similarity:.3f}) | Expected: {expected_text}")
    print(f"   1: {text1}")
    print(f"   2: {text2}")

embedding_accuracy = (similarity_correct / len(similarity_test_cases)) * 100
print(f"\n✓ Embedding Model Accuracy: {embedding_accuracy:.1f}% ({similarity_correct}/{len(similarity_test_cases)})")

# ═══════════════════════════════════════════════════════════════
# SUMMARY REPORT
# ═══════════════════════════════════════════════════════════════

print("\n" + "=" * 80)
print("ACCURACY SUMMARY")
print("=" * 80)

overall_accuracy = (sentiment_accuracy + category_accuracy + embedding_accuracy) / 3

print(f"\n1. Sentiment Analysis (DistilBERT):       {sentiment_accuracy:5.1f}%")
print(f"2. Category Classification (Keywords):   {category_accuracy:5.1f}%")
print(f"3. Embedding/Similarity (MiniLM-L6-v2): {embedding_accuracy:5.1f}%")
print(f"\n{'─' * 50}")
print(f"Overall Model Accuracy:                  {overall_accuracy:5.1f}%")
print("=" * 80)

# Save results to JSON
report = {
    "timestamp": datetime.now().isoformat(),
    "models": {
        "sentiment_analysis": {
            "name": "DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)",
            "accuracy": round(sentiment_accuracy, 2),
            "test_cases": len(sentiment_test_cases),
            "correct": sentiment_correct,
            "results": sentiment_results
        },
        "category_classification": {
            "name": "Keyword Matching with Fallback",
            "accuracy": round(category_accuracy, 2),
            "test_cases": len(category_test_cases),
            "correct": category_correct,
            "results": category_results
        },
        "embedding_similarity": {
            "name": "Sentence Transformers (all-MiniLM-L6-v2)",
            "accuracy": round(embedding_accuracy, 2),
            "test_cases": len(similarity_test_cases),
            "correct": similarity_correct,
            "results": similarity_results
        }
    },
    "overall_accuracy": round(overall_accuracy, 2),
    "techniques_used": [
        "Fine-tuned BERT for Sentiment Analysis",
        "Keyword-based Classification with fallback to Gemini AI",
        "Sentence-level embeddings for semantic similarity",
        "FAISS index for fast similarity search",
        "Transformers library for NLP models"
    ]
}

with open("accuracy_report.json", "w") as f:
    json.dump(report, f, indent=2)

print("\n✓ Detailed report saved to: accuracy_report.json")
