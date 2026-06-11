"""
AI Engine for ResolveX.
Handles classification, sentiment analysis, embeddings, and similarity search.
"""

import numpy as np
import faiss
import re
from typing import Optional
from config import CATEGORIES, URGENCY_KEYWORDS, SIMILARITY_THRESHOLD


class AIEngine:
    def __init__(self):
        self.embedding_model = None
        self.sentiment_pipeline = None
        self.faiss_index = None
        self.solved_ticket_ids: list[int] = []
        self._ready = False

    def initialize(self):
        """Load models. Called once at startup."""
        from sentence_transformers import SentenceTransformer
        from transformers import pipeline

        print("[AI] Loading sentence-transformer model...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

        print("[AI] Loading sentiment analysis pipeline...")
        self.sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            top_k=None,
        )

        self._ready = True
        print("[AI] Models loaded successfully.")

    @property
    def is_ready(self) -> bool:
        return self._ready

    # ──────────────── Embeddings ────────────────

    def get_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for a text string."""
        return self.embedding_model.encode([text], normalize_embeddings=True)[0]

    def get_embeddings(self, texts: list[str]) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        return self.embedding_model.encode(texts, normalize_embeddings=True)

    # ──────────────── FAISS Index ────────────────

    def build_faiss_index(self, ticket_ids: list[int], texts: list[str]):
        """Build FAISS index from solved ticket texts."""
        embeddings = self.get_embeddings(texts)
        dimension = embeddings.shape[1]

        self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product = cosine on normalized vectors
        self.faiss_index.add(embeddings.astype("float32"))
        self.solved_ticket_ids = ticket_ids

        print(f"[AI] FAISS index built with {len(ticket_ids)} solved tickets (dim={dimension}).")

    def search_similar(self, text: str, top_k: int = 3) -> list[dict]:
        """Search for similar solved tickets. Returns list of {id, score}."""
        if self.faiss_index is None or self.faiss_index.ntotal == 0:
            return []

        query_embedding = self.get_embedding(text).astype("float32").reshape(1, -1)
        scores, indices = self.faiss_index.search(query_embedding, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.solved_ticket_ids) and score >= SIMILARITY_THRESHOLD:
                results.append({
                    "id": self.solved_ticket_ids[idx],
                    "score": float(score),
                })
        return results

    # ──────────────── Classification ────────────────

    def classify_category(self, text: str) -> str:
        """Classify ticket into a category using Gemini or keyword matching."""
        from config import GEMINI_API_KEY, GEMINI_MODEL
        if GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel(GEMINI_MODEL)
                prompt = f"""Classify the following IT support ticket description into one of these exact categories:
technical, billing, account, network, software, hardware.
Return ONLY the category name in lowercase. Do not include any other text, explanation, or punctuation.

Ticket:
{text}"""
                response = model.generate_content(prompt)
                result = response.text.strip().lower()
                for cat in CATEGORIES:
                    if cat in result:
                        return cat
            except Exception as e:
                print(f"[AI] Error calling Gemini for classification: {e}")

        # Offline Fallback
        text_lower = text.lower()
        keyword_map = {
            "billing": ["invoice", "charge", "payment", "refund", "subscription", "billing", "price", "cost", "renewal", "plan", "credit card", "overcharged"],
            "account": ["login", "password", "account", "sign in", "sign up", "locked", "access", "profile", "authentication", "2fa", "sso", "email notification", "session", "delete account"],
            "network": ["wifi", "internet", "vpn", "network", "dns", "connection", "bandwidth", "firewall", "remote desktop", "speed", "latency", "ping", "email client", "smtp"],
            "hardware": ["hard drive", "screen", "monitor", "keyboard", "mouse", "battery", "fan", "overheating", "usb", "docking", "printer hardware", "ram", "ssd", "cpu"],
            "software": ["install", "update", "crash", "error", "application", "windows", "office", "excel", "browser", "license", "corrupted", "antivirus", "driver", "permission"],
            "technical": ["freeze", "bsod", "boot", "startup", "performance", "slow", "memory", "webcam", "audio", "display", "dual boot", "backup", "restore"],
        }

        scores = {cat: 0 for cat in CATEGORIES}
        for category, keywords in keyword_map.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[category] += 1

        best = max(scores, key=scores.get)
        if scores[best] > 0:
            return best

        return "technical"  # Default

    # ──────────────── Sentiment Analysis ────────────────

    def analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment and return: angry, frustrated, neutral, or satisfied."""
        from config import GEMINI_API_KEY, GEMINI_MODEL
        if GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel(GEMINI_MODEL)
                prompt = f"""Analyze the sentiment of the following IT support ticket.
Return ONLY one of these exact words in lowercase: angry, frustrated, neutral, satisfied.
Do not include any other text, explanation, or punctuation.

Ticket:
{text}"""
                response = model.generate_content(prompt)
                result = response.text.strip().lower()
                for sentiment in ["angry", "frustrated", "neutral", "satisfied"]:
                    if sentiment in result:
                        return sentiment
            except Exception as e:
                print(f"[AI] Error calling Gemini for sentiment: {e}")

        # Offline Fallback
        try:
            anger_keywords = ["terrible", "worst", "hate", "furious", "unacceptable", "disgusting", "ridiculous", "garbage", "trash", "useless", "bullshit", "crap"]
            frustration_keywords = ["frustrated", "annoying", "again", "still", "keeps", "constantly", "always", "why", "fed up", "broken", "crashed", "slow", "freeze", "stuck", "failing", "down", "not working"]
            satisfied_keywords = ["satisfied", "thanks", "thank you", "great", "awesome", "solved", "fixed", "resolved"]

            text_lower = text.lower()
            has_anger = any(kw in text_lower for kw in anger_keywords)
            has_frustration = any(kw in text_lower for kw in frustration_keywords)
            has_satisfied = any(kw in text_lower for kw in satisfied_keywords)

            if has_anger:
                return "angry"
            elif has_frustration:
                return "frustrated"
            elif has_satisfied:
                return "satisfied"

            # Check model output with strict triggers
            result = self.sentiment_pipeline(text[:512])[0]
            label_scores = {r["label"]: r["score"] for r in result}
            neg_score = label_scores.get("NEGATIVE", 0)

            if neg_score > 0.95 and ("!" in text or "?" in text or text.isupper()):
                return "frustrated"

            return "neutral"
        except Exception:
            return "neutral"

    # ──────────────── Priority Calculation ────────────────

    def calculate_priority(self, text: str, sentiment: str) -> str:
        """Determine priority based on sentiment and urgency keywords."""
        from config import GEMINI_API_KEY, GEMINI_MODEL
        if GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel(GEMINI_MODEL)
                prompt = f"""Determine the priority of the following IT support ticket.
Return ONLY one of these exact words in lowercase: low, medium, high, critical.
Do not include any other text, explanation, or punctuation.

Ticket:
{text}
(Calculated Sentiment: {sentiment})"""
                response = model.generate_content(prompt)
                result = response.text.strip().lower()
                for prio in ["low", "medium", "high", "critical"]:
                    if prio in result:
                        return prio
            except Exception as e:
                print(f"[AI] Error calling Gemini for priority: {e}")

        # Offline Fallback
        text_lower = text.lower()
        urgency_count = sum(1 for kw in URGENCY_KEYWORDS if kw in text_lower)

        if sentiment == "angry" and urgency_count >= 2:
            return "critical"
        elif sentiment == "angry" or urgency_count >= 2:
            return "high"
        elif sentiment == "frustrated" or urgency_count >= 1:
            return "medium"
        else:
            return "low"


# Singleton
ai_engine = AIEngine()
