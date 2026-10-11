from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    db_name: str = "knowledge_bridge"

    jwt_secret: str = "dev_secret_change_me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days

    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    s3_bucket: str = "knowledge-bridge-books"

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    resend_api_key: str = ""
    from_email: str = "noreply@knowledgebridge.in"

    mock_otp: bool = True
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""

    allowed_origins: str = "http://localhost:5173,http://localhost:3000,https://knowledge-bridge-three.vercel.app"
    # Vercel preview deployments of this project get a fresh subdomain per build
    allowed_origin_regex: str = r"https://knowledge-bridge-[a-z0-9-]+\.vercel\.app"

    sponsorship_ops_fee_pct: int = 12

    groq_api_key: str = ""
    openrouter_api_key: str = ""

    @property
    def origins_list(self) -> list[str]:
        # Browsers send Origin without a trailing slash, so "https://x.app/" would never match
        origins = {o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()}
        origins.add("https://knowledge-bridge-three.vercel.app")
        return sorted(origins)

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
