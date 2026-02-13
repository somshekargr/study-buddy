from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import settings
from pydantic import EmailStr
import logging

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

class EmailService:
    def __init__(self):
        self.fm = FastMail(conf)

    async def send_ingestion_status_email(self, email: str, filename: str, status: str):
        """Sends an email notification when document ingestion finishes."""
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.warning("Email settings not configured. Skipping notification.")
            return

        subject = f"Study Buddy: Ingestion {status.capitalize()} - {filename}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #4F46E5;">Study Buddy Ingestion Update</h2>
                <p>Hello,</p>
                <p>The processing of your document <strong>{filename}</strong> has finished with status: 
                   <span style="color: {'#059669' if status == 'ready' else '#DC2626'}; font-weight: bold;">{status.upper()}</span>.
                </p>
                {"<p>Your Knowledge Map has been updated and is ready for study!</p>" if status == 'ready' else "<p>There was an issue processing your file. Please try reprocessing it from the dashboard.</p>"}
                <br>
                <p>Happy Studying,<br>StudyBuddy Team</p>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=body,
            subtype=MessageType.html
        )

        try:
            await self.fm.send_message(message)
            logger.info(f"Ingestion status email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")

email_service = EmailService()
