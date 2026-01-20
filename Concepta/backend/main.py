from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
import requests
import json
import re
import time

app = FastAPI(
    title="Concepta API",
    description="Local AI Study Buddy Backend with Phi-3 Mini",
    version="1.0.0"
)

# Configure CORS properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM Service
class LLMService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.available_models = ["phi3:mini", "llama3.2:3b", "mistral:7b", "llama3.1:8b"]
    
    def check_ollama(self) -> bool:
        """Check if Ollama is running."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=3)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                installed = [model["name"] for model in models_data.get("models", [])]
                return installed if installed else self.available_models
        except Exception as e:
            print(f"Ollama connection error: {e}")
        return self.available_models
    
    def generate_response(self, prompt: str, model: str = "phi3:mini") -> str:
        """Generate response from Ollama with fallback."""
        print(f"\n📤 Sending to {model}: {prompt[:100]}...")
        
        # Check if Ollama is running
        if not self.check_ollama():
            print("⚠️ Ollama not running, using mock response")
            return self._generate_mock_response(prompt, model)
        
        try:
            # Optimize for Phi-3
            options = {
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "num_predict": 1024
            }
            
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": options
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "").strip()
                print(f"✅ Received {len(response_text)} chars")
                return response_text
            else:
                print(f"❌ Ollama error {response.status_code}")
                return self._generate_mock_response(prompt, model)
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection failed: {e}")
            return self._generate_mock_response(prompt, model)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return self._generate_mock_response(prompt, model)
    
    def _generate_mock_response(self, prompt: str, model: str) -> str:
        """Generate mock responses for testing."""
        time.sleep(0.5)  # Simulate delay
        
        if "explain" in prompt.lower():
            return """SIMPLE EXPLANATION:
This concept helps organize information and solve problems systematically.

STEPS:
1. Understand the basic definition
2. Learn the key components
3. Practice with examples
4. Apply in real situations

ANALOGY:
Like learning to cook - start with ingredients, follow recipes, then create your own dishes.

KEY POINTS:
- Focus on core principles
- Practice regularly
- Connect to real-world applications"""
        
        elif "summarize" in prompt.lower():
            return """SUMMARY:
The content covers essential concepts with practical applications for effective learning.

KEY POINTS:
- Core concepts are explained clearly
- Examples help understanding
- Practice exercises reinforce learning

DEFINITIONS:
Concept: A fundamental idea or principle
Application: How concepts are used in practice

EXAM TIPS:
- Review key definitions
- Practice with examples
- Understand concepts rather than memorize"""
        
        elif "quiz" in prompt.lower():
            return """[
  {
    "question": "What is the main purpose of studying this concept?",
    "type": "mcq",
    "options": ["To memorize facts", "To develop problem-solving skills", "To pass exams only", "To complicate simple ideas"],
    "answer": "To develop problem-solving skills",
    "explanation": "The concept helps build critical thinking and problem-solving abilities."
  },
  {
    "question": "True or False: This concept has practical applications.",
    "type": "truefalse",
    "answer": "True",
    "explanation": "The concept can be applied to solve real-world problems."
  }
]"""
        
        elif "flashcard" in prompt.lower():
            return """[
  {
    "question": "What is the definition of the core concept?",
    "answer": "A fundamental idea that forms the basis for understanding a subject."
  },
  {
    "question": "Name one application of this concept.",
    "answer": "It can be used to solve problems systematically."
  }
]"""
        
        else:
            return f"""Response from {model}:

I understand you're looking for information on this topic. Here are key insights:

1. **Main Idea**: The concept revolves around understanding fundamental principles
2. **Applications**: Can be used in various practical scenarios
3. **Importance**: Provides foundation for advanced learning

