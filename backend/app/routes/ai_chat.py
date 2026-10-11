"""AI Chat — Knowledge Bridge assistant powered by OpenRouter."""
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import httpx

log = logging.getLogger(__name__)

from ..database import col
from ..deps import get_optional_user
from ..config import get_settings

router = APIRouter(prefix="/ai", tags=["ai_chat"])

SYSTEM_PROMPT = """You are the Knowledge Bridge AI Assistant — a warm, helpful guide for a book redistribution platform serving Hyderabad, India.

Knowledge Bridge moves used school books from homes and kabadiwalas (scrap dealers) to government schools and low-income students.

You help with:
- How to donate books (individuals, families, kabadiwalas)
- How schools can order books from the donate lane (free/subsidised)
- How buyers can find discounted books on the resale lane
- How sponsors can fund school book orders and see their impact
- Understanding kabadiwala pickup process and trust scores
- Explaining the two lanes: donate (govt schools) and resale (buyers)
- Impact stories and how books reach children

Key facts:
- Govt-issued books ALWAYS go to the donate lane — never resale
- Price is always transparent: book_cost + handling + delivery
- Kabadiwalas earn per accepted pickup; trust score = accepted/total
- Sponsorship ops fee funds platform operations (shown openly)
- Schools in Hyderabad can get verified and order for free via sponsors

## How to respond — understand the message first
Before replying, read the user's LATEST message and the conversation so far, work out what they actually mean, and answer THAT. Never paste a canned reply, and never repeat an earlier reply of yours word for word.

- Greetings and small talk ("hi", "hello", "hey", "good morning", "thanks", "ok"): reply naturally and briefly in your own words — a short warm greeting, then one line offering help (donating books, ordering for a school, buying books, sponsoring, how pickups work). Do NOT start collecting details from a greeting.
- Questions about the platform ("how do I donate books?", "what is the donate lane?"): answer the question clearly in a few sentences, then — only if it is about donating — offer to arrange it: "Would you like me to set up a pickup? I can take your details right here."
- Clear intent to donate ("I'd like to donate some books", "I have old textbooks", "yes, arrange a pickup"): start the donation flow below.
- Anything unclear: ask one short clarifying question.

## Book Donation Collection Flow
Collect details ONE question at a time, in this order, only for details not already given:
  1. Name
  2. Phone number or email
  3. Area/locality (Hyderabad)
  4. Kind of books (school textbooks, storybooks, or both)
  5. Approximate quantity
  6. Pickup preference (home pickup vs drop-off point)
Begin with something like: "That's wonderful! 🙏 To get your pickup arranged, I just need a few quick details. May I know your name?"

Rules while collecting:
- Look at what you last asked and check that the user's reply actually answers it. A greeting ("hi"), a question, or something unrelated is NOT an answer — never record it as a name, phone, area, etc.
- If the reply isn't an answer, respond to what they said in a sentence, then ask the pending question again in different words.
- If the user gives several details at once, accept them all and skip those questions.
- If they change topic or want to stop, follow them; offer to resume later.
- Never ask for something they've already told you.

After all 6 details are collected, confirm with a warm summary:
"Thank you, [name]! Here's what we've noted:
- 📍 Area: [area]
- 📚 Books: [type], approx [quantity]
- 🚗 Pickup: [preference]
- 📞 Contact: [phone/email]
Our team will reach out within 24 hours to confirm the pickup. Your books will go to children who need them most. 🙏"

Never redirect to another page. Keep the entire flow in this chat.

Always be warm, concise, and in the spirit of community service."""


class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: str = ""


