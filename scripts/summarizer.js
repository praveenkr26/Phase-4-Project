// SUMMARIZER TOOL - Gemini API VERSION

let selectedMode = 'concise';
let currentSummary = '';

function selectMode(btn) {
  document.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMode = btn.dataset.mode;
}

function updateWordCount() {
  const text = document.getElementById('textInput').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = words + ' words';
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('textInput').value = text;
    updateWordCount();
  } catch {
    alert('Please paste manually (Ctrl+V)');
  }
}

function clearInput() {
  document.getElementById('textInput').value = '';
  updateWordCount();
  document.getElementById('outputContent').innerHTML =
    '<div class="output-empty"><div class="output-empty-icon">📝</div><div class="output-empty-text">Your summary will appear here</div></div>';
  document.getElementById('copyBtn').style.display = 'none';
}

// -------------------- GEMINI API FUNCTION --------------------

async function generateAIText(prompt) {
  const API_KEY = "paste your api key here"; 
  
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini API Error");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

// -------------------- PROMPTS --------------------

const modePrompts = {
  concise:
    'Provide a concise summary of the following text in 2-3 short paragraphs. Focus on the most important points. Use plain text only.',
  detailed:
    'Provide a detailed summary of the following text covering all key points and supporting details. Use plain text organized in clear paragraphs.',
  bullets:
    'Summarize the following text as a clear list of key bullet points (use • symbol). Start each bullet on a new line. Use plain text.',
  executive:
    'Create an executive brief of the following text. Include: one-line TL;DR, 3 key takeaways, and bottom line. Use plain text.'
};

// -------------------- MAIN FUNCTION --------------------

async function summarize() {
  const text = document.getElementById('textInput').value.trim();
  if (!text || text.split(/\s+/).length < 10) {
    alert('Please enter at least 10 words to summarize.');
    return;
  }

  const btn = document.getElementById('sumBtn');
  const output = document.getElementById('outputContent');

  btn.disabled = true;
  btn.textContent = 'Summarizing…';
  document.getElementById('copyBtn').style.display = 'none';

  output.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <div class="loading-text">Reading and analyzing…</div>
    </div>`;

  try {
    const prompt =
      modePrompts[selectedMode] + "\n\nTEXT:\n" + text;

    currentSummary = await generateAIText(prompt);

    const wordCount = text.split(/\s+/).length;
    const summaryWords = currentSummary.split(/\s+/).length;
    const ratio = ((summaryWords / wordCount) * 100).toFixed(1);

    output.innerHTML = `
      <div class="output-body">
        <div class="summary-text">${currentSummary}</div>
        <div class="summary-meta">
          <div class="meta-item">
            <div class="meta-label">Original</div>
            <div class="meta-val">${wordCount} words</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Summary</div>
            <div class="meta-val">${summaryWords} words</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Reduction</div>
            <div class="meta-val">${ratio}%</div>
          </div>
        </div>
      </div>`;

    document.getElementById('copyBtn').style.display = 'flex';

  } catch (e) {
    output.innerHTML = `<div class="error-card">⚠ Error: ${e.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Summarize';
  }
}

function copySummary() {
  navigator.clipboard.writeText(currentSummary).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
      btn.innerHTML = 'Copy';
    }, 2000);
  });
}

document.getElementById('textInput')?.addEventListener('input', updateWordCount);