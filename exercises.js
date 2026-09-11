// exercises.js - Módulos Pedagógicos com o Mocho Pico (PLNN 1.º e 2.º Ano)

// Utilitário de Síntese de Voz (Garantia de pt-PT sem erros de Media)
// Utilitário de Síntese de Voz (Garantia de pt-PT sem erros de Media)
function speakWord(text) {
  if (!text) return;

  // 1. Tenta a síntese nativa do browser prioritariamente se existir voz pt-PT
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();

    const ptPtVoice = voices.find(v => 
      (v.lang === 'pt-PT' || v.lang === 'pt_PT' || v.name.includes('Portugal')) &&
      !v.lang.toUpperCase().includes('BR') &&
      !v.name.toUpperCase().includes('BRAZIL') &&
      !v.name.toUpperCase().includes('BRASIL')
    );

    if (ptPtVoice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = ptPtVoice;
      utterance.lang = 'pt-PT';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
      return;
    }
  }

  // 2. Fallback remoto de alta fidelidade em pt-PT (Serviço de voz europeia nativo)
  const cleanText = encodeURIComponent(text);
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=pt-PT&client=tw-ob`;

  const audio = new Audio();
  audio.src = audioUrl;

  // Tenta reproduzir diretamente com tratamento de exceções
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Se houver restrição do browser ou rede, força com a voz padrão em pt-PT nativa
      if ('speechSynthesis' in window) {
        const fallbackUtterance = new SpeechSynthesisUtterance(text);
        fallbackUtterance.lang = 'pt-PT';
        fallbackUtterance.rate = 0.85;
        window.speechSynthesis.speak(fallbackUtterance);
      }
    });
  }
}

// Garante o carregamento das vozes locais no arranque
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
  window.speechSynthesis.getVoices();
}
// -------------------------------------------------------------
// COMPONENTE DO MASCOTE MOCHO PICO 🦉
// -------------------------------------------------------------
function PicoHeader({ message, isSuccess = false }) {
  if (!message) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      backgroundColor: isSuccess ? '#ECFDF5' : '#FFFBEB',
      border: isSuccess ? '2px solid #10B981' : '2px solid #F59E0B',
      borderRadius: '16px',
      padding: '14px 18px',
      marginBottom: '20px',
      maxWidth: '550px',
      margin: '0 auto 24px auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div 
        onClick={() => speakWord(message)}
        title="Ouve o Mocho Pico!"
        style={{ 
          fontSize: '3rem', 
          cursor: 'pointer',
          lineHeight: '1',
          transition: 'transform 0.2s'
        }}
      >
        🦉
      </div>
      <div style={{ flexGrow: 1, textAlign: 'left' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isSuccess ? '#059669' : '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Mocho Pico diz:
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#1F2937', marginTop: '2px' }}>
          "{message}"
        </div>
      </div>
      <button 
        type="button" 
        onClick={() => speakWord(message)}
        className="btn btn-outline"
        style={{ padding: '8px 12px', borderRadius: '50%', fontSize: '1.1rem' }}
      >
        🔊
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENTES 1.º ANO
// -------------------------------------------------------------

// 1.º Ano - Módulo 1: Descobrir Palavras
function Grade1Module1({ words }) {
  const [selectedWord, setSelectedWord] = React.useState(null);
  const [showText, setShowText] = React.useState(false);

  const handleSelectWord = (w) => {
    setSelectedWord(w);
    setShowText(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <PicoHeader message="Escolhe um emoji para descobrires como se escreve e como se diz!" />

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

// 1.º e 2.º Ano - Módulo de Letra em Falta
function MissingLetterList({ words, onComplete }) {
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
  const [picoState, setPicoState] = React.useState({
    message: "Completa a letra que falta em cada palavra!",
    isSuccess: false
  });

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
      const successMsg = "Excelente! Completaste todas as letras certas!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);
      if (onComplete) onComplete();
    } else {
      const retryMsg = "Quase lá! Revisa as letras que estão a vermelho.";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

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
  const [picoState, setPicoState] = React.useState({
    message: "Escolhe a palavra correta para preencher cada frase!",
    isSuccess: false
  });

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
      const successMsg = "Muito bem! Preencheste todas as frases corretamente!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);
      if (onComplete) onComplete();
    } else {
      const retryMsg = "Tenta outra vez nas frases que precisam de correção!";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

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
            <div style={{ fontSize: '1.2rem', marginBottom: '12px' }}>
              <span>{beforeText}</span>
              <span style={{ fontWeight: 'bold', color: '#2563EB', padding: '0 8px', textDecoration: 'underline' }}>
                {selectedAnswers[w.id] ? `${selectedAnswers[w.id].emoji} ${selectedAnswers[w.id].word}` : "________"}
              </span>
              <span>{afterText}</span>
            </div>

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
  const [picoState, setPicoState] = React.useState({
    message: "Escreve o nome correspondente a cada emoji!",
    isSuccess: false
  });

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
      const successMsg = "Espetacular! Escreveste todas as palavras corretamente!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);
      if (onComplete) onComplete();
    } else {
      const retryMsg = "Confere a ortografia das palavras marcadas a vermelho.";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

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

// 2.º Ano - Módulo 3: Frases com Emojis (Aluno escreve o nome)
function Grade2Module3({ words, onComplete }) {
  const sentenceWords = React.useMemo(() => words.slice(0, 5), [words]);
  const [userInputs, setUserInputs] = React.useState({});
  const [results, setResults] = React.useState({});
  const [picoState, setPicoState] = React.useState({
    message: "Escreve o nome do emoji para completar cada frase!",
    isSuccess: false
  });

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
      const successMsg = "Parabéns! Escreveste o nome de todos os emojis nas frases!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);
      if (onComplete) onComplete();
    } else {
      const retryMsg = "Há palavras por corrigir. Tenta outra vez!";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

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

// =============================================================
// COMPONENTES 3.º E 4.º ANO (PLNN)
// =============================================================

// 3.º Ano - Módulo 1: Concordância e Flexão (Gênero, Número e Tempo)
function Grade3Module1({ exercises, onComplete }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [picoState, setPicoState] = React.useState({
    message: exercises[0]?.prompt || "Escolhe a palavra correta para completar a frase!",
    isSuccess: false
  });

  const currentEx = exercises[currentIndex];
  if (!currentEx) return null;

  const content = typeof currentEx.content === 'string' 
    ? JSON.parse(currentEx.content) 
    : currentEx.content;

  const handleSelectOption = (opt) => {
    setSelectedOption(opt);
    setResult(null);
  };

  const handleCheck = () => {
    if (!selectedOption) return;

    const isCorrect = selectedOption === content.correct_option;
    setResult(isCorrect);

    if (isCorrect) {
      const successMsg = "Excelente! A concordância está perfeita!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);

      setTimeout(() => {
        if (currentIndex + 1 < exercises.length) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setResult(null);
          setPicoState({ 
            message: exercises[currentIndex + 1]?.prompt || "Escolhe a palavra correta!", 
            isSuccess: false 
          });
        } else {
          if (onComplete) onComplete();
        }
      }, 1800);
    } else {
      const retryMsg = "Quase lá! Tenta outra opção para fazer sentido.";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  const sentenceParts = content.sentence_template.split('___');

  return (
    <div style={{ padding: '16px', maxWidth: '550px', margin: '0 auto', textAlign: 'center' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

      <div style={{
        backgroundColor: '#FAFAFA',
        border: '2px solid #E5E7EB',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '1.3rem', fontWeight: '500', color: '#1F2937', marginBottom: '20px' }}>
          <span>{sentenceParts[0]}</span>
          <span style={{
            display: 'inline-block',
            minWidth: '100px',
            borderBottom: '3px solid #3B82F6',
            color: '#2563EB',
            fontWeight: 'bold',
            padding: '0 8px'
          }}>
            {selectedOption || "____?"}
          </span>
          <span>{sentenceParts[1]}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {content.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className="btn btn-outline"
              style={{
                fontSize: '1.1rem',
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: selectedOption === opt ? '#DBEAFE' : '#FFFFFF',
                borderColor: selectedOption === opt ? '#2563EB' : '#D1D5DB',
                fontWeight: selectedOption === opt ? 'bold' : 'normal'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => speakWord(content.full_sentence)}
          className="btn btn-outline"
          style={{ fontSize: '1rem', padding: '10px 16px' }}
        >
          🔊 Ouvir Frase
        </button>

        <button
          type="button"
          onClick={handleCheck}
          disabled={!selectedOption}
          className="btn btn-primary"
          style={{ fontSize: '1rem', padding: '10px 24px', opacity: selectedOption ? 1 : 0.6 }}
        >
          Verificar
        </button>
      </div>
    </div>
  );
}

// 3.º Ano - Módulo 2: Reconstituição e Ordem Frásica (Puzzle de Sintaxe)
function Grade3Module2({ exercises, onComplete }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentEx = exercises[currentIndex];
  
  if (!currentEx) return null;

  const content = typeof currentEx.content === 'string' 
    ? JSON.parse(currentEx.content) 
    : currentEx.content;

  const [availableWords, setAvailableWords] = React.useState(content.scrambled);
  const [builtSentence, setBuiltSentence] = React.useState([]);
  const [picoState, setPicoState] = React.useState({
    message: currentEx.prompt || "Clica nas palavras pela ordem correta!",
    isSuccess: false
  });

  const handleAddWord = (word, index) => {
    setBuiltSentence(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWord = (word, index) => {
    setAvailableWords(prev => [...prev, word]);
    setBuiltSentence(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerify = () => {
    const isCorrect = JSON.stringify(builtSentence) === JSON.stringify(content.correct_order);

    if (isCorrect) {
      const successMsg = "Fantástico! A frase está perfeitamente ordenada!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(content.full_sentence);

      setTimeout(() => {
        if (currentIndex + 1 < exercises.length) {
          const nextEx = exercises[currentIndex + 1];
          const nextContent = typeof nextEx.content === 'string' ? JSON.parse(nextEx.content) : nextEx.content;
          setCurrentIndex(prev => prev + 1);
          setAvailableWords(nextContent.scrambled);
          setBuiltSentence([]);
          setPicoState({ message: nextEx.prompt || "Organiza a próxima frase!", isSuccess: false });
        } else {
          if (onComplete) onComplete();
        }
      }, 2000);
    } else {
      const retryMsg = "A ordem ainda não está certa. Clica nas palavras para ajustar!";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

      {/* Área da Frase a ser Construída */}
      <div style={{
        minHeight: '70px',
        backgroundColor: '#F3F4F6',
        border: '2px dashed #9CA3AF',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        {builtSentence.length === 0 && (
          <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            Clica nas palavras abaixo para construir a frase...
          </span>
        )}
        {builtSentence.map((word, idx) => (
          <button
            key={idx}
            onClick={() => handleRemoveWord(word, idx)}
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '8px 14px', borderRadius: '8px' }}
          >
            {word} ✕
          </button>
        ))}
      </div>

      {/* Palavras Disponíveis */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
        {availableWords.map((word, idx) => (
          <button
            key={idx}
            onClick={() => handleAddWord(word, idx)}
            className="btn btn-outline"
            style={{ fontSize: '1.1rem', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}
          >
            {word}
          </button>
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={availableWords.length > 0}
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: '1.1rem', opacity: availableWords.length === 0 ? 1 : 0.6 }}
      >
        Verificar Frase
      </button>
    </div>
  );
}

// 4.º Ano - Módulo 3: Leitura e Interpretação de Microtextos
function Grade4Module3({ exercises, onComplete }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const currentEx = exercises[currentIndex];

  if (!currentEx) return null;

  const content = typeof currentEx.content === 'string' 
    ? JSON.parse(currentEx.content) 
    : currentEx.content;

  const [answers, setAnswers] = React.useState({});
  const [picoState, setPicoState] = React.useState({
    message: currentEx.prompt || "Lê o texto com atenção e responde às perguntas!",
    isSuccess: false
  });

  const handleSelectAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleVerify = () => {
    let allCorrect = true;

    content.questions.forEach(q => {
      if (answers[q.id] !== q.answer) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      const successMsg = "Excelente interpretação! Acertaste em todas as respostas!";
      setPicoState({ message: successMsg, isSuccess: true });
      speakWord(successMsg);

      setTimeout(() => {
        if (currentIndex + 1 < exercises.length) {
          setCurrentIndex(prev => prev + 1);
          setAnswers({});
          setPicoState({ message: "Lê o novo texto com atenção!", isSuccess: false });
        } else {
          if (onComplete) onComplete();
        }
      }, 2000);
    } else {
      const retryMsg = "Há respostas por corrigir. Lê o texto novamente com atenção!";
      setPicoState({ message: retryMsg, isSuccess: false });
      speakWord(retryMsg);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '650px', margin: '0 auto' }}>
      <PicoHeader message={picoState.message} isSuccess={picoState.isSuccess} />

      {/* Cartão de Leitura do Texto */}
      <div style={{
        backgroundColor: '#FFFBEB',
        border: '2px solid #F59E0B',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#D97706', fontSize: '1.2rem' }}>📖 {currentEx.title}</h3>
          <button
            onClick={() => speakWord(content.text)}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.9rem' }}
          >
            🔊 Ouvir Texto
          </button>
        </div>
        <p style={{ fontSize: '1.15rem', lineHeight: '1.6', color: '#1F2937', margin: 0 }}>
          {content.text}
        </p>
      </div>

      {/* Lista de Perguntas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {content.questions.map((q, qIdx) => (
          <div key={q.id} style={{ backgroundColor: '#FAFAFA', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#111827', marginBottom: '12px' }}>
              {qIdx + 1}. {q.question}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectAnswer(q.id, opt)}
                  className="btn btn-outline"
                  style={{
                    padding: '8px 14px',
                    fontSize: '1rem',
                    backgroundColor: answers[q.id] === opt ? '#DBEAFE' : '#FFFFFF',
                    borderColor: answers[q.id] === opt ? '#2563EB' : '#D1D5DB',
                    fontWeight: answers[q.id] === opt ? 'bold' : 'normal'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={Object.keys(answers).length < content.questions.length}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '1.1rem',
          opacity: Object.keys(answers).length === content.questions.length ? 1 : 0.6
        }}
      >
        Verificar Respostas
      </button>
    </div>
  );
}
