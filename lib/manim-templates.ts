/**
 * Manim Script Templates Library
 * 
 * Pre-built templates for common educational topics.
 * These can be used for fast rendering (Tier 1 strategy).
 */

export const manimTemplates = {
  projectileMotion: (velocity = 20, angle = 45) => `from manim import *
import numpy as np

class ProjectileMotion(Scene):
    def construct(self):
        # Title
        title = Text("Projectile Motion", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.7))
        
        # Parameters
        v0 = ${velocity}  # m/s
        angle = ${angle}  # degrees
        g = 9.8  # m/s^2
        
        params = Text(f"v₀ = {v0} m/s, θ = {angle}°", font_size=32)
        params.next_to(title, DOWN)
        self.play(FadeIn(params))
        
        # Axes
        axes = Axes(
            x_range=[0, 50, 10],
            y_range=[0, 25, 5],
            x_length=8,
            y_length=4,
            tips=False,
        ).shift(DOWN * 0.5)
        
        labels = axes.get_axis_labels(x_label="Distance (m)", y_label="Height (m)")
        self.play(Create(axes), Write(labels))
        
        # Calculate trajectory
        t_max = 2 * v0 * np.sin(np.radians(angle)) / g
        
        def trajectory(t):
            x = v0 * np.cos(np.radians(angle)) * t
            y = v0 * np.sin(np.radians(angle)) * t - 0.5 * g * t**2
            return axes.c2p(x, max(0, y))
        
        # Draw path
        path = ParametricFunction(
            trajectory,
            t_range=[0, t_max],
            color=YELLOW,
        )
        
        ball = Dot(color=BLUE, radius=0.15).move_to(axes.c2p(0, 0))
        
        self.play(Create(path), run_time=1)
        self.play(MoveAlongPath(ball, path), run_time=3, rate_func=linear)
        self.wait(1)
`,

  electricField: (charge = 1) => `from manim import *
import numpy as np

class ElectricField(Scene):
    def construct(self):
        # Title
        title = Text("Electric Field", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.7))
        
        # Positive charge
        positive = Circle(radius=0.4, color=RED, fill_opacity=1)
        positive.move_to(LEFT * 2.5)
        pos_label = MathTex("+Q", color=WHITE).move_to(positive.get_center())
        
        # Negative charge
        negative = Circle(radius=0.4, color=BLUE, fill_opacity=1)
        negative.move_to(RIGHT * 2.5)
        neg_label = MathTex("-Q", color=WHITE).move_to(negative.get_center())
        
        self.play(Create(positive), Write(pos_label))
        self.play(Create(negative), Write(neg_label))
        
        # Field lines from positive
        field_lines = VGroup()
        num_lines = 12
        
        for i in range(num_lines):
            angle = i * 360 / num_lines
            rad = np.radians(angle)
            start = positive.get_center() + 0.4 * np.array([np.cos(rad), np.sin(rad), 0])
            end = start + 1.5 * np.array([np.cos(rad), np.sin(rad), 0])
            
            line = Arrow(start, end, color=YELLOW, buff=0, stroke_width=2, max_tip_length_to_length_ratio=0.15)
            field_lines.add(line)
        
        self.play(Create(field_lines, lag_ratio=0.05), run_time=2)
        self.wait(2)
`,

  quadraticFunction: (a = 1, b = -2, c = 1) => `from manim import *

class QuadraticFunction(Scene):
    def construct(self):
        # Title
        title = Text("Quadratic Function", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.7))
        
        # Equation
        equation = MathTex(f"y = {a}x^2 + {b}x + {c}", font_size=40)
        equation.next_to(title, DOWN)
        self.play(Write(equation))
        
        # Axes
        axes = Axes(
            x_range=[-4, 6, 1],
            y_range=[-2, 12, 2],
            x_length=8,
            y_length=5,
        ).shift(DOWN * 0.3)
        
        labels = axes.get_axis_labels()
        self.play(Create(axes), Write(labels))
        
        # Function
        graph = axes.plot(lambda x: ${a} * x**2 + ${b} * x + ${c}, color=BLUE)
        self.play(Create(graph), run_time=2)
        
        # Vertex
        vertex_x = -${b} / (2 * ${a})
        vertex_y = ${a} * vertex_x**2 + ${b} * vertex_x + ${c}
        vertex = Dot(axes.c2p(vertex_x, vertex_y), color=RED, radius=0.1)
        vertex_label = MathTex(f"({vertex_x:.1f}, {vertex_y:.1f})", font_size=28)
        vertex_label.next_to(vertex, DOWN + RIGHT, buff=0.2)
        
        self.play(FadeIn(vertex), Write(vertex_label))
        self.wait(2)
`,

  derivativeVisualization: () => `from manim import *

class DerivativeVisualization(Scene):
    def construct(self):
        # Title
        title = Text("Derivative: Rate of Change", font_size=44)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.6))
        
        # Function equation
        func_label = MathTex(r"f(x) = x^2", font_size=36)
        func_label.to_edge(UP).shift(DOWN * 0.8)
        self.play(Write(func_label))
        
        # Axes
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-1, 9, 2],
            x_length=7,
            y_length=4.5,
        ).shift(DOWN * 0.5)
        
        self.play(Create(axes))
        
        # Function
        func = axes.plot(lambda x: x**2, color=BLUE)
        self.play(Create(func), run_time=1.5)
        
        # Animated tangent line
        x_val = ValueTracker(-2)
        
        def get_tangent_line():
            x = x_val.get_value()
            slope = 2 * x  # derivative of x^2
            point = axes.c2p(x, x**2)
            
            line = Line(
                point + LEFT * 1.2 + DOWN * 1.2 * slope,
                point + RIGHT * 1.2 + UP * 1.2 * slope,
                color=YELLOW,
                stroke_width=3,
            )
            return line
        
        tangent = always_redraw(get_tangent_line)
        dot = always_redraw(lambda: Dot(axes.c2p(x_val.get_value(), x_val.get_value()**2), color=RED))
        
        self.play(FadeIn(dot), Create(tangent))
        self.play(x_val.animate.set_value(2), run_time=3, rate_func=smooth)
        self.wait(1)
`,

  newtonSecondLaw: (mass = 2, force = 10) => `from manim import *

class NewtonSecondLaw(Scene):
    def construct(self):
        # Title
        title = Text("Newton's Second Law", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.7))
        
        # Equation
        equation = MathTex(r"F = ma", font_size=60)
        self.play(Write(equation))
        self.wait(1)
        self.play(equation.animate.scale(0.6).to_edge(UP).shift(DOWN * 0.7))
        
        # Values
        values = MathTex(f"F = {force}N, \\\\, m = {mass}kg", font_size=36)
        values.next_to(equation, DOWN)
        self.play(Write(values))
        
        # Calculate acceleration
        acceleration = ${force} / ${mass}
        result = MathTex(f"a = {acceleration:.1f} \\\\, m/s^2", font_size=36, color=GREEN)
        result.next_to(values, DOWN)
        self.play(Write(result))
        
        # Visual demonstration
        box = Square(side_length=1.2, color=BLUE, fill_opacity=0.5).shift(DOWN * 1.5)
        box_label = Text(f"{mass}kg", font_size=28).move_to(box.get_center())
        
        arrow = Arrow(ORIGIN, RIGHT * 2, color=RED, stroke_width=6, max_tip_length_to_length_ratio=0.2)
        arrow.next_to(box, LEFT, buff=0.1)
        arrow_label = Text(f"{force}N", font_size=28, color=RED)
        arrow_label.next_to(arrow, UP, buff=0.1)
        
        self.play(Create(box), Write(box_label))
        self.play(Create(arrow), Write(arrow_label))
        
        # Show acceleration
        self.play(
            box.animate.shift(RIGHT * 4),
            box_label.animate.shift(RIGHT * 4),
            run_time=2,
            rate_func=rush_from
        )
        self.wait(1)
`,
}

export type TemplateKey = keyof typeof manimTemplates

export function getTemplate(key: TemplateKey, params?: Record<string, number>): string {
  const template = manimTemplates[key]
  if (!template) {
    throw new Error(`Template "${key}" not found`)
  }
  
  // Call template function with parameters
  if (typeof template === 'function') {
    return template(...Object.values(params || {}))
  }
  
  return template as string
}
