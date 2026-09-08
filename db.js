// db.js - Gestão de dados e comunicação com o Supabase
const SUPABASE_URL = "https://ostzbzkxvomuztprzdvw.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdHpiemt4dm9tdXp0cHJ6ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Nzk1OTUsImV4cCI6MjEwMjQ1NTU5NX0.ae8uWGBFn2gQ23GJykxRoZ8q9ci4Ql8Y4xIwalBSWsE";

// Garante a criação do cliente sem conflito de redeclaração
if (typeof window.supabaseClient === "undefined") {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
var supabase = window.supabaseClient;
// 1. AUTENTICAÇÃO E SESSÃO DO PROFESSOR (Tabela Simples)

// Registar novo professor na tabela pública
async function registerTeacher(email, pin, name, school) {
  const { data, error } = await supabase
    .from('teachers')
    .insert([{ email: email.trim().toLowerCase(), pin: pin.trim(), name, school }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error("Este email já está registado!");
    throw error;
  }
  return data;
}

// Login de professor por Email e PIN
async function loginTeacher(email, pin) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .eq('pin', pin.trim())
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Email ou PIN incorretos.");
  
  return data;
}

// Obter perfil do professor
async function getTeacherProfile(teacherId) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) console.error("Erro ao obter perfil do professor:", error);
  return data;
}

// Gestão da sessão local (LocalStorage)
function saveTeacherSession(teacher) {
  localStorage.setItem('jardim_teacher', JSON.stringify(teacher));
}

function getStoredTeacherSession() {
  const stored = localStorage.getItem('jardim_teacher');
  return stored ? JSON.parse(stored) : null;
}

function clearTeacherSession() {
  localStorage.removeItem('jardim_teacher');
}

async function logoutTeacher() {
  clearTeacherSession();
}

// 2. GESTÃO DE ALUNOS (Associados ao teacher_id)
async function getStudentsByTeacher(teacherId) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('name', { ascending: true });

  if (error) {
    console.error("Erro ao carregar alunos:", error);
    return [];
  }
  return data;
}

async function createStudent(teacherId, name, pin, grade) {
  const { data, error } = await supabase
    .from('students')
    .insert([
      { 
        teacher_id: teacherId, 
        name: name, 
        pin: pin, 
        grade: parseInt(grade) 
      }
    ])
    .select();

  if (error) throw error;
  return data[0];
}

async function verifyStudentPin(studentId, pin) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('pin', pin)
    .single();

  if (error || !data) return null;
  return data;
}

// 3. PALAVRAS E PROGRESSO
async function getWordsByGrade(grade) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('grade', grade);

  if (error) {
    console.error("Erro ao carregar palavras:", error);
    return [];
  }
  return data;
}

async function getStudentProgress(studentId) {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('student_id', studentId);

  if (error) {
    console.error("Erro ao carregar progresso:", error);
    return {};
  }

  // Retorna em formato de dicionário { word_id: { stage, written_sentence, ... } }
  return (data || []).reduce((acc, item) => {
    acc[item.word_id] = item;
    return acc;
  }, {});
}

async function saveStudentProgress(studentId, wordId, stage, writtenSentence = null) {
  const payload = {
    student_id: studentId,
    word_id: wordId,
    stage: stage,
    written_sentence: writtenSentence,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('student_progress')
    .upsert(payload, { onConflict: 'student_id,word_id' });

  if (error) {
    console.error("Erro ao guardar progresso:", error);
  }
}
