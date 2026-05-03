// IDEA SPARK TOOL - FIXED GEMINI VERSION

const catExamples = {
  blog: ['AI trends', 'Self-improvement', 'Tech reviews', 'Productivity hacks'],
  business: ['Startup ideas', 'Growth strategies', 'Management tips', 'Team building'],
  story: ['Plot twists', 'Character arcs', 'Worldbuilding', 'Narrative hooks'],
  social: ['Instagram captions', 'Tweet threads', 'TikTok angles', 'Engaging content'],
  product: ['Feature ideas', 'User experience', 'Pricing models', 'Marketing angles'],
  research: ['Research directions', 'Hypotheses', 'Study designs', 'Analysis methods'],
  names: ['Brand names', 'Product names', 'Character names', 'Company names'],
  custom: ['Free form', 'Any topic', 'Creative brainstorm', 'Custom ideas']
};

let selectedCat = 'blog';
let selectedTone = 'creative';

// ---------------- CATEGORY ----------------

function selectCat(btn) {
  document.querySelectorAll('.cat-btn').forEach((b) =>
    b.classList.remove('selected')
  );
  btn.classList.add('selected');
  selectedCat = btn.dataset.cat;
  renderExamples();
}

// ---------------- TONE ----------------

function selectTone(btn) {
  document.querySelectorAll('.tone-btn').forEach((b) =>
    b.classList.remove('selected')
  );
  btn.classList.add('selected');
  selectedTone = btn.dataset.tone;
}

// ---------------- EXAMPLES ----------------

function renderExamples() {
  const list = document.getElementById('examplesList');

  list.innerHTML = catExamples[selectedCat]
    .map(
      (ex) =>
        `<button class="example-chip" onclick="setExample('${ex}')">${ex}</button>`
    )
    .join('');
}

function setExample(text) {
  document.getElementById('topicInput').value = text;
  document.getElementById('topicInput').focus();
}

renderExamples();

// ---------------- GEMINI API ----------------

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

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ---------------- PROMPTS ----------------

const catPrompts = {
  blog:
    'Generate blog ideas about the topic. Give title + description.',
  business:
    'Suggest innovative business ideas with value and audience.',
  story:
    'Create creative story ideas with hook and concept.',
  social:
    'Generate social media content ideas for platforms.',
  product:
    'Brainstorm product ideas with features and benefits.',
  research:
    'Give research topics, questions and study directions.',
  names:
    'Generate brandable and creative names.',
  custom:
    'Generate creative ideas about the topic.'
};

// ---------------- MAIN FUNCTION ----------------

async function generateIdeas() {
  const input = document.getElementById('topicInput');
  const topic = input.value.trim();

  if (!topic) {
    input.focus();
    return;
  }

  const count = document.getElementById('countSelect').value;
  const btn = document.getElementById('sparkBtn');
  const output = document.getElementById('ideasOutput');

  btn.disabled = true;
  btn.innerHTML = '⏳ Generating...';

  output.innerHTML = `
    <div class="loading-card">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <div class="loading-text">Sparking ideas…</div>
      <div class="loading-sub">Generating ${count} ideas</div>
    </div>
  `;

  try {
    const toneText =
      selectedTone === 'creative'
        ? 'creative and imaginative'
        : selectedTone === 'practical'
        ? 'practical and useful'
        : 'bold and innovative';

    const prompt = `
${catPrompts[selectedCat]}

Topic: ${topic}
Number of ideas: ${count}
Tone: ${toneText}

Format:
1. Title
- Description (1-2 lines)
`;

    const result = await generateAIText(prompt);

    renderIdeas(result);
  } catch (e) {
    output.innerHTML = `<div class="error-card">⚠ ${e.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Spark Ideas';
  }
}

// ---------------- RENDER IDEAS ----------------

function renderIdeas(text) {
  const output = document.getElementById('ideasOutput');

  const lines = text.split('\n').filter((l) => l.trim());

  let ideas = [];
  let current = null;

  for (let line of lines) {
    const match = line.match(/^(\d+)\.\s*(.*)/);

    if (match) {
      if (current) ideas.push(current);
      current = { title: match[2], detail: '' };
    } else if (current) {
      current.detail += line + ' ';
    }
  }

  if (current) ideas.push(current);

  if (ideas.length === 0) {
    ideas = [{ title: 'Idea', detail: text }];
  }

  const html = `
    <div class="ideas-grid">
      ${ideas
        .map(
          (idea, i) => `
        <div class="idea-card">
          <div class="idea-num">${i + 1}</div>
          <div class="idea-content">
            <div class="idea-title">${idea.title}</div>
            <div class="idea-detail">${idea.detail}</div>
            <div class="idea-actions">
              <button class="idea-copy-btn" onclick="copyIdea(this,'${(
                idea.title + ' - ' + idea.detail
              ).replace(/'/g, "\\'")}')">📋 Copy</button>
            </div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  output.innerHTML = html;
}

// ---------------- COPY ----------------

function copyIdea(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied!';
    setTimeout(() => {
      btn.textContent = '📋 Copy';
    }, 2000);
  });
}

// ---------------- ENTER KEY ----------------

document.getElementById('topicInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateIdeas();
});