const user = "Prashant64bit";

const indiaTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
document.getElementById('yearFooter').innerHTML = `© ${new Date(indiaTime).getFullYear()} Prashant Thakur • Built with passion`;

new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('.progress-fill').forEach(bar => {
      bar.style.width = bar.dataset.p + '%';
    });
  }
}, { threshold: 0.6 }).observe(document.querySelector('.skills-grid'));

async function loadProjects() {
  const grid = document.getElementById('projects');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:5rem;color:#94a3b8"><i class="fas fa-spinner fa-spin fa-3x"></i><br><br>Loading projects...</div>';

  try {
    const jsonRes = await fetch('repo.json');
    if (!jsonRes.ok) throw new Error('repo.json not found');
    const projects = await jsonRes.json();

    if (projects.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:#94a3b8">No projects added yet.<br>Edit repo.json</div>';
      return;
    }

    grid.innerHTML = '';

    projects.forEach(project => {
      const techTags = project.tech.map(t => 
        `<span class="tech-tag">${t}</span>`
      ).join('');

      const links = [];
      if (project.website) links.push(`<a href="${project.website}" target="_blank" class="project-link"><i class="fas fa-globe"></i> Website</a>`);
      if (project.source)   links.push(`<a href="${project.source}" target="_blank" class="project-link"><i class="fab fa-github"></i> Source</a>`);
      if (project.live)     links.push(`<a href="${project.live}" target="_blank" class="project-link"><i class="fas fa-play-circle"></i> Live</a>`);

      grid.innerHTML += `
        <div class="repo-card">
          <div class="project-image-container">
            <img src="${project.image}" alt="${project.name}" class="project-image">
          </div>

          <h3 class="project-name">${project.name}</h3>

          <p class="project-desc">${project.description}</p>

          <div class="tech-title">Tech-stack</div>
          <div class="tech-stack">
            ${techTags}
          </div>

          <div class="project-links">
            ${links.join('')}
          </div>
        </div>`;
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem;color:#94a3b8">Could not load projects.<br>Check repo.json and image files</div>';
  }
}

async function loadGitStats() {
  try {
    const [userData, repos] = await Promise.all([
      fetch(`https://api.github.com/users/${user}`).then(r => r.json()),
      fetch(`https://api.github.com/users/${user}/repos?per_page=100`).then(r => r.json())
    ]);

    document.getElementById('repoNum').textContent = userData.public_repos || 0;
    document.getElementById('followNum').textContent = userData.followers || 0;
    document.getElementById('starNum').textContent = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  } catch {}
}

async function loadContributions() {
  const totalEl = document.querySelector('.contrib-total');
  const grid = document.querySelector('.contrib-days');
  const monthLabels = document.querySelector('.month-labels');

  totalEl.textContent = 'Loading contributions...';

  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    const total = data.total.lastYear;
    totalEl.textContent = `${total} contributions in the last year`;

    const today = new Date();
    let contributions = data.contributions
      .filter(c => new Date(c.date) <= today && c.count > 0);

    if (!contributions.length) {
      totalEl.textContent = 'No contributions found.';
      grid.innerHTML = '';
      monthLabels.innerHTML = '';
      return;
    }

    contributions.sort((a, b) => new Date(a.date) - new Date(b.date));

    const firstDate = new Date(contributions[0].date);
    const lastDate = today;

    const totalDays = Math.floor((lastDate - firstDate) / 86400000) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    grid.innerHTML = '';

    const commitMap = new Map(contributions.map(c => [c.date, c.count]));

    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const squareIndex = week * 7 + day;
        if (squareIndex >= totalDays) break;

        const currentDateObj = new Date(firstDate);
        currentDateObj.setDate(firstDate.getDate() + squareIndex);
        const dateStr = currentDateObj.toISOString().split('T')[0];

        const count = commitMap.get(dateStr) || 0;
        const level = count === 0 ? 0 : Math.min(4, Math.ceil(count / 5));

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", week * 14);
        rect.setAttribute("y", day * 14);
        rect.setAttribute("width", 12);
        rect.setAttribute("height", 12);
        rect.setAttribute("rx", 3);
        rect.setAttribute("data-level", level);
        rect.setAttribute("data-date", dateStr);
        rect.setAttribute("data-count", count);
        rect.setAttribute("fill", ["#1a1625","#351d5e","#4c1d95","#7c3aed","#a78bfa"][level]);

        rect.onmouseover = e => {
          const tip = document.createElement('div');
          tip.id = 'tooltip';
          tip.innerHTML = `${dateStr}<br>${count} contributions`;
          tip.style.cssText = `position:absolute;background:#1a1625;color:white;padding:8px 12px;border-radius:6px;font-size:13px;pointer-events:none;z-index:1000;left:${e.pageX+15}px;top:${e.pageY+15}px;`;
          document.body.appendChild(tip);
        };
        rect.onmouseout = () => document.getElementById('tooltip')?.remove();

        grid.appendChild(rect);
      }
    }

    monthLabels.innerHTML = '';
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let lastMonth = -1;
    let isFirst = true;

    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < 7; day++) {
        const idx = week * 7 + day;
        if (idx >= totalDays) break;

        const d = new Date(firstDate);
        d.setDate(firstDate.getDate() + idx);
        const m = d.getMonth();

        if (m !== lastMonth) {
          let text = monthNames[m];
          if (isFirst) {
            text = "   ";
            isFirst = false;
          }

          const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
          t.setAttribute("x", week * 14 + 70);
          t.setAttribute("y", 15);
          t.setAttribute("text-anchor", "middle");
          t.setAttribute("font-size", "14");
          t.setAttribute("fill", "#94a3b8");
          t.textContent = text;
          monthLabels.appendChild(t);

          lastMonth = m;
        }
      }
    }

    const svg = document.querySelector('.js-calendar-graph-svg');
    const width = Math.max(828, totalWeeks * 14 + 80);
    svg.setAttribute("width", width);
    svg.setAttribute("viewBox", `0 0 ${width} 140`);

  } catch {
    totalEl.textContent = 'Unable to load contributions.';
  }
}

loadGitStats();
loadProjects();
loadContributions();