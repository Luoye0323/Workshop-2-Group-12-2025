#!/usr/bin/env python3
"""
Convert SVG to PNG with transparency preservation using svglib and reportlab
"""
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

# Load SVG
drawing = svg2rlg("public/ipetro-logo.svg")

# Convert to PNG with transparency
renderPM.drawToFile(
    drawing, "public/ipetro-logo.svg.png", fmt="PNG", bg=0x00000000
)  # Transparent background

print(
    "Converted public/ipetro-logo.svg to public/ipetro-logo.svg.png with transparency preserved"
)
