/**
 * Test script to verify Vercel AI SDK integration with Lumina
 * Run with: npx ts-node test-vercel-ai-integration.ts
 */

import { GeminiClient, getGeminiClient } from "./services/GeminiClient"
import type {
  QueryProcessingOutput,
  LessonPlanningOutput,
  ScriptGenerationOutput,
} from "./types/lumina"

async function testGeminiClientIntegration() {
  console.log("🧪 Testing Vercel AI SDK Integration with Lumina\n")

  try {
    // Test 1: Initialize client
    console.log("✓ Test 1: Initializing GeminiClient...")
    const client = getGeminiClient((stage, attempt, delay) => {
      console.log(
        `  [Retry] Stage: ${stage}, Attempt: ${attempt}, Delay: ${delay}ms`
      )
    })
    console.log("  ✅ GeminiClient initialized successfully\n")

    // Test 2: Query Processing
    console.log("✓ Test 2: Testing Query Processing Stage...")
    const testQuery = "Why is the sky blue?"
    const queryOutput = await client.processQuery(testQuery, "explain")
    console.log("  ✅ Query Processing completed")
    console.log("     Concepts:", queryOutput.concepts)
    console.log("     Audience:", queryOutput.audience)
    console.log("     Goal:", queryOutput.goal)
    console.log("     Tone:", queryOutput.tone, "\n")

    // Test 3: Lesson Planning
    console.log("✓ Test 3: Testing Lesson Planning Stage...")
    const lessonOutput = await client.planLesson(testQuery, queryOutput)
    console.log("  ✅ Lesson Planning completed")
    console.log("     Hook:", lessonOutput.narrative.hook)
    console.log("     Steps:", lessonOutput.narrative.steps.length)
    console.log("     Visual Scenes:", lessonOutput.visual_strategy.scenes.length, "\n")

    // Test 4: Script Generation
    console.log("✓ Test 4: Testing Script Generation Stage...")
    const scriptOutput = await client.generateScript(
      testQuery,
      lessonOutput,
      queryOutput
    )
    console.log("  ✅ Script Generation completed")
    console.log("     Concept:", scriptOutput.manim_spec.concept)
    console.log("     Scenes:", scriptOutput.manim_spec.scenes.length, "\n")

    // Test 5: Streaming explanation
    console.log("✓ Test 5: Testing Explanation Streaming...")
    const streamPrompt = "Briefly explain why the sky is blue"
    let streamedText = ""
    for await (const chunk of client.streamExplanation(streamPrompt)) {
      streamedText += chunk
      process.stdout.write(".")
    }
    console.log("\n  ✅ Streaming completed")
    console.log("     Total characters:", streamedText.length, "\n")

    console.log("✅ All integration tests passed!")
    return true
  } catch (error) {
    console.error("❌ Integration test failed:", error)
    return false
  }
}

// Run tests
testGeminiClientIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("Test execution failed:", error)
    process.exit(1)
  })
