interface PacketFormFooterMessageProps {
  message: string
  status: 'error' | 'idle' | 'success'
}

export function PacketFormFooterMessage({
  message,
  status,
}: PacketFormFooterMessageProps) {
  if (!message) {
    return null
  }

  return (
    <div className="profile-form-footer packet-form-footer">
      <div className="packet-form-footer-inner">
        <p
          className={`form-message ${
            status === 'success' ? 'form-message-success' : status === 'error' ? 'form-message-error' : ''
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
