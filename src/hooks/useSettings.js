import { useState } from 'react'

export function useSettings() {
  const [sliderStep, setSliderStepState] = useState(() => {
    try {
      const saved = localStorage.getItem('verso_slider_step')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
          return parsed
        }
      }
    } catch (e) {
      console.error(e)
    }
    return 5
  })

  const [revealDuration, setRevealDurationState] = useState(() => {
    try {
      const saved = localStorage.getItem('verso_reveal_duration')
      if (saved !== null) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 60) {
          return parsed
        }
      }
    } catch (e) {
      console.error(e)
    }
    return 5
  })

  const setSliderStep = (val) => {
    const num = Math.min(100, Math.max(1, parseInt(val, 10) || 1))
    setSliderStepState(num)
    try {
      localStorage.setItem('verso_slider_step', num.toString())
    } catch (e) {
      console.error(e)
    }
  }

  const setRevealDuration = (val) => {
    const num = Math.min(60, Math.max(0, parseInt(val, 10) || 0))
    setRevealDurationState(num)
    try {
      localStorage.setItem('verso_reveal_duration', num.toString())
    } catch (e) {
      console.error(e)
    }
  }

  return { 
    sliderStep, 
    setSliderStep,
    revealDuration,
    setRevealDuration
  }
}
