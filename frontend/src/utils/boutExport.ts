import type { Card, Bout } from "../entities/cards";
import type { ScoresByRound } from "../entities/scores";

const decisionLabels: Record<string, string> = {
  ud: "Unanimous Decision",
  sd: "Split Decision",
  md: "Majority Decision",
  rsc: "Referee Stop Contest",
  "rsc-i": "Referee Stop Contest (Injury)",
  abd: "Abandon",
  dq: "Disqualified",
  c: "Cancelled",
  wo: "Walk Over",
};

const winnerLabel = (winner: string) => {
  if (winner === "red") return "Red Corner";
  if (winner === "blue") return "Blue Corner";
  return winner;
};

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvRow(cells: (string | number | undefined)[]) {
  return cells
    .map((c) => {
      const s = String(c ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

// ─── CSV ────────────────────────────────────────────────────────────────────

export function downloadFullCsv(card: Card, bout: Bout, scores: ScoresByRound) {
  const lines: string[] = [];

  // Bout header
  lines.push(csvRow(["Card", card.name]));
  lines.push(csvRow(["Card Date", card.date]));
  lines.push(csvRow(["Bout #", bout.boutNumber]));
  lines.push(csvRow(["Red Corner", bout.redCorner]));
  lines.push(csvRow(["Blue Corner", bout.blueCorner]));
  lines.push(csvRow(["Age Category", bout.ageCategory]));
  lines.push(csvRow(["Gender", bout.gender]));
  lines.push(csvRow(["Experience", bout.experience]));
  lines.push(csvRow(["Weight Class", bout.weightClass]));
  lines.push(csvRow(["Glove Size", bout.gloveSize]));
  lines.push(csvRow(["Round Length (min)", bout.roundLength]));
  lines.push(csvRow(["Number of Rounds", bout.rounds?.length ?? ""]));
  lines.push(csvRow(["Referee", bout.referee]));
  lines.push(csvRow(["Status", bout.status]));
  lines.push(csvRow(["Winner", winnerLabel(bout.winner)]));
  lines.push(csvRow(["Decision", decisionLabels[bout.decision] ?? bout.decision]));
  lines.push(csvRow(["Comments", (bout.comments ?? []).join(" | ")]));
  lines.push("");

  // Scores per round
  lines.push(
    csvRow([
      "Round",
      "Judge Role",
      "Judge Name",
      "Red Score",
      "Blue Score",
      "Red Warnings",
      "Red Cautions",
      "Red 8-Counts",
      "Blue Warnings",
      "Blue Cautions",
      "Blue 8-Counts",
    ])
  );

  const roundDetails = Object.fromEntries(
    (bout.rounds ?? []).map((r) => [r.roundNumber, r])
  );

  for (const [roundNumStr, roundScores] of Object.entries(scores)) {
    const roundNum = Number(roundNumStr);
    const rd = roundDetails[roundNum];
    for (const score of roundScores) {
      lines.push(
        csvRow([
          roundNum,
          score.judgeRole,
          score.judgeName ?? "",
          score.red,
          score.blue,
          rd?.red?.warnings?.length ?? "",
          rd?.red?.cautions?.length ?? "",
          rd?.red?.eightCounts ?? "",
          rd?.blue?.warnings?.length ?? "",
          rd?.blue?.cautions?.length ?? "",
          rd?.blue?.eightCounts ?? "",
        ])
      );
    }
  }

  downloadBlob(
    lines.join("\n"),
    `bout-${bout.boutNumber}-full.csv`,
    "text/csv"
  );
}

export function downloadPublicCsv(card: Card, bout: Bout) {
  const lines: string[] = [];
  lines.push(
    csvRow([
      "Card",
      "Card Date",
      "Bout #",
      "Red Corner",
      "Blue Corner",
      "Age Category",
      "Gender",
      "Experience",
      "Weight Class",
      "Glove Size",
      "Winner",
      "Decision",
    ])
  );
  lines.push(
    csvRow([
      card.name,
      card.date,
      bout.boutNumber,
      bout.redCorner,
      bout.blueCorner,
      bout.ageCategory,
      bout.gender,
      bout.experience,
      bout.weightClass,
      bout.gloveSize,
      winnerLabel(bout.winner),
      decisionLabels[bout.decision] ?? bout.decision,
    ])
  );

  downloadBlob(
    lines.join("\n"),
    `bout-${bout.boutNumber}-public.csv`,
    "text/csv"
  );
}

// ─── PDF (print-to-PDF via new window) ──────────────────────────────────────

const pdfStyles = `
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 32px; color: #111; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 15px; margin: 20px 0 8px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; }
  .meta-row { display: contents; }
  .label { color: #666; }
  .value { font-weight: 600; }
  .section { margin-bottom: 16px; }
  .red { color: #c0392b; font-weight: 600; }
  .blue { color: #2980b9; font-weight: 600; }
`;

function printHtml(title: string, body: string, filename: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>${pdfStyles}</style>
</head>
<body>
${body}
<script>window.onload = () => { window.print(); }</` + `script>
</body>
</html>`);
  win.document.title = filename;
  win.document.close();
}

function boutHeaderHtml(card: Card, bout: Bout) {
  return `
  <h1>Bout ${bout.boutNumber}</h1>
  <div class="section">
    <div class="meta">
      <span class="label">Card</span><span class="value">${card.name}</span>
      <span class="label">Date</span><span class="value">${card.date}</span>
      <span class="label">Red Corner</span><span class="value red">${bout.redCorner}</span>
      <span class="label">Blue Corner</span><span class="value blue">${bout.blueCorner}</span>
      <span class="label">Age Category</span><span class="value">${bout.ageCategory}</span>
      <span class="label">Gender</span><span class="value">${bout.gender}</span>
      <span class="label">Experience</span><span class="value">${bout.experience}</span>
      <span class="label">Weight Class</span><span class="value">${bout.weightClass}</span>
      <span class="label">Glove Size</span><span class="value">${bout.gloveSize}</span>
      <span class="label">Round Length (min)</span><span class="value">${bout.roundLength}</span>
      ${bout.referee ? `<span class="label">Referee</span><span class="value">${bout.referee}</span>` : ""}
    </div>
  </div>`;
}

function resultHtml(bout: Bout) {
  const winner = winnerLabel(bout.winner);
  const decision = decisionLabels[bout.decision] ?? bout.decision;
  return `
  <div class="section">
    <h2>Result</h2>
    <div class="meta">
      <span class="label">Winner</span>
      <span class="value ${bout.winner === "red" ? "red" : bout.winner === "blue" ? "blue" : ""}">${winner}</span>
      <span class="label">Decision</span><span class="value">${decision}</span>
    </div>
  </div>`;
}

export function downloadFullPdf(card: Card, bout: Bout, scores: ScoresByRound) {
  const roundDetails = Object.fromEntries(
    (bout.rounds ?? []).map((r) => [r.roundNumber, r])
  );

  const roundRows = Object.entries(scores)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([roundNumStr, roundScores]) => {
      const roundNum = Number(roundNumStr);
      const rd = roundDetails[roundNum];
      return roundScores.map(
        (score) => `<tr>
          <td>${roundNum}</td>
          <td>${score.judgeRole}</td>
          <td>${score.judgeName ?? ""}</td>
          <td>${score.red}</td>
          <td>${score.blue}</td>
          <td>${rd?.red?.warnings?.length ?? 0}</td>
          <td>${rd?.red?.cautions?.length ?? 0}</td>
          <td>${rd?.red?.eightCounts ?? 0}</td>
          <td>${rd?.blue?.warnings?.length ?? 0}</td>
          <td>${rd?.blue?.cautions?.length ?? 0}</td>
          <td>${rd?.blue?.eightCounts ?? 0}</td>
        </tr>`
      );
    })
    .join("");

  const commentsHtml =
    bout.comments && bout.comments.length > 0
      ? `<div class="section"><h2>Comments</h2><ul>${bout.comments.map((c) => `<li>${c}</li>`).join("")}</ul></div>`
      : "";

  const body = `
    ${boutHeaderHtml(card, bout)}
    ${resultHtml(bout)}
    <h2>Judge Scores</h2>
    <table>
      <thead>
        <tr>
          <th>Round</th><th>Role</th><th>Judge</th>
          <th>Red</th><th>Blue</th>
          <th>Red Warn</th><th>Red Caut</th><th>Red 8c</th>
          <th>Blue Warn</th><th>Blue Caut</th><th>Blue 8c</th>
        </tr>
      </thead>
      <tbody>${roundRows}</tbody>
    </table>
    ${commentsHtml}
  `;

  printHtml(
    `Bout ${bout.boutNumber} — Full`,
    body,
    `bout-${bout.boutNumber}-full.pdf`
  );
}

export function downloadPublicPdf(card: Card, bout: Bout) {
  const body = `
    ${boutHeaderHtml(card, bout)}
    ${resultHtml(bout)}
  `;
  printHtml(
    `Bout ${bout.boutNumber} — Result`,
    body,
    `bout-${bout.boutNumber}-public.pdf`
  );
}

// ─── Judge consistency report (card-wide) ───────────────────────────────────

type JudgeStat = {
  name: string;
  totalRed: number;
  totalBlue: number;
  deviations: number[];
  agreedRounds: number;
  totalRounds: number;
};

function buildJudgeStats(allBoutScores: Record<string, ScoresByRound>): JudgeStat[] {
  const judgeMap = new Map<string, JudgeStat>();

  for (const scores of Object.values(allBoutScores)) {
    for (const roundScores of Object.values(scores)) {
      if (!roundScores || roundScores.length === 0) continue;

      const meanRed = roundScores.reduce((s, j) => s + j.red, 0) / roundScores.length;
      const meanBlue = roundScores.reduce((s, j) => s + j.blue, 0) / roundScores.length;

      let redWins = 0, blueWins = 0;
      for (const s of roundScores) {
        if (s.red > s.blue) redWins++;
        else if (s.blue > s.red) blueWins++;
      }
      const majority = redWins > blueWins ? "red" : blueWins > redWins ? "blue" : "draw";

      for (const s of roundScores) {
        const key = s.judgeName ?? s.judgeRole;
        if (!judgeMap.has(key)) {
          judgeMap.set(key, { name: key, totalRed: 0, totalBlue: 0, deviations: [], agreedRounds: 0, totalRounds: 0 });
        }
        const stat = judgeMap.get(key)!;
        stat.totalRed += s.red;
        stat.totalBlue += s.blue;
        stat.deviations.push(Math.abs(s.red - meanRed) + Math.abs(s.blue - meanBlue));
        stat.totalRounds++;
        const judgeWinner = s.red > s.blue ? "red" : s.blue > s.red ? "blue" : "draw";
        if (judgeWinner === majority) stat.agreedRounds++;
      }
    }
  }

  return Array.from(judgeMap.values());
}

export function downloadJudgeConsistencyCsv(card: Card, allBoutScores: Record<string, ScoresByRound>) {
  const stats = buildJudgeStats(allBoutScores);
  const lines: string[] = [];

  lines.push(csvRow(["Card", card.name]));
  lines.push(csvRow(["Date", card.date]));
  lines.push("");
  lines.push(csvRow(["Judge", "Total Red", "Total Blue", "Avg Deviation from Panel", "Agreement with Majority (%)"]));

  for (const stat of stats) {
    const avgDev = stat.deviations.length > 0
      ? stat.deviations.reduce((s, d) => s + d, 0) / stat.deviations.length
      : 0;
    const agreePct = stat.totalRounds > 0 ? (stat.agreedRounds / stat.totalRounds) * 100 : 0;
    lines.push(csvRow([stat.name, stat.totalRed, stat.totalBlue, avgDev.toFixed(2), agreePct.toFixed(1)]));
  }

  downloadBlob(lines.join("\n"), `${card.name}-judge-consistency.csv`, "text/csv");
}

export function downloadJudgeConsistencyPdf(card: Card, allBoutScores: Record<string, ScoresByRound>) {
  const stats = buildJudgeStats(allBoutScores);

  const rows = stats.map((stat) => {
    const avgDev = stat.deviations.length > 0
      ? stat.deviations.reduce((s, d) => s + d, 0) / stat.deviations.length
      : 0;
    const agreePct = stat.totalRounds > 0 ? (stat.agreedRounds / stat.totalRounds) * 100 : 0;
    const devClass = avgDev <= 1 ? "style='color:#389e0d'" : avgDev <= 2 ? "" : "style='color:#cf1322'";
    const agClass = agreePct >= 80 ? "style='color:#389e0d'" : agreePct >= 60 ? "" : "style='color:#cf1322'";
    return `<tr>
      <td><strong>${stat.name}</strong></td>
      <td>${stat.totalRed}</td>
      <td>${stat.totalBlue}</td>
      <td ${devClass}>${avgDev.toFixed(2)}</td>
      <td ${agClass}>${agreePct.toFixed(1)}%</td>
    </tr>`;
  }).join("");

  const body = `
    <h1>Judge Consistency Report</h1>
    <div class="meta">
      <span class="label">Card</span><span class="value">${card.name}</span>
      <span class="label">Date</span><span class="value">${card.date}</span>
      <span class="label">Bouts scored</span><span class="value">${Object.keys(allBoutScores).length}</span>
    </div>
    <h2>Judge Stats — Across All Bouts</h2>
    <table>
      <thead>
        <tr>
          <th>Judge</th>
          <th>Total Red</th>
          <th>Total Blue</th>
          <th>Avg Deviation from Panel</th>
          <th>Agreement with Majority (%)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#666;margin-top:16px">
      <strong>Avg Deviation:</strong> average absolute difference from the panel mean per round across all bouts (lower = more consistent with the panel).<br>
      <strong>Agreement %:</strong> percentage of rounds where the judge agreed with the majority on who won.
    </p>
  `;

  printHtml(`${card.name} — Judge Consistency`, body, `${card.name}-judge-consistency.pdf`);
}

// ─── Card-level exports (all bouts) ─────────────────────────────────────────

const fullBoutRow = (bout: Bout) =>
  csvRow([
    bout.boutNumber,
    bout.redCorner,
    bout.blueCorner,
    bout.ageCategory,
    bout.gender,
    bout.experience,
    bout.weightClass,
    bout.gloveSize,
    bout.roundLength,
    bout.rounds?.length ?? "",
    bout.numberOfJudges,
    bout.referee,
    bout.status,
    winnerLabel(bout.winner),
    decisionLabels[bout.decision] ?? bout.decision,
    (bout.comments ?? []).join(" | "),
  ]);

const publicBoutRow = (bout: Bout) =>
  csvRow([
    bout.boutNumber,
    bout.redCorner,
    bout.blueCorner,
    bout.ageCategory,
    bout.gender,
    bout.experience,
    bout.weightClass,
    winnerLabel(bout.winner),
    decisionLabels[bout.decision] ?? bout.decision,
  ]);

export function downloadCardFullCsv(card: Card, bouts: Bout[]) {
  const lines: string[] = [];
  lines.push(csvRow(["Card", card.name]));
  lines.push(csvRow(["Date", card.date]));
  lines.push("");
  lines.push(
    csvRow([
      "Bout #", "Red Corner", "Blue Corner", "Age Category", "Gender",
      "Experience", "Weight Class", "Glove Size", "Round Length (min)",
      "# Rounds", "# Judges", "Referee", "Status", "Winner", "Decision", "Comments",
    ])
  );
  for (const bout of bouts) lines.push(fullBoutRow(bout));
  downloadBlob(lines.join("\n"), `${card.name}-full.csv`, "text/csv");
}

export function downloadCardPublicCsv(card: Card, bouts: Bout[]) {
  const lines: string[] = [];
  lines.push(csvRow(["Card", card.name]));
  lines.push(csvRow(["Date", card.date]));
  lines.push("");
  lines.push(
    csvRow([
      "Bout #", "Red Corner", "Blue Corner", "Age Category", "Gender",
      "Experience", "Weight Class", "Winner", "Decision",
    ])
  );
  for (const bout of bouts) lines.push(publicBoutRow(bout));
  downloadBlob(lines.join("\n"), `${card.name}-public.csv`, "text/csv");
}

function cardBoutsTableHtml(bouts: Bout[], full: boolean) {
  const headers = full
    ? `<th>Bout #</th><th>Red Corner</th><th>Blue Corner</th><th>Age Cat.</th>
       <th>Gender</th><th>Experience</th><th>Weight</th><th>Gloves</th>
       <th>Rnd Len</th><th>Rounds</th><th>Judges</th><th>Status</th>
       <th>Winner</th><th>Decision</th><th>Comments</th>`
    : `<th>Bout #</th><th>Red Corner</th><th>Blue Corner</th><th>Age Cat.</th>
       <th>Gender</th><th>Experience</th><th>Weight</th><th>Winner</th><th>Decision</th>`;

  const rows = bouts
    .map((b) => {
      const winner = winnerLabel(b.winner);
      const decision = decisionLabels[b.decision] ?? b.decision;
      const winnerClass = b.winner === "red" ? "red" : b.winner === "blue" ? "blue" : "";
      if (full) {
        return `<tr>
          <td>${b.boutNumber}</td>
          <td class="red">${b.redCorner}</td>
          <td class="blue">${b.blueCorner}</td>
          <td>${b.ageCategory}</td><td>${b.gender}</td><td>${b.experience}</td>
          <td>${b.weightClass}</td><td>${b.gloveSize}</td><td>${b.roundLength}</td>
          <td>${b.rounds?.length ?? ""}</td><td>${b.numberOfJudges}</td>
          <td>${b.status}</td>
          <td class="${winnerClass}">${winner}</td>
          <td>${decision}</td>
          <td>${(b.comments ?? []).join(", ")}</td>
        </tr>`;
      }
      return `<tr>
        <td>${b.boutNumber}</td>
        <td class="red">${b.redCorner}</td>
        <td class="blue">${b.blueCorner}</td>
        <td>${b.ageCategory}</td><td>${b.gender}</td><td>${b.experience}</td>
        <td>${b.weightClass}</td>
        <td class="${winnerClass}">${winner}</td>
        <td>${decision}</td>
      </tr>`;
    })
    .join("");

  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function downloadCardFullPdf(card: Card, bouts: Bout[]) {
  const body = `
    <h1>${card.name}</h1>
    <div class="meta">
      <span class="label">Date</span><span class="value">${card.date}</span>
      <span class="label">Bouts</span><span class="value">${bouts.length}</span>
    </div>
    <h2>All Bouts — Full Report</h2>
    ${cardBoutsTableHtml(bouts, true)}
  `;
  printHtml(`${card.name} — Full`, body, `${card.name}-full.pdf`);
}

export function downloadCardPublicPdf(card: Card, bouts: Bout[]) {
  const body = `
    <h1>${card.name}</h1>
    <div class="meta">
      <span class="label">Date</span><span class="value">${card.date}</span>
      <span class="label">Bouts</span><span class="value">${bouts.length}</span>
    </div>
    <h2>Results</h2>
    ${cardBoutsTableHtml(bouts, false)}
  `;
  printHtml(`${card.name} — Results`, body, `${card.name}-public.pdf`);
}
