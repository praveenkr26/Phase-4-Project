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
            maxOutputTokens,
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
    console.error(err);
    throw err;
  }
}

// ===============================
// ASK TOOL
// ===============================

const history = [];

function updateCount() {
  const v = document.getElementById('questionInput').value;
  document.getElementById('charCount').textContent = v.length + ' / 500';
}

function setSuggestion(text) {
  document.getElementById('questionInput').value = text;
  updateCount();
  document.getElementById('questionInput').focus();
}

async function askQuestion() {
  const input = document.getElementById('questionInput');
  const question = input.value.trim();
  if (!question) return input.focus();

  const btn = document.getElementById('askBtn');
  const area = document.getElementById('responseArea');

  btn.disabled = true;
  btn.innerHTML = "⏳ Thinking...";

  area.innerHTML = `
    <div class="response-card">
      <div class="loading-state">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <div class="loading-text">Thinking…</div>
      </div>
    </div>`;

  try {
    const answer = await generateAIText({
      prompt: question,
      model: "gemini-2.5-flash",
      maxOutputTokens: 1000
    });

    history.unshift({ question, answer });

    showAnswer(question, answer);
    renderHistory();

  } catch (e) {
    area.innerHTML = `<div class="error-card">⚠ ${e.message || "Error occurred"}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `🔍 Get Answer`;
  }
}

// ===============================
// SHOW ANSWER
// ===============================
function showAnswer(question, answer) {
  const area = document.getElementById('responseArea');
  const id = 'answer-' + Date.now();

  area.innerHTML = `
    <div class="response-card">
      <div class="response-header">
        <div class="response-label">
          ✦ AI Response
          <span class="ai-badge">Gemini</span>
        </div>
        <button class="copy-btn" onclick="copyText('${id}')">Copy</button>
      </div>

      <div class="response-body">
        <div class="response-question">"${question}"</div>
        <div class="response-text" id="${id}">${answer}</div>
      </div>
    </div>`;
}

// ===============================
// COPY TEXT
// ===============================
function copyText(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text);

  const btns = document.querySelectorAll('.copy-btn');
  btns.forEach(b => b.textContent = "✓ Copied");

  setTimeout(() => {
    btns.forEach(b => b.textContent = "Copy");
  }, 1500);
}

// ===============================
// HISTORY
// ===============================
function renderHistory() {
  if (!history.length) return;

  document.getElementById('historySection').style.display = 'block';

  const list = document.getElementById('historyList');
  list.innerHTML = history.slice(0, 5).map(h => `
    <div class="history-item" onclick="showAnswer('${h.question.replace(/'/g,"\\'")}', '${h.answer.replace(/'/g,"\\'").replace(/\n/g," ")}')">
      <div class="history-q">${h.question}</div>
      <div class="history-arrow">→</div>
    </div>
  `).join('');
}

// ===============================
// ENTER SUPPORT
// ===============================
document.getElementById('questionInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) askQuestion();
});