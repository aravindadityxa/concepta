import requests
import json
from typing import List, Dict, Any
import time
import re

class LLMService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.available_models = ["phi3:mini", "llama3.1:8b", "mistral:7b"]
        
    def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                return [model["name"] for model in models_data.get("models", [])]
        except:
            pass
        return self.available_models
    
    def generate_response(self, prompt: str, model: str = "phi3:mini") -> str:
        """Generate a response from Ollama."""
        
        # For testing without Ollama
        print(f"Generating response with {model}...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.95,
                        "top_k": 40,
                        "num_predict": 2048
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                print(f"Ollama error: {response.status_code}")
                return self._generate_mock_response(prompt, model)
                
        except requests.exceptions.RequestException as e:
            print(f"Ollama connection failed: {e}")
            return self._generate_mock_response(prompt, model)
    
    def _generate_mock_response(self, prompt: str, model: str) -> str:
        """Generate a mock response for testing."""
        time.sleep(1)  # Simulate processing
        
        if "explain" in prompt.lower():
            return """SIMPLE EXPLANATION:
This is a demonstration from Phi-3 Mini model.

STEPS:
1. Start with basic understanding
2. Learn key components
3. Practice application
4. Review and improve

ANALOGY:
Like learning a new language - start with vocabulary, then grammar, then conversation.

KEY POINTS:
- Foundation is important
- Practice leads to mastery
- Real-world application matters"""
        
        elif "summarize" in prompt.lower():
            return """SUMMARY:
A concise overview of the main points.

KEY POINTS:
- Main idea one
- Important concept two
- Key detail three

DEFINITIONS:
Key Term: Important definition
Core Concept: Fundamental idea

EXAM TIPS:
- Review key terms
- Practice with examples
- Understand concepts deeply"""
        
        elif "quiz" in prompt.lower():
            return """[
  {
    "question": "What is the primary focus?",
    "type": "mcq",
    "options": ["Memory", "Understanding", "Speed", "Complexity"],
    "answer": "Understanding",
    "explanation": "True learning comes from understanding concepts."
  }
]"""
        
        elif "flashcard" in prompt.lower():
            return """[
  {
    "question": "What does this concept involve?",
    "answer": "It involves understanding fundamental principles."
  },
  {
    "question": "Why is practice important?",
    "answer": "Practice reinforces learning and builds skill."
  }
]"""
        
        else:
            return f"Response from {model}: I understand you're asking about this topic. The key points are understanding fundamentals, regular practice, and practical application."