import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Bot, CalendarDays, SendHorizontal, UserRound } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { ChatMessage, LearningPlan } from '../../types'
import { useAuth } from '../auth/auth-context'

export function MentorPage({ onContinue }: { onContinue?: () => void }) {
  const { request } = useAuth()
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('How should I prioritize my roadmap this week?')
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [planningDays, setPlanningDays] = useState<7 | 30 | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    request<{ history: ChatMessage[] }>('/mentor/history')
      .then((payload) => setHistory(payload.history))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Could not load mentor history'))
  }, [request])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function sendMessage() {
    const trimmed = message.trim()
    if (!trimmed) return

    setError(null)
    setIsSending(true)
    try {
      const payload = await request<{ history: ChatMessage[] }>('/mentor/chat', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed }),
      })
      setHistory(payload.history)
      setMessage('')
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not send message')
    } finally {
      setIsSending(false)
    }
  }

  async function loadPlan(days: 7 | 30) {
    setError(null)
    setPlanningDays(days)
    try {
      const payload = await request<{ plan: LearningPlan }>('/mentor/plan', {
        method: 'POST',
        body: JSON.stringify({ days }),
      })
      setPlan(payload.plan)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not generate learning plan')
    } finally {
      setPlanningDays(null)
    }
  }

  return (
    <section className="page-stack mentor-page" aria-labelledby="mentor-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI virtual mentor</p>
          <h1 id="mentor-title">Career guidance chat</h1>
          <p>Ask for next actions, project scope, interview preparation, or how to turn roadmap work into portfolio evidence.</p>
        </div>
      </header>

      {error && (
        <p className="form-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </p>
      )}

      <section className="chat-panel" aria-label="Mentor chat history">
        {history.length === 0 ? (
          <div className="empty-chat">
            <Bot size={28} aria-hidden="true" />
            <h2>No mentor messages yet</h2>
            <p>Ask a career question after selecting a target role and saving profile skills.</p>
            <div className="prompt-grid" aria-label="Suggested mentor prompts">
              {[
                'What should I learn first this week?',
                'Which project proves my target role best?',
                'How do I explain my skill gaps in an interview?',
              ].map((prompt) => (
                <button type="button" key={prompt} onClick={() => setMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((chat) => (
            <article className={`chat-message ${chat.role.toLowerCase()}`} key={chat.id}>
              <div className="chat-avatar">{chat.role === 'USER' ? <UserRound size={18} /> : <Bot size={18} />}</div>
              <p>{chat.content}</p>
            </article>
          ))
        )}
        <div ref={endRef} />
      </section>

      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault()
          void sendMessage()
        }}
      >
        <label>
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={1200} />
        </label>
        <button className="primary-button" type="submit" disabled={isSending}>
          <SendHorizontal size={18} aria-hidden="true" />
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>

      <section className="mentor-plan-panel" aria-labelledby="mentor-plan-title">
        <div className="section-title">
          <CalendarDays size={20} aria-hidden="true" />
          <h2 id="mentor-plan-title">Learning plan</h2>
        </div>
        <div className="plan-actions">
          <button className="secondary-button" type="button" onClick={() => void loadPlan(7)} disabled={planningDays !== null}>
            7-day plan
          </button>
          <button className="secondary-button" type="button" onClick={() => void loadPlan(30)} disabled={planningDays !== null}>
            30-day plan
          </button>
        </div>
        {planningDays && <p className="topbar-copy">Generating {planningDays}-day plan...</p>}
        {plan ? (
          <div className="learning-plan">
            <div>
              <span className="status-pill">{plan.horizonDays} days</span>
              <p>{plan.focus}</p>
            </div>
            <div className="plan-grid">
              {plan.items.map((item) => (
                <article className="plan-card" key={`${item.dayRange}-${item.title}`}>
                  <span>{item.dayRange}</span>
                  <h3>{item.title}</h3>
                  <ul>
                    {item.tasks.map((task) => (
                      <li key={task}>{task}</li>
                    ))}
                  </ul>
                  <p>{item.evidence}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="topbar-copy">Generate a short sprint or 30-day plan from your profile, skill gap, and roadmap status.</p>
        )}
      </section>

      <section className="demo-action-bar" aria-label="Mentor demo actions">
        <span>After one mentor answer, sync GitHub to connect learning progress with portfolio evidence.</span>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue to Portfolio
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    </section>
  )
}
