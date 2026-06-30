import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Bot, SendHorizontal, UserRound } from 'lucide-react'
import { ApiClientError } from '../../api'
import type { ChatMessage } from '../../types'
import { useAuth } from '../auth/AuthContext'

export function MentorPage() {
  const { request } = useAuth()
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('How should I prioritize my roadmap this week?')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
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

  return (
    <section className="page-stack mentor-page" aria-labelledby="mentor-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI virtual mentor</p>
          <h1 id="mentor-title">Career guidance chat</h1>
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
    </section>
  )
}
