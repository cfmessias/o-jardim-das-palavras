const { useState, useEffect, useRef } = React;

/* =========================================================================
   O JARDIM DAS PALAVRAS
   Jogo de vocabulário para o 1º-4º ano.
   Progressão por palavra: 0 Descobre -> 1 Completa a frase -> 2 Escreve -> 3 Dominada
   ========================================================================= */

const storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v === null ? null : { key, value: v };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
};

const CATEGORIES = [
  {
    id: "animais",
    label: "Bicharada",
    color: "#5CAE52",
    colorDark: "#3F8A38",
    colorSoft: "#E4F5DF",
    icon: "paw",
    words: [
      {
        id: "camaleao",
        word: "camaleão",
        emoji: "🦎",
        hint: "Este animal muda de cor consoante o sítio onde está pousado.",
        blankBefore: "O ",
        blankAfter: " mudou de cor para se esconder entre as folhas.",
      },
      {
        id: "ourico",
        word: "ouriço",
        emoji: "🦔",
        hint: "Tem o corpo coberto de espinhos e enrola-se quando tem medo.",
        blankBefore: "O ",
        blankAfter: " enrolou-se numa bola cheia de espinhos.",
      },
      {
        id: "morcego",
        word: "morcego",
        emoji: "🦇",
        hint: "Voa de noite e dorme pendurado de cabeça para baixo.",
        blankBefore: "O ",
        blankAfter: " dormia pendurado no telhado da gruta.",
      },
      {
        id: "flamingo",
        word: "flamingo",
        emoji: "🦩",
        hint: "É uma ave cor-de-rosa que gosta de ficar à espera numa perna só.",
        blankBefore: "O ",
        blankAfter: " ficou equilibrado numa perna, à beira do lago.",
      },
    ],
  },
  {
    id: "casa",
    label: "Cá em Casa",
    color: "#F2704E",
    colorDark: "#C85A3B",
    colorSoft: "#FEE9E1",
    icon: "home",
    words: [
      {
        id: "chave",
        word: "chave",
        emoji: "🔑",
        hint: "Usamos este objeto para abrir e fechar a porta.",
        blankBefore: "A ",
        blankAfter: " estava escondida debaixo do tapete da entrada.",
      },
      {
        id: "escada",
        word: "escada",
        emoji: "🪜",
        hint: "Serve para subir ou descer entre os andares de uma casa.",
        blankBefore: "O gato subiu pela ",
        blankAfter: " até ao sótão.",
      },
      {
        id: "espelho",
        word: "espelho",
        emoji: "🪞",
        hint: "Quando olhamos para este objeto, vemos o nosso reflexo.",
        blankBefore: "Ela penteou o cabelo em frente ao ",
        blankAfter: ".",
      },
      {
        id: "candeeiro",
        word: "candeeiro",
        emoji: "💡",
        hint: "Usamos este objeto para iluminar uma sala quando escurece.",
        blankBefore: "Acendemos o ",
        blankAfter: " porque já estava escuro.",
      },
    ],
  },
  {
    id: "natureza",
    label: "Lá Fora",
    color: "#6F52B5",
    colorDark: "#54408A",
    colorSoft: "#EAE3F8",
    icon: "leaf",
    words: [
      {
        id: "arco-iris",
        word: "arco-íris",
        emoji: "🌈",
        hint: "Aparece no céu depois da chuva, com muitas cores.",
        blankBefore: "Depois da chuva, apareceu um ",
        blankAfter: " enorme no céu.",
      },
      {
        id: "girassol",
        word: "girassol",
        emoji: "🌻",
        hint: "É uma flor amarela que se vira para acompanhar o sol.",
        blankBefore: "O ",
        blankAfter: " virou-se lentamente para seguir o sol.",
      },
      {
        id: "trovao",
        word: "trovão",
        emoji: "⛈️",
        hint: "É o som forte que ouvimos durante uma tempestade.",
        blankBefore: "Um ",
        blankAfter: " assustou o cão durante a tempestade.",
      },
      {
        id: "ninho",
        word: "ninho",
        emoji: "🪹",
        hint: "É onde as aves põem os ovos e cuidam das crias.",
        blankBefore: "O passarinho construiu um ",
        blankAfter: " entre os ramos da árvore.",
      },
    ],
  },
];

