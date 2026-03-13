# Scientific Calculator

A modern, responsive web-based calculator built with **React**, **Tailwind CSS**, and **Express**.

## Features
- **Advanced Scientific Functions**: 
  - **Logarithms**: Base-10 (`log₁₀`) and Natural Log (`ln`).
  - **Exponential**: Base-e exponential (`eˣ`).
  - **Absolute Value**: Magnitude of a number (`|x|`).
  - **Rounding**: Round up (`ceil`) and round down (`floor`).
  - **Trigonometry**: Sine, Cosine, Tangent (in degrees), plus Inverse and Hyperbolic variants.
  - **Other**: Square Root (√), Power (xʸ), Factorial (n!), and Percentage (%).
- **Parentheses Support**: Switch to **Manual Expression Mode** (parentheses icon) to evaluate complex expressions like `(2 + 3) * 4`.
- **Theme Toggle**: Switch between **Light** and **Dark** modes for comfortable use in any environment.
- **Copy to Clipboard**: One-click copying of results to your clipboard.
- **Subtle Feedback**: Added hover effects and active state scaling to all buttons for a tactile feel.
- **Clear History**: Easily clear your calculation history with the trash icon in the sidebar.
- **Custom Color Palette**: Implemented using specific professional colors:
  - Background: `#F7F8FA` (Light) / `#0F172A` (Dark)
  - Text: `#1F2933` (Light) / `#F8FAFC` (Dark)
  - Accent: `#3B82F6` (Blue)
  - Secondary: `#64748B` (Slate)
  - Card: `#FFFFFF` (Light) / `#1E293B` (Dark)

## New Features
- **Scientific Functions**: Added support for Square Root (√), Power (xʸ), Sine (sin), Cosine (cos), and Tangent (tan).
- **Calculation History**: View your last 10 calculations in a dedicated sidebar. History is persisted in-memory on the server.
- **Keyboard Support**:
  - `Enter`: Trigger calculation.
  - `Escape`: Reset all fields and focus first input.
  - `+`, `-`, `*`, `/`, `^`: Select corresponding operations.
  - `0-9`: Auto-focus inputs if not already typing.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Lucide React (Icons), Motion (Animations).
- **Backend**: Express (Node.js).
- **Build Tool**: Vite.

## How to Use
1. Enter the first number.
2. Select an operation.
3. Enter the second number.
4. Click "Calculate Result".
5. Use the reset icon in the header to clear all fields.
