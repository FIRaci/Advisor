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
    
    async def generate(self, prompt: str, phase: str = "1", quiz_data: dict = None) -> str:
        """Generate AI response asynchronously with fallback"""
        if self.use_mock:
            return self._get_mock_response(prompt, phase, quiz_data)
        
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
    def _get_mock_response(message: str, phase: str = "1", quiz_data: dict = None) -> str:
        """Smart mock responses for demo mode"""
        quiz_data = quiz_data or {}
        product_name = quiz_data.get("productName", "your product")
        goal = quiz_data.get("goal", "growth")
        
        if phase == "1":
            return f"""# Marketing Strategy Proposal for {product_name.title()}

Based on your quiz data, I have thoroughly analyzed your target market and competitive landscape. Since your main goal is {goal}, and your audience prefers quick shopping experiences, a combination of short-form content and targeted paid acquisition will yield the best results.

To optimize your initial budget, we need to allocate ad spend efficiently while leveraging viral organic content.

Here are 3 personalized strategic plans for you to choose from:"""
        
        elif phase == "2":
            return f"""# Detailed Execution Plan (Stage 2)

Based on the strategy you selected in Stage 1 for {product_name.title()}, I have outlined a week-by-week execution roadmap to optimize your budget and achieve your KPIs as quickly as possible.

## 4-Week Execution Roadmap
| Week | Objective | Channels | Budget |
| :--- | :--- | :--- | :--- |
| Week 1 | Brand Awareness & Lead Gen | Facebook Ads, Email | 30% |
| Week 2 | Acceleration & Remarketing | Facebook Ads, TikTok | 40% |
| Week 3 | Conversion Rate Optimization | Email, Website | 15% |
| Week 4 | Evaluation & Scale-up | All Channels | 15% |

## Target KPI Benchmarks
| Metric | Suggested Target | Current Status |
| :--- | :--- | :--- |
| **CTR** | > 3.5% | Not measured |
| **CVR** | > 2.0% | Not measured |
| **ROAS** | > 3.0x | N/A |

### Content Draft: Facebook Ad
**Headline:** Don't miss the ultimate solution for {product_name}! 🚀
**Body:** Are you struggling with inefficient ad spend? Let us help you optimize every dollar with a breakthrough marketing strategy tailored for {goal}. Join us today for a free consultation!
**Call-to-Action:** Sign up now!

### Content Draft: Email Newsletter
**Subject:** Discover the secret to 3x revenue in 30 days 💥
**Body:** Hi there, we just launched an exclusive method to optimize conversion rates for {product_name}. Do you want to be the first to apply it? Click the button below!

**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**.
"""
        elif phase == "3":
            return f"""# Optimization Report (Stage 3)

Based on the latest performance metrics for {product_name.title()}, the campaign is experiencing a bottleneck in conversion rate (CVR).

## Optimization Proposals:
1. **Pause underperforming ad sets**: Ads with CTR < 1.5% are wasting budget. Reallocate this 20% budget to a new Lookalike audience.
2. **Refresh Content**: Current content is experiencing "Ad Fatigue". You should test short-form video formats like TikTok or Reels.

Try implementing these changes, update the metrics, and we will measure the results again next week!"""

        return "Thank you! AdVisor is currently running in Demo Mode. Would you like to retake the quiz?"


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
- IMPORTANT: If you suggest specific KPI/metric targets, you MUST output them at the end of your response in a JSON block exactly like this:
```json
{
  "type": "metrics_targets",
  "targets": {
    "cpc": 0.5,
    "cpa": 15,
    "roas": 3.0,
    "retentionRate": 15
  }
}
```
Use only standard metric keys (e.g., cpc, cpm, cpa, cpl, cac, ctr, conversionRate, roas, churnRate, bounceRate, retentionRate, engagementRate).

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

        # Extract phase and quiz_data from context
        phase = "1"
        quiz_data = {}
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
        
        response_text = await gemini_service.generate(prompt, phase, quiz_data)
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
