from neo4j import GraphDatabase
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class GraphService:
    def __init__(self):
        self._driver = None
        try:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
            logger.info("Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")

    def close(self):
        if self._driver:
            self._driver.close()

    def verify_connectivity(self):
        try:
            self._driver.verify_connectivity()
            return True
        except Exception as e:
            logger.error(f"Neo4j connectivity error: {e}")
            return False

    async def execute_query(self, query: str, parameters: dict = None):
        """Execute a cypher query."""
        if not self._driver:
            raise Exception("Neo4j driver not initialized")
        
        with self._driver.session() as session:
            try:
                result = session.run(query, parameters)
                return [record for record in result]
            except Exception as e:
                logger.error(f"Error executing Cypher query: {e}")
                raise

    async def extract_triplets(self, text: str) -> list[dict]:
        """Extract (subject, relation, object) triplets from text using Ollama."""
        from app.services.llm import llm_service
        
        prompt = f"""
        Extract key knowledge relationships from the following text in JSON format.
        Each relationship should be a triplet: (subject, relation, object).
        
        Text: {text}
        
        Return a JSON list of objects:
        [
            {{"subject": "Concept A", "relation": "is part of", "object": "Concept B"}},
            ...
        ]
        
        Only extract meaningful relationships. Use clear, concise names for subjects and objects.
        """
        
        try:
            response = await llm_service.call_ollama(prompt, format="json")
            import json
            import re
            
            # Extract JSON from potential preamble/markdown
            json_match = re.search(r'\[\s*{.*}\s*\]', response, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            else:
                content = response

            try:
                data = json.loads(content)
                # handle cases where LLM wraps the list in a key
                if isinstance(data, dict):
                    for key in ["triplets", "relationships", "data"]:
                        if key in data and isinstance(data[key], list):
                            return data[key]
                return data if isinstance(data, list) else []
            except json.JSONDecodeError:
                logger.warning(f"Ollama returned invalid JSON for triplets: {response[:100]}...")
                return []
        except Exception as e:
            logger.error(f"Error in extract_triplets: {e}")
            return []

graph_service = GraphService()
