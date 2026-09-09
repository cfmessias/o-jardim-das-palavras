// app.js - Fluxo principal, Estado Global e Inicialização

const { useState, useEffect } = React;

function App() {
  // Estado Global
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [regSchool, setRegSchool] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(1)
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [words, setWords] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentWord, setCurrentWord] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [currentView, setCurrentView] = useState("student_select");

  // Formulários
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPin, setNewStudentPin] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("1");

  const [dashboardTab, setDashboardTab] = useState("alunos");
  const [allWords, setAllWords] = useState([]);
  const [editingWordId, setEditingWordId] = useState(null);
  const [wordText, setWordText] = useState("");
  const [wordGrade, setWordGrade] = useState("1");
  const [wordEmoji, setWordEmoji] = useState("");
  const [wordHint, setWordHint] = useState("");
  const [wordBlankBefore, setWordBlankBefore] = useState("");
  const [wordBlankAfter, setWordBlankAfter] = useState("");
  const [savingWord, setSavingWord] = useState(false);

  // Carregar alunos e sessão ao iniciar
  useEffect(() => {
    async function initApp() {
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) setStudents(data);

      const savedTeacher = getStoredTeacherSession();
      if (savedTeacher) {
        setTeacher(savedTeacher);
      }
    }
    initApp();
  }, []);

  const loadTeacherStudents = async (teacherId) => {
    const list = await getStudentsByTeacher(teacherId);
    setStudents(list);
  };

  // Ações do Professor
  const handleLogout = async () => {
    await logoutTeacher();
    setTeacher(null);
    setSelectedStudent(null);
    const { data } = await supabase.from('students').select('*').order('name');
    if (data) setStudents(data);
    setCurrentView("student_select");
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!teacher) return;
    try {
      const created = await createStudent(teacher.id, newStudentName, newStudentPin, newStudentGrade);
      setStudents([...students, created]);
      setNewStudentName("");
      setNewStudentPin("");
    } catch (err) {
      alert("Erro ao criar aluno: " + err.message);
    }
  };

  // Ações do professor sobre as palavras
  const clearWordForm = () => {
    setEditingWordId(null);
    setWordText("");
    setWordGrade("1");
    setWordEmoji("");
    setWordHint("");
    setWordBlankBefore("");
    setWordBlankAfter("");
  };

  const openWordsTab = async () => {
    setDashboardTab("palavras");
    setAllWords(await getAllWords());
  };

  const startEditWord = (w) => {
    setEditingWordId(w.id);
    setWordText(w.word);
    setWordGrade(String(w.grade));
    setWordEmoji(w.emoji || "");
    setWordHint(w.hint || "");
    setWordBlankBefore(w.blank_before || "");
    setWordBlankAfter(w.blank_after || "");
  };

  const handleWordSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      word: wordText.trim(),
      grade: wordGrade,
      emoji: wordEmoji.trim(),
      hint: wordHint.trim(),
      blankBefore: wordBlankBefore,
      blankAfter: wordBlankAfter,
    };

    if (!payload.word || !payload.emoji || !payload.hint) return;

    setSavingWord(true);
    try {
      if (editingWordId) {
        await updateWord(editingWordId, payload);
      } else {
        await createWord(payload);
      }
      clearWordForm();
      setAllWords(await getAllWords());
    } catch (err) {
      alert("Erro ao guardar palavra: " + err.message);
    } finally {
      setSavingWord(false);
    }
  };

  const handleDeleteWord = async (id) => {
    if (!confirm("Remover esta palavra? O progresso dos alunos nesta palavra também será apagado.")) {
      return;
    }
    await deleteWord(id);
    setAllWords(await getAllWords());
  };

  // Ações do Aluno
  const handleSelectStudent = async (student) => {
    const pin = prompt(`Digita o PIN para entrar como ${student.name}:`);
    if (!pin) return;

    const validated = await verifyStudentPin(student.id, pin);
    if (!validated) {
      alert("PIN incorreto!");
      return;
    }

    setSelectedStudent(validated);
    const studentWords = await getWordsByGrade(validated.grade);
    const studentProgress = await getStudentProgress(validated.id);

    setWords(studentWords);
    setProgress(studentProgress);
    setCurrentView("game");
  };

  const handleStageComplete = async (nextStage, writtenSentence = null) => {
    if (!selectedStudent || !currentWord) return;

    await saveStudentProgress(selectedStudent.id, currentWord.id, nextStage, writtenSentence);
    
    setProgress((prev) => ({
      ...prev,
      [currentWord.id]: {
        ...prev[currentWord.id],
        stage: nextStage,
        written_sentence: writtenSentence || prev[currentWord.id]?.written_sentence
      }
    }));
  };

  const totalStars = Object.values(progress).reduce((acc, curr) => acc + (curr.stage || 0), 0);
  const filteredStudents = students.filter(s => Number(s.grade) === Number(selectedGrade));

  // 1. ECRÃ INICIAL: Seleção do Aluno
  if (currentView === "student_select") {
    return (
      <div className="container">
        <div className="card">
          <h2>🤓 Quem vai jogar hoje?</h2>
          <p className="subtitle">Escolhe o teu ano e depois o teu nome na lista da turma.</p>

          <div className="grade-selector" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '20px 0' }}>
            {[1, 2, 3, 4, 5, 6].map((grade) => {
              const isActive = Number(selectedGrade) === grade;
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setSelectedGrade(grade)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '25px',
                    border: isActive ? '2px solid #F2704E' : '1px solid #D1D5DB',
                    backgroundColor: isActive ? '#FFF0ED' : '#FFFFFF',
                    color: isActive ? '#F2704E' : '#374151',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {grade}.º Ano
                </button>
              );
            })}
          </div>

          {filteredStudents.length > 0 ? (
            <div className="students-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  className="btn btn-outline student-card-btn"
                  onClick={() => handleSelectStudent(s)}
                  style={{ padding: '10px 22px', borderRadius: '25px' }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>{s.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-message" style={{ margin: '24px 0', color: '#666' }}>
              Ainda não há alunos registados neste ano. Pede ao professor para te adicionar.
            </p>
          )}

          <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <button
            className="link-btn"
            onClick={() => setCurrentView(teacher ? "dashboard" : "auth")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97706' }}
          >
            🦉 Acesso do professor
          </button>
        </div>
      </div>
    );
  }

  // 2. ECRÃ: Autenticação do Professor
  if (currentView === "auth") {
    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      try {
        if (isRegistering) {
          const newTeacher = await registerTeacher(loginEmail, loginPin, regName, regSchool);
          alert("Conta de professor criada com sucesso!");
          setTeacher(newTeacher);
          saveTeacherSession(newTeacher);
          await loadTeacherStudents(newTeacher.id);
          setCurrentView("dashboard");
        } else {
          const loggedTeacher = await loginTeacher(loginEmail, loginPin);
          setTeacher(loggedTeacher);
          saveTeacherSession(loggedTeacher);
          await loadTeacherStudents(loggedTeacher.id);
          setCurrentView("dashboard");
        }
      } catch (err) {
        alert("Erro na autenticação: " + err.message);
      }
    };

    return (
      <div className="container">
        <div className="card">
          <h1>🌿 O Jardim das Palavras</h1>
          <h3>{isRegistering ? "Criar Conta de Professor" : "Área Reservada aos Professores"}</h3>
          
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {isRegistering && (
              <React.Fragment>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome Completo"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Escola / Agrupamento"
                  value={regSchool}
                  onChange={(e) => setRegSchool(e.target.value)}
                  required
                />
              </React.Fragment>
            )}
            
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input"
              placeholder="PIN (4 dígitos)"
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              required
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">
                {isRegistering ? "Registar e Entrar" : "Entrar"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setCurrentView("student_select")}>
                Voltar
              </button>
            </div>
          </form>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <button
            type="button"
            className="link-btn"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: '0.95rem' }}
          >
            {isRegistering ? "Já tens conta? Faz login aqui." : "Ainda não tens conta? Regista-te aqui."}
          </button>
        </div>
      </div>
    );
  }

  // 3. ECRÃ: Painel do Professor (Dashboard)
  if (currentView === "dashboard") {
    return (
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>👨‍🏫Painel do Professor</h2>
            <button onClick={handleLogout} className="btn btn-outline">Sair</button>
          </div>
          <p>Prof. {teacher?.name} ({teacher?.school || "Escola"})</p>

          <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
            <button
              type="button"
              className={`btn ${dashboardTab === "alunos" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setDashboardTab("alunos")}
            >
              Alunos
            </button>
            <button
              type="button"
              className={`btn ${dashboardTab === "palavras" ? "btn-primary" : "btn-outline"}`}
              onClick={openWordsTab}
            >
              Gerir palavras
            </button>
          </div>

          <hr style={{ margin: '16px 0' }} />

          {dashboardTab === "alunos" && (
            <React.Fragment>
              <h3>Criar Novo Aluno</h3>

              {/* autoComplete="off" e labels previnem que o browser preencha com os dados do professor */}
              <form 
                onSubmit={handleCreateStudent} 
                autoComplete="off"
                style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end', marginTop: '12px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Nome do Aluno</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Zé Maria"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>PIN do Aluno</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    placeholder="Ex: 1234"
                    value={newStudentPin}
                    onChange={(e) => setNewStudentPin(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Ano Escolar</label>
                  <select className="input" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)}>
                    <option value="1">1.º Ano</option>
                    <option value="2">2.º Ano</option>
                    <option value="3">3.º Ano</option>
                    <option value="4">4.º Ano</option>
                    <option value="5">5.º Ano</option>
                    <option value="6">6.º Ano</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Adicionar</button>
              </form>

              <hr style={{ margin: '24px 0' }} />

              <h3>Alunos Registados ({students.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {students.map((student) => (
                  <div key={student.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>{student.name}</h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{student.grade}.º Ano</p>
                  </div>
                ))}
              </div>

              <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => setCurrentView("student_select")}>
                Ver Visão do Aluno
              </button>
            </React.Fragment>
          )}

          {dashboardTab === "palavras" && (
            <React.Fragment>
              <h3>{editingWordId ? "Editar Palavra" : "Criar Nova Palavra"}</h3>

              <form
                onSubmit={handleWordSubmit}
                autoComplete="off"
                style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr', marginTop: '12px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Palavra</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: gato"
                    value={wordText}
                    onChange={(e) => setWordText(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Ano Escolar</label>
                  <select className="input" value={wordGrade} onChange={(e) => setWordGrade(e.target.value)}>
                    <option value="1">1.º Ano</option>
                    <option value="2">2.º Ano</option>
                    <option value="3">3.º Ano</option>
                    <option value="4">4.º Ano</option>
                    <option value="5">5.º Ano</option>
                    <option value="6">6.º Ano</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Emoji</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: 🐱"
                    value={wordEmoji}
                    onChange={(e) => setWordEmoji(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Dica</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: Animal doméstico que mia."
                    value={wordHint}
                    onChange={(e) => setWordHint(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Início da frase</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: O "
                    value={wordBlankBefore}
                    onChange={(e) => setWordBlankBefore(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Fim da frase</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex:  dorme no sofá."
                    value={wordBlankAfter}
                    onChange={(e) => setWordBlankAfter(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingWord}>
                    {editingWordId ? "Guardar alterações" : "Adicionar palavra"}
                  </button>

                  {editingWordId && (
                    <button type="button" className="btn btn-outline" onClick={clearWordForm}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>

              <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '0.85rem' }}>
                Pré-visualização da frase: "{wordBlankBefore}<strong>{wordText || "..."}</strong>{wordBlankAfter}"
              </p>

              <hr style={{ margin: '24px 0' }} />

              <h3>Palavras Registadas ({allWords.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {allWords.map((w) => (
                  <div key={w.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>{w.emoji} {w.word}</h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>{w.grade}.º Ano</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="button" className="link-btn" onClick={() => startEditWord(w)}>Editar</button>
                      <button type="button" className="link-btn" onClick={() => handleDeleteWord(w.id)}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }

  // 4. ECRÃ: Visão do Aluno / Jogo
  if (currentView === "game") {
    // 1. Obtém o ano do aluno (usa selectedStudent com fallback de segurança para 1)
    const studentGrade = selectedStudent?.grade || 1;

    // 2. Filtra os módulos disponíveis com base no ano escolar do aluno
    const availableModules = GAME_MODULES.filter(m => studentGrade >= m.minGrade);
    const activeModuleId = selectedModuleId || 1;
    const currentModule = GAME_MODULES.find(m => m.id === activeModuleId) || GAME_MODULES[0];

    // 3. Filtra palavras pelo ano e pelo tema selecionado
    const currentGradeWords = words.filter(w => w.grade === studentGrade);
    const availableThemes = [...new Set(currentGradeWords.map(w => w.theme || "Geral"))];
    const activeTheme = selectedTheme || availableThemes[0] || "Geral";
    const filteredWords = currentGradeWords.filter(w => (w.theme || "Geral") === activeTheme);

    return (
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <div className="card" style={{ padding: '24px' }}>
          
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Jardim de {selectedStudent?.name}</h2>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {studentGrade}.º Ano • ⭐ {Object.keys(progress || {}).length} Concluídas
              </span>
            </div>

            {/* Ação: Se houver professor faz "Voltar ao Painel", senão faz "Sair" */}
            {teacher ? (
              <button onClick={() => setCurrentView("dashboard")} className="btn btn-outline">
                ← Voltar ao Painel
              </button>
            ) : (
              <button 
                onClick={() => { 
                  setSelectedStudent(null); 
                  setCurrentView("student_select"); 
                }} 
                className="btn btn-outline"
              >
                Sair
              </button>
            )}
          </div>

          {/* SELETOR DE MÓDULOS */}
          <div style={{ marginBottom: '20px', backgroundColor: '#F3F4F6', padding: '12px', borderRadius: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4B5563', display: 'block', marginBottom: '8px' }}>
              Escolhe o Módulo de Aprendizagem:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`btn ${activeModuleId === mod.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    backgroundColor: activeModuleId === mod.id ? '#F2704E' : '#FFFFFF',
                    color: activeModuleId === mod.id ? '#FFFFFF' : '#374151',
                    fontSize: '0.9rem'
                  }}
                >
                  {mod.title}
                </button>
              ))}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
              {currentModule.description}
            </p>
          </div>

          {/* SELETOR DE TEMAS */}
          {availableThemes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {availableThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`btn ${activeTheme === theme ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    backgroundColor: activeTheme === theme ? '#3B82F6' : '#FFFFFF',
                    color: activeTheme === theme ? '#FFFFFF' : '#374151',
                    borderColor: '#E5E7EB'
                  }}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}

          <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #E5E7EB' }} />

          {/* GRELHA DE PALAVRAS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {filteredWords.map((word) => {
              const isCompleted = !!(progress && progress[word.id]);
              return (
                <div
                  key={word.id}
                  onClick={() => {
                    setCurrentWord(word);
                    setCurrentView("exercise");
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isCompleted ? '#10B981' : '#E5E7EB',
                    backgroundColor: isCompleted ? '#ECFDF5' : '#FAFAFA',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{word.emoji || "🌻"}</div>
                  <div style={{ fontWeight: 'bold', color: '#111827' }}>{word.word}</div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  // 5. ECRÃ: Execução do Exercício
  if (currentView === "exercise" && currentWord) {
    const activeModuleId = selectedModuleId || 1;

    return (
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        <div className="card">
          <button 
            onClick={() => setCurrentView("game")} 
            className="btn btn-outline" 
            style={{ marginBottom: '16px' }}
          >
            ← Voltar às Palavras
          </button>

          {/* Módulo 1: Fluxo Tradicional */}
          {activeModuleId === 1 && (
            <ActivityStages 
              word={currentWord} 
              stage={(progress && progress[currentWord.id]) || 0}
              onComplete={(stageCompleted, sentence) => {
                if (typeof saveProgress === 'function') {
                  saveProgress(selectedStudent.id, currentWord.id, stageCompleted, sentence);
                }
              }}
            />
          )}

          {/* Módulo 2: Ditado, Sílabas e Letra em Falta */}
          {activeModuleId === 2 && (
            <div>
              <h3 style={{ textAlign: 'center', color: '#374151' }}>Módulo 2: Ditado & Ortografia</h3>
              <ListenAndWriteExercise 
                word={currentWord} 
                onSuccess={() => {
                  if (typeof saveProgress === 'function') {
                    saveProgress(selectedStudent.id, currentWord.id, 3, "Concluído via Ditado");
                  }
                  alert("Excelente! Ganhaste mais 1 estrela! ⭐");
                  setCurrentView("game");
                }} 
              />
            </div>
          )}

          {/* Módulo 4: Desafios Visuais */}
          {activeModuleId === 4 && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h3>Módulo 4: Desafio Visual</h3>
              <div style={{ fontSize: '4rem', margin: '20px 0' }}>{currentWord.emoji}</div>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentWord.word}</p>
              <button 
                onClick={() => {
                  if (typeof saveProgress === 'function') {
                    saveProgress(selectedStudent.id, currentWord.id, 3, "Concluído via Desafio Visual");
                  }
                  setCurrentView("game");
                }} 
                className="btn btn-primary"
              >
                Concluir Desafio ⭐
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }}
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.render(<App />, rootElement);
}
