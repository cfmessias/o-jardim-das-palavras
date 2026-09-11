// exercises.js - Módulos Pedagógicos para PLNN (1.º e 2.º Ano)

// 1. Utilitário de Síntese de Voz (pt-PT estrito)
function speakWord(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-PT';
  utterance.rate = 0.8;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const ptPtVoice = voices.find(v => 
    v.lang === 'pt-PT' || 
    v.lang === 'pt_PT' || 
    v.name.includes('Portugal') || 
    v.name.includes('Portuguese (Portugal)')
  );

  if (ptPtVoice) {
    utterance.voice = ptPtVoice;
  }

  window.speechSynthesis.speak(utterance);
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// -------------------------------------------------------------
// COMPONENTES 1.º ANO
// -------------------------------------------------------------

// 1.º Ano - Módulo 1: Descobrir Palavras (Exploração Imagem, Texto e Som)
function Grade1Module1({ words }) {
  const [selectedWord, setSelectedWord] = React.useState(null);
  const [showText, setShowText] = React.useState(false);

  const handleSelectWord = (w) => {
    setSelectedWord(w);
    setShowText(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <p style={{ color: '#4B5563', marginBottom: '16px', fontWeight: 'bold' }}>
        Escolhe um emoji para descobrires a palavra:
      </p>

      {/* Grelha de Emojis */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
        {words.map((w) => (
          <button
            key={w.id}
            onClick={() => handleSelectWord(w)}
            className="btn btn-outline"
            style={{
              fontSize: '2.5rem',
              padding: '16px',
              border: selectedWord?.id === w.id ? '3px solid #F2704E' : '2px solid #E5E7EB',
              backgroundColor: selectedWord?.id === w.id ? '#FFF0ED' : '#FFFFFF',
              borderRadius: '16px',
              cursor: 'pointer'
            }}
          >
            {w.emoji}
          </button>
        ))}
      </div>

      {/* Cartão de Ação para a Palavra Selecionada */}
      {selectedWord && (
        <div style={{ border: '2px dashed #F2704E', padding: '24px', borderRadius: '16px', backgroundColor: '#FAFAFA', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>{selectedWord.emoji}</div>

          {/* Área da Palavra */}
          <div style={{ minHeight: '48px', marginBottom: '20px', fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
            {showText ? selectedWord.word : "___ ??? ___"}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn btn-outline"
              onClick={() => setShowText(true)}
              style={{ fontSize: '1rem' }}
            >
              👁️ Ver Palavra
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => speakWord(selectedWord.word)}
              style={{ fontSize: '1rem' }}
            >
              🔊 Ouvir Palavra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 1.º e 2.º Ano - Módulo de Letra em Falta (1º Ano: Mod 2 / 2º Ano: Mod 1)
function MissingLetterList({ words, onComplete }) {
  // Prepara cada palavra sorteando uma letra para ocultar
  const [preparedWords] = React.useState(() => {
    return words.map(w => {
      const cleanWord = w.word.trim();
      const hideIndex = Math.floor(Math.random() * cleanWord.length);
      const letterToHide = cleanWord[hideIndex];
      const masked = cleanWord.substring(0, hideIndex) + '_' + cleanWord.substring(hideIndex + 1);
      return { ...w, masked, hideIndex, letterToHide };
    });
  });

  const [userInputs, setUserInputs] = React.useState({});
  const [results, setResults] = React.useState({});

  const handleInputChange = (id, val) => {
    setUserInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleCheckAll = () => {
    const newResults = {};
    let correctCount = 0;

    preparedWords.forEach(w => {
      const entered = (userInputs[w.id] || '').trim().toLowerCase();
      const isRight = entered === w.letterToHide.toLowerCase();
      newResults[w.id] = isRight;
      if (isRight) correctCount++;
    });

    setResults(newResults);

    if (correctCount === preparedWords.length) {
      speakWord("Excelente! Completaste todas as letras!");
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: '#4B5563', marginBottom: '20px', fontWeight: 'bold' }}>
        Completa a letra que falta em cada palavra:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {preparedWords.map(w => {
          const parts = w.masked.split('_');
          const isCorrect = results[w.id] === true;
          const isWrong = results[w.id] === false;

          return (
            <div 
              key={w.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                backgroundColor: isCorrect ? '#ECFDF5' : (isWrong ? '#FEF2F2' : '#F9FAFB'),
                border: isCorrect ? '2px solid #10B981' : (isWrong ? '2px solid #EF4444' : '1px solid #E5E7EB')
              }}
            >
              <span style={{ fontSize: '2rem' }}>{w.emoji}</span>
              
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', flexGrow: 1, letterSpacing: '2px' }}>
                <span>{parts[0]}</span>
                <input
                  type="text"
                  maxLength={1}
                  value={userInputs[w.id] || ''}
                  onChange={(e) => handleInputChange(w.id, e.target.value)}
                  style={{
                    width: '36px',
                    height: '40px',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    border: '2px solid #3B82F6',
                    borderRadius: '6px',
                    margin: '0 4px',
                    color: '#1D4ED8'
                  }}
                />
                <span>{parts[1]}</span>
              </div>

              <button 
                type="button" 
                onClick={() => speakWord(w.word)}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '1rem' }}
              >
                🔊
              </button>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleCheckAll} 
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '24px', padding: '12px', fontSize: '1.1rem' }}
      >
        Verificar Respostas
      </button>
    </div>
  );
}

// 1.º Ano - Módulo 3: Frases com Escolha de Palavra + Emoji
function Grade1Module3({ words, onComplete }) {
  const sentenceWords = React.useMemo(() => words.slice(0, 5), [words]);
  const [selectedAnswers, setSelectedAnswers] = React.useState({});
  const [results, setResults] = React.useState({});

  const handleSelect = (wordId, option) => {
    setSelectedAnswers(prev => ({ ...prev, [wordId]: option }));
  };

  const handleVerify = () => {
    const newResults = {};
    let correct = 0;

    sentenceWords.forEach(w => {
      const isRight = selectedAnswers[w.id]?.id === w.id;
      newResults[w.id] = isRight;
      if (isRight) correct++;
    });

    setResults(newResults);

    if (correct === sentenceWords.length) {
      speakWord("Muito bem! Preencheste todas as frases corretamente!");
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: '#4B5563', marginBottom: '20px', fontWeight: 'bold' }}>
        Escolha a palavra correta para cada frase:
      </p>

      {sentenceWords.map(w => {
        const beforeText = w.wordBlankBefore || w.blank_before || "O/A ";
        const afterText = w.wordBlankAfter || w.blank_after || "";
        const isCorrect = results[w.id] === true;
        const isWrong = results[w.id] === false;

        return (
          <div 
            key={w.id} 
            style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: isCorrect ? '#ECFDF5' : (isWrong ? '#FEF2F2' : '#FAFAFA'),
              border: '1px solid #E5E7EB' 
            }}
          >
            <div style={{ fontSize: '1.2rem', marginBottom: '12px' }}>
              <span>{beforeText}</span>
              <span style={{ fontWeight: 'bold', color: '#2563EB', padding: '0 8px', textDecoration: 'underline' }}>
                {selectedAnswers[w.id] ? `${selectedAnswers[w.id].emoji} ${selectedAnswers[w.id].word}` : "________"}
              </span>
              <span>{afterText}</span>
            </div>

            {/* Banco de Opções para esta frase */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {words.slice(0, 5).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(w.id, opt)}
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.95rem',
                    backgroundColor: selectedAnswers[w.id]?.id === opt.id ? '#DBEAFE' : '#FFFFFF',
                    borderColor: selectedAnswers[w.id]?.id === opt.id ? '#2563EB' : '#D1D5DB'
                  }}
                >
                  {opt.emoji} {opt.word}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <button 
        onClick={handleVerify} 
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '1.1rem' }}
      >
        Verificar Frases
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENTES 2.º ANO
// -------------------------------------------------------------

// 2.º Ano - Módulo 2: Escrita Completa da Palavra a partir do Emoji
function Grade2Module2({ words, onComplete }) {
  const [userInputs, setUserInputs] = React.useState({});
  const [results, setResults] = React.useState({});

  const handleInputChange = (id, val) => {
    setUserInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleCheckAll = () => {
    const newResults = {};
    let correctCount = 0;

    words.forEach(w => {
      const entered = (userInputs[w.id] || '').trim().toLowerCase();
      const isRight = entered === w.word.trim().toLowerCase();
      newResults[w.id] = isRight;
      if (isRight) correctCount++;
    });

    setResults(newResults);

    if (correctCount === words.length) {
      speakWord("Espetacular! Escreveste todas as palavras corretamente!");
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: '#4B5563', marginBottom: '20px', fontWeight: 'bold' }}>
        Escreve o nome correspondente a cada emoji:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {words.map(w => {
          const isCorrect = results[w.id] === true;
          const isWrong = results[w.id] === false;

          return (
            <div 
              key={w.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                backgroundColor: isCorrect ? '#ECFDF5' : (isWrong ? '#FEF2F2' : '#F9FAFB'),
                border: isCorrect ? '2px solid #10B981' : (isWrong ? '2px solid #EF4444' : '1px solid #E5E7EB')
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>{w.emoji}</span>
              
              <input
                type="text"
                placeholder="Escreve aqui..."
                value={userInputs[w.id] || ''}
                onChange={(e) => handleInputChange(w.id, e.target.value)}
                style={{
                  flexGrow: 1,
                  height: '42px',
                  padding: '0 12px',
                  fontSize: '1.2rem',
                  border: '2px solid #3B82F6',
                  borderRadius: '8px'
                }}
              />

              <button 
                type="button" 
                onClick={() => speakWord(w.word)}
                className="btn btn-outline"
                style={{ padding: '6px 10px', fontSize: '1rem' }}
              >
                🔊
              </button>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleCheckAll} 
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '24px', padding: '12px', fontSize: '1.1rem' }}
      >
        Verificar Ortografia
      </button>
    </div>
  );
}

// 2.º Ano - Módulo 3: Frases com Emojis (Aluno escreve o nome do Emoji)
function Grade2Module3({ words, onComplete }) {
  const sentenceWords = React.useMemo(() => words.slice(0, 5), [words]);
  const [userInputs, setUserInputs] = React.useState({});
  const [results, setResults] = React.useState({});

  const handleInputChange = (id, val) => {
    setUserInputs(prev => ({ ...prev, [id]: val }));
  };

  const handleVerify = () => {
    const newResults = {};
    let correct = 0;

    sentenceWords.forEach(w => {
      const entered = (userInputs[w.id] || '').trim().toLowerCase();
      const isRight = entered === w.word.trim().toLowerCase();
      newResults[w.id] = isRight;
      if (isRight) correct++;
    });

    setResults(newResults);

    if (correct === sentenceWords.length) {
      speakWord("Parabéns! Escreveste o nome de todos os emojis nas frases!");
      if (onComplete) onComplete();
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: '#4B5563', marginBottom: '20px', fontWeight: 'bold' }}>
        Escreve o nome do emoji para completar cada frase:
      </p>

      {sentenceWords.map(w => {
        const beforeText = w.wordBlankBefore || w.blank_before || "O/A ";
        const afterText = w.wordBlankAfter || w.blank_after || "";
        const isCorrect = results[w.id] === true;
        const isWrong = results[w.id] === false;

        return (
          <div 
            key={w.id} 
            style={{ 
              marginBottom: '20px', 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: isCorrect ? '#ECFDF5' : (isWrong ? '#FEF2F2' : '#FAFAFA'),
              border: isCorrect ? '2px solid #10B981' : (isWrong ? '2px solid #EF4444' : '1px solid #E5E7EB')
            }}
          >
            <div style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>{beforeText}</span>
              <span style={{ fontSize: '1.8rem' }}>{w.emoji}</span>
              <input
                type="text"
                placeholder="???"
                value={userInputs[w.id] || ''}
                onChange={(e) => handleInputChange(w.id, e.target.value)}
                style={{
                  width: '130px',
                  padding: '6px 10px',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  border: '2px solid #3B82F6',
                  borderRadius: '6px'
                }}
              />
              <span>{afterText}</span>
            </div>
          </div>
        );
      })}

      <button 
        onClick={handleVerify} 
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '1.1rem' }}
      >
        Verificar Frases
      </button>
    </div>
  );
}
