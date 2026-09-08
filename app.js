// app.js - Fluxo principal, Estado Global e Inicialização

const { useState, useEffect } = React;

function App() {
  // Estado Global
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [words, setWords] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentWord, setCurrentWord] = useState(null);
  const [activeCategory, setActiveCategory] = useState("animais");
  const [currentView, setCurrentView] = useState("auth"); // 'auth', 'dashboard', 'game'

  // Formulários
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPin, setNewStudentPin] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("1");

  // 1. Verificação inicial de sessão
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await getTeacherProfile(session.user.id);
        setTeacher(profile || { id: session.user.id, name: "Professor" });
        await loadStudents(session.user.id);
        setCurrentView("dashboard");
      }
    }
    checkSession();
  }, []);

  const loadStudents = async (teacherId) => {
    const list = await getStudentsByTeacher(teacherId);
    setStudents(list);
  };

  // 2. Ações do Professor
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginTeacher(loginEmail, loginPass);
      const profile = await getTeacherProfile(user.id);
      setTeacher(profile || { id: user.id, name: "Professor" });
      await loadStudents(user.id);
      setCurrentView("dashboard");
    } catch (err) {
      alert("Erro ao entrar: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logoutTeacher();
    setTeacher(null);
    setSelectedStudent(null);
    setCurrentView("auth");
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

  // 3. Ações do Aluno (Jogo)
  const handleStartStudentSession = async (student) => {
    const pin = prompt(`Digita o PIN para entrar como ${student.name}:`);
    if (!pin) return;

    const validated = await verifyStudentPin(student.id, pin);
    if (!validated) {
      alert("PIN incorreto!");
      return;
    }

    setSelectedStudent(validated);
    
    // Carregar palavras e progresso do aluno
    const studentWords = await getWordsByGrade(validated.grade);
    const studentProgress = await getStudentProgress(validated.id);

    setWords(studentWords);
    setProgress(studentProgress);
    setCurrentView("game");
  };

  const handleStageComplete = async (nextStage, writtenSentence = null) => {
    if (!selectedStudent || !currentWord) return;

    await saveStudentProgress(selectedStudent.id, currentWord.id, nextStage, writtenSentence);
    
    // Atualiza estado local
    setProgress((prev) => ({
      ...prev,
      [currentWord.id]: {
        ...prev[currentWord.id],
        stage: nextStage,
        written_sentence: writtenSentence || prev[currentWord.id]?.written_sentence
      }
    }));
  };

  // Cálculo de Estrelas do Aluno
  const totalStars = Object.values(progress).reduce((acc, curr) => acc + (curr.stage || 0), 0);

  // --- RENDERS ---

  // ECRÃ 1: Autenticação do Professor
  if (currentView === "auth") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1>🌿 O Jardim das Palavras</h1>
          <p>Área Reservada aos Professores</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Palavra-passe"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  // ECRÃ 2: Painel da Turma (Dashboard)
  if (currentView === "dashboard") {
    return (
      <div className="dashboard-screen">
        <header className="top-bar">
          <h2>Painel do Professor</h2>
          <span>Prof. {teacher?.name} ({teacher?.school || "Escola"})</span>
          <button onClick={handleLogout} className="btn-secondary">Sair</button>
        </header>

        <main className="dashboard-content">
          <section className="form-section">
            <h3>Criar Novo Aluno</h3>
            <form onSubmit={handleCreateStudent}>
              <input
                type="text"
                placeholder="Nome do Aluno"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="PIN (4 dígitos)"
                value={newStudentPin}
                onChange={(e) => setNewStudentPin(e.target.value)}
                required
              />
              <select value={newStudentGrade} onChange={(e) => setNewStudentGrade(e.target.value)}>
                <option value="1">1.º Ano</option>
                <option value="2">2.º Ano</option>
                <option value="3">3.º Ano</option>
                <option value="4">4.º Ano</option>
               
              </select>
              <button type="submit" className="btn-primary">Adicionar Aluno</button>
            </form>
          </section>

          <section className="list-section">
            <h3>Alunos da Turma</h3>
            <div className="students-grid">
              {students.map((student) => (
                <div key={student.id} className="student-card">
                  <Avatar config={{ skinTone: SKIN_TONES[0] }} size="small" />
                  <h4>{student.name}</h4>
                  <p>{student.grade}º Ano</p>
                  <button
                    onClick={() => handleStartStudentSession(student)}
                    className="btn-action"
                  >
                    Entrar no Jardim 🌸
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ECRÃ 3: O Jogo do Aluno
  return (
    <div className="game-screen">
      <header className="game-header">
        <button onClick={() => setCurrentView("dashboard")} className="btn-back">
          ← Voltar à Turma
        </button>
        <div className="student-info">
          <span>Jardim de <strong>{selectedStudent.name}</strong></span>
          <StarBadge stars={totalStars} />
        </div>
      </header>

      <main className="game-container">
        {/* Categorias */}
        <nav className="categories-nav">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategory === cat.id ? "active" : ""}`}
              style={{ backgroundColor: cat.color }}
              onClick={() => {
                setActiveCategory(cat.id);
                setCurrentWord(null);
              }}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Grelha de Palavras vs Exercício Ativo */}
        {!currentWord ? (
          <div className="words-grid">
            {words.map((w) => {
              const wordStage = progress[w.id]?.stage || 0;
              return (
                <div
                  key={w.id}
                  className={`word-card stage-${wordStage}`}
                  onClick={() => setCurrentWord(w)}
                >
                  <span className="emoji">{w.emoji}</span>
                  <span className="label">{w.word}</span>
                  <ProgressDots stage={wordStage} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="activity-view">
            <button onClick={() => setCurrentWord(null)} className="btn-close">
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

// Renderização na div #root
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.render(<App />, rootElement);
}
