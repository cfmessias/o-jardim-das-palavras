// db.js - Gestão de dados e comunicação com o Supabase

// 1. AUTENTICAÇÃO DO PROFESSOR
async function loginTeacher(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function registerTeacher(email, password, name, school) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, school } }
  });

  if (authError) throw authError;

  if (authData.user) {
    const { error: profileError } = await supabase
      .from('teachers')
      .insert([{ id: authData.user.id, name, school }]);

    if (profileError) throw profileError;
  }
  return authData.user;
}

async function getTeacherProfile(teacherId) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', teacherId)
    .single();

  if (error) console.error("Erro ao obter perfil do professor:", error);
  return data;
}

async function logoutTeacher() {
  await supabase.auth.signOut();
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