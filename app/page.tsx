'use client'

import { useState, useEffect } from 'react'

const samples = [
  {
    id: 1,
    text: 'I need help resetting my password.',
  },
  {
    id: 2,
    text: 'Your service is terrible.',
  },
  {
    id: 3,
    text: 'Thank you for the quick support!',
  },
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saved, setSaved] = useState(false)

  const currentSample = samples[currentIndex]

  function nextSample() {
    setSaved(false)

    if (currentIndex < samples.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === 'n') {
        nextSample()
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [currentIndex])

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-6">
        Data Annotation Workspace
      </h1>

      <div className="border p-6 rounded mb-6">
        <h2 className="text-xl font-bold mb-4">
          Text Sample
        </h2>

        <p>{currentSample.text}</p>
      </div>

      <div className="mb-6">
        <h2 className="font-bold mb-2">
          Category
        </h2>

        <div className="flex gap-4">
          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Support
          </button>

          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Complaint
          </button>

          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Feedback
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold mb-2">
          Sentiment
        </h2>

        <div className="flex gap-4">
          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Positive
          </button>

          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Neutral
          </button>

          <button className="border px-4 py-2 rounded hover:bg-gray-100">
            Negative
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-bold mb-2">
          Toxicity Score
        </h2>

        <input
          type="range"
          min="1"
          max="10"
          className="w-full"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setSaved(true)}
          className="bg-black text-white px-6 py-3 rounded"
        >
          Save Annotation
        </button>

        <button
          onClick={nextSample}
          className="border px-6 py-3 rounded"
        >
          Next Sample
        </button>
      </div>

      {saved && (
        <p className="mt-4 text-green-600">
          Annotation saved successfully.
        </p>
      )}

      <div className="mt-10">
        <p>
          Progress: {currentIndex + 1} / {samples.length}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Press "N" to move to next sample
        </p>
      </div>
    </main>
  )
}