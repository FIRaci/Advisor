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
    
    async def generate(self, prompt: str, phase: str = "1") -> str:
        """Generate AI response asynchronously with fallback"""
        if self.use_mock:
            return self._get_mock_response(prompt, phase)
        
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
    def _get_mock_response(message: str, phase: str = "1") -> str:
        """Smart mock responses for demo mode"""
        if phase == "1":
            return """# Kế hoạch Marketing Đề xuất từ AdVisor

Dựa trên dữ liệu khảo sát của bạn, tôi đã phân tích kỹ lưỡng thị trường mục tiêu và bối cảnh cạnh tranh. Khách hàng của bạn chủ yếu là nhóm người dùng thích trải nghiệm mua sắm nhanh chóng, do đó, các kênh Digital Marketing kết hợp xây dựng nội dung ngắn sẽ mang lại hiệu quả cao nhất.

Tuy nhiên, để tối ưu hóa ngân sách ban đầu, chúng ta cần phân bổ chi phí quảng cáo hợp lý và tận dụng các nội dung có tính viral.

Dưới đây là 3 phương án chiến lược (Plans) đã được cá nhân hóa để bạn lựa chọn:"""
        
        elif phase == "2":
            return """# Kế hoạch Thực thi Chi tiết (Stage 2)

Dựa trên chiến lược bạn đã chọn ở Stage 1, tôi đã vạch ra lộ trình thực thi theo tuần để tối ưu hoá ngân sách và đạt được KPIs mục tiêu nhanh nhất.

## Lộ trình Thực thi 4 Tuần
| Tuần | Mục tiêu | Kênh triển khai | Ngân sách |
| :--- | :--- | :--- | :--- |
| Tuần 1 | Xây dựng nhận diện & Thu thập Lead | Facebook Ads, Email | 30% |
| Tuần 2 | Tăng tốc & Remarketing | Facebook Ads, TikTok | 40% |
| Tuần 3 | Tối ưu hoá Tỷ lệ chuyển đổi | Email, Website | 15% |
| Tuần 4 | Đánh giá & Scale-up | Tất cả các kênh | 15% |

## Bảng Benchmarks Mục tiêu
| Chỉ số | Target Đề xuất | Trạng thái |
| :--- | :--- | :--- |
| **CTR** | > 3.5% | Chưa đo lường |
| **CVR** | > 2.0% | Chưa đo lường |
| **ROAS** | > 3.0x | N/A |

### Content Draft: Facebook Ad
**Headline:** Đừng bỏ lỡ giải pháp tối ưu doanh thu cho doanh nghiệp của bạn! 🚀
**Body:** Bạn đang đau đầu vì ngân sách quảng cáo không hiệu quả? Hãy để chúng tôi giúp bạn tối ưu từng đồng chi phí với chiến lược marketing đột phá. Tham gia ngay hôm nay để nhận tư vấn!
**Call-to-Action:** Đăng ký nhận tư vấn ngay!

### Content Draft: Email Newsletter
**Subject:** Khám phá bí quyết tăng x3 doanh thu trong 30 ngày 💥
**Body:** Chào bạn, chúng tôi vừa ra mắt một phương pháp độc quyền giúp tối ưu hóa tỷ lệ chuyển đổi. Bạn có muốn trở thành người đầu tiên áp dụng? Hãy click vào nút bên dưới nhé!

**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**.
"""
        elif phase == "3":
            return """# Báo cáo Tối ưu hoá (Stage 3)

Dựa trên các chỉ số hiệu suất gần nhất, chiến dịch đang gặp một số nút thắt ở tỷ lệ chuyển đổi (CVR).

## Đề xuất Tối ưu:
1. **Tắt các nhóm quảng cáo kém hiệu quả**: Các ads có CTR < 1.5% đang tiêu tốn ngân sách vô ích. Hãy dồn 20% ngân sách này sang nhóm Lookalike mới.
2. **Cập nhật Content**: Content hiện tại đang bị "Ad Fatigue". Bạn nên test thêm định dạng Video ngắn trên TikTok hoặc Reels.

Hãy thử áp dụng các thay đổi này, cập nhật lại metrics và chúng ta sẽ đo lường lại vào tuần sau nhé!"""

        return "Cảm ơn bạn! AdVisor đang chạy ở chế độ Demo. Bạn có muốn thử làm quiz lại không?"


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
        
        response_text = await gemini_service.generate(prompt, phase)
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
