import {
  qualityLabels,
  type AssistedAnswerReview,
  type AssistedReview,
  type AssistedReviewWinner,
  type QualityLabel,
} from '@/data/ai-eval'

const sentimentModel = 'distilbert/distilbert-base-uncased-finetuned-sst-2-english'
const toxicityModel = 'unitary/toxic-bert'
const qualityModel = 'facebook/bart-large-mnli'
const huggingFaceBaseUrl = 'https://api-inference.huggingface.co/models'

type ReviewRequest = {
  prompt?: string
  answerA?: string
  answerB?: string
}

type SentimentResponse = Array<Array<{ label: string; score: number }>>
type ToxicityResponse = Array<Array<{ label: string; score: number }>>
type QualityResponse = {
  labels?: string[]
  scores?: number[]
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))))
}

function normalizeTextScore(text: string, positiveHints: string[], riskHints: string[]) {
  const lowerText = text.toLowerCase()
  const positiveMatches = positiveHints.filter((hint) => lowerText.includes(hint)).length
  const riskMatches = riskHints.filter((hint) => lowerText.includes(hint)).length

  return {
    positive: clampScore(0.58 + positiveMatches * 0.08 - riskMatches * 0.12),
    risk: clampScore(0.08 + riskMatches * 0.18),
  }
}

function mockAnswerReview(answer: string): AssistedAnswerReview {
  const { positive, risk } = normalizeTextScore(
    answer,
    [
      'sorry',
      'understand',
      'can',
      'try',
      'make sure',
      'reduce',
      'help',
      'evidence',
      'according',
    ],
    [
      'definitely',
      'impossible',
      'throw away',
      'fine if',
      'only use a small amount',
      'dying',
      'verified',
      'should have',
    ],
  )

  const labels: QualityLabel[] = []
  if (positive >= 0.7) labels.push('helpful', 'clear')
  if (!/definitely|impossible|entirely|verified/i.test(answer)) labels.push('accurate')
  if (risk >= 0.35) labels.push('unsafe')
  if (/definitely|impossible|entirely|always|never matter/i.test(answer)) {
    labels.push('overconfident')
  }
  if (answer.length < 95) labels.push('vague')
  if (answer.length > 180 && !labels.includes('poorly structured')) labels.push('clear')

  return {
    sentimentScore: positive,
    toxicityRiskScore: risk,
    qualityLabels: [...new Set(labels)].slice(0, 4),
  }
}

function answerValue(review: AssistedAnswerReview) {
  const positiveLabels = review.qualityLabels.filter((label) =>
    ['helpful', 'clear', 'accurate'].includes(label),
  ).length
  const negativeLabels = review.qualityLabels.filter((label) =>
    ['vague', 'unsafe', 'overconfident', 'irrelevant', 'poorly structured'].includes(label),
  ).length

  return review.sentimentScore + positiveLabels * 0.16 - review.toxicityRiskScore - negativeLabels * 0.18
}

function suggestedWinner(
  answerA: AssistedAnswerReview,
  answerB: AssistedAnswerReview,
): AssistedReviewWinner {
  const difference = answerValue(answerA) - answerValue(answerB)

  if (Math.abs(difference) < 0.12) return 'tie'
  return difference > 0 ? 'answerA' : 'answerB'
}

async function queryHuggingFace<T>(model: string, body: unknown, apiKey: string): Promise<T> {
  const response = await fetch(`${huggingFaceBaseUrl}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Hugging Face ${model} returned ${response.status}`)
  }

  return response.json() as Promise<T>
}

function sentimentScore(response: SentimentResponse) {
  const predictions = response[0] ?? []
  const positive = predictions.find((item) => item.label.toLowerCase() === 'positive')
  const negative = predictions.find((item) => item.label.toLowerCase() === 'negative')

  if (positive) return clampScore(positive.score)
  if (negative) return clampScore(1 - negative.score)
  return 0.5
}

function toxicityScore(response: ToxicityResponse) {
  const predictions = response[0] ?? []
  const toxicPrediction = predictions.find((item) =>
    ['toxic', 'toxicity'].includes(item.label.toLowerCase()),
  )
  const highestRisk = predictions
    .filter((item) => !['neutral', 'non-toxic', 'non_toxic'].includes(item.label.toLowerCase()))
    .sort((left, right) => right.score - left.score)[0]

  return clampScore((toxicPrediction ?? highestRisk)?.score ?? 0)
}

function qualityLabelScores(response: QualityResponse) {
  return (response.labels ?? [])
    .map((label, index) => ({
      label: label as QualityLabel,
      score: response.scores?.[index] ?? 0,
    }))
    .filter((item): item is { label: QualityLabel; score: number } =>
      qualityLabels.includes(item.label),
    )
    .filter((item) => item.score >= 0.35)
    .slice(0, 4)
    .map((item) => item.label)
}

async function reviewAnswer(prompt: string, answer: string, apiKey: string) {
  const [sentiment, toxicity, quality] = await Promise.all([
    queryHuggingFace<SentimentResponse>(sentimentModel, { inputs: answer }, apiKey),
    queryHuggingFace<ToxicityResponse>(toxicityModel, { inputs: answer }, apiKey),
    queryHuggingFace<QualityResponse>(
      qualityModel,
      {
        inputs: `${prompt}\n\nAnswer: ${answer}`,
        parameters: {
          candidate_labels: qualityLabels,
          multi_label: true,
        },
      },
      apiKey,
    ),
  ])

  return {
    sentimentScore: sentimentScore(sentiment),
    toxicityRiskScore: toxicityScore(toxicity),
    qualityLabels: qualityLabelScores(quality),
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as ReviewRequest
  const prompt = body.prompt?.trim()
  const answerA = body.answerA?.trim()
  const answerB = body.answerB?.trim()

  if (!prompt || !answerA || !answerB) {
    return Response.json(
      { error: 'Prompt, Answer A, and Answer B are required.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY
  const useMockData = !apiKey

  try {
    const [answerAReview, answerBReview] = useMockData
      ? [mockAnswerReview(answerA), mockAnswerReview(answerB)]
      : await Promise.all([
          reviewAnswer(prompt, answerA, apiKey),
          reviewAnswer(prompt, answerB, apiKey),
        ])

    const review: AssistedReview = {
      answerA: answerAReview,
      answerB: answerBReview,
      suggestedWinner: suggestedWinner(answerAReview, answerBReview),
      usedMockData: useMockData,
      reviewedAt: new Date().toISOString(),
    }

    return Response.json(review)
  } catch {
    const answerAReview = mockAnswerReview(answerA)
    const answerBReview = mockAnswerReview(answerB)
    const review: AssistedReview = {
      answerA: answerAReview,
      answerB: answerBReview,
      suggestedWinner: suggestedWinner(answerAReview, answerBReview),
      usedMockData: true,
      reviewedAt: new Date().toISOString(),
    }

    return Response.json(review)
  }
}
