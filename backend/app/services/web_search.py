from ddgs import DDGS
from typing import List, Dict

class WebSearchService:
    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search the web using DuckDuckGo.
        Returns a list of dicts with 'title', 'url', and 'content'.
        """
        results = []
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "content": r.get("body", "")
                    })
        except Exception as e:
            print(f"Web Search Error: {e}")
            
        return results

web_search_service = WebSearchService()
