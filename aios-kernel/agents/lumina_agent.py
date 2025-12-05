"""
Lumina Agent for AIOS

Implements the 5-stage STEM tutoring pipeline as an AIOS agent:
1. Query Processing
2. Lesson Planning
3. Script Generation
4. Animation Synthesis
5. Optimization
"""

from typing import AsyncGenerator, Dict, Any, Optional
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime


class QueryProcessingOutput(BaseModel):
    """Stage 1: Query analysis output"""
    concepts: list[str]
    audience: str
    goal: str
    tone: str
    prerequisites: list[str]


class LessonPlanningOutput(BaseModel):
    """Stage 2: Lesson design output"""
    narrative: Dict[str, Any]
    visual_strategy: Dict[str, Any]


class ScriptGenerationOutput(BaseModel):
    """Stage 3: Manim script output"""
    manim_spec: Dict[str, Any]


class AnimationSynthesisOutput(BaseModel):
    """Stage 4: Animation rendering output"""
    visual_plan: Dict[str, Any]
    video_path: Optional[str] = None


class OptimizationOutput(BaseModel):
    """Stage 5: Final optimization output"""
    optimized_answer: str
    video_url: str
    thumbnail_url: Optional[str] = None


class LuminaAgentState(BaseModel):
    """Lumina agent execution state for checkpointing"""
    run_id: str
    user_id: str
    query: str
    mode: str
    status: str  # pending, processing, completed, failed
    stages_completed: list[str] = []
    stages_failed: list[str] = []
    outputs: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    errors: list[str] = []


