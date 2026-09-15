// app.js - Fluxo principal, Estado Global e Inicialização (Com Suporte PLNN A1-B2)

const { useState, useEffect } = React;

function App() {
 // Verifica se o URL contém "?prof"
  const isProfUrl = window.location.search.includes("prof");

  // Estado Global
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [regSchool, setRegSchool] = useState("");

  // Só carrega o professor do localStorage se estivermos no URL "?prof"
  const [teacher, setTeacher] = useState(() => {
    if (!isProfUrl) return null;
    const saved = localStorage.getItem("jardim_teacher");
    return saved ? JSON.parse(saved) : null;
  });

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState(1); 
  const [newStudentPlnnLevel, setNewStudentPlnnLevel] = useState("A1");
  const [words, setWords] = useState([]);
  const [plnnExercises, setPlnnExercises] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentWord, setCurrentWord] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPlnnLevel, setSelectedPlnnLevel] = useState("A1");
 
  // Define a vista inicial: se for URL de prof e já tiver sessão, vai para o dashboard; senão login ou alunos
  const [currentView, setCurrentView] = useState(() => {
    if (isProfUrl) {
      const saved = localStorage.getItem("jardim_teacher");
      return saved ? "dashboard" : "teacher_login";
    }
    return "student_select";
  });

  const [editingStudentId, setEditingStudentId] = useState(null);
  // Formulários do Professor
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

  const [wordPlnnLevel, setWordPlnnLevel] = useState("A1");
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
 // Preenche o formulário com os dados do aluno a editar
  const startEditStudent = (student) => {
    setEditingStudentId(student.id);
    setNewStudentName(student.name);
    setNewStudentPin(student.pin || "");
    setNewStudentGrade(student.grade?.toString() || "1");
    setNewStudentPlnnLevel(student.plnn_level || "A1");
  };
  
  // Limpa o formulário e cancela o modo de edição
  const clearStudentForm = () => {
    setEditingStudentId(null);
    setNewStudentName("");
    setNewStudentPin("");
    setNewStudentGrade("1");
    setNewStudentPlnnLevel("A1");
  };
  
  // SUSTITUIR a função handleCreateStudent por esta:
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!teacher) return;

    try {
      const payload = {
        name: newStudentName,
        pin: newStudentPin,
        grade: Number(newStudentGrade),
        plnn_level: newStudentPlnnLevel,
        teacher_id: teacher.id
      };

      if (editingStudentId) {
        // Modo Edição: UPDATE na tabela 'students'
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingStudentId);

        if (error) throw error;
      } else {
        // Modo Criação: INSERT na tabela 'students'
        const { error } = await supabase
          .from('students')
          .insert([payload]);

        if (error) throw error;
      }

      // Recarrega a lista atualizada e limpa os campos
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) setStudents(data);
      clearStudentForm();

    } catch (err) {
      alert("Erro ao guardar aluno: " + err.message);
    }
  };

  
  const openWordsTab = async () => {
    setDashboardTab("palavras");
    setAllWords(await getAllWords());
  };
  
  const clearWordForm = () => {
  setEditingWordId(null);
  setWordText("");
  setWordGrade("1");
  setWordPlnnLevel("A1");
  setWordEmoji("");
  setWordHint("");
  setWordBlankBefore("");
  setWordBlankAfter("");
};

const startEditWord = (w) => {
  setEditingWordId(w.id);
  setWordText(w.word);
  setWordGrade(String(w.grade));
  setWordPlnnLevel(w.plnn_level || "A1");
  setWordEmoji(w.emoji || "");
  setWordHint(w.hint || "");
  setWordBlankBefore(w.blank_before || "");
  setWordBlankAfter(w.blank_after || "");
};

