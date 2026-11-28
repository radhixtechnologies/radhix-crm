const AiCallTranscriptView = ({ turns = [], transcriptText = '' }) => {
  if (Array.isArray(turns) && turns.length > 0) {
    return (
      <div className="ai-transcript-bubbles">
        {turns.map((turn, idx) => {
          const isUser = turn.role === 'user';
          return (
            <div key={idx} className={`ai-bubble ${isUser ? 'user' : 'agent'}`}>
              <div className="ai-bubble-role">{isUser ? 'Lead / Client' : 'AI Voice Agent'}</div>
              <div>{turn.message}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (transcriptText && transcriptText.trim()) {
    return (
      <pre
        style={{
          margin: 0,
          padding: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          fontSize: '12.5px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
          maxHeight: '320px',
          overflowY: 'auto',
          color: '#1e293b',
        }}
      >
        {transcriptText}
      </pre>
    );
  }

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '8px',
        background: '#f8fafc',
        border: '1px dashed #cbd5e1',
        color: '#64748b',
        fontSize: '13px',
        textAlign: 'center',
      }}
    >
      No conversation transcript captured for this call.
    </div>
  );
};

export default AiCallTranscriptView;
