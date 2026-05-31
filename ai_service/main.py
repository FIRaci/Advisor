"""
AdVisor AI Service - Modern FastAPI + Google GenAI (2026)
Clean architecture with proper error handling and logging
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Optional
import json

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Any, Dict
from examples import EXAMPLE_PROMPTS, build_few_shot_examples
from prompt_helpers import get_stage_instructions, append_fallback_tags_if_missing

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings with validation"""
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    port: int = Field(default=8000, alias="PORT")
    model_name: str = "gemini-3-flash-preview"
    backend_url: str = Field(default="http://backend:3000", alias="BACKEND_URL")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    @property
    def is_api_key_valid(self) -> bool:
        return len(self.gemini_api_key) > 30


settings = Settings()


class GeminiService:
    """Modern Gemini AI service with proper error handling"""
    
    def __init__(self):
        self.client: Optional[genai.Client] = None
        self.use_mock = True
        self._initialize()
    
    def _initialize(self) -> None:
        """Initialize Gemini client without blocking network calls"""
        if not settings.is_api_key_valid:
            logger.warning("No valid API key - using mock mode")
            return
        
        try:
            self.client = genai.Client(api_key=settings.gemini_api_key)
            self.use_mock = False
            logger.info("Gemini AI client initialized successfully")
        except Exception as e:
            logger.error(f"Gemini initialization failed: {e}")
            logger.info("Falling back to mock mode")
    
    async def generate(self, prompt: str) -> str:
        """Generate AI response asynchronously with fallback"""
        if self.use_mock:
            return self._get_mock_response(prompt)
        
        try:
            response = await self.client.aio.models.generate_content(
                model=settings.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            logger.error(f"Generation error: {e}")
            raise Exception(f"Gemini API error: {str(e)}")
    
    @staticmethod
    def _get_mock_response(message: str) -> str:
        """Smart mock responses for demo mode"""
        msg_lower = message.lower()
        
        if any(word in msg_lower for word in ['strategy', 'chiến lược', 'quiz', 'business']):
            return """# Your Personalized Marketing Strategy

## Target Audience Analysis
Based on your profile, your ideal customers are:
- **Demographics**: Age 25-45, mid to high income
- **Behavior**: Active on social media, values quality and convenience
- **Pain Points**: Looking for trusted, efficient solutions

## Recommended Marketing Channels
1. **Social Media Marketing** (Priority: High)
    - Focus on Instagram & Facebook
    - Budget: 40% of marketing spend
    - Expected ROI: 3-5x

2. **Search Engine Marketing**
    - Google Ads + SEO
    - Budget: 30%
    - Expected ROI: 4-6x

3. **Email Marketing**
    - Budget: 15%
    - Expected ROI: 8-10x

4. **Content Marketing**
## 90-Day Action Plan

### Month 1: Foundation
- Set up tracking (Google Analytics, Facebook Pixel)
- Create content calendar
- Launch initial campaigns
- A/B test ad creatives

### Month 2: Optimization
- Analyze performance data
- Scale winning campaigns
- Expand to new audiences
- Launch email automation

### Month 3: Growth
- Launch retargeting campaigns
- Expand to additional channels
- Optimize conversion funnel
- Build brand authority

## Quick Wins
1. Create a lead magnet (free guide/checklist)
2. Set up Facebook pixel for retargeting
3. Start collecting customer testimonials
4. Launch a limited-time offer

---
**Note**: This is a demo response. Connect a valid Gemini API key for personalized AI-powered strategies!

How can I help you refine this strategy?"""
        
        elif any(word in msg_lower for word in ['social', 'facebook', 'instagram']):
            return """## Social Media Strategy

### Platform Priorities
1. **Instagram** - Visual storytelling, Reels, Stories
2. **Facebook** - Community building, Ads
3. **TikTok** - Short-form video content (if target audience is younger)

### Content Strategy
- Post 5-7 times per week
- Mix: 40% educational, 30% promotional, 30% engagement
- Use trending audio and hashtags
- Engage with comments within 2 hours

### Ad Strategy
- Budget: $20-50/day to start
- Focus on conversions, not just reach
- A/B test different creatives
- Use lookalike audiences

Would you like specific content ideas for your business?"""
        
        return """Thank you for your question! As an AI marketing advisor, I'm here to help with:

    - Marketing strategy development
    - Social media planning
    - Ad campaign optimization
    - Content creation ideas
    - Budget allocation
    - Performance tracking

    **Note**: I'm currently running in demo mode. For full AI-powered responses, please configure a valid Gemini API key.

    What specific marketing challenge can I help you with?"""


# Global service instance
gemini_service = GeminiService()


# Pydantic models
class ChatRequest(BaseModel):
    """Chat request with optional context"""
    message: str = Field(..., min_length=1, max_length=10000)
    context: Optional[dict] = Field(default=None)

class AssistRequest(BaseModel):
    """Assist request for content generation"""
    type: Literal['email', 'ad_copy', 'social_post', 'landing_page', 'custom']
    message: Optional[str] = Field(default="", max_length=2000)
    context: Optional[Dict[str, Any]] = Field(default=None)

class QuizAnalysisRequest(BaseModel):
    """Quiz analysis payload validation"""
    business: Optional[str] = Field(default="", max_length=500)
    goal: Optional[str] = Field(default="", max_length=500)
    audience: Optional[str] = Field(default="", max_length=500)
    budget: Optional[str] = Field(default="", max_length=50)
    timeframe: Optional[str] = Field(default="", max_length=50)
    productName: Optional[str] = Field(default="", max_length=200)
    phase: Optional[str] = Field(default="1", max_length=10)
    selectedPlan: Optional[str] = Field(default="", max_length=50)


class ChatResponse(BaseModel):
    """Chat response"""
    response: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    mode: str
    api_configured: bool
    model: str


class ExamplesResponse(BaseModel):
    """Prompt examples response"""
    count: int
    examples: list[dict]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting AdVisor AI Service")
    gemini_service._initialize()
    yield
    logger.info("Shutting down AdVisor AI Service")


# Initialize FastAPI with lifespan
app = FastAPI(
    title="AdVisor AI Service",
    description="Modern AI-powered marketing advisor using Google Gemini",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware — restrict to backend only (not public-facing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.backend_url,
        "http://backend:3000",
        "http://localhost:3000",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization"],
)


SYSTEM_PROMPT = """You are AdVisor, an expert AI marketing strategist. Your role is to help businesses create effective marketing campaigns.

Your capabilities:
1. Analyze target audience and market segments
2. Develop marketing strategies (digital, traditional, social media)
3. Create compelling ad copy and content suggestions
4. Recommend budget allocation
5. Suggest KPIs and success metrics

Guidelines:
- Be professional but friendly
- Give actionable, specific advice
- Ask clarifying questions when needed
- Provide examples when helpful
- Consider budget constraints
- Focus on ROI and measurable outcomes

Respond in the same language the user writes in (English or Vietnamese)."""


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        service="ai_service",
        mode="mock" if gemini_service.use_mock else "gemini",
        api_configured=not gemini_service.use_mock,
        model=settings.model_name
    )


@app.get("/examples", response_model=ExamplesResponse)
async def examples_endpoint():
    """Expose curated examples used for few-shot prompting"""
    return ExamplesResponse(
        count=len(EXAMPLE_PROMPTS),
        examples=EXAMPLE_PROMPTS
    )


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI marketing advisor"""
    try:
        few_shot_context = build_few_shot_examples(limit=3)

        # Extract phase from context
        phase = "1"
        if request.context and "quizData" in request.context:
            quiz_data = request.context.get("quizData", {})
            if isinstance(quiz_data, dict) and "phase" in quiz_data:
                phase = str(quiz_data["phase"])

        stage_instructions = get_stage_instructions(phase)

        # Sanitize message to prevent XML tag injection
        safe_message = request.message.replace("<", "&lt;").replace(">", "&gt;")

        # Build context string if provided, safely serialized
        context_str = ""
        if request.context:
            context_json = json.dumps(request.context, ensure_ascii=False)
            if len(context_json) > 20000:
                context_json = context_json[:20000] + "... (truncated)"
            context_str = f"\n\nContext about the campaign:\n{context_json}\n\n"
        
        prompt = f"{SYSTEM_PROMPT}\n\n{stage_instructions}\n\n{few_shot_context}{context_str}User Request: <user_input>{safe_message}</user_input>"
        
        response_text = await gemini_service.generate(prompt)
        response_text = append_fallback_tags_if_missing(response_text, phase)
        
        return ChatResponse(response=response_text)
    
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message"
        )


@app.post("/assist", response_model=ChatResponse)
async def assist_endpoint(request: AssistRequest):
    """Content Assistant for generating marketing copy"""
    try:
        content_type_labels = {
            "email": "Marketing Email",
            "ad_copy": "Ad Copy",
            "social_post": "Social Media Post",
            "landing_page": "Landing Page Copy",
            "custom": "Custom Content"
        }
        
        label = content_type_labels.get(request.type, "Custom Content")
        
        # Sanitize message
        safe_message = request.message.replace("<", "&lt;").replace(">", "&gt;") if request.message else ""

        context_str = ""
        if request.context:
            context_json = json.dumps(request.context, ensure_ascii=False)
            if len(context_json) > 20000:
                context_json = context_json[:20000] + "... (truncated)"
            context_str = f"\n\nCampaign context:\n{context_json}\n\n"
            
        custom_prompt = ""
        if safe_message:
            custom_prompt = f"User's content request: <user_input>{safe_message}</user_input>\n\n"

        prompt = f"""You are AdVisor Content Assistant, an expert marketing copywriter. Generate high-quality {label} content.

{context_str}
{custom_prompt}
Generate professional, engaging {label} content ready to use. Include:
1. The actual content (ready to copy-paste)
2. Key messaging points used
3. A/B variant suggestion

Format with clear markdown."""
        
        response_text = await gemini_service.generate(prompt)
        
        return ChatResponse(response=response_text)
    
    except Exception as e:
        logger.error(f"Assist endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process assist message"
        )


@app.post("/analyze-quiz")
async def analyze_quiz(data: QuizAnalysisRequest):
    """Analyze quiz responses and generate marketing recommendations"""
    try:
        # Stringify only the validated schema fields to prevent massive payload injection
        validated_data = data.model_dump(exclude_none=True)
        
        prompt = f"""{SYSTEM_PROMPT}

Based on the following business information, provide a comprehensive marketing strategy:

<user_input>
{validated_data}
</user_input>

Please provide:
1. Target Audience Analysis
2. Recommended Marketing Channels
3. Content Strategy
4. Budget Allocation Suggestions
5. Key Performance Indicators (KPIs)
6. 90-Day Action Plan"""
        
        strategy = await gemini_service.generate(prompt)
        
        return {"strategy": strategy}
    
    except Exception as e:
        logger.error(f"Quiz analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze quiz data"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )
