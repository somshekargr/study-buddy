from pydantic import BaseModel
from datetime import datetime


class PersonaTemplate(BaseModel):
    name: str
    description: str
    system_instruction: str


PERSONAS = {
    "default": PersonaTemplate(
        name="Standard Tutor",
        description="A helpful assistant that explains concepts clearly and concisely.",
        system_instruction="You are a helpful and professional study tutor. Your goal is to help the student understand the provided material."
    ),
    "general": PersonaTemplate(
        name="General Assistant",
        description="A helpful AI assistant.",
        system_instruction="You are a helpful AI assistant. Answer the user's questions clearly and accurately."
    ),
    "eli5": PersonaTemplate(
        name="Explain Like I'm 5",
        description="Simplifies complex topics for a younger audience.",
        system_instruction="You are an expert at simplifying complex topics. Explain everything as if you were talking to a 5-year-old. Use simple words and fun analogies."
    ),
    "star_wars": PersonaTemplate(
        name="Yoda / Star Wars",
        description="Explains things using Star Wars metaphors and Yoda-style speech.",
        system_instruction="You are a Jedi Master. Explain the concepts from the text as if you were teaching a young Padawan. Use Star Wars metaphors and a bit of Yoda-style wisdom (and speech patterns if appropriate)."
    ),
    "professor": PersonaTemplate(
        name="Strict Professor",
        description="Academic, rigorous, and demanding high accuracy.",
        system_instruction="You are a rigorous university professor. Provide detailed, academic, and highly accurate explanations. Focus on precision and formal language."
    ),
    "socratic": PersonaTemplate(
        name="Socratic Tutor",
        description="Asks questions to guide you to the answer instead of giving it directly.",
        system_instruction="You are a Socratic tutor. Instead of giving the answer directly, guide the student with helpful questions based on the provided text to help them discover the answer themselves."
    )
}


class PersonaEngine:
    @staticmethod
    def get_persona(persona_name: str) -> PersonaTemplate:
        return PERSONAS.get(persona_name, PERSONAS["default"])

    def assemble_prompt(self, persona_name: str, context_chunks: list[dict], question: str, history: list[dict] = None) -> list[dict]:
        persona = self.get_persona(persona_name)
        
        # Improvement #3 & #4: Page numbers and safe grounding
        content_parts = []
        for c in context_chunks:
            source = f"[{c['page_number']}]" if c['page_number'] == "Web" else f"[Page {c['page_number']}]"
            content_parts.append(f"{source}: {c['content']}")
        
        context_text = "\n\n".join(content_parts)

        # Improvement #5: Dynamic Response Length
        if context_chunks:
            # Check if we have web results specifically
            has_web = any(c['page_number'] == "Web" for c in context_chunks)
            
            length_instruction = """
RESPONSE LENGTH RULE:
Since you have relevant context, be COMPREHENSIVE and DETAILED. 
Provide long, thorough explanations, break down complex ideas into steps, and use bullet points or numbered lists where appropriate.
"""
            grounding_rule = f"""
STRICT GROUNDING RULE:
You must answer the student's question PRIMARY using the provided context below. 
{'Cite the source whenever possible (e.g., "[As mentioned on Web...", "[According to the document Page 3...").' if has_web else 'Cite the page numbers whenever possible (e.g., "As mentioned on Page 3...").'}
"""
        else:
            length_instruction = """
RESPONSE LENGTH RULE:
Since no specific context was found, keep your response helpful but CONCISE (1-2 sentences) if it's just a greeting or general query. 
However, feel free to be more detailed if the user is asking a direct question that doesn't necessarily require local document context.
"""
            grounding_rule = """
GREETING RULE:
If the user is just saying hi or making small talk, respond naturally. Do not try to force document context into the response if it's not relevant.
"""

        system_message = f"""{persona.system_instruction}

Current Date: {datetime.now().strftime("%Y-%m-%d")}

{grounding_rule}

{length_instruction}

CONTEXT INFORMATION (Only use if relevant to the question):
---
{context_text}
---
"""
        
        messages = [{"role": "system", "content": system_message}]
        
        # Add history if provided
        if history:
            messages.extend(history)
            
        # Add current question
        messages.append({"role": "user", "content": question})
        
        return messages


persona_engine = PersonaEngine()
