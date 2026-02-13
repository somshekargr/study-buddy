import httpx
import base64
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_VISION_MODEL

    async def describe_image(self, image_path: str, prompt: str = "Describe this diagram or chart in detail for a study guide.") -> str:
        """Use local Ollama vision model to describe an image."""
        try:
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "images": [image_data]
                    }
                )
                response.raise_for_status()
                return response.json().get("response", "")
        except Exception as e:
            logger.error(f"Error in vision service: {e}")
            return f"[Vision Error: Could not analyze image at {image_path.split('/')[-1]}]"

vision_service = VisionService()