const ALL_WORDS = CATEGORIES.flatMap((c) =>
  c.words.map((w) => ({ ...w, categoryId: c.id }))
);

const MAX_STARS = ALL_WORDS.length * 3;

const SKIN_TONES = [
  "#FFDBB4",
  "#F1C27D",
  "#C68642",
  "#8D5524",
];

const HAIR_COLORS = [
  "#2E2321",
  "#7A4A2B",
  "#D4A017",
  "#8B2E2E",
];

const HAIR_STYLES = [
  "liso",
  "encaracolado",
];

const ACCESSORIES = [
  { id: "chapeu", label: "Chapéu de explorador", threshold: 6 },
  { id: "oculos", label: "Óculos redondos", threshold: 14 },
  { id: "capa", label: "Capa de aventuras", threshold: 22 },
  { id: "coroa", label: "Coroa de campeão", threshold: 30 },
];

const PRAISE = [
  "Boa! Isso mesmo!",
  "Muito bem, continua assim!",
  "Certinho! Estás a aprender depressa.",
  "Excelente! Essa palavra já é tua.",
  "Perfeito! Que orgulho.",
];

const RETRY = [
  "Quase! Tenta outra vez.",
  "Não foi essa, mas tu consegues.",
  "Hmm, vamos tentar de novo.",
  "Ainda não é essa. Pensa bem no significado.",
];

function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeQuizOptions(word, categoryId) {
  const sameCat = ALL_WORDS.filter(
    (w) => w.categoryId === categoryId && w.id !== word.id
  );

  const others = ALL_WORDS.filter(
    (w) => w.categoryId !== categoryId && w.id !== word.id
  );

  const pool = shuffle([
    ...sameCat,
    ...shuffle(others),
  ]).slice(0, 3);

  return shuffle([
    word,
    ...pool,
  ]);
}

/* ---------------------------- Avatar ---------------------------- */

