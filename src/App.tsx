import React, { useEffect, useMemo, useState } from "react";

const PROMPTS = {
  faculty: [
    "Share a fun fact you learned this week",
    "Discover one key skill a professor recommends",
    "Learn why a student chose their major",
    "Discover what at Foothill influenced an alum most",
    "Find a student working on an interesting project",
    "Who is from Robotics club?",
    "Who is from Rocketry club?",
    "Who is from Engineering club?",
    "Who is from Chemistry club?",
    "Who is from Physics club?",
    "Learn about a student's goal at Foothill",
    "Find a student with a big goal",
    "Meet someone new from the event",
    "Find someone who discovered a useful resource at Foothill",
    "Find someone attending their first Foothill STEM event"
  ],

  student: [
    "Share a fun fact you learned this week",
    "Discover one key skill a professor recommends",
    "Discover what at Foothill influenced an alum most",
    "Learn why a professor decided to teach at Foothill",
    "Find your mentor and share your appreciation",
    "Figure out who is a club leader (not someone you already know)",
    "Who is from Robotics club?",
    "Who is from Rocketry club?",
    "Who is from Engineering club?",
    "Who is from Chemistry club?",
    "Who is from Physics club?",
    "Learn why someone chose their major",
    "Discover what surprised an alum after Foothill",
    "Take a selfie with a new friend",
    "Find someone who is not a STEM major",
    "Take a selfie with a professor"
  ],

  alumni: [
    "Share a fun fact you learned this week",
    "Discover one key skill a professor recommends",
    "Share the most important resource that helped you succeed",
    "Discover why someone chose their major",
    "Share one lesson learned after transfer",
    "Who is from Robotics club?",
    "Who is from Rocketry club?",
    "Who is from Engineering club?",
    "Who is from Chemistry club?",
    "Who is from Physics club?",
    "Take a selfie with someone new",
    "Take a selfie with a professor you reconnect with",
    "Find someone doing something exciting at Foothill",
    "Meet a student from a different major"
  ]
};

const ROLE_LABELS = {
  faculty: "Faculty",
  student: "Student",
  alumni: "Alumni",
};

