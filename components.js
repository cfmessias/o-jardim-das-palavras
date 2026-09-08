// components.js - Componentes React da Interface e Atividades do Jogo

// --- COMPONENTES AUXILIARES E DE UI ---

function StarBadge({ stars }) {
  return (
    <div className="star-badge">
      <span className="star-icon">⭐</span>
      <span className="star-count">{stars}</span>
    </div>
  );
}

function ProgressDots({ stage }) {
  return (
    <div className="progress-dots">
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`dot ${step <= stage ? "completed" : ""} ${step === stage + 1 ? "active" : ""}`}
        />
      ))}
    </div>
  );
}

// --- AVATAR DO ALUNO ---

function Avatar({ config, size = "medium" }) {
  const { skinTone = "#FFDBB4", hairColor = "#2E2321", hairStyle = "liso", accessory = null } = config || {};
  
  const sizeMap = { small: "60px", medium: "120px", large: "180px" };
  const dimension = sizeMap[size] || sizeMap.medium;

  return (
    <div className="avatar-container" style={{ width: dimension, height: dimension, position: "relative" }}>
      <svg viewBox="0 0 100 100" className="avatar-svg">
        {/* Cabeça */}
        <circle cx="50" cy="50" r="35" fill={skinTone} />
        
        {/* Olhos */}
        <circle cx="40" cy="45" r="4" fill="#333" />
        <circle cx="60" cy="45" r="4" fill="#333" />
        
        {/* Sorriso */}
        <path d="M 40 60 Q 50 70 60 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Cabelo */}
        {hairStyle === "liso" ? (
          <path d="M 15 45 Q 50 10 85 45 Q 50 25 15 45 Z" fill={hairColor} />
        ) : (
          <g fill={hairColor}>
            <circle cx="25" cy="30" r="10" />
            <circle cx="40" cy="20" r="12" />
            <circle cx="60" cy="20" r="12" />
            <circle cx="75" cy="30" r="10" />
          </g>
        )}
      </svg>

      {/* Acessório desbloqueado */}
      {accessory === "chapeu" && <span className="avatar-accessory hat">🤠</span>}
      {accessory === "oculos" && <span className="avatar-accessory glasses">👓</span>}
      {accessory === "capa" && <span className="avatar-accessory cape">🦸</span>}
      {accessory === "coroa" && <span className="avatar-accessory crown">👑</span>}
    </div>
  );
}

// --- ETAPAS DE APRENDIZAGEM / EXERCÍCIOS ---

function ActivityStages({ word, stage, onComplete }) {
  const [writtenInput, setWrittenInput] = React.useState("");
  const [feedbackMessage, setFeedbackMessage] = React.useState(null);

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleValidation = (isCorrect, nextStage, text = null) => {
    if (isCorrect) {
      const randomPraise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      setFeedbackMessage({ type: "success", text: randomPraise });
      setTimeout(() => {
        setFeedbackMessage(null);
        onComplete(nextStage, text);
      }, 1200);
    } else {
      const randomRetry = RETRY[Math.floor(Math.random() * RETRY.length)];
      setFeedbackMessage({ type: "error", text: randomRetry });
    }
  };

  return (
    <div className="activity-card">
      <div className="word-header">
        <span className="word-emoji" onClick={() => speakWord(word.word)} style={{ cursor: "pointer" }}>
          {word.emoji} 🔊
        </span>
        <h2>{word.word}</h2>
        <ProgressDots stage={stage} />
      </div>

      {feedbackMessage && (
        <div className={`feedback-toast ${feedbackMessage.type}`}>
          {feedbackMessage.text}
        </div>
      )}

      {/* ETAPA 1: Identificação e Dica */}
      {stage === 0 && (
        <div className="stage-container">
          <p className="hint-text"><strong>Dica:</strong> {word.hint}</p>
          <button className="btn-action" onClick={() => handleValidation(true, 1)}>
            Avançar para a Frase →
          </button>
        </div>
      )}

      {/* ETAPA 2: Completar a Frase */}
      {stage === 1 && (
        <div className="stage-container">
          <p className="sentence-exercise">
            {word.blank_before} <strong><u>{word.word}</u></strong> {word.blank_after}
          </p>
          <button className="btn-action" onClick={() => handleValidation(true, 2)}>
            Aprender a Escrever →
          </button>
        </div>
      )}

      {/* ETAPA 3: Escrita da Frase Completa */}
      {stage === 2 && (
        <div className="stage-container">
          <p className="instruction">Escreve uma frase com a palavra <strong>{word.word}</strong>:</p>
          <textarea
            value={writtenInput}
            onChange={(e) => setWrittenInput(e.target.value)}
            placeholder="Escreve aqui a tua frase..."
            rows="3"
            className="input-sentence"
          />
          <button
            className="btn-action"
            onClick={() => {
              const isValid = writtenInput.trim().toLowerCase().includes(word.word.toLowerCase());
              handleValidation(isValid, 3, writtenInput);
            }}
          >
            Concluir e Guardar
          </button>
        </div>
      )}

      {/* PALAVRA DOMINADA */}
      {stage >= 3 && (
        <div className="stage-container mastered">
          <h3>✨ Palavra Dominada! ✨</h3>
          <p>Esta flor já desabrochou no teu jardim.</p>
        </div>
      )}
    </div>
  );
}