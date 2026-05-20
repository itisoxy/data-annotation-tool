'use client'

import { useMemo, useState } from 'react'
import {
  evaluationTasks,
  scoreCriteria,
  winnerLabels,
  type AnswerScores,
  type ConfidenceLevel,
  type EvaluationRecord,
  type EvaluationTask,
  type ScoreCriterion,
  type WinnerChoice,
} from '@/data/ai-eval'

type TaskMap = Record<string, EvaluationTask>

const defaultScores: AnswerScores = {
  helpfulness: 3,
  accuracy: 3,
  clarity: 3,
  safety: 3,
}

const winnerChoices: WinnerChoice[] = ['answerA', 'answerB', 'tie', 'neither']
const confidenceLevels: ConfidenceLevel[] = ['low', 'medium', 'high']

function formatWinner(choice: WinnerChoice) {
  return winnerLabels[choice]
}

function averageScore(scores: AnswerScores) {
  const total = scoreCriteria.reduce((sum, criterion) => sum + scores[criterion], 0)
  return (total / scoreCriteria.length).toFixed(1)
}

function buildExportRows(records: EvaluationRecord[]) {
  return records.map((record) => ({
    taskId: record.taskId,
    prompt: record.prompt,
    selectedWinner: record.selectedWinner,
    selectedWinnerLabel: formatWinner(record.selectedWinner),
    answerAHelpfulness: record.scores.answerA.helpfulness,
    answerAAccuracy: record.scores.answerA.accuracy,
    answerAClarity: record.scores.answerA.clarity,
    answerASafety: record.scores.answerA.safety,
    answerBHelpfulness: record.scores.answerB.helpfulness,
    answerBAccuracy: record.scores.answerB.accuracy,
    answerBClarity: record.scores.answerB.clarity,
    answerBSafety: record.scores.answerB.safety,
    confidence: record.confidence,
    reviewerNotes: record.reviewerNotes,
    reasonForChoice: record.reasonForChoice,
    reviewedAt: record.reviewedAt,
  }))
}

function escapeCsvValue(value: string | number) {
  const stringValue = String(value)
  if (!/[",\n]/.test(stringValue)) {
    return stringValue
  }

  return `"${stringValue.replaceAll('"', '""')}"`
}

function buildCsv(records: EvaluationRecord[]) {
  const rows = buildExportRows(records)
  const headers = Object.keys(rows[0] ?? {
    taskId: '',
    prompt: '',
    selectedWinner: '',
    selectedWinnerLabel: '',
    answerAHelpfulness: '',
    answerAAccuracy: '',
    answerAClarity: '',
    answerASafety: '',
    answerBHelpfulness: '',
    answerBAccuracy: '',
    answerBClarity: '',
    answerBSafety: '',
    confidence: '',
    reviewerNotes: '',
    reasonForChoice: '',
    reviewedAt: '',
  })

  return [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header as keyof typeof row]))
        .join(','),
    ),
  ].join('\n')
}