For best results with Phi-3 Mini:
- Keep questions specific and concise
- Focus on one concept at a time
- Use clear, simple language"""

llm_service = LLMService()

# Request Models
class ExplainRequest(BaseModel):
    topic: str
    difficulty: str = "beginner"
    model: str = "phi3:mini"

class SummarizeRequest(BaseModel):
    notes: str
    length: str = "medium"
    model: str = "phi3:mini"

class QuizRequest(BaseModel):
    content: str
    type: str = "mixed"
    difficulty: str = "medium"
    count: int = 3
    model: str = "phi3:mini"

class FlashcardsRequest(BaseModel):
    content: str
    count: int = 5
    model: str = "phi3:mini"

# ===== API ENDPOINTS =====

@app.get("/")
async def root():
    return {
        "message": "Concepta API is running!",
        "version": "1.0.0",
        "model": "phi3:mini",
        "endpoints": [
            "GET /health",
            "GET /models",
            "GET /model-info",
            "POST /explain",
            "POST /summarize",
            "POST /quiz",
            "POST /flashcards"
        ],
        "instructions": "Open frontend at http://localhost:3000"
    }

@app.get("/health")
async def health_check():
    ollama_status = llm_service.check_ollama()
    return {
        "status": "healthy",
        "service": "Concepta API",
        "ollama_connected": ollama_status,
        "model": "phi3:mini"
    }

@app.get("/models")
async def get_models():
    models = llm_service.get_available_models()
    return {"models": models}

@app.get("/model-info")
async def get_model_info():
    return {
        "current_model": "phi3:mini",
        "available_models": llm_service.get_available_models(),
        "optimized_for": "phi3:mini",
        "specs": {
            "phi3:mini": "3.8B parameters, ~4GB RAM",
            "llama3.2:3b": "3B parameters, ~3GB RAM",
            "mistral:7b": "7B parameters, ~7GB RAM",
            "llama3.1:8b": "8B parameters, ~8GB RAM"
        },
        "ollama_running": llm_service.check_ollama()
    }

@app.post("/explain")
async def explain_concept(request: ExplainRequest):
    try:
        # Limit input length for Phi-3
        topic = request.topic[:500]
        
        prompt = f"""Explain "{topic}" for a {request.difficulty} level student.

Please provide in this exact format:

SIMPLE EXPLANATION:
[2-3 sentences, very simple]

STEPS:
1. [First step - concise]
2. [Second step - concise]
3. [Third step - concise]

ANALOGY:
[One simple real-world comparison]

KEY POINTS:
- [Most important point]
- [Second important point]
- [Third important point]

Use simple language and avoid technical jargon."""
        
        response = llm_service.generate_response(prompt, request.model)
        
        # Parse response
        result = {
            "topic": topic,
            "difficulty": request.difficulty,
            "simple_explanation": "",
            "steps": [],
            "analogy": "",
            "key_points": []
        }
        
        lines = response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect sections
            if "SIMPLE EXPLANATION" in line.upper():
                current_section = "explanation"
            elif "STEPS" in line.upper():
                current_section = "steps"
            elif "ANALOGY" in line.upper():
                current_section = "analogy"
            elif "KEY POINTS" in line.upper():
                current_section = "key_points"
            elif current_section:
                if current_section == "explanation" and not result["simple_explanation"]:
                    result["simple_explanation"] = line
                elif current_section == "steps":
                    if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '*')):
                        step = line.lstrip('12345.-* ').strip()
                        if step and len(result["steps"]) < 5:
                            result["steps"].append(step)
                elif current_section == "analogy" and not result["analogy"]:
                    result["analogy"] = line
                elif current_section == "key_points":
                    if line.startswith(('-', '*')):
                        point = line.lstrip('-* ').strip()
                        if point and len(result["key_points"]) < 5:
                            result["key_points"].append(point)
        
        # Ensure we have data
        if not result["simple_explanation"]:
            result["simple_explanation"] = f"Explanation of {topic} at {request.difficulty} level."
        if not result["steps"]:
            result["steps"] = ["Learn the basics", "Understand components", "Practice applications"]
        if not result["analogy"]:
            result["analogy"] = f"Understanding {topic} is like learning any new skill - start simple, practice, master."
        if not result["key_points"]:
            result["key_points"] = ["Focus on fundamentals", "Practice regularly", "Apply in real situations"]
        
        return result
        
    except Exception as e:
        print(f"Error in explain endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_notes(request: SummarizeRequest):
    try:
        # Limit input for Phi-3
        notes = request.notes[:2000]
        
        prompt = f"""Summarize these notes concisely:

{notes}

Provide in this exact format:

SUMMARY:
[2-3 sentence overview]

KEY POINTS:
- [Point 1]
- [Point 2]
- [Point 3]

DEFINITIONS:
[Term1]: [Simple definition]
[Term2]: [Simple definition]

EXAM TIPS:
- [Tip 1]
- [Tip 2]

