from manim import *
import numpy as np

class LuminaDemoAnimation(Scene):
    def construct(self):
        # Title
        title = Text("Lumina AI Tutoring", font_size=48, color=BLUE)
        subtitle = Text("Interactive STEM Learning", font_size=24, color=GRAY)

        # Position title
        title.to_edge(UP)
        subtitle.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(subtitle))
        self.wait(1)

        # Create coordinate system
        axes = Axes(
            x_range=[-1, 10, 1],
            y_range=[-1, 6, 1],
            axis_config={"color": WHITE},
            x_length=8,
            y_length=6
        )

        # Simple text labels (no LaTeX)
        x_label = Text("Time", font_size=24).next_to(axes.x_axis, DOWN)
        y_label = Text("Height", font_size=24).next_to(axes.y_axis, LEFT).rotate(PI/2)

        self.play(Create(axes), Write(x_label), Write(y_label))
        self.wait(0.5)

        # Projectile motion equation: y = -0.5*g*t^2 + v0*t
        # Parameters
        g = 9.8  # gravity
        v0 = 8   # initial velocity
        angle = 45  # degrees

        # Convert to components
        v0x = v0 * np.cos(np.radians(angle))
        v0y = v0 * np.sin(np.radians(angle))

        # Time points
        t_max = 2 * v0y / g
        t_points = np.linspace(0, t_max, 50)

        # Calculate trajectory
        x_points = v0x * t_points
        y_points = v0y * t_points - 0.5 * g * t_points**2

        # Create the trajectory path
        trajectory = VMobject()
        trajectory.set_points_smoothly([
            axes.coords_to_point(x, y) for x, y in zip(x_points, y_points)
        ])
        trajectory.set_color(YELLOW)

        # Create projectile dot
        projectile = Dot(color=RED, radius=0.1)
        projectile.move_to(axes.coords_to_point(0, 0))

        # Animation
        self.play(Create(trajectory), run_time=2)

        # Move projectile along path
        self.play(
            MoveAlongPath(projectile, trajectory),
            rate_func=linear,
            run_time=3
        )

        # Add explanation text (no LaTeX)
        explanation = Text(
            "Projectile motion under gravity",
            font_size=28,
            color=GREEN
        ).to_edge(DOWN)

        equation = Text(
            "y = v*t*sin(theta) - 0.5*g*t^2",
            font_size=24,
            color=BLUE
        ).next_to(explanation, UP)

        self.play(Write(explanation))
        self.play(Write(equation))

        # Highlight key points
        max_height_time = v0y / g
        max_height_x = v0x * max_height_time
        max_height_y = v0y**2 / (2 * g)

        max_point = Dot(
            axes.coords_to_point(max_height_x, max_height_y),
            color=PURPLE,
            radius=0.15
        )

        max_label = Text("Max Height", font_size=20, color=PURPLE)
        max_label.next_to(max_point, RIGHT)

        self.play(Create(max_point), Write(max_label))

        # Final message
        final_text = Text(
            "Interactive learning with Lumina AI",
            font_size=32,
            color=BLUE
        ).move_to(ORIGIN)

        self.play(
            FadeOut(trajectory),
            FadeOut(projectile),
            FadeOut(max_point),
            FadeOut(max_label),
            FadeOut(equation),
            FadeOut(explanation),
            FadeOut(axes),
            FadeOut(x_label),
            FadeOut(y_label)
        )

        self.play(Write(final_text))
        self.wait(2)

        # Fade out everything
        self.play(FadeOut(title), FadeOut(subtitle), FadeOut(final_text))