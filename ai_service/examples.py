"""Reusable prompt examples for few-shot context in AdVisor AI service."""

from __future__ import annotations

from typing import Any

EXAMPLE_PROMPTS: list[dict[str, Any]] = [
    {
        "id": "startup-social-launch",
        "language": "en",
        "user": "I run a skincare startup. Budget is $1500/month. Suggest a 30-day launch plan.",
        "assistant": (
            "Focus on short-form video + creator seeding + conversion landing page. "
            "Week 1: positioning and 6 hooks. Week 2: creator outreach and UGC. "
            "Week 3: paid retargeting. Week 4: optimize by CAC and retention cohort."
        )
    },
    {
        "id": "local-fnb-vietnam",
        "language": "vi",
        "user": "Toi co quan ca phe tai HCM, ngan sach 20 trieu/thang. Nen chay kenh nao?",
        "assistant": (
            "Uu tien TikTok + Facebook + Google Maps. 40% noi dung video ngan, "
            "35% ads quanh ban kinh 3km, 25% CRM quay lai. KPI: luot den quan, "
            "ti le quay lai, doanh thu gio cao diem."
        )
    },
    {
        "id": "b2b-saas-leadgen",
        "language": "en",
        "user": "Our B2B SaaS needs pipeline growth. What should we do first?",
        "assistant": (
            "Start with ICP clarity, then build one high-intent offer and one authority asset. "
            "Run LinkedIn + search capture, route traffic to a focused demo funnel, "
            "and score leads by fit + intent before SDR outreach."
        )
    },
    {
        "id": "ecommerce-retention",
        "language": "vi",
        "user": "Shop online cua toi co don moi tot nhung mua lai thap, can cai thien gi?",
        "assistant": (
            "Tap trung retention: flow email/SMS sau mua, uu dai cho don thu 2, "
            "bundle theo hanh vi mua. KPI chinh: repeat rate 30-60-90 ngay, AOV, LTV."
        )
    }
]


def build_few_shot_examples(limit: int = 3) -> str:
    """Build compact few-shot block for Gemini prompts."""
    selected = EXAMPLE_PROMPTS[: max(1, limit)]
    lines: list[str] = ["Reference examples:"]

    for item in selected:
        lines.append(f"- Example {item['id']} ({item['language']}):")
        lines.append(f"  User: {item['user']}")
        lines.append(f"  Assistant: {item['assistant']}")

    lines.append("")
    return "\n".join(lines)
