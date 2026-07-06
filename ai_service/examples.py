"""Reusable prompt examples for few-shot context in AdVisor AI service."""

from __future__ import annotations

from typing import Any

EXAMPLE_PROMPTS: list[dict[str, Any]] = [
    {
        "id": "skincare-startup-stage1",
        "language": "en",
        "user": "I run a vegan skincare startup. Budget is $1500/month. Our USP is 100% cruelty-free and organic ingredients. Target audience is Gen Z women. My goal is rapid customer acquisition. Give me the Stage 1 Strategy.",
        "assistant": (
            "Here is my deep-dive analysis of your vegan skincare business. Targeting Gen Z women with a 100% cruelty-free and organic USP is highly viable, as this demographic strongly values ethical consumption. However, with a $1500/month budget, we cannot compete with massive legacy brands on broad terms. We must be surgical with our acquisition strategy, leveraging viral visual platforms where Gen Z congregates.\n\n"
            "**[PLAN_OPTIONS]**\n"
            "[PLAN_A]\n"
            "**Plan A: TikTok Creator Seeding & Ads**\n"
            "- **Core Philosophy:** Send free product to micro-influencers and amplify the best performing UGC with paid ads.\n"
            "- **Channel Mix:** TikTok Ads, Organic TikTok, Instagram Reels\n"
            "| Metric | Projection |\n"
            "| :--- | :--- |\n"
            "| Budget Split | 70% TikTok Ads / 30% Creator Seeding |\n"
            "| Time to Impact | 1-2 Weeks |\n"
            "[/PLAN_A]\n\n"
            "[PLAN_B]\n"
            "**Plan B: Hyper-Targeted Meta Retargeting**\n"
            "- **Core Philosophy:** Use high-quality educational carousel ads on Instagram to build awareness, followed by aggressive conversion ads.\n"
            "- **Channel Mix:** Meta Ads (IG), Email Capture\n"
            "| Metric | Projection |\n"
            "| :--- | :--- |\n"
            "| Budget Split | 80% Meta Ads / 20% Email Software |\n"
            "| Time to Impact | 2-3 Weeks |\n"
            "[/PLAN_B]\n\n"
            "[PLAN_C]\n"
            "**Plan C: The Community Ambassador Program**\n"
            "- **Core Philosophy:** Build a referral engine offering heavy discounts to Gen Z buyers who recruit their friends on campus.\n"
            "- **Channel Mix:** Email Marketing, Organic Social, Word of Mouth\n"
            "| Metric | Projection |\n"
            "| :--- | :--- |\n"
            "| Budget Split | 50% Loyalty Program Tech / 50% Meta Ads |\n"
            "| Time to Impact | 1 Month |\n"
            "[/PLAN_C]\n"
            "[/PLAN_OPTIONS]"
        )
    },
    {
        "id": "b2b-saas-stage2",
        "language": "en",
        "user": "I selected Plan B (LinkedIn Authority & Lead Gen) for my B2B HR SaaS. My goal is pipeline growth. Please give me the Stage 2 Execution Plan.",
        "assistant": (
            "Excellent choice. LinkedIn Authority combined with Lead Gen forms is the most effective way to scale pipeline for an HR SaaS targeting enterprise decision-makers. Here is your comprehensive 4-week roadmap.\n\n"
            "### 4-Week Execution Roadmap\n"
            "| Week | Objective | Key Actions | Budget Allocation |\n"
            "| :--- | :--- | :--- | :--- |\n"
            "| Week 1 | Asset Creation & Tracking | Build \"State of HR 2026\" Lead Magnet, setup LinkedIn Pixel | 15% |\n"
            "| Week 2 | Campaign Launch | Launch LinkedIn Lead Gen Forms targeting HR Directors | 35% |\n"
            "| Week 3 | Optimization & Retargeting | Pause ads with CTR < 0.5%, launch Retargeting layer | 25% |\n"
            "| Week 4 | Sales Handoff & Scaling | Automate CRM routing, increase budget on winning creatives | 25% |\n\n"
            "### Target KPI Benchmarks\n"
            "| Metric | Target Benchmark |\n"
            "| :--- | :--- |\n"
            "| **CTR (LinkedIn)** | > 0.8% |\n"
            "| **Lead Form CVR** | > 12.0% |\n"
            "| **Cost Per Lead (CPL)** | < $85.00 |\n\n"
            "### Content Draft: LinkedIn Lead Gen Ad\n"
            "**Headline:** Is your HR team wasting 15 hours a week on manual compliance?\n"
            "**Body:** We analyzed over 500 Enterprise HR departments. The ones adopting automated compliance workflows are saving millions in potential fines and reclaiming 15+ hours weekly. Download our free *State of HR Compliance 2026* report to see the exact frameworks they use.\n"
            "**Call-to-Action:** Download Report\n\n"
            "**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**."
        )
    },
    {
        "id": "ecommerce-stage3",
        "language": "vi",
        "user": "Chiến dịch bán giày thể thao trên Facebook đang chạy. CTR là 2.5% (khá tốt), nhưng CVR (tỉ lệ chuyển đổi trên web) chỉ có 0.4%. Doanh thu đang lỗ (ROAS 0.6x). Giúp tôi Stage 3 Optimization.",
        "assistant": (
            "# Optimization Report (Stage 3)\n\n"
            "Dựa trên các chỉ số bạn cung cấp, chiến dịch bán giày thể thao đang gặp vấn đề nghiêm trọng ở **Middle/Bottom of Funnel (Tỉ lệ chuyển đổi trên website)**. \n"
            "Chỉ số CTR 2.5% chứng tỏ quảng cáo (Creative/Angle) của bạn rất hấp dẫn và thu hút đúng đối tượng click vào. Tuy nhiên, CVR 0.4% là mức cực kỳ thấp đối với e-commerce (mức chuẩn phải từ 1.5% - 2.5%). Tức là khách hàng vào web nhưng bỏ đi không mua, dẫn đến ROAS lỗ.\n\n"
            "## Optimization Proposals (Hành động ngay lập tức):\n"
            "1. **Tối ưu Tốc độ tải trang & UI Mobile:** Khách hàng click từ Facebook đa số dùng Mobile. Nếu web load chậm hơn 3 giây hoặc nút 'Thêm vào giỏ hàng' bị khuất, họ sẽ thoát ngay. Hãy kiểm tra tốc độ bằng Google PageSpeed Insights.\n"
            "2. **Kiểm tra Lại Phễu Thanh Toán (Checkout Flow):** Có phải phí ship quá cao không hiện rõ từ đầu? Có bắt tạo tài khoản mới được mua không? Hãy thêm tuỳ chọn 'Freeship cho đơn hàng đầu tiên' và 'Checkout không cần đăng nhập' (Guest Checkout).\n"
            "3. **Kích hoạt Retargeting & Abandoned Cart Email:** Ngay lập tức tạo chiến dịch Retargeting trên Facebook nhắm vào những người đã Add To Cart nhưng chưa thanh toán trong 3 ngày qua, tặng họ mã giảm giá 10% chốt sale gấp.\n\n"
            "Hãy thực hiện 3 bước này, đo lường lại CVR sau 3 ngày và cập nhật lại số liệu cho tôi!"
        )
    }
]


def build_few_shot_examples(limit: int = 3) -> str:
    """Build compact few-shot block for Gemini prompts."""
    selected = EXAMPLE_PROMPTS[: max(1, limit)]
    lines: list[str] = ["# REFERENCE EXAMPLES (FEW-SHOT LEARNING):"]
    lines.append("Analyze these examples to understand the expected tone, structure, and tag usage.\n")

    for item in selected:
        lines.append(f"--- Example: {item['id']} ({item['language']}) ---")
        lines.append(f"USER INPUT:\n{item['user']}\n")
        lines.append(f"ASSISTANT OUTPUT:\n{item['assistant']}\n")

    lines.append("")
    return "\n".join(lines)
