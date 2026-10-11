"""S3 presigned upload / download URLs."""
import uuid
from typing import Optional
import boto3
from botocore.exceptions import ClientError

from ..config import get_settings


def _s3():
    s = get_settings()
    return boto3.client(
        "s3",
        region_name=s.aws_region,
        aws_access_key_id=s.aws_access_key_id,
        aws_secret_access_key=s.aws_secret_access_key,
    )


def presigned_upload_url(
    prefix: str,
    content_type: str = "image/jpeg",
    expires_in: int = 300,
) -> dict:
    """Return {upload_url, object_key, public_url}."""
    settings = get_settings()
    key = f"{prefix}/{uuid.uuid4()}.jpg"
    try:
        url = _s3().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        public_url = f"https://{settings.s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"
        return {"upload_url": url, "object_key": key, "public_url": public_url}
    except ClientError as e:
        # In local dev without real AWS, return a stub
        print(f"[S3 STUB] {e}")
        stub_key = f"{prefix}/{uuid.uuid4()}.jpg"
        return {
            "upload_url": f"http://localhost:9000/stub/{stub_key}",
            "object_key": stub_key,
            "public_url": f"https://placehold.co/400x300?text=book",
        }


def presigned_download_url(key: str, expires_in: int = 3600) -> str:
    settings = get_settings()
    try:
        return _s3().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": key},
            ExpiresIn=expires_in,
        )
    except ClientError:
        return f"https://placehold.co/400x300?text=book"
