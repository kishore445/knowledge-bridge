"""Shortcut: python seed.py (from the backend/ directory)."""
import asyncio
from app.seed import seed

asyncio.run(seed())
