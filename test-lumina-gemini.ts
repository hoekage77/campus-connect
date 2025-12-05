/**
 * Test script for Lumina pipeline with Gemini + Xera integration
 * Run with: tsx test-lumina-gemini.ts
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { getLuminaOrchestrator } from "./services/LuminaOrchestrator"

async function testLuminaPipeline() {
  console.log("🧪 Testing Lumina Full Pipeline...\n")
  console.log("📋 Configuration:")
  console.log(`  - Gemini API: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing"}`)
  console.log(`  - Daytona: ${process.env.DAYTONA_API_KEY ? "✅ Configured (sandbox rendering)" : "⚠️  Not configured (local rendering)"}`)
  console.log(`  - Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configured" : "❌ Missing"}`)
  console.log()

  const orchestrator = getLuminaOrchestrator()
  const testQuery = "Explain projectile motion"

  try {
    // Create agent run
    console.log(`📝 Creating agent run for query: "${testQuery}"`)
    const run = await orchestrator.createRun("test_user", testQuery, "explain")
    console.log(`✅ Run created: ${run.id}\n`)

    // Execute run and stream events
    console.log("🚀 Executing pipeline stages:\n")
    
    let currentStage = ""
    
    for await (const event of orchestrator.executeRun(run.id)) {
      switch (event.type) {
        case "stage":
          currentStage = event.stage
          const stageLabels: Record<string, string> = {
            query_processing: "Query Processing (Gemini)",
            lesson_planning: "Lesson Planning (Gemini)",
            script_generation: "Script Generation (Gemini)",
            animation_synthesis: process.env.DAYTONA_API_KEY 
              ? "Animation Synthesis (Daytona Sandbox)" 
              : "Animation Synthesis (Local Manim)",
            optimization: "Optimization",
          }
          console.log(`\n  🔹 ${stageLabels[event.stage] || event.stage}`)
          break
        case "token":
          process.stdout.write(event.content)
          break
        case "visual-plan":
          console.log(`\n\n  🎨 Visual plan generated:`)
          console.log(`     Scene: ${event.plan.scene}`)
          console.log(`     Concept: ${event.plan.spec.concept}`)
          if (Object.keys(event.plan.spec.parameters || {}).length > 0) {
            console.log(`     Parameters:`, event.plan.spec.parameters)
          }
          break
        case "done":
          console.log("\n\n✅ Pipeline completed!")
          if (event.video_url) {
            console.log(`\n🎬 Video URL: ${event.video_url}`)
          }
          if (event.result) {
            console.log("\n📊 Final result:")
            console.log(`   Answer length: ${event.result.answer?.length || 0} chars`)
            console.log(`   Video: ${event.result.videoUrl ? "✅ Generated" : "❌ Not available"}`)
            console.log(`   Visual plan: ${event.result.visualPlan ? "✅ Available" : "❌ Not available"}`)
          }
          break
        case "error":
          console.error(`\n\n❌ Error in ${currentStage}: ${event.error}`)
          break
      }
    }
    
    console.log("\n\n✨ Test completed successfully!")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  }
}

testLuminaPipeline()
