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
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [words, setWords] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentWord, setCurrentWord] = useState(null);
  const [activeCategory, setActiveCategory] = useState("animais");
  const [currentView, setCurrentView] = useState("student_select"); // 'student_select', 'auth', 'dashboard', 'game'

  // Formulários
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPin, setNewStudentPin] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("1");

  // Carregar alunos ao iniciar
  useEffect(() => {
    async function initApp() {
      // Carrega todos os alunos para a seleção inicial
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) setStudents(data);

      // Carrega sessão guardada do professor
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
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginTeacher(loginEmail, loginPass);
      const profile = await getTeacherProfile(user.id);
      setTeacher(profile || { id: user.id, name: "Professor" });
      await loadTeacherStudents(user.id);
      setCurrentView("dashboard");
    } catch (err) {
      alert("Erro ao entrar: " + err.message);
    }
  };

  const handleLogout = () => {
    clearTeacherSession();
    setTeacher(null);
    setSelectedStudent(null);
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

  // 1. ECRÃ INICIAL: Seleção do Aluno ("Quem vai jogar hoje?")
  if (currentView === "student_select") {
    return (
      <div className="container">
        <div className="card">
          <h2>Quem vai jogar hoje?</h2>
          <p className="subtitle">Escolhe o teu ano e depois o teu nome na lista da turma.</p>

          {/* Botões do 1.º ao 6.º Ano */}
         {/* Botões do 1.º ao 6.º Ano */}
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

          {/* Lista de Alunos do Ano Selecionado */}
          {filteredStudents.length > 0 ? (
            <div className="students-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  className="btn btn-outline student-card-btn"
                  onClick={() => handleSelectStudent(s)}
                  style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{s.name}</div>
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
            🔑 Acesso do professor
          </button>
        </div>
      </div>
    );
  }

  // 2. ECRÃ: Login do Professor
  // 2. ECRÃ: Autenticação do Professor (Login / Registo)
  // 2. ECRÃ: Autenticação do Professor (Login / Registo por PIN)
  if (currentView === "auth") {
    const handleAuthSubmit = async (e) => {
      e.preventDefault();
      try {
        if (isRegistering) {
          const newTeacher = await registerTeacher(loginEmail, loginPass, regName, regSchool);
          alert("Conta de professor criada com sucesso!");
          setTeacher(newTeacher);
          saveTeacherSession(newTeacher);
          await loadTeacherStudents(newTeacher.id);
          setCurrentView("dashboard");
        } else {
          const loggedTeacher = await loginTeacher(loginEmail, loginPass);
          setTeacher(loggedTeacher);
          saveTeacherSession(loggedTeacher);
          await loadTeacherStudents(loggedTeacher.id);
          setCurrentView("dashboard");
        }
      } catch (err) {
        alert(err.message);
      }
    };

    return (
      <div className="container">
        <div className="card">
          <h1>🌿 O Jardim das Palavras</h1>
          <h3>{isRegistering ? "Criar Conta de Professor" : "Área Reservada aos Professores"}</h3>
          
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {isRegistering && (
              <>
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
              </>
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
              className="input"
              placeholder="PIN / Palavra-passe"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
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
              className="input"
              placeholder="Palavra-passe"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
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
            <h2>Painel do Professor</h2>
            <button onClick={handleLogout} className="btn btn-outline">Sair</button>
          </div>
          <p>Prof. {teacher?.name} ({teacher?.school || "Escola"})</p>

          <hr style={{ margin: '16px 0' }} />

          <h3>Criar Novo Aluno</h3>
          <form onSubmit={handleCreateStudent} style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr 1fr auto', marginTop: '12px' }}>
            <input
              type="text"
              className="input"
              placeholder="Nome do Aluno"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              required
            />
            <input
              type="password"
              className="input"
              placeholder="PIN (4 dígitos)"
              value={newStudentPin}
              onChange={(e) => setNewStudentPin(e.target.value)}
              required
            />
            <select className="input" value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)}>
              <option value="1">1.º Ano</option>
              <option value="2">2.º Ano</option>
              <option value="3">3.º Ano</option>
              <option value="4">4.º Ano</option>
              <option value="5">5.º Ano</option>
              <option value="6">6.º Ano</option>
            </select>
            <button type="submit" className="btn btn-primary">Adicionar</button>
          </form>

          <hr style={{ margin: '24px 0' }} />

          <h3>Alunos Registados ({students.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' }}>
            {students.map((student) => (
              <div key={student.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px' }}>
                <h4>{student.name}</h4>
                <p>{student.grade}.º Ano</p>
              </div>
            ))}
          </div>

          <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => setCurrentView("student_select")}>
            Ver Visão do Aluno
          </button>
        </div>
      </div>
    );
  }

  // 4. ECRÃ: O Jogo
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => setCurrentView("student_select")} className="btn btn-outline">
          ← Voltar à Seleção
        </button>
        <div>
          Jardim de <strong>{selectedStudent.name}</strong> ({selectedStudent.grade}.º Ano)
          <StarBadge stars={totalStars} />
        </div>
      </header>

      <main className="card">
        <nav style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`btn ${activeCategory === cat.id ? "btn-primary" : "btn-outline"}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setCurrentWord(null);
              }}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {!currentWord ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
            {words.map((w) => {
              const wordStage = progress[w.id]?.stage || 0;
              return (
                <div
                  key={w.id}
                  onClick={() => setCurrentWord(w)}
                  style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '2rem' }}>{w.emoji}</div>
                  <div>{w.word}</div>
                  <ProgressDots stage={wordStage} />
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <button onClick={() => setCurrentWord(null)} className="btn btn-outline" style={{ marginBottom: '12px' }}>
              ✖ Fechar Palavra
            </button>
            <ActivityStages
              word={currentWord}
              stage={progress[currentWord.id]?.stage || 0}
              onComplete={handleStageComplete}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.render(<App />, rootElement);
}