Keep it concise and focused on essentials."""
        
        response = llm_service.generate_response(prompt, request.model)
        
        # Parse response
        result = {
            "length": request.length,
            "summary": "",
            "key_points": [],
            "definitions": [],
            "exam_tips": []
        }
        
        lines = response.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "SUMMARY" in line.upper():
                current_section = "summary"
            elif "KEY POINTS" in line.upper():
                current_section = "key_points"
            elif "DEFINITIONS" in line.upper():
                current_section = "definitions"
            elif "EXAM TIPS" in line.upper():
                current_section = "exam_tips"
            elif current_section:
                if current_section == "summary" and not result["summary"]:
                    result["summary"] = line
                elif current_section == "key_points":
                    if line.startswith(('-', '*')):
                        point = line.lstrip('-* ').strip()
                        if point:
                            result["key_points"].append(point)
                elif current_section == "definitions":
                    if ':' in line:
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            result["definitions"].append({
                                "term": parts[0].strip(),
                                "definition": parts[1].strip()
                            })
                elif current_section == "exam_tips":
                    if line.startswith(('-', '*')):
                        tip = line.lstrip('-* ').strip()
                        if tip:
                            result["exam_tips"].append(tip)
        
        # Ensure data
        if not result["summary"]:
            result["summary"] = f"Summary of notes for {request.length} review."
        if not result["key_points"]:
            result["key_points"] = ["Main concept", "Important detail", "Key application"]
        if not result["definitions"]:
            result["definitions"] = [
                {"term": "Concept", "definition": "Fundamental idea"},
                {"term": "Application", "definition": "Practical use"}
            ]
        if not result["exam_tips"]:
            result["exam_tips"] = ["Review regularly", "Practice problems", "Understand concepts"]
        
        return result
        
    except Exception as e:
        print(f"Error in summarize endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    try:
        # Limit input
        content = request.content[:1000]
        count = min(request.count, 5)  # Max 5 for Phi-3
        
        prompt = f"""Create {count} quiz questions about this content:

{content}

Format as JSON array with exactly these fields for each question:
- question: string
- type: "mcq" or "truefalse" or "short"
- options: array of strings (only for MCQ)
- answer: string
- explanation: string

Example format:
[
  {{
    "question": "What is...?",
    "type": "mcq",
    "options": ["A", "B", "C", "D"],
    "answer": "B",
    "explanation": "Because..."
  }}
]

Create {count} diverse questions."""
        
        response = llm_service.generate_response(prompt, request.model)
        
        # Try to extract JSON
        try:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                # Validate and clean
                valid_questions = []
                for q in questions:
                    if isinstance(q, dict) and "question" in q and "answer" in q:
                        if "type" not in q:
                            q["type"] = "short"
                        if "explanation" not in q:
                            q["explanation"] = "Explanation not provided."
                        valid_questions.append(q)
                
                if valid_questions:
                    return {
                        "difficulty": request.difficulty,
                        "type": request.type,
                        "questions": valid_questions[:count]
                    }
        except:
            pass
        
        # Fallback questions
        return {
            "difficulty": request.difficulty,
            "type": request.type,
            "questions": [
                {
                    "question": f"What is the main topic of: {content[:50]}...?",
                    "type": "mcq",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Option B",
                    "explanation": "This is correct based on the content."
                },
                {
                    "question": "True or False: This topic is important to understand.",
                    "type": "truefalse",
                    "answer": "True",
                    "explanation": "Understanding this topic is fundamental."
                }
            ]
        }
        
    except Exception as e:
        print(f"Error in quiz endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flashcards")
async def generate_flashcards(request: FlashcardsRequest):
    try:
        # Limit input
        content = request.content[:800]
        count = min(request.count, 8)  # Max 8 for Phi-3
        
        prompt = f"""Create {count} flashcards about:

{content}

Format as JSON array with question and answer pairs:
[
  {{
    "question": "Clear question?",
    "answer": "Concise answer"
  }}
]

Create {count} focused flashcards."""
        
        response = llm_service.generate_response(prompt, request.model)
        
        # Try to extract JSON
        try:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                flashcards = json.loads(json_match.group())
                # Validate
                valid_flashcards = []
                for card in flashcards:
                    if isinstance(card, dict) and "question" in card and "answer" in card:
                        valid_flashcards.append({
                            "question": card["question"],
                            "answer": card["answer"]
                        })
                
                if valid_flashcards:
                    return {"flashcards": valid_flashcards[:count]}
        except:
            pass
        
        # Fallback
        return {
            "flashcards": [
                {
                    "question": f"What is {content[:30]}...?",
                    "answer": "Important concept or definition."
                },
                {
                    "question": "Why is this topic important?",
                    "answer": "It helps understand fundamental principles."
                }
            ]
        }
        
    except Exception as e:
        print(f"Error in flashcards endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Starting Concepta Backend Server")
    print("=" * 50)
    print("API URL: http://localhost:8000")
    print("Frontend: http://localhost:3000")
    print("Health check: http://localhost:8000/health")
    print("\n📊 Checking Ollama status...")
    
    if llm_service.check_ollama():
        print("✅ Ollama is running!")
        models = llm_service.get_available_models()
        print(f"📚 Available models: {', '.join(models)}")
    else:
        print("⚠️ Ollama not detected")
        print("   Run in another window: ollama serve")
        print("   Or install: https://ollama.ai/")
    
    print("\n✅ Backend ready! Press CTRL+C to stop")
    print("=" * 50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )