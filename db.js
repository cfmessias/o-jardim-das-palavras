// db.js - Gestão de dados e comunicação com o Supabase

const SUPABASE_URL = "https://ostzbzkxvomuztprzdvw.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdHpiemt4dm9tdXp0cHJ6ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Nzk1OTUsImV4cCI6MjEwMjQ1NTU5NX0.ae8uWGBFn2gQ23GJykxRoZ8q9ci4Ql8Y4xIwalBSWsE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. AUTENTICAÇÃO DO PROFESSOR (email + PIN, sem Supabase Auth)
async function registerTeacher(email, pin, name, school) {
  const { data, error } = await supabase
    .from("teachers")
    .insert([{ email, pin, name, school }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe uma conta registada com este email.");
    }
    throw error;
  }

  return data;
}

async function loginTeacher(email, pin) {
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("email", email)
    .eq("pin", pin)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Email ou PIN incorretos.");

  return data;
}

function saveTeacherSession(teacher) {
  localStorage.setItem("jdp_teacher", JSON.stringify(teacher));
}

function getStoredTeacherSession() {
  try {
    const raw = localStorage.getItem("jdp_teacher");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearTeacherSession() {
  localStorage.removeItem("jdp_teacher");
}

async function logoutTeacher() {
  clearTeacherSession();
}

// 2. GESTÃO DE ALUNOS (Associados ao teacher_id)
async function getStudentsByTeacher(teacherId) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao carregar alunos:", error);
    return [];
  }
  return data;
}

async function createStudent(teacherId, name, pin, grade) {
  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        teacher_id: teacherId,
        name: name,
        pin: pin,
        grade: parseInt(grade),
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}

async function verifyStudentPin(studentId, pin) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .eq("pin", pin)
    .single();

  if (error || !data) return null;
  return data;
}

// 4. GESTÃO DE PALAVRAS
function slugifyWordId(word, grade) {
  const base = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");

  return `${base || "palavra"}-${grade}`;
}

async function getAllWords() {
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .order("grade")
    .order("word");

  if (error) {
    console.error("Erro ao carregar palavras:", error);
    return [];
  }
  return data;
}

async function createWord({ word, grade, emoji, hint, blankBefore, blankAfter }) {
  const id = slugifyWordId(word, grade);

  const { data, error } = await supabase
    .from("words")
    .insert([
      {
        id,
        grade: parseInt(grade),
        word,
        emoji,
        hint,
        blank_before: blankBefore || "",
        blank_after: blankAfter || "",
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Já existe uma palavra igual registada nesse ano.");
    }
    throw error;
  }

  return data;
}

async function updateWord(id, { word, grade, emoji, hint, blankBefore, blankAfter }) {
  const { error } = await supabase
    .from("words")
    .update({
      word,
      grade: parseInt(grade),
      emoji,
      hint,
      blank_before: blankBefore || "",
      blank_after: blankAfter || "",
    })
    .eq("id", id);

  if (error) throw error;
}

async function deleteWord(id) {
  // apaga primeiro o progresso associado, já que não há FK a garantir isso
  await supabase.from("student_progress").delete().eq("word_id", id);

  const { error } = await supabase.from("words").delete().eq("id", id);
  if (error) throw error;
}

// 3. PALAVRAS E PROGRESSO
async function getWordsByGrade(grade) {
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("grade", grade);

  if (error) {
    console.error("Erro ao carregar palavras:", error);
    return [];
  }
  return data;
}

async function getStudentProgress(studentId) {
  const { data, error } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", studentId);

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
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("student_progress")
    .upsert(payload, { onConflict: "student_id,word_id" });

  if (error) {
    console.error("Erro ao guardar progresso:", error);
  }
}
