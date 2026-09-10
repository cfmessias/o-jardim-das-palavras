// exercises.js - Arquitetura de Módulos e Exercícios Dinâmicos

// 1. Definição Central de Módulos por Ano Escolar
const GAME_MODULES = [
  {
    id: 1,
    title: "Módulo 1: Descobrir e Construir",
    description: "Reconhecimento visual, ordenação de letras e frases simples",
    minGrade: 1
  },
  {
    id: 2,
    title: "Módulo 2: Ouvir e Decompor",
    description: "Ditado (Ouve e Escreve), divisão silábica e letra em falta",
    minGrade: 1
  },
  {
    id: 3,
    title: "Módulo 3: Desafios Visuais",
    description: "Jogo da memória e associação palavra-imagem",
    minGrade: 1
  },
  {
    id: 4,
    title: "Módulo 4: Gramática e Ortografia Avançada",
    description: "Singular/Plural, Sinónimos/Antónimos e Caça ao Erro",
    minGrade: 3 // Restrito a partir do 3.º Ano
  }
];

// 2. Utilitário de Síntese de Voz (pt-PT)
function speakWord(text) {
  if (!('speechSynthesis' in window)) return;
  
  // Cancela áudios pendentes para não sobrepor
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-PT';
  utterance.rate = 0.8; // Velocidade ligeiramente mais pausada para crianças
  utterance.pitch = 1.0; // Afinação natural

  const voices = window.speechSynthesis.getVoices();

  // 1. Procura prioritariamente por vozes explícitas pt-PT ou de Portugal
  const ptPtVoice = voices.find(v => 
    v.lang === 'pt-PT' || 
    v.lang === 'pt_PT' || 
    v.name.includes('Portugal') || 
    v.name.includes('Portuguese (Portugal)') ||
    (v.lang.startsWith('pt') && !v.lang.includes('BR') && !v.name.includes('Brazil'))
  );

  if (ptPtVoice) {
    utterance.voice = ptPtVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// Carregamento assíncrono obrigatorio para browsers baseados em Chromium (Chrome/Edge/Brave)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
// Força o pré-carregamento das vozes do browser
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// 3. EXERCÍCIO 1 (Módulo 2): Ouve e Escreve (Ditado)
function ListenAndWriteExercise({ word, onSuccess }) {
  const [userInput, setUserInput] = React.useState("");
  const [feedback, setFeedback] = React.useState(null);

  React.useEffect(() => {
    speakWord(word.word);
  }, [word]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.trim().toLowerCase() === word.word.trim().toLowerCase()) {
      setFeedback('correct');
      speakWord("Muito bem!");
      setTimeout(() => {
        setFeedback(null);
        setUserInput("");
        onSuccess();
      }, 1200);
    } else {
      setFeedback('incorrect');
      speakWord("Tenta outra vez.");
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px', maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => speakWord(word.word)}
          className="btn btn-primary"
          style={{ fontSize: '1.2rem', padding: '14px 24px', borderRadius: '50px' }}
        >
          🔊 Ouvir a Palavra
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Escreve o que ouviste..."
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            if (feedback) setFeedback(null);
          }}
          autoComplete="off"
          autoFocus
          style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '12px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Verificar Ortografia
        </button>
      </form>

      {feedback === 'correct' && <p style={{ color: '#10B981', fontWeight: 'bold', marginTop: '12px' }}>✨ Boa! Escreveste corretamente!</p>}
      {feedback === 'incorrect' && <p style={{ color: '#EF4444', fontWeight: 'bold', marginTop: '12px' }}>❌ Não está bem. Ouve novamente e corrige.</p>}
    </div>
  );
}

// 4. EXERCÍCIO 2 (Módulo 2): Divisão Silábica (Bater Palmas / Seleção)
function SyllablesExercise({ word, onSuccess }) {
  // Exemplo básico de divisão silábica por hífen ou fallback por tamanho
  const syllables = word.syllables ? word.syllables.split('-') : [word.word];
  const [selectedSyllables, setSelectedSyllables] = React.useState([]);

  const handleSyllableClick = (syllable, index) => {
    speakWord(syllable);
    const updated = [...selectedSyllables, { syllable, index }];
    setSelectedSyllables(updated);

    if (updated.length === syllables.length) {
      const assembled = updated.map(item => item.syllable).join('');
      if (assembled.toLowerCase() === word.word.toLowerCase()) {
        setTimeout(() => {
          speakWord("Excelente divisão!");
          onSuccess();
        }, 500);
      } else {
        setTimeout(() => {
          alert("A ordem das sílabas não está correta. Tenta novamente!");
          setSelectedSyllables([]);
        }, 500);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <p style={{ fontSize: '1.1rem', color: '#4B5563', marginBottom: '16px' }}>
        Clica nas sílabas pela ordem certa para juntares a palavra:
      </p>

      {/* Sílabas já selecionadas */}
      <div style={{ minHeight: '48px', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {selectedSyllables.map((item, i) => (
          <span key={i} style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '6px 12px', backgroundColor: '#FEF3C7', borderRadius: '8px', color: '#D97706' }}>
            {item.syllable}
          </span>
        ))}
      </div>

      {/* Botões das Sílabas */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {syllables.map((syllablesItem, idx) => {
          const isUsed = selectedSyllables.some(s => s.index === idx);
          return (
            <button
              key={idx}
              disabled={isUsed}
              onClick={() => handleSyllableClick(syllablesItem, idx)}
              className="btn btn-outline"
              style={{ fontSize: '1.3rem', padding: '12px 20px', opacity: isUsed ? 0.4 : 1 }}
            >
              {syllablesItem} 👏
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 5. EXERCÍCIO 3 (Módulo 2): Letra em Falta
function MissingLetterExercise({ word, onSuccess }) {
  const targetWord = word.word.toUpperCase();
  // Escolhe uma posição aleatória para ocultar
  const [missingIndex] = React.useState(Math.floor(Math.random() * targetWord.length));
  const missingLetter = targetWord[missingIndex];

  // Gera 3 opções (a correta + 2 letras aleatórias)
  const [options] = React.useState(() => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const wrong = alphabet.replace(missingLetter, '').split('').sort(() => 0.5 - Math.random()).slice(0, 2);
    return [missingLetter, ...wrong].sort(() => 0.5 - Math.random());
  });

  const displayWord = targetWord.split('').map((char, index) => index === missingIndex ? '_' : char).join(' ');

  const handleOptionClick = (letter) => {
    if (letter === missingLetter) {
      speakWord("Correto!");
      onSuccess();
    } else {
      speakWord("Tenta outra letra.");
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <p style={{ fontSize: '1.1rem', color: '#4B5563', marginBottom: '16px' }}>Qual é a letra que falta?</p>
      
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '4px', marginBottom: '24px', color: '#1F2937' }}>
        {displayWord}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {options.map((letter, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(letter)}
            className="btn btn-primary"
            style={{ fontSize: '1.5rem', width: '56px', height: '56px', padding: 0 }}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
