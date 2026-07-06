"""Helper functions for AI prompts."""

def get_stage_instructions(phase: str) -> str:
    """Get stage-specific instructions for the AI prompt."""
    if phase == "1":
        return """You are currently in Stage 1 (Strategy Formulation). 
MANDATORY: You MUST provide 2 to 4 selectable plan options depending on what fits best using the [PLAN_A], [PLAN_B], etc. tags.

CRITICAL FORMATTING RULES:
1. FIRST, write a comprehensive 2-3 paragraph analysis of the user's business based on their quiz inputs. Evaluate their market, audience, and potential challenges.
2. SECOND, you MUST provide the plans inside exactly ONE [PLAN_OPTIONS] block.
3. EACH PLAN MUST BE WRAPPED IN [PLAN_X] AND [/PLAN_X] TAGS.
4. DO NOT USE "Plan 1", "Plan 2". USE "[PLAN_A]", "[PLAN_B]", "[PLAN_C]".
5. Make sure the plans are distinct (e.g., Aggressive Paid Ads vs Organic Content vs Balanced).
6. When showing structured comparisons, use valid markdown tables (| col | col |), not plain-text pseudo tables.
7. Example of required format:
Here is my analysis of your business...

**[PLAN_OPTIONS]**
[PLAN_A]
**Plan A: <Title>**
| Category | Detail |
| :--- | :--- |
| ... | ... |
[/PLAN_A]
[PLAN_B]
...
[/PLAN_B]
[/PLAN_OPTIONS]

If you do not include these tags, the user CANNOT select a plan and CANNOT move to the next stage. YOUR RESPONSE IS USELESS WITHOUT THESE TAGS."""

    elif phase == "2":
        return """You are currently in Stage 2 (Execution Plan).
IMPORTANT INSTRUCTIONS:
1. Provide a HIGHLY DETAILED execution plan based on the user's chosen strategy. You are a top-tier Marketing Director. Break down the channel strategy, week-by-week timeline, milestones, and budget allocation.
2. CONTENT GENERATION: You MUST generate at least 2 specific pieces of content (e.g., a Facebook Ad copy, an Email Newsletter draft, or a TikTok video script) based on the strategy. Label them clearly with headings like "### Content Draft: Facebook Ad". This is critical for the AI Content Writer to process.
3. Use proper markdown tables for timeline, KPIs, and budget split where useful.
4. Explain the psychological triggers and why this strategy will convert.
5. If quizData includes Stage 2 targets (deadline, target_ctr, target_cvr, target_roas), include a "Target KPI Benchmarks" table and explicitly reference these targets in your recommendations.
6. If latestMetrics are available, include a concise "Target vs Actual" table comparing actual values to target benchmarks.
7. At the very end of your response, you MUST include this exact string to allow the user to transition to Stage 3:
**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**."""

    elif phase == "3":
        return """You are currently in Stage 3 (Ongoing Optimization).
IMPORTANT INSTRUCTIONS:
1. Analyze any metrics snapshots provided. Give a highly detailed breakdown of performance, identify bottlenecks, and suggest concrete optimizations (e.g., budget shifts, new creatives). Provide deep reasoning for your suggestions."""

    return ""

def append_fallback_tags_if_missing(text: str, phase: str) -> str:
    """Ensure essential tags are present in the AI response."""
    if phase == "1" and "[PLAN_OPTIONS]" not in text:
        fallback = """

**[PLAN_OPTIONS]**
[PLAN_A]
**Plan A: Growth Accelerator**
- Focus: Rapid acquisition with paid channels
- Budget mix: 70% Paid, 20% Content, 10% Email
- Timeline: 3 months
- Best for: Fast results
[/PLAN_A]
[PLAN_B]
**Plan B: Organic Builder**
- Focus: Content, community, and long-term trust
- Budget mix: 30% Paid, 50% Content, 20% Community
- Timeline: 6 months
- Best for: Low-cost, steady growth
[/PLAN_B]
[PLAN_C]
**Plan C: Hybrid Strategy**
- Focus: Balanced paid and organic growth
- Budget mix: 50% Paid, 30% Content, 20% Email/Community
- Timeline: 4 months
- Best for: Balanced risk and ROI
[/PLAN_C]
[/PLAN_OPTIONS]"""
        return text + fallback
        
    elif phase == "2" and "[STAGE_TRANSITION]" not in text:
        fallback = "\n\n**[STAGE_TRANSITION]** You have completed Stage 2! You can now move to **Stage 3: Ongoing Optimization**."
        return text + fallback
        
    return text