function Avatar({
  config,
  stars,
  size = 120,
  mood = "happy",
}) {
  const unlocked = ACCESSORIES.filter(
    (a) => stars >= a.threshold
  );

  const bestAccessory = unlocked[unlocked.length - 1];

  const skin = config.skin;
  const hairColor = config.hairColor;
  const s = size;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 200 200"
      aria-label="Avatar"
    >
      {bestAccessory?.id === "capa" && (
        <path
          d="M 40 120 Q 100 90 160 120 L 175 195 L 25 195 Z"
          fill="#F2704E"
        />
      )}

      {/* head */}
      <circle
        cx="100"
        cy="100"
        r="62"
        fill={skin}
      />

      {/* ears */}
      <circle
        cx="40"
        cy="102"
        r="10"
        fill={skin}
      />

      <circle
        cx="160"
        cy="102"
        r="10"
        fill={skin}
      />

      {/* hair */}
      {config.hairStyle === "liso" ? (
        <path
          d="M 40 90 Q 45 30 100 30 Q 155 30 160 90 Q 130 65 100 65 Q 70 65 40 90 Z"
          fill={hairColor}
        />
      ) : (
        <g fill={hairColor}>
          <circle cx="55" cy="55" r="16" />
          <circle cx="80" cy="38" r="17" />
          <circle cx="110" cy="34" r="17" />
          <circle cx="140" cy="45" r="16" />
          <circle cx="155" cy="70" r="14" />
          <circle cx="45" cy="75" r="13" />
        </g>
      )}

      {/* eyes */}
      {mood === "happy" && (
        <>
          <path
            d="M 75 105 Q 82 95 89 105"
            stroke="#2E2A26"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />

          <path
            d="M 111 105 Q 118 95 125 105"
            stroke="#2E2A26"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {mood === "sad" && (
        <>
          <circle
            cx="82"
            cy="103"
            r="4"
            fill="#2E2A26"
          />

          <circle
            cx="118"
            cy="103"
            r="4"
            fill="#2E2A26"
          />
        </>
      )}

      {mood === "excited" && (
        <>
          <circle
            cx="82"
            cy="102"
            r="6"
            fill="#2E2A26"
          />

          <circle
            cx="118"
            cy="102"
            r="6"
            fill="#2E2A26"
          />

          <circle
            cx="80"
            cy="100"
            r="2"
            fill="#fff"
          />

          <circle
            cx="116"
            cy="100"
            r="2"
            fill="#fff"
          />
        </>
      )}

      {/* cheeks */}
      <circle
        cx="68"
        cy="122"
        r="8"
        fill="#FF8B6A"
        opacity="0.35"
      />

      <circle
        cx="132"
        cy="122"
        r="8"
        fill="#FF8B6A"
        opacity="0.35"
      />

      {/* mouth */}
      {mood === "sad" ? (
        <path
          d="M 85 138 Q 100 128 115 138"
          stroke="#2E2A26"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M 82 130 Q 100 148 118 130"
          stroke="#2E2A26"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* glasses */}
      {bestAccessory?.id === "oculos" && (
        <g
          fill="none"
          stroke="#2E2A26"
          strokeWidth="4"
        >
          <circle
            cx="82"
            cy="104"
            r="16"
            fill="rgba(255,255,255,0.35)"
          />

          <circle
            cx="118"
            cy="104"
            r="16"
            fill="rgba(255,255,255,0.35)"
          />

          <line
            x1="98"
            y1="104"
            x2="102"
            y2="104"
          />
        </g>
      )}

      {/* hat */}
      {(bestAccessory?.id === "chapeu" ||
        bestAccessory?.id === "capa") && (
        <g>
          <ellipse
            cx="100"
            cy="52"
            rx="55"
            ry="10"
            fill="#6F52B5"
          />

          <path
            d="M 65 55 Q 70 10 100 10 Q 130 10 135 55 Z"
            fill="#8C6FD1"
          />
        </g>
      )}

      {/* crown overrides hat */}
      {bestAccessory?.id === "coroa" && (
        <g
          fill="#FFC857"
          stroke="#C89A2E"
          strokeWidth="2"
        >
          <polygon
            points="55,52 65,20 80,42 100,14 120,42 135,20 145,52"
          />

          <circle
            cx="65"
            cy="20"
            r="4"
            fill="#F2704E"
            stroke="none"
          />

          <circle
            cx="100"
            cy="14"
            r="4"
            fill="#5CAE52"
            stroke="none"
          />

          <circle
            cx="135"
            cy="20"
            r="4"
            fill="#F2704E"
            stroke="none"
          />
        </g>
      )}
    </svg>
  );
}

/* ------------------------- Small pieces ------------------------- */

function StarBadge({
  stars,
  max,
  size = "normal",
}) {
  return (
    <span className={`star-badge ${size}`}>
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
      >
        <path
          fill="#FFC857"
          stroke="#C89A2E"
          strokeWidth="1"
          d="M12 2 L14.9 8.6 L22 9.3 L16.7 14 L18.2 21 L12 17.3 L5.8 21 L7.3 14 L2 9.3 L9.1 8.6 Z"
        />
      </svg>

      {stars}

      {max ? (
        <span className="star-max">
          /{max}
        </span>
      ) : null}
    </span>
  );
}

function ProgressDots({ stage }) {
  const labels = [
    "Descobre",
    "Frase",
    "Escreve",
  ];

  return (
    <div
      className="progress-dots"
      aria-hidden="true"
    >
      {labels.map((l, i) => (
        <div
          key={l}
          className={`p-dot ${
            i < stage ? "done" : ""
          } ${
            i === stage ? "active" : ""
          }`}
        />
      ))}
    </div>
  );
}

/* ============================== APP ============================== */

function App() {
  const [loading, setLoading] = useState(true);

  const [screen, setScreen] = useState("setup");

  const [avatar, setAvatar] = useState({
    name: "",
    skin: SKIN_TONES[0],
    hairColor: HAIR_COLORS[0],
    hairStyle: "liso",
  });

  const [progress, setProgress] = useState({});

  const [activeCategory, setActiveCategory] =
    useState(null);

  const [activeWord, setActiveWord] =
    useState(null);

  const [toast, setToast] = useState(null);

  const saveTimer = useRef(null);

  const totalStars = ALL_WORDS.reduce(
    (sum, w) => sum + (progress[w.id] || 0),
    0
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(
          "jdp-profile"
        );

        if (res && res.value) {
          const data = JSON.parse(res.value);

          if (data.avatar) {
            setAvatar(data.avatar);
          }

          if (data.progress) {
            setProgress(data.progress);
          }

          if (data.setupDone) {
            setScreen("map");
          }
        }
      } catch (e) {
        // sem perfil guardado ainda — começa do zero
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function saveProfile(next) {
    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(
      async () => {
        try {
          await storage.set(
            "jdp-profile",
            JSON.stringify({
              setupDone: true,
              ...next,
            })
          );
        } catch (e) {
          console.error(
            "Não foi possível guardar o progresso",
            e
          );
        }
      },
      250
    );
  }

  function finishSetup() {
    const finalName =
      avatar.name.trim() || "Explorador";

    const next = {
      ...avatar,
      name: finalName,
    };

    setAvatar(next);
    setScreen("map");

    saveProfile({
      avatar: next,
      progress,
    });
  }

  function advanceWord(wordId, prevStars) {
    const current = progress[wordId] || 0;

    const nextStage = Math.min(
      3,
      current + 1
    );

    const nextProgress = {
      ...progress,
      [wordId]: nextStage,
    };

    setProgress(nextProgress);

    saveProfile({
      avatar,
      progress: nextProgress,
    });

    const newTotal = ALL_WORDS.reduce(
      (sum, w) =>
        sum + (nextProgress[w.id] || 0),
      0
    );

    const crossed = ACCESSORIES.find(
      (a) =>
        prevStars < a.threshold &&
        newTotal >= a.threshold
    );

    if (crossed) {
      setToast({
        type: "unlock",
        accessory: crossed,
      });
    } else if (nextStage === 3) {
      setToast({
        type: "mastered",
        word: wordId,
      });
    }

    return nextStage;
  }

  function resetGame() {
    setProgress({});

    setAvatar({
      name: "",
      skin: SKIN_TONES[0],
      hairColor: HAIR_COLORS[0],
      hairStyle: "liso",
    });

    setScreen("setup");

    storage
      .delete("jdp-profile")
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="jdp-root">
        <div className="loading-screen">
          <div className="loading-seed">
            🌱
          </div>

          <p>
            A preparar o jardim...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="jdp-root">
      {screen === "setup" && (
        <SetupScreen
          avatar={avatar}
          setAvatar={setAvatar}
          onFinish={finishSetup}
        />
      )}

      {screen === "map" && (
        <MapScreen
          avatar={avatar}
          progress={progress}
          totalStars={totalStars}
          onOpenCategory={(cat) => {
            setActiveCategory(cat);
            setScreen("category");
          }}
          onReset={resetGame}
        />
      )}

      {screen === "category" &&
        activeCategory && (
          <CategoryScreen
            category={activeCategory}
            progress={progress}
            onBack={() =>
              setScreen("map")
            }
            onOpenWord={(word) => {
              setActiveWord(word);
              setScreen("activity");
            }}
          />
        )}

      {screen === "activity" &&
        activeWord && (
          <ActivityScreen
            word={activeWord}
            category={activeCategory}
            stage={
              progress[activeWord.id] || 0
            }
            totalStars={totalStars}
            avatar={avatar}
            onExit={() =>
              setScreen("category")
            }
            onComplete={(prevStars) =>
              advanceWord(
                activeWord.id,
                prevStars
              )
            }
          />
        )}

      {toast && (
        <ToastOverlay
          toast={toast}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </div>
  );
}

/* --------------------------- Setup screen --------------------------- */

function SetupScreen({
  avatar,
  setAvatar,
  onFinish,
}) {
  return (
    <div className="screen setup-screen">
      <div className="setup-card">
        <h1>
          Cria o teu explorador
        </h1>

        <p className="sub">
          Vais aprender palavras novas e
          usá-las em frases. Primeiro,
          escolhe como é o teu avatar.
        </p>

        <div className="setup-body">
          <div className="avatar-preview">
            <Avatar
              config={avatar}
              stars={0}
              size={160}
            />
          </div>

          <div className="setup-controls">
            <label
              className="field-label"
              htmlFor="name-input"
            >
              Como te chamas?
            </label>

            <input
              id="name-input"
              className="text-input"
              placeholder="Escreve o teu nome"
              value={avatar.name}
              maxLength={16}
              onChange={(e) =>
                setAvatar((a) => ({
                  ...a,
                  name: e.target.value,
                }))
              }
            />

            <span className="field-label">
              Cor da pele
            </span>

            <div className="swatch-row">
              {SKIN_TONES.map((c) => (
                <button
                  key={c}
                  className={`swatch ${
                    avatar.skin === c
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    background: c,
                  }}
                  aria-label={
                    "Cor de pele " + c
                  }
                  onClick={() =>
                    setAvatar((a) => ({
                      ...a,
                      skin: c,
                    }))
                  }
                />
              ))}
            </div>

            <span className="field-label">
              Cor do cabelo
            </span>

            <div className="swatch-row">
              {HAIR_COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${
                    avatar.hairColor === c
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    background: c,
                  }}
                  aria-label={
                    "Cor de cabelo " + c
                  }
                  onClick={() =>
                    setAvatar((a) => ({
                      ...a,
                      hairColor: c,
                    }))
                  }
                />
              ))}
            </div>

            <span className="field-label">
              Estilo do cabelo
            </span>

            <div className="pill-row">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h}
                  className={`pill ${
                    avatar.hairStyle === h
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setAvatar((a) => ({
                      ...a,
                      hairStyle: h,
                    }))
                  }
                >
                  {h === "liso"
                    ? "Liso"
                    : "Encaracolado"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="btn-primary big"
          onClick={onFinish}
        >
          Começar a aventura
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Map screen ---------------------------- */

function MapScreen({
  avatar,
  progress,
  totalStars,
  onOpenCategory,
  onReset,
}) {
  const [
    confirmingReset,
    setConfirmingReset,
  ] = useState(false);

  return (
    <div className="screen map-screen">
      <header className="map-header">
        <div className="map-header-left">
          <Avatar
            config={avatar}
            stars={totalStars}
            size={64}
          />

          <div>
            <div className="hello">
              Olá, {avatar.name}!
            </div>

            <StarBadge
              stars={totalStars}
              max={MAX_STARS}
            />
          </div>
        </div>

        <button
          className="ghost-btn"
          onClick={() =>
            setConfirmingReset(true)
          }
        >
          Recomeçar
        </button>
      </header>

      <h1 className="map-title">
        O Jardim das Palavras
      </h1>

      <p className="map-sub">
        Escolhe uma zona para explorar.
      </p>

      <div className="island-grid">
        {CATEGORIES.map((cat) => {
          const mastered =
            cat.words.filter(
              (w) =>
                (progress[w.id] || 0) === 3
            ).length;

          return (
            <button
              key={cat.id}
              className="island-card"
              style={{
                background:
                  cat.colorSoft,
                borderColor:
                  cat.color,
              }}
              onClick={() =>
                onOpenCategory(cat)
              }
            >
              <div
                className="island-icon"
                style={{
                  background:
                    cat.color,
                }}
              >
                <CategoryIcon
                  id={cat.icon}
                />
              </div>

              <div
                className="island-name"
                style={{
                  color:
                    cat.colorDark,
                }}
              >
                {cat.label}
              </div>

              <div className="island-progress">
                {mastered} de{" "}
                {cat.words.length}{" "}
                dominadas
              </div>

              <div className="mini-bar">
                <div
                  className="mini-bar-fill"
                  style={{
                    width: `${
                      (mastered /
                        cat.words.length) *
                      100
                    }%`,
                    background:
                      cat.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="accessory-shelf">
        <span className="field-label">
          Coleção
        </span>

        <div className="accessory-row">
          {ACCESSORIES.map((a) => {
            const unlocked =
              totalStars >=
              a.threshold;

            return (
              <div
                key={a.id}
                className={`accessory-chip ${
                  unlocked
                    ? "unlocked"
                    : ""
                }`}
                title={a.label}
              >
                {unlocked
                  ? "★"
                  : a.threshold}

                <span className="accessory-label">
                  {a.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {confirmingReset && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>
              Recomeçar o jogo?
            </h2>

            <p>
              Isto vai apagar o avatar
              e todas as palavras
              aprendidas.
            </p>

            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() =>
                  setConfirmingReset(false)
                }
              >
                Cancelar
              </button>

              <button
                className="btn-primary"
                onClick={onReset}
              >
                Sim, recomeçar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryIcon({ id }) {
  if (id === "paw") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="#fff"
      >
        <circle
          cx="7"
          cy="8"
          r="2.2"
        />

        <circle
          cx="12"
          cy="6"
          r="2.2"
        />

        <circle
          cx="17"
          cy="8"
          r="2.2"
        />

        <path d="M12 12c-3.5 0-6 2.2-6 4.6 0 1.7 1.5 2.9 3.2 2.4.9-.3 1.8-.4 2.8-.4s1.9.1 2.8.4c1.7.5 3.2-.7 3.2-2.4 0-2.4-2.5-4.6-6-4.6z" />
      </svg>
    );
  }

  if (id === "home") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="#fff"
      >
        <path d="M12 3 2 11h3v9h6v-6h2v6h6v-9h3z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="#fff"
    >
      <path d="M12 2C7 6 5 10 5 13.5 5 18 8.5 21 12 21s7-3 7-7.5C19 10 17 6 12 2z" />
    </svg>
  );
}

/* -------------------------- Category screen -------------------------- */

function CategoryScreen({
  category,
  progress,
  onBack,
  onOpenWord,
}) {
  return (
    <div className="screen category-screen">
      <header className="category-header">
        <button
          className="ghost-btn"
          onClick={onBack}
        >
          ← Voltar ao mapa
        </button>
      </header>

      <div
        className="category-banner"
        style={{
          background:
            category.color,
        }}
      >
        <CategoryIcon
          id={category.icon}
        />

        <h1>
          {category.label}
        </h1>
      </div>

      <div className="word-grid">
        {category.words.map((w) => {
          const stage =
            progress[w.id] || 0;

          const mastered =
            stage === 3;

          return (
            <button
              key={w.id}
              className={`word-card ${
                mastered
                  ? "mastered"
                  : ""
              }`}
              style={{
                borderColor:
                  category.color,
              }}
              onClick={() =>
                onOpenWord(w)
              }
            >
              {mastered && (
                <div className="mastered-ribbon">
                  ★ Dominada
                </div>
              )}

              <div className="word-emoji">
                {w.emoji}
              </div>

              <div className="word-name">
                {stage === 0
                  ? "???"
                  : w.word}
              </div>

              <ProgressDots
                stage={stage}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------- Activity screen -------------------------- */

function ActivityScreen({
  word,
  category,
  stage,
  totalStars,
  avatar,
  onExit,
  onComplete,
}) {
  if (stage >= 3) {
    return (
      <MasteredCard
        word={word}
        category={category}
        avatar={avatar}
        onExit={onExit}
      />
    );
  }

  if (stage === 0) {
    return (
      <QuizStage
        word={word}
        category={category}
        avatar={avatar}
        onExit={onExit}
        onSuccess={() =>
          onComplete(totalStars)
        }
      />
    );
  }

  if (stage === 1) {
    return (
      <SentenceChoiceStage
        word={word}
        category={category}
        avatar={avatar}
        onExit={onExit}
        onSuccess={() =>
          onComplete(totalStars)
        }
      />
    );
  }

  return (
    <WriteStage
      word={word}
      category={category}
      avatar={avatar}
      onExit={onExit}
      onSuccess={() =>
        onComplete(totalStars)
      }
    />
  );
}

function ActivityShell({
  category,
  title,
  stepLabel,
  onExit,
  mood,
  avatar,
  children,
}) {
  return (
    <div
      className="screen activity-screen"
      style={{
        "--cat-color":
          category.color,
      }}
    >
      <header className="activity-header">
        <button
          className="ghost-btn"
          onClick={onExit}
        >
          ← Sair
        </button>

        <span
          className="step-label"
          style={{
            color:
              category.colorDark,
          }}
        >
          {stepLabel}
        </span>
      </header>

      <div className="activity-avatar">
        <Avatar
          config={avatar}
          stars={0}
          size={90}
          mood={mood}
        />
      </div>

      <h1 className="activity-title">
        {title}
      </h1>

      {children}
    </div>
  );
}

function QuizStage({
  word,
  category,
  avatar,
  onExit,
  onSuccess,
}) {
  const [options] =
    useState(() =>
      makeQuizOptions(
        word,
        category.id
      )
    );

  const [feedback, setFeedback] =
    useState(null);

  const [message, setMessage] =
    useState(
      "De que palavra estamos a falar?"
    );

  const [locked, setLocked] =
    useState(false);

  function choose(opt) {
    if (locked) return;

    if (opt.id === word.id) {
      setFeedback("right");
      setMessage(pick(PRAISE));
      setLocked(true);

      setTimeout(
        onSuccess,
        900
      );
    } else {
      setFeedback("wrong");
      setMessage(pick(RETRY));

      setTimeout(
        () => setFeedback(null),
        500
      );
    }
  }

  return (
    <ActivityShell
      category={category}
      title="Descobre a palavra"
      stepLabel="Passo 1 · Descobre"
      onExit={onExit}
      avatar={avatar}
      mood={
        feedback === "wrong"
          ? "sad"
          : feedback === "right"
          ? "excited"
          : "happy"
      }
    >
      <div className="quiz-card">
        <div className="quiz-emoji">
          {word.emoji}
        </div>

        <p className="quiz-hint">
          {word.hint}
        </p>
      </div>

      <p
        className={`feedback-line ${
          feedback || ""
        }`}
      >
        {message}
      </p>

      <div className="options-grid">
        {options.map((opt) => (
          <button
            key={opt.id}
            className="option-btn"
            onClick={() =>
              choose(opt)
            }
            disabled={locked}
          >
            {opt.word}
          </button>
        ))}
      </div>
    </ActivityShell>
  );
}

function SentenceChoiceStage({
  word,
  category,
  avatar,
  onExit,
  onSuccess,
}) {
  const [options] =
    useState(() =>
      makeQuizOptions(
        word,
        category.id
      )
    );

  const [selected, setSelected] =
    useState(null);

  const [feedback, setFeedback] =
    useState(null);

  const [message, setMessage] =
    useState(
      "Escolhe a palavra certa para completar a frase."
    );

  const [locked, setLocked] =
    useState(false);

  function confirm() {
    if (!selected || locked)
      return;

    if (selected.id === word.id) {
      setFeedback("right");
      setMessage(pick(PRAISE));
      setLocked(true);

      setTimeout(
        onSuccess,
        900
      );
    } else {
      setFeedback("wrong");
      setMessage(pick(RETRY));

      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
      }, 600);
    }
  }

  return (
    <ActivityShell
      category={category}
      title="Completa a frase"
      stepLabel="Passo 2 · Frase"
      onExit={onExit}
      avatar={avatar}
      mood={
        feedback === "wrong"
          ? "sad"
          : feedback === "right"
          ? "excited"
          : "happy"
      }
    >
      <div className="sentence-card">
        {word.blankBefore}

        <span
          className={`blank-slot ${
            selected ? "filled" : ""
          } ${
            feedback === "wrong"
              ? "wrong"
              : ""
          }`}
        >
          {selected
            ? selected.word
            : "______"}
        </span>

        {word.blankAfter}
      </div>

      <p
        className={`feedback-line ${
          feedback || ""
        }`}
      >
        {message}
      </p>

      <div className="chip-row">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={`chip ${
              selected?.id === opt.id
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setSelected(opt)
            }
            disabled={locked}
          >
            {opt.word}
          </button>
        ))}
      </div>

      <button
        className="btn-primary"
        disabled={!selected || locked}
        onClick={confirm}
      >
        Confirmar
      </button>
    </ActivityShell>
  );
}

function WriteStage({
  word,
  category,
  avatar,
  onExit,
  onSuccess,
}) {
  const [text, setText] =
    useState("");

  const [feedback, setFeedback] =
    useState(null);

  const [message, setMessage] =
    useState(
      `Escreve uma frase tua com a palavra "${word.word}".`
    );

  const [locked, setLocked] =
    useState(false);

  function submit() {
    if (locked) return;

    const clean = text.trim();

    const words = clean
      .split(/\s+/)
      .filter(Boolean);

    const containsWord =
      normalize(clean).includes(
        normalize(word.word)
      );

    if (!clean) {
      setMessage(
        "Escreve a tua frase na caixa antes de enviar."
      );

      setFeedback("wrong");

      return;
    }

    if (!containsWord) {
      setFeedback("wrong");

      setMessage(
        `Não encontrei a palavra "${word.word}" na tua frase. Tenta incluir essa palavra.`
      );

      return;
    }

    if (words.length < 3) {
      setFeedback("wrong");

      setMessage(
        "A tua frase é muito curta. Tenta escrever uma frase completa."
      );

      return;
    }

    setFeedback("right");

    setMessage(
      pick(PRAISE) +
        " Frase guardada no teu caderno."
    );

    setLocked(true);

    setTimeout(
      onSuccess,
      1100
    );
  }

  return (
    <ActivityShell
      category={category}
      title="Escreve a tua frase"
      stepLabel="Passo 3 · Escreve"
      onExit={onExit}
      avatar={avatar}
      mood={
        feedback === "wrong"
          ? "sad"
          : feedback === "right"
          ? "excited"
          : "happy"
      }
    >
      <div className="write-card">
        <div className="write-word">
          <span className="write-emoji">
            {word.emoji}
          </span>

          <span>
            {word.word}
          </span>
        </div>

        <p className="write-hint">
          {word.hint}
        </p>

        <textarea
          className="write-input"
          rows={3}
          placeholder={`Ex.: ontem vi um ${word.word} muito bonito.`}
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          disabled={locked}
        />
      </div>

      <p
        className={`feedback-line ${
          feedback || ""
        }`}
      >
        {message}
      </p>

      <button
        className="btn-primary"
        disabled={locked}
        onClick={submit}
      >
        Enviar frase
      </button>
    </ActivityShell>
  );
}

function MasteredCard({
  word,
  category,
  avatar,
  onExit,
}) {
  return (
    <ActivityShell
      category={category}
      title="Palavra dominada"
      stepLabel="Revisão"
      onExit={onExit}
      avatar={avatar}
      mood="excited"
    >
      <div className="quiz-card">
        <div className="quiz-emoji">
          {word.emoji}
        </div>

        <div className="mastered-word">
          {word.word}
        </div>

        <p className="quiz-hint">
          {word.hint}
        </p>

        <p className="example-sentence">
          "{word.blankBefore}
          <strong>
            {word.word}
          </strong>
          {word.blankAfter}"
        </p>
      </div>

      <button
        className="btn-primary"
        onClick={onExit}
      >
        Voltar às palavras
      </button>
    </ActivityShell>
  );
}

/* ----------------------------- Toast ----------------------------- */

function ToastOverlay({
  toast,
  onClose,
}) {
  useEffect(() => {
    const t = setTimeout(
      onClose,
      2600
    );

    return () =>
      clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="toast-backdrop"
      onClick={onClose}
    >
      <div className="toast-card">
        {Array.from({
          length: 14,
        }).map((_, i) => (
          <span
            key={i}
            className="confetti-bit"
            style={{
              left: `${
                (i * 37) % 100
              }%`,
              animationDelay: `${
                (i % 7) * 0.08
              }s`,
              background: [
                "#FFC857",
                "#F2704E",
                "#5CAE52",
                "#6F52B5",
              ][i % 4],
            }}
          />
        ))}

        {toast.type === "unlock" ? (
          <>
            <div className="toast-emoji">
              🎉
            </div>

            <h2>
              Novo acessório!
            </h2>

            <p>
              Desbloqueaste:{" "}
              {toast.accessory.label}
            </p>
          </>
        ) : (
          <>
            <div className="toast-emoji">
              ⭐
            </div>

            <h2>
              Palavra dominada!
            </h2>

            <p>
              Já sabes usar essa
              palavra em frases.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Render ----------------------------- */

const rootEl =
  document.getElementById("root");

ReactDOM
  .createRoot(rootEl)
  .render(<App />);
