from app.services.web_search import web_search_service

print("Searching for latest AI news...")
results = web_search_service.search("AI news")
print(f"Found {len(results)} results")
for i, r in enumerate(results):
    print(f"{i+1}. {r['title']}")
    print(f"   URL: {r['url']}")
    print(f"   Snippet: {r['content'][:100]}...")
