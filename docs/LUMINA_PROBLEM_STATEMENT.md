# Lumina: Problem Statement & Solution Overview

## 1. Concise Problem Statement

**STEM students frequently struggle to grasp abstract concepts because they lack access to personalized, visual explanations.** While text-based AI can explain *theory* and pre-recorded videos can show *general examples*, there exists no scalable technology to generate **custom, on-demand animated visualizations** for specific student questions in real-time.

---

## 2. The Core Challenge: "The Visualization Gap"

In fields like Physics, Calculus, and Chemistry, understanding requires bridging the gap between **symbolic representation** (formulas, code) and **geometric intuition** (movement, shapes, interactions).

### Current Limitations
| Resource | Limitation |
|----------|------------|
| **Textbooks / PDFs** | Static images; cannot show motion or change over time. |
| **Video Platforms** (YouTube, Khan Academy) | **Passive & Generic.** A student asking about "projectile motion *with* wind resistance" has to watch a generic video about "projectile motion" and mentally adjust. |
| **LLM Chatbots** (ChatGPT, Claude) | **Text-Heavy.** They excel at generating text and code but fail to produce accurate, verifiable visual diagrams or animations. |
| **Human Tutors** | **Scarce & Expensive.** The only current way to get a custom visual explanation is to have a human draw it on a whiteboard. |

### The Technical Bottleneck
Creating high-quality educational animations (using tools like Adobe After Effects or Python libraries) is **prohibitively difficult and time-consuming** for educators. A 10-second animation explaining a concept often takes hours to script and render.

---

## 3. The Lumina Solution

Lumina is an **autonomous multi-stage AI agent** designed to democratize access to high-quality visual education. It solves the visualization gap by automating the entire pipeline of educational content creation.

### How It Works
Instead of retrieving a pre-made video, Lumina **generates a new one from scratch** in seconds:

1.  **Intent Understanding:** Parses the student's specific query (e.g., "Show me how a sine wave relates to a unit circle").
2.  **Visual Planning:** An LLM reasoning engine designs a scene specification.
3.  **Code Generation:** Writes executable Python code using the **Manim** (Mathematical Animation) engine.
4.  **Real-Time Rendering:** Executes the code in a sandboxed environment to produce an MP4 video.
5.  **Delivery:** Streams the custom animation directly to the student's workspace.

### Key Differentiator
Lumina shifts educational content from **Static/Retrieval-based** to **Dynamic/Generative**.

*   **Old Way:** Search for a video that *might* answer the question.
*   **Lumina Way:** Ask a question, *get* a video generated specifically for that question.