const FREE_SPACE = {
  id: "free-space",
  prompt: "FREE SPACE",
  type: "free",
  completed: true,
};

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function seededShuffle(items, seedString) {
  const seedFn = stringToSeed(seedString);
  const rng = mulberry32(seedFn());
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCard(role, name, email) {
  const source = PROMPTS[role] || [];
  const chosen = seededShuffle(source, `${role}-${name}-${email}`).slice(0, 8);
  const grid = chosen.map((prompt, index) => ({
    id: `${role}-${index}-${prompt}`,
    prompt,
    type: "task",
    completed: false,
    proof: null,
    interactionName: "",
    pendingApproval: false,
  }));

  grid.splice(4, 0, FREE_SPACE);
  return grid;
}

function getCompletedLines(card) {
  const size = 3;
  const lines = [];

  for (let r = 0; r < size; r++) {
    lines.push([r * size, r * size + 1, r * size + 2]);
  }
  for (let c = 0; c < size; c++) {
    lines.push([c, c + size, c + size * 2]);
  }
  lines.push([0, 4, 8]);
  lines.push([2, 4, 6]);

  return lines.filter((line) => line.every((index) => card[index]?.completed));
}

function countCompletedLines(card) {
  return getCompletedLines(card).length;
}

function getCompletedLineCellIds(card) {
  return new Set(getCompletedLines(card).flat());
}

function getPhotoPreview(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

function triggerVibrate(pattern = [35]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// no default background; selfie cells will use the uploaded photo after completion

function CardCell({ cell, onOpen, isInCompletedLine, isJustCompleted, isLineCelebrating, freeTone = "student" }) {
  const participantFreeBg =
    freeTone === "faculty"
      ? "border-blue-300 bg-blue-100"
      : freeTone === "alumni"
      ? "border-orange-300 bg-orange-100"
      : "border-green-300 bg-green-100";
  return (
    <button
      onClick={onOpen}
      className={`group relative aspect-square w-full border p-2 text-center transition-all duration-300 hover:bg-slate-50 ${
        isLineCelebrating
          ? "border-emerald-400 bg-emerald-100 shadow-[0_0_0_2px_rgba(16,185,129,0.18),0_0_28px_rgba(16,185,129,0.25)]"
          : isInCompletedLine
          ? "border-emerald-300 bg-emerald-50 shadow-[inset_0_0_0_2px_rgba(16,185,129,0.12)]"
          : cell.completed
          ? "border-slate-300 bg-green-50"
          : cell.pendingApproval
          ? "border-slate-300 bg-amber-50"
          : cell.type === "free"
          ? participantFreeBg
          : "border-slate-300 bg-white"
      } ${isJustCompleted ? "scale-[1.04]" : "scale-100"}`}
    >
      {cell.pendingApproval ? <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500" /> : null}
      {cell.completed && cell.type !== "free" ? <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-600" /> : null}

      {isJustCompleted || isLineCelebrating ? (
        <div className="pointer-events-none absolute inset-0 rounded-[2px] border-2 border-emerald-300 animate-pulse" />
      ) : null}

      <div className="flex h-full items-center justify-center px-2">
        <div
          className={`max-w-[10ch] font-semibold uppercase text-slate-900 ${
            cell.type === "free"
              ? "rotate-[-32deg] text-sm tracking-[0.12em] md:text-base"
              : "text-[11px] leading-[1.35] tracking-[0.04em] sm:text-xs md:text-[13px]"
          }`}
        >
          {cell.prompt}
        </div>
      </div>

      {cell.interactionName ? (
        <div className="absolute bottom-1.5 left-2 right-2 truncate text-[9px] uppercase tracking-[0.08em] text-slate-400">
          {cell.interactionName}
        </div>
      ) : null}
    </button>
  );
}

function TaskModal({ cell, onClose, onSubmit }) {
  const [interactionName, setInteractionName] = useState(cell?.interactionName || "");
  const [photoFile, setPhotoFile] = useState(null);
  const photoPreview = useMemo(() => getPhotoPreview(photoFile), [photoFile]);
  const isPhotoTask = /take a selfie/i.test(cell?.prompt || "");

  useEffect(() => {
    setInteractionName(cell?.interactionName || "");
    setPhotoFile(null);
  }, [cell?.id]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (!cell) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-slate-900">{cell.prompt}</h3>
          <button onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">
            Close
          </button>
        </div>

        <div className="space-y-4">
          {isPhotoTask ? (
            <div>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border px-3 py-3"
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="mt-3 h-56 w-full rounded-2xl object-cover" />
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input
              value={interactionName}
              onChange={(e) => setInteractionName(e.target.value)}
              className="w-full border border-slate-400 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <button
            onClick={() =>
              onSubmit({
                interactionName,
                proof: {
                  photoPreview: isPhotoTask ? photoPreview : null,
                  fileName: isPhotoTask ? photoFile?.name || null : null,
                },
              })
            }
            disabled={!interactionName.trim() || (isPhotoTask && !photoFile)}
            className="w-full rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-40"
          >
            Send high‑five
          </button>
        </div>
      </div>
    </div>
  );
}

function ParticipantBoard({ participant, onUpdate, people }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showBingo, setShowBingo] = useState(false);
  const [justCompletedCellId, setJustCompletedCellId] = useState(null);
  const [celebratingLineCellIds, setCelebratingLineCellIds] = useState([]);
  const lines = countCompletedLines(participant.card);
  const completedLineCellIds = getCompletedLineCellIds(participant.card);
  const enteredNames = Array.from(
    new Set(
      participant.card
        .map((cell) => cell.interactionName?.trim())
        .filter(Boolean)
    )
  );
  

  const approvalsWaitingForMe = people.flatMap((p) =>
    p.card
      .filter(
        (cell) =>
          cell.pendingApproval &&
          cell.interactionName?.trim().toLowerCase() === participant.name.trim().toLowerCase()
      )
      .map((cell) => ({ ownerId: p.id, ownerName: p.name, cellId: cell.id, prompt: cell.prompt, proof: cell.proof }))
  );

  function approveRequest(request) {
    onUpdate((allPeople) =>
      allPeople.map((p) => {
        if (p.id !== request.ownerId) return p;
        return {
          ...p,
          card: p.card.map((cell) =>
            cell.id === request.cellId ? { ...cell, pendingApproval: false, completed: true } : cell
          ),
        };
      })
    );
  }

  function submitProof(data) {
    const previousLines = getCompletedLines(participant.card);

    const updatedCard = participant.card.map((cell) =>
      cell.id === selectedCell.id
        ? {
            ...cell,
            interactionName: data.interactionName,
            proof: data.proof,
            pendingApproval: true,
            completed: true,
          }
        : cell
    );

    const newLines = getCompletedLines(updatedCard);

    onUpdate((allPeople) =>
      allPeople.map((p) => {
        if (p.id !== participant.id) return p;
        return {
          ...p,
          card: updatedCard,
        };
      })
    );

    setJustCompletedCellId(selectedCell.id);
    triggerVibrate([35, 45, 35]);
    window.setTimeout(() => setJustCompletedCellId(null), 650);

    if (newLines.length > previousLines.length) {
      const lineIds = [...new Set(newLines.flat())];
      setCelebratingLineCellIds(lineIds);
      triggerVibrate([80, 50, 120]);
      window.setTimeout(() => setCelebratingLineCellIds([]), 1400);
    }

    if (previousLines.length < 2 && newLines.length >= 2) {
      setShowBingo(true);
    }

    const duration = 800;
    const end = Date.now() + duration;
    (function frame() {
      const colors = ["#16a34a", "#22c55e", "#4ade80"];
      const particle = document.createElement("div");
      particle.style.position = "fixed";
      particle.style.width = "8px";
      particle.style.height = "8px";
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * 100 + "vw";
      particle.style.top = "-10px";
      particle.style.borderRadius = "50%";
      particle.style.pointerEvents = "none";
      particle.style.zIndex = 9999;
      document.body.appendChild(particle);

      const fall = particle.animate(
        [
          { transform: "translateY(0px)", opacity: 1 },
          { transform: "translateY(100vh)", opacity: 0 },
        ],
        { duration: 900, easing: "ease-out" }
      );

      fall.onfinish = () => particle.remove();

      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    setSelectedCell(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-8">
        <div className="mb-5 flex items-center justify-center">
          <h2 className="text-center text-3xl font-semibold text-slate-900">{participant.name}</h2>
        </div>

        <div className="mx-auto max-w-3xl rounded-[24px] border border-slate-300 bg-white p-4 md:p-5">
          <div className="grid grid-cols-3 overflow-hidden rounded-t-[14px] border border-slate-300">
            {['B','I','N'].map((letter) => (
              <div
                key={letter}
                className="flex aspect-[5/1.2] items-center justify-center border-r border-slate-300 bg-slate-50 text-2xl font-semibold tracking-[0.3em] text-slate-900 last:border-r-0 sm:text-3xl md:text-4xl"
              >
                {letter}
              </div>
            ))}

            <div className="pointer-events-none absolute right-3 top-3 text-right text-sm text-slate-500">
              <div>{lines} line{lines === 1 ? "" : "s"} completed</div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 overflow-hidden rounded-b-[14px] border-l border-r border-b border-slate-300">
            {participant.card.map((cell) => (
              <CardCell
                key={cell.id}
                cell={cell}
                freeTone={participant.role}
                isInCompletedLine={completedLineCellIds.has(participant.card.indexOf(cell))}
                isJustCompleted={justCompletedCellId === cell.id}
                isLineCelebrating={celebratingLineCellIds.includes(participant.card.indexOf(cell))}
                onOpen={() => cell.type !== "free" && setSelectedCell(cell)}
              />
            ))}
          </div>
        </div>
      </div>

      {approvalsWaitingForMe.length > 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Approvals waiting for you</h3>
          <div className="mt-4 space-y-3">
            {approvalsWaitingForMe.map((request) => (
              <div key={`${request.ownerId}-${request.cellId}`} className="rounded-2xl border border-amber-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">{request.ownerName}</div>
                <div className="mt-1 text-sm text-slate-600">{request.prompt}</div>
                {request.proof?.photoPreview ? (
                  <img
                    src={request.proof.photoPreview}
                    alt="Uploaded proof"
                    className="mt-3 h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}
                {request.proof?.note ? <div className="mt-2 text-sm text-slate-500">{request.proof.note}</div> : null}
                <button
                  onClick={() => approveRequest(request)}
                  className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Accept interaction
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showBingo ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
            <div className="text-center">
              <div className="text-4xl font-bold tracking-[0.18em] text-emerald-600">BINGO!</div>
              <div className="mt-3 text-sm text-slate-500">You completed 2 lines.</div>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm font-semibold text-slate-900">People you connected with</div>
              <div className="space-y-2">
                {enteredNames.map((personName) => (
                  <div key={personName} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {personName}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowBingo(false)}
              className="mt-6 w-full rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white"
            >
              Nice
            </button>
          </div>
        </div>
      ) : null}

      <TaskModal key={selectedCell?.id || "empty"} cell={selectedCell} onClose={() => setSelectedCell(null)} onSubmit={submitProof} />
    </div>
  );
}

function AdminPanel({ people }) {
  const leaderboard = people
    .map((p) => ({
      ...p,
      lines: countCompletedLines(p.card),
      completedSquares: p.card.filter((c) => c.completed).length,
      pendingSquares: p.card.filter((c) => c.pendingApproval).length,
    }))
    .sort((a, b) => b.lines - a.lines || b.completedSquares - a.completedSquares);

  const lineWinners = leaderboard.filter((p) => p.lines >= 1);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Controller dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">
          In the real version, this view should be protected and updated from a backend in real time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Participants</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{people.length}</div>
        </div>
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">At least one line</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{lineWinners.length}</div>
        </div>
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Pending approvals</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {people.reduce((sum, p) => sum + p.card.filter((c) => c.pendingApproval).length, 0)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Leaderboard</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Completed</th>
                <th className="px-3 py-2">Pending</th>
                <th className="px-3 py-2">Lines</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((person) => (
                <tr key={person.id} className="border-b last:border-0">
                  <td className="px-3 py-3 font-medium text-slate-900">{person.name}</td>
                  <td className="px-3 py-3 text-slate-600">{ROLE_LABELS[person.role]}</td>
                  <td className="px-3 py-3 text-slate-600">{person.completedSquares}</td>
                  <td className="px-3 py-3 text-slate-600">{person.pendingSquares}</td>
                  <td className="px-3 py-3 text-slate-600">{person.lines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("landing");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [people, setPeople] = useState([
    {
      id: "demo-student",
      name: "Ari",
      email: "ari@example.edu",
      role: "student",
      card: buildCard("student", "Ari", "ari@example.edu"),
    },
    {
      id: "demo-faculty",
      name: "Prof. Chen",
      email: "chen@example.edu",
      role: "faculty",
      card: buildCard("faculty", "Prof. Chen", "chen@example.edu"),
    },
    {
      id: "demo-alumni",
      name: "Maya",
      email: "maya@example.edu",
      role: "alumni",
      card: buildCard("alumni", "Maya", "maya@example.edu"),
    },
  ]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [registrationStep, setRegistrationStep] = useState("role");

  const currentUser = useMemo(
    () => people.find((p) => p.id === currentUserId) || null,
    [people, currentUserId]
  );

  function registerParticipant() {
    if (!role || !name.trim() || !email.trim()) return;
    const id = `user-${Date.now()}`;
    const person = {
      id,
      name: name.trim(),
      email: email.trim(),
      role,
      card: buildCard(role, name.trim(), email.trim()),
    };
    setPeople((prev) => [...prev, person]);
    setCurrentUserId(id);
    setMode("participant");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        {mode === "landing" ? (
          <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-10">
              {registrationStep === "role" ? (
                <div>
                  <div className="mb-10 text-center">
                    <h1 className="text-4xl font-semibold tracking-[0.25em] text-slate-900">BINGO</h1>
                  </div>

                  <div className="space-y-4">
                    {[
                      ["student", "STUDENT"],
                      ["alumni", "ALUMNI"],
                      ["faculty", "FACULTY"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => {
                          setRole(value);
                          setRegistrationStep("details");
                        }}
                        className="flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-5 text-lg font-medium tracking-[0.18em] text-slate-900 transition hover:bg-slate-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setRegistrationStep("role")}
                    className="mb-8 text-sm uppercase tracking-[0.2em] text-slate-500"
                  >
                    ← Back
                  </button>

                  <div className="mb-8 text-center">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{ROLE_LABELS[role]}</div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Enter your info</h2>
                  </div>

                  <div className="space-y-4">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-base outline-none placeholder:text-slate-400 focus:border-slate-900"
                      placeholder="Name"
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-4 text-base outline-none placeholder:text-slate-400 focus:border-slate-900"
                      placeholder="Email"
                    />
                    <button
                      onClick={registerParticipant}
                      className="w-full rounded-2xl border border-slate-900 bg-slate-900 px-4 py-4 text-base font-medium uppercase tracking-[0.18em] text-white"
                    >
                      Start bingo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {mode === "participant" && currentUser ? (
          <ParticipantBoard participant={currentUser} onUpdate={setPeople} people={people} />
        ) : null}

        {mode === "admin" ? <AdminPanel people={people} /> : null}
      </div>
    </div>
  );
}
