'use client'

import { useEffect, useState } from 'react'

// Black sketch-style SVG drawings
const sketchDoodles = [
  // Lightbulb
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M25 5C15 5 8 12 8 22C8 28 12 33 18 36L18 42L32 42L32 36C38 33 42 28 42 22C42 12 35 5 25 5"/><path d="M18 45L32 45"/><path d="M20 48L30 48"/></svg>',
  // Book
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 8C5 8 15 5 25 8C35 5 45 8 45 8L45 42C45 42 35 39 25 42C15 39 5 42 5 42Z"/><path d="M25 8L25 42"/></svg>',
  // Pencil
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 40L5 45L10 48L40 18L35 13Z"/><path d="M35 13L40 8C42 6 46 6 48 8L48 12L43 17"/></svg>',
  // Star
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M25 5L30 20L47 20L34 30L38 45L25 36L12 45L16 30L3 20L20 20Z"/></svg>',
  // Brain
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><ellipse cx="18" cy="22" rx="12" ry="14"/><ellipse cx="32" cy="22" rx="12" ry="14"/><path d="M14 14Q18 18 24 14"/><path d="M26 14Q32 18 36 14"/></svg>',
  // Clock
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="25" cy="25" r="20"/><path d="M25 12L25 25L35 30"/></svg>',
  // Rocket
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M25 5C20 15 18 30 20 40L25 38L30 40C32 30 30 15 25 5"/><path d="M20 40L14 48L22 42"/><path d="M30 40L36 48L28 42"/><circle cx="25" cy="20" r="4"/></svg>',
  // Target
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="25" cy="25" r="20"/><circle cx="25" cy="25" r="12"/><circle cx="25" cy="25" r="4"/></svg>',
  // Coffee
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 18L10 42C10 45 15 48 25 48C35 48 40 45 40 42L40 18"/><path d="M40 22C46 22 50 26 50 32C50 38 46 42 40 42"/><path d="M8 18L42 18"/><path d="M18 8Q20 12 18 16"/><path d="M25 6Q27 10 25 14"/><path d="M32 8Q34 12 32 16"/></svg>',
  // Graduation cap
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 20L25 10L45 20L25 30Z"/><path d="M12 24L12 38C12 38 18 44 25 44C32 44 38 38 38 38L38 24"/><path d="M45 20L45 35"/></svg>',
  // Music note
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><ellipse cx="14" cy="40" rx="8" ry="6"/><path d="M22 40L22 12L46 6L46 34"/><ellipse cx="38" cy="34" rx="8" ry="6"/></svg>',
  // Question mark
  '<svg viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M16 16C16 8 22 4 28 4C36 4 42 10 42 18C42 26 32 28 28 34L28 38"/><circle cx="28" cy="46" r="3" fill="currentColor"/></svg>',
]

export default function FloatingDoodles() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="floating-sketches-container">
      {sketchDoodles.map((svg, index) => (
        <div
          key={index}
          className="sketch-doodle"
          style={{
            top: `${8 + ((index * 7) % 82)}%`,
            left: `${3 + ((index * 8) % 90)}%`,
            animationDelay: `${-index * 2}s`,
            animationDuration: `${20 + (index * 2)}s`,
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}

      <style jsx global>{`
        .floating-sketches-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .sketch-doodle {
          position: absolute;
          width: 55px;
          height: 55px;
          color: #000;
          opacity: 0.18;
          animation: sketchFloat 25s ease-in-out infinite;
        }

        .sketch-doodle:nth-child(odd) {
          animation-direction: reverse;
        }

        @keyframes sketchFloat {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          20% {
            transform: translate(30px, -40px) rotate(10deg);
          }
          40% {
            transform: translate(-25px, 25px) rotate(-8deg);
          }
          60% {
            transform: translate(40px, 35px) rotate(15deg);
          }
          80% {
            transform: translate(-20px, -30px) rotate(-12deg);
          }
        }
      `}</style>
    </div>
  )
}
