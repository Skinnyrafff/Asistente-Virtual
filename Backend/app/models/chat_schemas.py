from pydantic import BaseModel

class ConversationItem(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