const handleWordSubmit = async (e) => {
  e.preventDefault();
  const payload = {
    word: wordText.trim(),
    grade: Number(wordGrade),
    plnn_level: wordPlnnLevel,
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

  // Ações do Aluno e Carregamento de Exercícios por Nível PLNN
  // REMOVER as funções: fetchPlnnExercises e handleLevelChange

// SUBSTITUIR a função handleSelectStudent por esta:
const handleSelectStudent = async (student) => {
  const pin = prompt(`Digita o teu PIN para entrar, ${student.name}:`);
  if (!pin) return;

  const validated = await verifyStudentPin(student.id, pin);
  if (!validated) {
    alert("PIN incorreto!");
    return;
  }

  setSelectedStudent(validated);
  const gradeNum = Number(validated.grade);
  // Lê diretamente o nível gravado na ficha do aluno
  const studentPlnnLevel = validated.plnn_level || "A1";

  if (gradeNum <= 2) {
    const studentWords = await getWordsByGrade(gradeNum);
    setWords(studentWords);
  } else {
    // Procura na tabela pelo ano e pelo nível atribuído ao aluno
    const { data } = await supabase
      .from('plnn_exercises')
      .select('*')
      .eq('grade', gradeNum)
      .eq('plnn_level', studentPlnnLevel)
      .order('id');

    setPlnnExercises(data || []);
  }

  const studentProgress = await getStudentProgress(validated.id);
  setProgress(studentProgress);
  setCurrentView("game");
};

   const handleModuleComplete = (moduleId) => {
    alert(`Módulo ${moduleId} concluído com sucesso! ⭐`);
  };

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
          {/* Cabeçalho do Professor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>👨‍🏫 Painel do Professor</h2>
            <button onClick={handleLogout} className="btn btn-outline">Sair</button>
          </div>
          <p>Prof. {teacher?.name} ({teacher?.school || "Escola"})</p>
  
          {/* Navegação por Separadores */}
          <div style={{ display: 'flex', gap: '8px', margin: '16px 0', flexWrap: 'wrap', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
            <button
              type="button"
              className={`btn ${dashboardTab === "alunos" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setDashboardTab("alunos")}
            >
              👥 Alunos
            </button>
            <button
              type="button"
              className={`btn ${dashboardTab === "palavras" ? "btn-primary" : "btn-outline"}`}
              onClick={openWordsTab}
            >
              🔤 Vocabulário
            </button>
            <button
              type="button"
              className={`btn ${dashboardTab === "frases" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setDashboardTab("frases")}
            >
              📖 Frases
            </button>
            <button
              type="button"
              className={`btn ${dashboardTab === "verbos" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setDashboardTab("verbos")}
            >
              🗣️ Verbos
            </button>
            <button
              type="button"
              className={`btn ${dashboardTab === "gramatica" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setDashboardTab("gramatica")}
            >
              📐 Gramática
            </button>
          </div>
  
          {/* BARRA DE FILTROS GLOBAIS (Partilhada por todas as abas) */}
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Filtro por Ano Escolar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#374151', minWidth: '100px' }}>Ano Escolar:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      className={`btn ${Number(selectedGrade) === grade ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '20px' }}
                      onClick={() => {
                        setSelectedGrade(grade);
                        setNewStudentGrade && setNewStudentGrade(grade);
                        setWordGrade && setWordGrade(grade);
                      }}
                    >
                      {grade}.º Ano
                    </button>
                  ))}
                </div>
              </div>
  
              {/* Filtro por Nível PLNN */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#374151', minWidth: '100px' }}>Nível PLNN:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {["A1", "A2", "B1", "B2"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`btn ${selectedPlnnLevel === level ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '20px' }}
                      onClick={() => {
                        setSelectedPlnnLevel(level);
                        setNewStudentPlnnLevel && setNewStudentPlnnLevel(level);
                        setWordPlnnLevel && setWordPlnnLevel(level);
                      }}
                    >
                      Nível {level}
                    </button>
                  ))}
                </div>
              </div>
  
            </div>
          </div>
  
          {/* 1. SEPARADOR: ALUNOS */}
          {dashboardTab === "alunos" && (
            <React.Fragment>
              <h3>{editingStudentId ? "Editar Aluno" : `Criar Novo Aluno para ${selectedGrade}.º Ano (${selectedPlnnLevel || 'A1'})`}</h3>
  
              <form 
                onSubmit={handleStudentSubmit} 
                autoComplete="off"
                style={{ display: 'grid', gap: '12px', gridTemplateColumns: '2fr 1fr auto', alignItems: 'end', marginTop: '12px' }}
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
  
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                    {editingStudentId ? "Guardar" : "Adicionar"}
                  </button>
                  {editingStudentId && (
                    <button type="button" className="btn btn-outline" style={{ height: '42px' }} onClick={clearStudentForm}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
  
              <hr style={{ margin: '24px 0' }} />
  
              <h3>
                Alunos Registados ({
                  students.filter(s => Number(s.grade) === Number(selectedGrade) && (s.plnn_level || 'A1') === selectedPlnnLevel).length
                })
              </h3>
  
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {students
                  .filter(s => Number(s.grade) === Number(selectedGrade) && (s.plnn_level || 'A1') === selectedPlnnLevel)
                  .map((student) => (
                    <div key={student.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>{student.name}</h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                        {student.grade}.º Ano • Nível {student.plnn_level || 'A1'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button type="button" className="link-btn" onClick={() => startEditStudent(student)}>
                          Editar
                        </button>
                        <button type="button" className="link-btn" onClick={() => handleDeleteStudent(student.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
  
              <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => setCurrentView("student_select")}>
                Ver Visão do Aluno
              </button>
            </React.Fragment>
          )}
  
          {/* 2. SEPARADOR: VOCABULÁRIO (PALAVRAS) */}
          {dashboardTab === "palavras" && (
            <React.Fragment>
              <h3>{editingWordId ? "Editar Palavra" : `Adicionar Palavra para ${selectedGrade}.º Ano (${selectedPlnnLevel || 'A1'})`}</h3>
  
              <form
                onSubmit={handleWordSubmit}
                autoComplete="off"
                style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr 2fr', marginTop: '12px' }}
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
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Dica / Significado</label>
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
  
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Fim da frase</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: dorme no sofá."
                    value={wordBlankAfter}
                    onChange={(e) => setWordBlankAfter(e.target.value)}
                  />
                </div>
  
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '8px' }}>
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
  
              <hr style={{ margin: '24px 0' }} />
  
              <h3>
                Palavras Registadas ({
                  allWords.filter(w => Number(w.grade) === Number(selectedGrade) && (w.plnn_level || 'A1') === selectedPlnnLevel).length
                })
              </h3>
  
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {allWords
                  .filter(w => Number(w.grade) === Number(selectedGrade) && (w.plnn_level || 'A1') === selectedPlnnLevel)
                  .map((w) => (
                    <div key={w.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>{w.emoji} {w.word}</h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                        {w.grade}.º Ano • Nível {w.plnn_level || 'A1'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button type="button" className="link-btn" onClick={() => startEditWord(w)}>Editar</button>
                        <button type="button" className="link-btn" onClick={() => handleDeleteWord(w.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
              </div>
            </React.Fragment>
          )}
  
          {/* 3. SEPARADOR: FRASES */}
          {dashboardTab === "frases" && (
            <React.Fragment>
              <h3>{editingPhraseId ? "Editar Frase" : `Adicionar Frase para ${selectedGrade}.º Ano (${selectedPlnnLevel || 'A1'})`}</h3>
          
              <form onSubmit={handlePhraseSubmit} autoComplete="off" style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Texto da Frase</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: O cão correu rapidamente no parque."
                    value={phraseText}
                    onChange={(e) => setPhraseText(e.target.value)}
                    required
                  />
                </div>
          
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Palavra-Alvo / Lacuna (opcional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ex: correu"
                      value={phraseTargetWord}
                      onChange={(e) => setPhraseTargetWord(e.target.value)}
                    />
                  </div>
          
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Tipo de Exercício</label>
                    <select 
                      className="input" 
                      value={phraseType} 
                      onChange={(e) => setPhraseType(e.target.value)}
                    >
                      <option value="leitura">Leitura / Compreensão</option>
                      <option value="lacuna">Preenchimento de Lacuna</option>
                      <option value="ordenacao">Ordenação de Frase</option>
                    </select>
                  </div>
                </div>
          
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingPhrase}>
                    {editingPhraseId ? "Guardar alterações" : "Adicionar frase"}
                  </button>
                  {editingPhraseId && (
                    <button type="button" className="btn btn-outline" onClick={clearPhraseForm}>
                      Cancelar edição
                    </button>
                  )}
                </div>
              </form>
          
              <hr style={{ margin: '24px 0' }} />
          
              <h3>
                Frases Registadas ({
                  phrases.filter(p => Number(p.grade) === Number(selectedGrade) && (p.plnn_level || 'A1') === selectedPlnnLevel).length
                })
              </h3>
          
              <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                {phrases
                  .filter(p => Number(p.grade) === Number(selectedGrade) && (p.plnn_level || 'A1') === selectedPlnnLevel)
                  .map((p) => (
                    <div key={p.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{p.phrase_text}</p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: '#6b7280' }}>
                          <span>Tipo: <strong>{p.type || 'leitura'}</strong></span>
                          {p.target_word && <span style={{ color: '#059669' }}>Palavra-alvo: <strong>{p.target_word}</strong></span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="link-btn" onClick={() => startEditPhrase(p)}>Editar</button>
                        <button type="button" className="link-btn" onClick={() => handleDeletePhrase(p.id)}>Remover</button>
                      </div>
                    </div>
                  ))}
              </div>
            </React.Fragment>
          )}
  
          {/* 4. SEPARADOR: VERBOS */}
         {dashboardTab === "verbos" && (
          <React.Fragment>
            <h3>{editingVerbId ? "Editar Verbo" : `Adicionar Verbo para ${selectedGrade}.º Ano (${selectedPlnnLevel || 'A1'})`}</h3>
        
            <form onSubmit={handleVerbSubmit} autoComplete="off" style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Verbo (Infinitivo)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: cantar"
                    value={verbInfinitive}
                    onChange={(e) => setVerbInfinitive(e.target.value)}
                    required
                  />
                </div>
        
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Tempo Verbal</label>
                  <select className="input" value={verbTense} onChange={(e) => setVerbTense(e.target.value)}>
                    <option value="Presente do Indicativo">Presente do Indicativo</option>
                    <option value="Pretérito Perfeito">Pretérito Perfeito</option>
                    <option value="Pretérito Imperfeito">Pretérito Imperfeito</option>
                    <option value="Futuro do Indicativo">Futuro do Indicativo</option>
                  </select>
                </div>
        
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Regularidade</label>
                  <select className="input" value={verbIsRegular ? "true" : "false"} onChange={(e) => setVerbIsRegular(e.target.value === "true")}>
                    <option value="true">Regular</option>
                    <option value="false">Irregular</option>
                  </select>
                </div>
              </div>
        
              {/* Formulário rápido para as 6 pessoas gramaticais */}
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#374151', marginTop: '8px' }}>Conjugações:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <input type="text" className="input" placeholder="Eu (ex: canto)" value={conjEu} onChange={(e) => setConjEu(e.target.value)} />
                <input type="text" className="input" placeholder="Tu (ex: cantas)" value={conjTu} onChange={(e) => setConjTu(e.target.value)} />
                <input type="text" className="input" placeholder="Ele/Ela (ex: canta)" value={conjEle} onChange={(e) => setConjEle(e.target.value)} />
                <input type="text" className="input" placeholder="Nós (ex: cantamos)" value={conjNos} onChange={(e) => setConjNos(e.target.value)} />
                <input type="text" className="input" placeholder="Vós (ex: cantais)" value={conjVos} onChange={(e) => setConjVos(e.target.value)} />
                <input type="text" className="input" placeholder="Eles/Elas (ex: cantam)" value={conjEles} onChange={(e) => setConjEles(e.target.value)} />
              </div>
        
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={savingVerb}>
                  {editingVerbId ? "Guardar alterações" : "Adicionar verbo"}
                </button>
                {editingVerbId && (
                  <button type="button" className="btn btn-outline" onClick={clearVerbForm}>
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>
        
            <hr style={{ margin: '24px 0' }} />
        
            <h3>
              Verbos Registados ({
                verbs.filter(v => Number(v.grade) === Number(selectedGrade) && (v.plnn_level || 'A1') === selectedPlnnLevel).length
              })
            </h3>
        
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {verbs
                .filter(v => Number(v.grade) === Number(selectedGrade) && (v.plnn_level || 'A1') === selectedPlnnLevel)
                .map((v) => (
                  <div key={v.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>{v.infinitive}</h4>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>
                      {v.tense || 'Presente'} • {v.is_regular ? 'Regular' : 'Irregular'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="button" className="link-btn" onClick={() => startEditVerb(v)}>Editar</button>
                      <button type="button" className="link-btn" onClick={() => handleDeleteVerb(v.id)}>Remover</button>
                    </div>
                  </div>
                ))}
            </div>
          </React.Fragment>
        )}
  
          {/* 5. SEPARADOR: GRAMÁTICA */}
          {dashboardTab === "gramatica" && (
           <React.Fragment>
             <h3>{editingGrammarId ? "Editar Parâmetro Gramatical" : `Adicionar Regra Gramatical para ${selectedGrade}.º Ano (${selectedPlnnLevel || 'A1'})`}</h3>
         
             <form onSubmit={handleGrammarSubmit} autoComplete="off" style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Categoria</label>
                   <select className="input" value={grammarCategory} onChange={(e) => setGrammarCategory(e.target.value)}>
                     <option value="Género">Género (M/F)</option>
                     <option value="Número">Número (Singular/Plural)</option>
                     <option value="Classe">Classe de Palavras</option>
                     <option value="Pontuação">Pontuação</option>
                   </select>
                 </div>
         
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Palavra Base</label>
                   <input
                     type="text"
                     className="input"
                     placeholder="Ex: menino"
                     value={grammarBaseWord}
                     onChange={(e) => setGrammarBaseWord(e.target.value)}
                     required
                   />
                 </div>
         
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Par / Alvo</label>
                   <input
                     type="text"
                     className="input"
                     placeholder="Ex: menina"
                     value={grammarTargetWord}
                     onChange={(e) => setGrammarTargetWord(e.target.value)}
                     required
                   />
                 </div>
         
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4b5563' }}>Regra / Tipo</label>
                   <input
                     type="text"
                     className="input"
                     placeholder="Ex: Feminino em -a"
                     value={grammarFeatureType}
                     onChange={(e) => setGrammarFeatureType(e.target.value)}
                   />
                 </div>
               </div>
         
               <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                 <button type="submit" className="btn btn-primary" disabled={savingGrammar}>
                   {editingGrammarId ? "Guardar alterações" : "Adicionar regra"}
                 </button>
                 {editingGrammarId && (
                   <button type="button" className="btn btn-outline" onClick={clearGrammarForm}>
                     Cancelar edição
                   </button>
                 )}
               </div>
             </form>
         
             <hr style={{ margin: '24px 0' }} />
         
             <h3>
               Regras Registadas ({
                 grammarList.filter(g => Number(g.grade) === Number(selectedGrade) && (g.plnn_level || 'A1') === selectedPlnnLevel).length
               })
             </h3>
         
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
               {grammarList
                 .filter(g => Number(g.grade) === Number(selectedGrade) && (g.plnn_level || 'A1') === selectedPlnnLevel)
                 .map((g) => (
                   <div key={g.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>{g.category}</span>
                     <h4 style={{ margin: '4px 0', color: '#111827' }}>{g.base_word} → {g.target_word}</h4>
                     {g.feature_type && <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{g.feature_type}</p>}
                     <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                       <button type="button" className="link-btn" onClick={() => startEditGrammar(g)}>Editar</button>
                       <button type="button" className="link-btn" onClick={() => handleDeleteGrammar(g.id)}>Remover</button>
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

  // 4. ECRÃ: Visão do Aluno / Jogo Pedagógico PLNN
  if (currentView === "game") {
    const studentGrade = Number(selectedStudent?.grade || 1);
    const activeModuleId = selectedModuleId || 1;

    // Lista de módulos disponíveis dependendo do Ano
    const availableModules = [
      { id: 1, title: studentGrade <= 2 ? "Descobre a Palavra" : "Gramática & Concordância" },
      { id: 2, title: studentGrade <= 2 ? "Letra em Falta" : "Construção de Frases" },
      { id: 3, title: studentGrade <= 2 ? "Completa a Frase" : "Leitura & Interpretação" }
    ];

    // Roteamento Dinâmico dos Componentes do exercises.js
    const renderActiveExercise = () => {
      // 1.º e 2.º ANO (Lógica de Vocabulário & Leitura Inicial)
      if (studentGrade === 1) {
        if (activeModuleId === 1) return <Grade1Module1 words={words} />;
        if (activeModuleId === 2) return <MissingLetterList words={words} onComplete={() => handleModuleComplete(2)} />;
        if (activeModuleId === 3) return <Grade1Module3 words={words} onComplete={() => handleModuleComplete(3)} />;
      }

      if (studentGrade === 2) {
        if (activeModuleId === 1) return <MissingLetterList words={words} onComplete={() => handleModuleComplete(1)} />;
        if (activeModuleId === 2) return <Grade2Module2 words={words} onComplete={() => handleModuleComplete(2)} />;
        if (activeModuleId === 3) return <Grade2Module3 words={words} onComplete={() => handleModuleComplete(3)} />;
      }

      // 3.º ao 6.º ANO (Lógica de Módulos PLNN: A1, A2, B1, B2)
      const moduleExercises = plnnExercises.filter(ex => ex.module_id === activeModuleId);

      if (activeModuleId === 1) {
        return <Grade3Module1 exercises={moduleExercises} onComplete={() => handleModuleComplete(1)} />;
      }
      if (activeModuleId === 2) {
        return <Grade3Module2 exercises={moduleExercises} onComplete={() => handleModuleComplete(2)} />;
      }
      if (activeModuleId === 3) {
        return <Grade4Module3 exercises={moduleExercises} onComplete={() => handleModuleComplete(3)} />;
      }

      return <Grade1Module1 words={words} />;
    };

    return (
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <div className="card" style={{ padding: '24px' }}>
          
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>Jardim de {selectedStudent?.name}</h2>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {studentGrade}.º Ano {studentGrade >= 3 && `• Nível PLNN: ${selectedStudent?.plnn_level || 'A1'}`}
              </span>
            </div>

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
          </div>

          <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #E5E7EB' }} />


          {/* ÁREA PRINCIPAL DO EXERCÍCIO */}
          <div style={{ marginTop: '16px' }}>
            {renderActiveExercise()}
          </div>

        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.render(<App />, rootElement);
}
