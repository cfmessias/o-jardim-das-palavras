const { useState, useEffect, useMemo, createElement: h } = React;

const SUPABASE_URL = 'https://ostzbzkxvomuztprzdvw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdHpiemt4dm9tdXp0cHJ6ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Nzk1OTUsImV4cCI6MjEwMjQ1NTU5NX0.ae8uWGBFn2gQ23GJykxRoZ8q9ci4Ql8Y4xIwalBSWsE';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  const [screen, setScreen] = useState("login");
  const [students, setStudents] = useState([]);
  const [words, setWords] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: stData } = await supabase.from('students').select('*').order('name');
    const { data: wData } = await supabase.from('words').select('*');
    if (stData) setStudents(stData);
    if (wData) setWords(wData);
    setLoading(false);
  }

  if (loading) {
    return h("div", { className: "screen center-screen" },
      h("h2", null, "🦉 A carregar O Jardim das Palavras...")
    );
  }

  return h("div", { className: "jdp-root" },
    screen === "login" && h(LoginScreen, {
      students,
      onSelect: (st) => { setSelectedStudent(st); setScreen("student_pin"); },
      onTeacher: () => setScreen("teacher_dash")
    }),
    screen === "student_pin" && h(StudentPin, {
      student: selectedStudent,
      onBack: () => setScreen("login"),
      onSuccess: () => setScreen("game")
    }),
    screen === "game" && h(StudentGame, {
      student: selectedStudent,
      words: words.filter(w => w.grade === selectedStudent.grade),
      onLogout: () => setScreen("login")
    }),
    screen === "teacher_dash" && h(TeacherDashboard, {
      students,
      words,
      onReload: loadData,
      onExit: () => setScreen("login")
    })
  );
}

function LoginScreen({ students, onSelect, onTeacher }) {
  const [grade, setGrade] = useState(1);
  const list = students.filter(s => s.grade === grade);

  return h("div", { className: "screen" },
    h("div", { className: "header-tag" }, "🌱 O Jardim das Palavras"),
    h("h1", null, "Quem vai jogar hoje?"),
    h("div", { className: "grade-selector" },
      [1,2,3,4,5,6].map(g => h("button", {
        key: g, className: `grade-tab ${grade === g ? "active" : ""}`,
        onClick: () => setGrade(g)
      }, `${g}.º Ano`))
    ),
    h("div", { className: "student-grid" },
      list.map(s => h("button", { key: s.id, className: "student-card", onClick: () => onSelect(s) },
        h("div", { className: "avatar-circle" }, s.name.charAt(0)),
        h("div", null, h("strong", null, s.name))
      ))
    ),
    h("div", { style: { marginTop: "30px", textAlign: "center" } },
      h("button", { className: "ghost-btn", onClick: onTeacher }, "🔑 Área do Professor")
    )
  );
}

function StudentPin({ student, onBack, onSuccess }) {
  const [pin, setPin] = useState("");
  return h("div", { className: "screen center-screen" },
    h("h2", null, `Olá, ${student.name}!`),
    h("p", { className: "sub" }, "Insere o teu PIN de 4 dígitos:"),
    h("input", {
      type: "password", className: "pin-input", maxLength: 4, autoFocus: true,
      value: pin, onChange: (e) => setPin(e.target.value)
    }),
    h("button", {
      className: "btn-primary", style: { marginTop: "16px" },
      onClick: () => pin === student.pin ? onSuccess() : alert("PIN Incorreto")
    }, "Entrar"),
    h("button", { className: "ghost-btn", style: { marginTop: "12px" }, onClick: onBack }, "Voltar")
  );
}

function StudentGame({ student, words, onLogout }) {
  return h("div", { className: "screen" },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      h("h2", null, `Aluno: ${student.name} (${student.grade}.º Ano)`),
      h("button", { className: "ghost-btn", onClick: onLogout }, "Sair")
    ),
    h("div", { className: "pico-container" },
      h("div", { className: "pico-avatar" }, "🦉"),
      h("div", null, h("strong", null, "Mocho Pico:"), h("p", null, "Escolhe uma palavra para começarmos!"))
    ),
    h("div", { className: "student-grid" },
      words.map(w => h("div", { key: w.id, className: "student-card" },
        h("span", { style: { fontSize: "28px" } }, w.emoji),
        h("div", null, h("strong", null, w.word), h("p", { className: "sub" }, w.hint))
      ))
    )
  );
}

function TeacherDashboard({ students, words, onReload, onExit }) {
  return h("div", { className: "screen" },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      h("h1", null, "Painel de Gestão do Docente"),
      h("button", { className: "ghost-btn", onClick: onExit }, "Sair")
    ),
    h("h3", null, `Total de Alunos Registados: ${students.length}`),
    h("h3", null, `Total de Palavras na BD: ${words.length}`)
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));