async def call_llm(messages: list) -> str:
    settings = get_settings()
    groq_key = getattr(settings, "groq_api_key", "") or ""
    or_key = getattr(settings, "openrouter_api_key", "") or ""

    log.info("call_llm: groq_key=%s or_key=%s", bool(groq_key), bool(or_key))

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Groq — qwen fast model first, then gpt-oss-120b
        if groq_key:
            for model in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
                try:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {groq_key}"},
                        json={"model": model, "messages": messages, "max_tokens": 800, "temperature": 0.7},
                    )
                    log.info("Groq %s: %s", model, resp.status_code)
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        if content:
                            return content
                    else:
                        log.warning("Groq %s error: %s", model, resp.text[:200])
                except Exception as e:
                    log.warning("Groq %s exception: %s", model, e)
                    continue

        # 2. OpenRouter free-tier fallback
        if or_key:
            for model in [
                "nvidia/nemotron-3-super-120b-a12b:free",
                "nvidia/nemotron-3.5-lightning:free",
                "liquid/lfm-2.5-2.6b:free",
            ]:
                try:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {or_key}",
                            "HTTP-Referer": "https://knowledgebridge.in",
                            "X-Title": "Knowledge Bridge",
                        },
                        json={"model": model, "messages": messages, "max_tokens": 800, "temperature": 0.7},
                    )
                    log.info("OR %s: %s", model, resp.status_code)
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
                    else:
                        log.warning("OR %s error: %s", model, resp.text[:200])
                except Exception as e:
                    log.warning("OR %s exception: %s", model, e)
                    continue

    return "Sorry, I couldn't reach the AI right now. Please try again in a moment."


@router.post("/chat/sessions")
async def create_session(user: dict = Depends(get_optional_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "title": "New Chat",
        "user_id": user["_id"] if user else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await col("ai_sessions").insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/chat/sessions")
async def get_sessions(user: dict = Depends(get_optional_user)):
    query = {"user_id": user["_id"]} if user else {"user_id": None}
    cursor = col("ai_sessions").find(query).sort("updated_at", -1).limit(50)
    sessions = await cursor.to_list(50)
    for s in sessions:
        s.pop("_id", None)
    return sessions


@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str):
    await col("ai_sessions").delete_one({"id": session_id})
    await col("ai_messages").delete_many({"session_id": session_id})
    return {"message": "Deleted"}


@router.get("/chat/messages/{session_id}")
async def get_messages(session_id: str):
    cursor = col("ai_messages").find({"session_id": session_id}).sort("created_at", 1)
    msgs = await cursor.to_list(200)
    for m in msgs:
        m.pop("_id", None)
    return msgs


@router.post("/chat/send")
async def send_message(body: ChatRequest):
    # Load session history for context
    # Most recent turns, oldest-first — sorting ascending with a limit would drop the newest ones
    cursor = col("ai_messages").find({"session_id": body.session_id}).sort("created_at", -1)
    history = list(reversed(await cursor.to_list(20)))
    last_reply = next((h["content"] for h in reversed(history) if h["role"] == "assistant"), None)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": body.message})

    # Save user message
    user_msg_id = str(uuid.uuid4())
    await col("ai_messages").insert_one({
        "id": user_msg_id,
        "session_id": body.session_id,
        "role": "user",
        "content": body.message,
        "created_at": datetime.utcnow(),
    })

    # Call LLM
    reply = await call_llm(messages)

    # An identical repeat means the model ignored the latest message — retry once with a nudge
    if last_reply and reply.strip() == last_reply.strip():
        retry = messages + [{
            "role": "system",
            "content": "Your previous reply was identical to your last one. Respond directly to the user's latest message in fresh wording.",
        }]
        reply = await call_llm(retry)

    # Save assistant reply
    reply_id = str(uuid.uuid4())
    await col("ai_messages").insert_one({
        "id": reply_id,
        "session_id": body.session_id,
        "role": "assistant",
        "content": reply,
        "created_at": datetime.utcnow(),
    })

    # Update session title from first user message
    if len(history) == 0:
        title = body.message[:50] + ("…" if len(body.message) > 50 else "")
        await col("ai_sessions").update_one(
            {"id": body.session_id},
            {"$set": {"title": title, "updated_at": datetime.utcnow()}},
        )
    else:
        await col("ai_sessions").update_one(
            {"id": body.session_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    return {"message_id": reply_id, "response": reply}