class LuminaAgent:
    """
    Lumina STEM Tutoring Agent for AIOS
    
    Orchestrates the complete tutoring pipeline with:
    - Stage checkpointing for resume capability
    - Resource allocation via AIOS scheduler
    - Event streaming for real-time UI updates
    - Retry logic with exponential backoff
    """

    def __init__(self, aios_kernel):
        """Initialize agent with AIOS kernel reference"""
        self.kernel = aios_kernel
        self.llm_core = aios_kernel.llm_core
        self.memory_manager = aios_kernel.memory_manager
        self.storage_manager = aios_kernel.storage_manager
        self.tool_manager = aios_kernel.tool_manager
        self.max_retries = 3
        self.base_delay = 1.0  # seconds

    async def execute(
        self,
        user_id: str,
        query: str,
        mode: str = "explain",
        resume_from: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute the Lumina tutoring pipeline

        Yields events for real-time UI updates:
        - stage: indicates stage start/completion
        - stage_output: contains structured output
        - retry: indicates retry attempt
        - error: error occurred
        - done: pipeline complete
        """

        # Create or resume agent state
        run_id = f"lumina_{user_id}_{int(datetime.now().timestamp())}"
        state = LuminaAgentState(
            run_id=run_id,
            user_id=user_id,
            query=query,
            mode=mode,
            status="processing",
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        # Store state in AIOS memory
        await self.memory_manager.write(f"lumina_run_{run_id}", state.dict())

        try:
            # Stage 1: Query Processing
            if not resume_from or resume_from == "start":
                yield {"type": "stage", "stage": "query_processing"}

                query_output = await self._execute_query_processing(
                    query, mode, state
                )
                state.outputs["query_processing"] = query_output.dict()
                state.stages_completed.append("query_processing")

                yield {
                    "type": "stage_output",
                    "stage": "query_processing",
                    "output": query_output.dict(),
                }
            else:
                # Resume: load from checkpoint
                query_output = QueryProcessingOutput(
                    **state.outputs.get("query_processing", {})
                )
                yield {"type": "stage", "stage": "query_processing", "status": "skipped"}

            # Stage 2: Lesson Planning
            if "lesson_planning" not in state.stages_completed:
                yield {"type": "stage", "stage": "lesson_planning"}

                lesson_output = await self._execute_lesson_planning(
                    query, query_output, state
                )
                state.outputs["lesson_planning"] = lesson_output.dict()
                state.stages_completed.append("lesson_planning")

                yield {
                    "type": "stage_output",
                    "stage": "lesson_planning",
                    "output": lesson_output.dict(),
                }
            else:
                lesson_output = LessonPlanningOutput(
                    **state.outputs.get("lesson_planning", {})
                )
                yield {"type": "stage", "stage": "lesson_planning", "status": "skipped"}

            # Stage 3: Script Generation
            if "script_generation" not in state.stages_completed:
                yield {"type": "stage", "stage": "script_generation"}

                script_output = await self._execute_script_generation(
                    query, lesson_output, query_output, state
                )
                state.outputs["script_generation"] = script_output.dict()
                state.stages_completed.append("script_generation")

                yield {
                    "type": "stage_output",
                    "stage": "script_generation",
                    "output": script_output.dict(),
                }
            else:
                script_output = ScriptGenerationOutput(
                    **state.outputs.get("script_generation", {})
                )
                yield {"type": "stage", "stage": "script_generation", "status": "skipped"}

            # Stage 4: Animation Synthesis (via Tool Manager)
            if "animation_synthesis" not in state.stages_completed:
                yield {"type": "stage", "stage": "animation_synthesis"}

                animation_output = await self._execute_animation_synthesis(
                    script_output, state
                )
                state.outputs["animation_synthesis"] = animation_output.dict()
                state.stages_completed.append("animation_synthesis")

                yield {
                    "type": "stage_output",
                    "stage": "animation_synthesis",
                    "output": animation_output.dict(),
                }
            else:
                animation_output = AnimationSynthesisOutput(
                    **state.outputs.get("animation_synthesis", {})
                )
                yield {"type": "stage", "stage": "animation_synthesis", "status": "skipped"}

            # Stage 5: Optimization
            if "optimization" not in state.stages_completed:
                yield {"type": "stage", "stage": "optimization"}

                optimization_output = await self._execute_optimization(
                    animation_output, query_output, state
                )
                state.outputs["optimization"] = optimization_output.dict()
                state.stages_completed.append("optimization")

                yield {
                    "type": "stage_output",
                    "stage": "optimization",
                    "output": optimization_output.dict(),
                }
            else:
                optimization_output = OptimizationOutput(
                    **state.outputs.get("optimization", {})
                )
                yield {"type": "stage", "stage": "optimization", "status": "skipped"}

            # Pipeline complete
            state.status = "completed"
            state.updated_at = datetime.now()
            await self.memory_manager.write(f"lumina_run_{run_id}", state.dict())

            yield {
                "type": "done",
                "run_id": run_id,
                "video_url": optimization_output.video_url,
                "result": {
                    "answer": optimization_output.optimized_answer,
                    "video_url": optimization_output.video_url,
                },
            }

        except Exception as e:
            state.status = "failed"
            state.errors.append(str(e))
            state.updated_at = datetime.now()
            await self.memory_manager.write(f"lumina_run_{run_id}", state.dict())

            yield {
                "type": "error",
                "message": str(e),
                "run_id": run_id,
            }

    async def _execute_query_processing(
        self, query: str, mode: str, state: LuminaAgentState
    ) -> QueryProcessingOutput:
        """Stage 1: Process query via LLM"""

        prompt = f"""You are a STEM tutoring assistant analyzing student questions.

Student query: "{query}"
Mode: {mode}

Analyze this query and extract:
1. Concepts: array of mathematical/scientific concepts involved
2. Audience: education level (middle_school, high_school, undergraduate, graduate)
3. Goal: one-sentence pedagogical goal
4. Tone: communication style (exploratory, formal, enthusiastic)
5. Prerequisites: array of prerequisite concepts

Return only valid JSON."""

        # Call LLM via AIOS kernel with retry
        response = await self._call_llm_with_retry(prompt, "Query Processing", state)

        try:
            data = json.loads(response)
            return QueryProcessingOutput(**data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse query processing output: {response}") from e

    async def _execute_lesson_planning(
        self,
        query: str,
        query_output: QueryProcessingOutput,
        state: LuminaAgentState,
    ) -> LessonPlanningOutput:
        """Stage 2: Design lesson via LLM"""

        prompt = f"""You are a mathematical educator inspired by 3Blue1Brown, designing a visual lesson.

Student query: "{query}"
Concepts: {", ".join(query_output.concepts)}
Goal: {query_output.goal}
Audience: {query_output.audience}
Tone: {query_output.tone}

Design a 3-5 step lesson narrative where each step:
- Builds intuition before formulas
- Uses visual metaphors and geometric reasoning
- Leads to a clear insight

Return JSON with structure:
{{
  "narrative": {{
    "hook": "Curiosity question",
    "steps": [{{"title": "...", "explanation": "...", "visual_cue": "..."}}],
    "conclusion": "Summary"
  }},
  "visual_strategy": {{
    "scenes": [{{"id": "...", "description": "...", "duration": 5}}]
  }}
}}"""

        response = await self._call_llm_with_retry(
            prompt, "Lesson Planning", state
        )

        try:
            data = json.loads(response)
            return LessonPlanningOutput(**data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse lesson planning output: {response}") from e

    async def _execute_script_generation(
        self,
        query: str,
        lesson_output: LessonPlanningOutput,
        query_output: QueryProcessingOutput,
        state: LuminaAgentState,
    ) -> ScriptGenerationOutput:
        """Stage 3: Generate Manim script via LLM"""

        prompt = f"""You are a Manim animation designer creating visual specifications.

Concept: {query_output.concepts[0] if query_output.concepts else "general"}
Visual scenes: {json.dumps(lesson_output.visual_strategy.get("scenes", []))}

Create a Manim specification describing objects, animations, and parameters.

Return JSON with Manim spec for animation rendering."""

        response = await self._call_llm_with_retry(
            prompt, "Script Generation", state
        )

        try:
            data = json.loads(response)
            return ScriptGenerationOutput(manim_spec=data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse script generation output: {response}") from e

    async def _execute_animation_synthesis(
        self, script_output: ScriptGenerationOutput, state: LuminaAgentState
    ) -> AnimationSynthesisOutput:
        """Stage 4: Render animation via Tool Manager (Manim + Daytona)"""

        # Call Manim renderer tool via AIOS tool manager
        result = await self.tool_manager.execute_tool(
            "manim_renderer",
            {
                "manim_spec": script_output.manim_spec,
                "format": "mp4",
            },
        )

        return AnimationSynthesisOutput(
            visual_plan={"scene": "animation", "spec": script_output.manim_spec},
            video_path=result.get("video_path"),
        )

    async def _execute_optimization(
        self,
        animation_output: AnimationSynthesisOutput,
        query_output: QueryProcessingOutput,
        state: LuminaAgentState,
    ) -> OptimizationOutput:
        """Stage 5: Final optimization and answer generation"""

        # Upload video to storage
        video_url = await self.storage_manager.upload_file(
            animation_output.video_path, f"videos/{state.run_id}.mp4"
        )

        return OptimizationOutput(
            optimized_answer="Visual explanation complete. See video for animated walkthrough.",
            video_url=video_url,
        )

    async def _call_llm_with_retry(
        self, prompt: str, context: str, state: LuminaAgentState
    ) -> str:
        """Call LLM with retry logic"""

        for attempt in range(self.max_retries):
            try:
                # Use AIOS LLM core
                response = await self.llm_core.generate(
                    model="gemini-2.0-flash-exp",
                    prompt=prompt,
                    max_tokens=2048,
                )
                return response.text

            except Exception as e:
                error_msg = str(e)

                # Check if retryable
                if "429" in error_msg or "quota" in error_msg:
                    if attempt < self.max_retries - 1:
                        delay = self.base_delay * (2 ** attempt)
                        print(f"[{context}] Rate limit, retrying in {delay}s...")
                        await asyncio.sleep(delay)
                        continue

                raise ValueError(
                    f"LLM call failed for {context}: {error_msg}"
                ) from e

        raise ValueError(f"Max retries exceeded for {context}")


def create_lumina_agent(aios_kernel):
    """Factory function to create Lumina agent instance"""
    return LuminaAgent(aios_kernel)
