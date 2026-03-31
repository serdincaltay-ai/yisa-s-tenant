"use client"

import { useEffect, useRef } from "react"

interface Orb {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  color: string
  opacity: number
}

export function AnimatedOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create orbs
    const colors = [
      "rgba(245, 158, 11, 0.6)", // Primary amber
      "rgba(139, 92, 246, 0.5)", // Accent purple
      "rgba(59, 130, 246, 0.4)", // Blue
      "rgba(245, 158, 11, 0.3)", // Lighter amber
      "rgba(168, 85, 247, 0.4)", // Purple variant
    ]

    const orbs: Orb[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 150 + 80,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.2,
    }))

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bgGradient.addColorStop(0, "hsl(222, 47%, 6%)")
      bgGradient.addColorStop(1, "hsl(222, 47%, 4%)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw orbs
      orbs.forEach((orb) => {
        // Update position
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off edges with smooth transition
        if (orb.x - orb.radius < 0 || orb.x + orb.radius > canvas.width) {
          orb.vx *= -1
        }
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > canvas.height) {
          orb.vy *= -1
        }

        // Draw orb with radial gradient
        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        )
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      // Add subtle blur effect overlay
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ filter: "blur(60px)" }}
    />
  )
}
