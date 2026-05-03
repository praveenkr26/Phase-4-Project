// ===============================
// GEMINI API CONFIG
// ===============================
const GEMINI_API_KEY = "paste your api key here";

async function generateAIText({ prompt, model = "gemini-2.5-flash", maxOutputTokens = 1000 }) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: maxOutputTokens,
            temperature: 0.7
          }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Gemini API Error");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
}

// ===============================
// DEFINITION TOOL - FIXED
// ===============================

let selectedDepth = 'simple';
const searchHistory = [];
let currentDefinition = '';

function selectDepth(btn) {
  document.querySelectorAll('.depth-btn').forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedDepth = btn.dataset.depth;
}

function quickDefine(term) {
  document.getElementById('termInput').value = term;
  define();
}

const depthPrompts = {
  simple:
    'Define this term in 2-3 sentences in simple language. Then provide one practical example.',
  intermediate:
    'Define this term clearly. Include origin and common uses. Provide 2 examples.',
  detailed:
    'Comprehensive definition including etymology, formal definition, detailed explanation, multiple examples, and related contexts.'
};

async function define() {
  const input = document.getElementById('termInput');
  const term = input.value.trim();
  if (!term) {
    input.focus();
    return;
  }

  const btn = document.getElementById('defineBtn');
  const area = document.getElementById('resultArea');

  btn.disabled = true;
  btn.innerHTML = "⏳ Searching...";

  area.innerHTML = `
    <div class="result-card">
      <div class="loading-state">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <div class="loading-text">Looking up definition…</div>
      </div>
    </div>`;

  try {
    const systemPrompt = `${depthPrompts[selectedDepth]}

Structure your response EXACTLY as follows:
PART_OF_SPEECH: noun/verb/adjective/concept
DEFINITION: main definition (1-3 sentences)
DETAILS: explanation and examples
RELATED: comma separated related terms`;

    const text = await generateAIText({
      prompt: systemPrompt + `\n\nDefine: ${term}`,
      model: "gemini-2.5-flash",
      maxOutputTokens: 1000
    });

    currentDefinition = text;

    const posMatch = text.match(/PART_OF_SPEECH:\s*(.+)/i);
    const defMatch = text.match(/DEFINITION:\s*([\s\S]+?)(?=DETAILS:|RELATED:|$)/i);
    const detailMatch = text.match(/DETAILS:\s*([\s\S]+?)(?=RELATED:|$)/i);
    const relatedMatch = text.match(/RELATED:\s*(.+)/i);

    const pos = posMatch ? posMatch[1].trim() : 'term';
    const definition = defMatch ? defMatch[1].trim() : text;
    const details = detailMatch ? detailMatch[1].trim() : '';
    const related = relatedMatch
      ? relatedMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    searchHistory.unshift(term);

    renderResult(term, pos, definition, details, related);
    renderHistory();

  } catch (e) {
    area.innerHTML = `<div class="error-card">⚠ ${e.message || 'Something went wrong'}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = "📚 Find Definition";
  }
}

function renderResult(term, pos, definition, details, related) {
  const area = document.getElementById('resultArea');

  area.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <div>
          <div class="result-term">${term}</div>
          <div class="result-type">${pos}</div>
        </div>
        <button class="action-btn" onclick="copyDefinition()">Copy</button>
      </div>

      <div class="result-body">
        <div class="def-section">
          <div class="def-section-label">Definition</div>
          <div class="def-text">${definition}</div>
        </div>

        ${details ? `
        <div class="def-section">
          <div class="def-section-label">Details</div>
          <div class="def-detail">${details}</div>
        </div>` : ''}
      </div>

      ${related.length ? `
      <div class="related-section">
        ${related.map(r => `<button onclick="quickDefine('${r}')">${r}</button>`).join(' ')}
      </div>` : ''}
    </div>`;
}

function renderHistory() {
  if (searchHistory.length < 2) return;

  const area = document.getElementById('historyArea');
  area.innerHTML = `
    <div class="search-history">
      ${searchHistory.slice(0, 8).map(t =>
        `<button onclick="quickDefine('${t}')">${t}</button>`
      ).join(' ')}
    </div>`;
}

function copyDefinition() {
  navigator.clipboard.writeText(currentDefinition);
}

// Enter key support
document.getElementById('termInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') define();
});