function ScoreControl({
  answerLabel,
  criterion,
  value,
  onChange,
}: {
  answerLabel: string
  criterion: ScoreCriterion
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold capitalize text-slate-800">
          {criterion}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
          {value}/5
        </span>
      </span>
      <input
        aria-label={`${answerLabel} ${criterion} score`}
        className="mt-3 w-full accent-cyan-700"
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function AnswerCard({
  label,
  text,
  selected,
  scores,
  onSelect,
  onScoreChange,
}: {
  label: 'A' | 'B'
  text: string
  selected: boolean
  scores: AnswerScores
  onSelect: () => void
  onScoreChange: (criterion: ScoreCriterion, value: number) => void
}) {
  return (
    <section
      className={`rounded-lg border-2 bg-white p-5 transition ${
        selected
          ? 'border-cyan-700 shadow-[0_12px_30px_rgba(14,116,144,0.18)]'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">Answer {label}</h3>
        {selected ? (
          <span className="rounded-full bg-cyan-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Selected
          </span>
        ) : null}
      </div>

      <p className="mt-4 min-h-36 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-800">
        {text}
      </p>

      <button
        type="button"
        onClick={onSelect}
        className={`mt-4 w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${
          selected
            ? 'border-cyan-700 bg-cyan-700 text-white'
            : 'border-slate-300 bg-white text-slate-800 hover:border-cyan-700 hover:text-cyan-800'
        }`}
      >
        Choose Answer {label}
      </button>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Quality scores</p>
          <p className="text-sm text-slate-500">Average {averageScore(scores)}</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {scoreCriteria.map((criterion) => (
            <ScoreControl
              key={criterion}
              answerLabel={`Answer ${label}`}
              criterion={criterion}
              value={scores[criterion]}
              onChange={(value) => onScoreChange(criterion, value)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function EvaluationPanel({
  task,
  savedRecord,
  onSave,
}: {
  task: EvaluationTask
  savedRecord?: EvaluationRecord
  onSave: (record: EvaluationRecord) => void
}) {
  const [selectedWinner, setSelectedWinner] = useState<WinnerChoice>(
    savedRecord?.selectedWinner ?? 'answerA',
  )
  const [scores, setScores] = useState(savedRecord?.scores ?? {
    answerA: defaultScores,
    answerB: defaultScores,
  })
  const [reviewerNotes, setReviewerNotes] = useState(savedRecord?.reviewerNotes ?? '')
  const [reasonForChoice, setReasonForChoice] = useState(
    savedRecord?.reasonForChoice ?? '',
  )
  const [confidence, setConfidence] = useState<ConfidenceLevel>(
    savedRecord?.confidence ?? 'medium',
  )
  const [markedReviewed, setMarkedReviewed] = useState(Boolean(savedRecord))
  const [saved, setSaved] = useState(Boolean(savedRecord))

  function updateScore(
    answer: 'answerA' | 'answerB',
    criterion: ScoreCriterion,
    value: number,
  ) {
    setScores((current) => ({
      ...current,
      [answer]: {
        ...current[answer],
        [criterion]: value,
      },
    }))
    setSaved(false)
  }

  function saveEvaluation() {
    onSave({
      taskId: task.id,
      prompt: task.prompt,
      selectedWinner,
      scores,
      reviewerNotes,
      reasonForChoice,
      confidence,
      reviewedAt: new Date().toISOString(),
    })
    setMarkedReviewed(true)
    setSaved(true)
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Evaluation task
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Compare model answers
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            {task.category}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">
            {task.difficulty}
          </span>
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-800">
            {task.status}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          User prompt/question
        </p>
        <p className="mt-3 text-lg leading-8 text-slate-950">{task.prompt}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <AnswerCard
          label="A"
          text={task.answerA}
          selected={selectedWinner === 'answerA'}
          scores={scores.answerA}
          onSelect={() => {
            setSelectedWinner('answerA')
            setSaved(false)
          }}
          onScoreChange={(criterion, value) =>
            updateScore('answerA', criterion, value)
          }
        />
        <AnswerCard
          label="B"
          text={task.answerB}
          selected={selectedWinner === 'answerB'}
          scores={scores.answerB}
          onSelect={() => {
            setSelectedWinner('answerB')
            setSaved(false)
          }}
          onScoreChange={(criterion, value) =>
            updateScore('answerB', criterion, value)
          }
        />
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900">
          Choose the better response
        </legend>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {winnerChoices.map((choice) => {
            const active = selectedWinner === choice
            return (
              <label
                key={choice}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-semibold transition ${
                  active
                    ? 'border-cyan-700 bg-cyan-50 text-cyan-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                }`}
              >
                <input
                  className="size-4 accent-cyan-700"
                  type="radio"
                  name={`winner-${task.id}`}
                  checked={active}
                  onChange={() => {
                    setSelectedWinner(choice)
                    setSaved(false)
                  }}
                />
                {formatWinner(choice)}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_0.65fr]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Reason for choice
          </span>
          <textarea
            value={reasonForChoice}
            onChange={(event) => {
              setReasonForChoice(event.target.value)
              setSaved(false)
            }}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition focus:border-cyan-700"
            placeholder="Explain why this winner choice best fits the prompt."
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Reviewer notes
          </span>
          <textarea
            value={reviewerNotes}
            onChange={(event) => {
              setReviewerNotes(event.target.value)
              setSaved(false)
            }}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition focus:border-cyan-700"
            placeholder="Capture any factual, safety, or style observations."
          />
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-900">Confidence level</p>
          <div className="mt-2 grid gap-2">
            {confidenceLevels.map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold capitalize text-slate-700"
              >
                <input
                  className="size-4 accent-cyan-700"
                  type="radio"
                  name={`confidence-${task.id}`}
                  checked={confidence === level}
                  onChange={() => {
                    setConfidence(level)
                    setSaved(false)
                  }}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
          <input
            className="size-4 accent-cyan-700"
            type="checkbox"
            checked={markedReviewed}
            onChange={(event) => {
              setMarkedReviewed(event.target.checked)
              setSaved(false)
            }}
          />
          Mark task as reviewed
        </label>
        <button
          type="button"
          onClick={saveEvaluation}
          disabled={!markedReviewed}
          className="rounded-lg bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Save evaluation
        </button>
      </div>

      {saved ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Evaluation saved. The task status is reviewed.
        </p>
      ) : null}
    </section>
  )
}

export default function HomePage() {
  const [tasksById, setTasksById] = useState<TaskMap>(() =>
    Object.fromEntries(evaluationTasks.map((task) => [task.id, task])),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([])

  const tasks = useMemo(() => Object.values(tasksById), [tasksById])
  const currentTask = tasks[currentIndex]
  const currentRecord = evaluations.find(
    (record) => record.taskId === currentTask.id,
  )

  const summary = useMemo(() => {
    const reviewed = evaluations.length
    const pending = tasks.length - reviewed

    return { reviewed, pending }
  }, [evaluations.length, tasks.length])

  function handleSave(record: EvaluationRecord) {
    setEvaluations((current) => {
      const withoutCurrent = current.filter((item) => item.taskId !== record.taskId)
      return [...withoutCurrent, record]
    })
    setTasksById((current) => ({
      ...current,
      [record.taskId]: {
        ...current[record.taskId],
        status: 'reviewed',
      },
    }))
    setCurrentIndex((index) => Math.min(index + 1, tasks.length - 1))
  }

  function downloadFile(contents: string, fileName: string, type: string) {
    const blob = new Blob([contents], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportJson() {
    downloadFile(
      JSON.stringify(buildExportRows(evaluations), null, 2),
      'ai-response-evaluations.json',
      'application/json',
    )
  }

  function exportCsv() {
    downloadFile(buildCsv(evaluations), 'ai-response-evaluations.csv', 'text/csv')
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
            AI trainer workflow
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                AI Response Evaluation Tool
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Compare model answers, score response quality, and create
                structured human feedback data for AI training.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-950 px-4 py-3 text-white">
                <span className="block text-xs uppercase tracking-[0.18em] text-slate-300">
                  Reviewed
                </span>
                <span className="mt-1 block text-2xl font-semibold">
                  {summary.reviewed}
                </span>
              </div>
              <div className="rounded-lg bg-cyan-50 px-4 py-3 text-cyan-950">
                <span className="block text-xs uppercase tracking-[0.18em] text-cyan-700">
                  Pending
                </span>
                <span className="mt-1 block text-2xl font-semibold">
                  {summary.pending}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
          <EvaluationPanel
            key={currentTask.id}
            task={currentTask}
            savedRecord={currentRecord}
            onSave={handleSave}
          />

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Task queue
              </p>
              <div className="mt-4 space-y-3">
                {tasks.map((task, index) => {
                  const active = index === currentIndex

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        active
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-cyan-300 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-4">
                        <span className="font-semibold">{task.id}</span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] opacity-75">
                          {task.status}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm opacity-80">
                        {task.category} · {task.difficulty}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Export
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Reviewed evaluations
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Export reviewed tasks with winner choice, per-answer scores,
                confidence, notes, rationale, and review timestamps.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportJson}
                  disabled={evaluations.length === 0}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={evaluations.length === 0}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  Export CSV
                </button>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Review history
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Saved human feedback
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {evaluations.length} reviewed task
              {evaluations.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[1100px] divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Prompt</th>
                  <th className="px-4 py-3">Selected winner</th>
                  <th className="px-4 py-3">Answer A scores</th>
                  <th className="px-4 py-3">Answer B scores</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Reviewer notes</th>
                  <th className="px-4 py-3">Reviewed at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {evaluations.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={7}>
                      No reviewed evaluations yet.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((record) => (
                    <tr key={record.taskId} className="align-top">
                      <td className="max-w-sm px-4 py-4 text-slate-800">
                        <span className="block font-semibold text-slate-950">
                          {record.taskId}
                        </span>
                        <span className="mt-1 block leading-6">{record.prompt}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {formatWinner(record.selectedWinner)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        H {record.scores.answerA.helpfulness} · A{' '}
                        {record.scores.answerA.accuracy} · C{' '}
                        {record.scores.answerA.clarity} · S{' '}
                        {record.scores.answerA.safety}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        H {record.scores.answerB.helpfulness} · A{' '}
                        {record.scores.answerB.accuracy} · C{' '}
                        {record.scores.answerB.clarity} · S{' '}
                        {record.scores.answerB.safety}
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-700">
                        {record.confidence}
                      </td>
                      <td className="max-w-xs px-4 py-4 leading-6 text-slate-700">
                        {record.reviewerNotes || record.reasonForChoice || '—'}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {new Date(record.reviewedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
