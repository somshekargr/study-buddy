from groq import AsyncGroq
from app.core.config import settings


class LLMService:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    async def stream_chat(self, messages: list[dict]):
        """Streams tokens from Groq API (Llama 3)."""
        stream = await self.client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            stream=True,
        )
        
        
        async for chunk in stream:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    async def generate_quiz(self, context: str, num_questions: int = 5) -> list[dict]:
        """Generates a multiple-choice quiz from the provided context in JSON format."""
        
        system_prompt = f"""You are a helpful study assistant. 
        Generate {num_questions} multiple-choice questions based on the provided text.
        Return the result as a STRICT JSON array of objects.
        
        The JSON format must be exactly:
        [
            {{
                "question": "The question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": 0,  # Index of the correct option (0-3)
                "explanation": "Brief explanation of why this answer is correct."
            }}
        ]
        
        Do not output any markdown formatting like ```json or ```. Just the raw JSON string.
        """

        user_prompt = f"Context:\n{context}\n\nGenerate {num_questions} questions."

        try:
            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.5, # Lower temperature for more deterministic JSON
                stream=False
            )
            
            content = response.choices[0].message.content.strip()
            # Cleanup potential markdown headers if the model disobeys
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            import json
            return json.loads(content)
            
        except Exception as e:
            print(f"Error generating quiz: {e}")
            # Fallback or empty list on failure
            return []

    async def call_ollama(self, prompt: str, model: str = None, format: str = None) -> str:
        """Call local Ollama API with a fallback to Groq if local fails."""
        import httpx
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        
        selected_model = model or settings.OLLAMA_TEXT_MODEL
        payload = {
            "model": selected_model,
            "prompt": prompt,
            "stream": False
        }
        if format == "json":
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json().get("response", "")
        except Exception as e:
            print(f"Ollama failed ({e}), falling back to Groq...")
            # If Ollama fails (500 Error, Memory, etc.), use Groq as a fallback
            try:
                # Map Ollama call to Groq format
                response = await self.client.chat.completions.create(
                    model=settings.LLM_MODEL, # Use the high-quality Groq model
                    messages=[{"role": "user", "content": prompt}],
                    stream=False
                )
                return response.choices[0].message.content or ""
            except Exception as groq_error:
                print(f"Fallback to Groq also failed: {groq_error}")
                raise


    async def generate_title(self, text: str) -> str:
        """Generates a concise title (max 5-6 words) for a chat session."""
        prompt = f"""
        Generate a short, concise title (max 5-6 words) for a chat session based on the following message.
        Do not use quotes. Just the title.
        
        Message:
        {text}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                stream=False
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return "New Chat"


llm_service = LLMService()
