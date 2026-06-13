const countdownElements = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
};
const targetDate = new Date('2026-06-26T00:00:00');
const loader = document.getElementById('loader');
const mobileNav = document.getElementById('mobileNav');
const menuToggle = document.getElementById('menuToggle');
const teamsGrid = document.getElementById('teamsGrid');
const challengeGrid = document.getElementById('challengeGrid');
const leaderboardCard = document.getElementById('leaderboardCard');
const uploadInput = document.getElementById('uploadInput');
const memoryGrid = document.getElementById('memoryGrid');
const copyLink = document.getElementById('copyLink');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const challengeModal = document.getElementById('challengeModal');
const challengeModalTitle = document.getElementById('challengeModalTitle');
const challengeModalBody = document.getElementById('challengeModalBody');
const challengeModalFooter = document.getElementById('challengeModalFooter');
const challengeModalClose = document.getElementById('challengeModalClose');

const defaultTeams = {
  groom: [],
  bride: [],
};

const challenges = [
  { icon: '❓', title: 'اختبر معلوماتك', desc: 'أسئلة مباشرة عن العروسين', action: 'ابدأ التحدي', stat: '12 سؤال' },
  { icon: '📸', title: 'تحدي الصور', desc: 'شارك أجمل صورة زفاف', action: 'ابدأ التحدي', stat: '34 مشاركة' },
  { icon: '💌', title: 'رسالة للعريس', desc: 'أرسل أرقى التهاني', action: 'ارسال رسالة', stat: '48 رسالة' },
  { icon: '📖', title: 'تحدي الذكريات', desc: 'شارك موقفًا مميزًا', action: 'شارك الذكرى', stat: '21 قصة' },
  { icon: '🔮', title: 'تحدي التوقعات', desc: 'توقع أحداث الليلة', action: 'ابدأ التحدي', stat: '77 توقع' },
];
;

const localData = {
  teams: { groom: [], bride: [] },
  memories: [],
};

async function apiPost(path, data) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  return { ok: response.ok, payload };
}

function setParticipants(rows) {
  localData.teams = {
    groom: rows.filter((row) => row.team === 'groom'),
    bride: rows.filter((row) => row.team === 'bride'),
  };
}

async function fetchParticipants() {
  try {
    const response = await fetch('/api/participants');
    if (!response.ok) {
      throw new Error('فشل تحميل بيانات المشاركين');
    }
    const rows = await response.json();
    setParticipants(rows);
    renderTeams();
    renderLeaderboard();
    return true;
  } catch (error) {
    console.error(error);
    showMessage('فشل تحميل بيانات المشاركين');
    return false;
  }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    countdownElements.days.textContent = '00';
    countdownElements.hours.textContent = '00';
    countdownElements.minutes.textContent = '00';
    countdownElements.seconds.textContent = '00';
    return;
  }

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 1000 / 60) % 60;
  const hours = Math.floor(diff / 1000 / 60 / 60) % 24;
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  countdownElements.days.textContent = pad(days);
  countdownElements.hours.textContent = pad(hours);
  countdownElements.minutes.textContent = pad(minutes);
  countdownElements.seconds.textContent = pad(seconds);
}

function saveLocalData() {
  localStorage.setItem('weddingInviteData', JSON.stringify({ memories: localData.memories }));
}

function getDefaultTeams() {
  return {
    groom: [],
    bride: [],
  };
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem('weddingInviteData');
    if (raw) {
      const parsed = JSON.parse(raw);
      localData.memories = parsed.memories || [];
      return;
    }
  } catch (err) {
    console.error('Error loading local data', err);
  }

  localData.memories = [];
}

// الملاحظة: البيانات الآن محفوظة في المتصفح فقط.
// لكي تظهر لكل الزوار، يلزم ربطها بخادم أو قاعدة بيانات مشتركة.

function showMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function getTeamScore(team) {
  return localData.teams[team].reduce((sum, member) => sum + member.points, 0);
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function findMember(team, name) {
  const normalized = normalizeName(name);
  return localData.teams[team].find((member) => normalizeName(member.name) === normalized);
}

function findMemberInOtherTeam(team, name) {
  const otherTeam = team === 'groom' ? 'bride' : 'groom';
  return findMember(otherTeam, name);
}

async function addPointsToMember(team, name, points) {
  const member = findMember(team, name);
  if (!member) return false;

  const { ok, payload } = await apiPost('/api/points', {
    name: member.name,
    team,
    points,
  });
  if (!ok) {
    showMessage(payload.message || 'فشل تحديث النقاط');
    return false;
  }

  await fetchParticipants();
  return true;
}

function renderAvatar(member) {
  const initial = member.name.trim().charAt(0);
  return `<span class="avatar">${initial}</span>`;
}

function renderTeams() {
  const groomScore = getTeamScore('groom');
  const brideScore = getTeamScore('bride');
  const groomMembers = localData.teams.groom.slice(0, 4);
  const brideMembers = localData.teams.bride.slice(0, 4);

  teamsGrid.innerHTML = `
    <article class="team-card team-card--groom">
      <span class="team-card__label">فريق العريس</span>
      <h3>ادعم العريس واجمع النقاط لفريقك</h3>
      <div class="avatars">
        ${groomMembers.map(renderAvatar).join('')}
        <div class="badge">${localData.teams.groom.length} أعضاء</div>
      </div>
      <p class="team-card__score">${groomScore} نقطة إجمالية</p>
      <input type="text" id="groomName" placeholder="اكتب اسمك هنا" />
      <button class="btn btn--primary" id="groomJoin">انضم للفريق</button>
    </article>
    <div class="team-vs">
      <div class="team-vs__circle">VS</div>
    </div>
    <article class="team-card team-card--bride">
      <span class="team-card__label">فريق العروسة</span>
      <h3>ادعمي العروسة واجمعي النقاط لفريقك</h3>
      <div class="avatars">
        ${brideMembers.map(renderAvatar).join('')}
        <div class="badge badge--pink">${localData.teams.bride.length} أعضاء</div>
      </div>
      <p class="team-card__score">${brideScore} نقطة إجمالية</p>
      <input type="text" id="brideName" placeholder="اكتبي اسمك هنا" />
      <button class="btn btn--secondary" id="brideJoin">انضمي للفريق</button>
    </article>
  `;
}

function renderChallenges() {
  challengeGrid.innerHTML = challenges
    .map(
      (item, index) => `
      <article class="challenge-card">
        <div class="challenge-card__icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <span class="challenge-card__stat">${item.stat}</span>
        <button class="btn btn--tertiary" data-challenge="${index}">${item.action}</button>
      </article>
    `
    )
    .join('');
}

function renderLeaderboard() {
  const groomEntries = [...localData.teams.groom].sort((a, b) => b.points - a.points);
  const brideEntries = [...localData.teams.bride].sort((a, b) => b.points - a.points);
  const allEntriesWithTeam = [
    ...groomEntries.map((member) => ({ ...member, team: 'فريق العريس' })),
    ...brideEntries.map((member) => ({ ...member, team: 'فريق العروسة' })),
  ].sort((a, b) => b.points - a.points);
  const hasEntries = allEntriesWithTeam.length > 0;

  leaderboardCard.innerHTML = `
    <div class="leaderboard-card__top">
      <div class="crown">👑</div>
      <div>
        <h3>المركز الأول</h3>
        <p>${hasEntries ? `${allEntriesWithTeam[0].name} - ${allEntriesWithTeam[0].points} نقطة` : 'لا توجد بيانات بعد'}</p>
      </div>
    </div>
    <div class="leaderboard-grid">
      <section class="leaderboard-team">
        <h4>فريق العريس</h4>
        <table>
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>الاسم</th>
              <th>النقاط</th>
            </tr>
          </thead>
          <tbody>
            ${groomEntries.length > 0
              ? groomEntries
                  .map(
                    (member, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${member.name}</td>
                <td>${member.points}</td>
              </tr>
            `
                  )
                  .join('')
              : '<tr><td colspan="3">لا يوجد أعضاء بعد</td></tr>'}
          </tbody>
        </table>
      </section>
      <section class="leaderboard-team">
        <h4>فريق العروسة</h4>
        <table>
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>الاسم</th>
              <th>النقاط</th>
            </tr>
          </thead>
          <tbody>
            ${brideEntries.length > 0
              ? brideEntries
                  .map(
                    (member, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${member.name}</td>
                <td>${member.points}</td>
              </tr>
            `
                  )
                  .join('')
              : '<tr><td colspan="3">لا يوجد أعضاء بعد</td></tr>'}
          </tbody>
        </table>
      </section>
    </div>
    <div class="participant-section">
      <h4>كل المسجلين</h4>
      ${hasEntries
        ? `
        <ul class="participant-list">
          ${allEntriesWithTeam
            .map(
              (member) => `
            <li>
              <span class="participant-name">${member.name}</span>
              <span class="participant-team">${member.team}</span>
              <span class="participant-points">${member.points} نقطة</span>
            </li>
          `
            )
            .join('')}
        </ul>
      `
        : '<p class="participant-empty">لم يسجل أحد بعد</p>'}
    </div>
    <button class="btn btn--primary">عرض الترتيب الكامل</button>
  `;
}

function renderMemories() {
  if (!memoryGrid) return;

  memoryGrid.innerHTML = '';
  const memories = [...localData.memories];

  if (memories.length === 0) {
    memoryGrid.innerHTML = `
      <div class="memory-empty">
        <p>لا توجد ذكريات بعد. اضغط على "أضف صورتك" لتشارك أجمل اللحظات!</p>
      </div>
    `;
    return;
  }

  memories.slice(-6).reverse().forEach((src) => {
    const item = document.createElement('div');
    item.className = 'memory-item';
    item.innerHTML = `<img src="${src}" alt="ذكرى" />`;
    item.addEventListener('click', () => openLightbox(src));
    memoryGrid.appendChild(item);
  });
}

const quizQuestions = [
  {
    question: 'أين تعرف الزوجان على بعضهما لأول مرة؟',
    options: ['في حفل عائلي', 'من خلال صديق مشترك', 'في الجامعة', 'على تطبيق التواصل'],
    answer: 0,
  },
  {
    question: 'ما هو اللون المفضل للعروسة؟',
    options: ['الاسود', 'الوردي', 'الكحلي', 'الأبيض'],
    answer: 0,
  },
  {
    question: 'أي نوع من الموسيقى يفضل العريس؟',
    options: ['رومانسي', 'عصري', 'كلاسيكي', 'شعبي'],
    answer: 3,
  },
  {
    question: 'ما اسم قاعة الحفل؟',
    options: ['الهيلتون', 'اللؤلؤه', 'نادي منشيه', 'فندق القصر'],
    answer: 2,
  },
  {
    question: 'من الذي اقترح الزواج أولاً؟',
    options: ['العريس', 'العروسة', 'كلاهما معًا', 'العائلة'],
    answer: 3,
  },
];

function openChallengeModal() {
  challengeModal.classList.add('open');
  challengeModal.setAttribute('aria-hidden', 'false');
}

function closeChallengeModal() {
  challengeModal.classList.remove('open');
  challengeModal.setAttribute('aria-hidden', 'true');
  challengeModalTitle.textContent = '';
  challengeModalBody.innerHTML = '';
  challengeModalFooter.innerHTML = '';
}

function createTeamSelect() {
  return `
    <label>اختر فريقك</label>
    <select id="challengeTeam">
      <option value="groom">فريق العريس</option>
      <option value="bride">فريق العروسة</option>
    </select>
  `;
}

function getChallengeTeam() {
  const select = document.getElementById('challengeTeam');
  return select ? select.value : 'groom';
}

function getChallengeName() {
  const input = document.getElementById('challengeName');
  return input ? input.value.trim() : '';
}

async function addChallengePoints(team, name, points) {
  if (!name) return false;
  const member = findMember(team, name);
  if (member) {
    return await addPointsToMember(team, name, points);
  }

  const otherMember = findMemberInOtherTeam(team, name);
  if (otherMember) {
    showMessage('الاسم مسجل بالفعل في الفريق الآخر. اختر فريقك الصحيح أو انضم باسم مختلف.');
    return false;
  }

  showMessage('الاسم غير موجود في هذا الفريق. انضم أولاً إلى الفريق بنفس الاسم ليتم احتساب النقاط.');
  return false;
}

function renderQuizQuestion(step, score, name, team) {
  const current = quizQuestions[step];
  challengeModalTitle.textContent = `سؤال ${step + 1} من ${quizQuestions.length}`;
  challengeModalBody.innerHTML = `
    <div class="challenge-question">
      <h4>${current.question}</h4>
      <div class="options">
        ${current.options
          .map(
            (option, index) => `
            <label>
              <input type="radio" name="quizAnswer" value="${index}" />
              ${option}
            </label>
          `
          )
          .join('')}
      </div>
    </div>
  `;
  challengeModalFooter.innerHTML = `
    <button class="btn btn--primary" id="quizNext">التالي</button>
  `;

  document.getElementById('quizNext').addEventListener('click', async () => {
    const selected = document.querySelector('input[name="quizAnswer"]:checked');
    if (!selected) {
      showMessage('اختر إجابة أولاً');
      return;
    }
    const value = Number(selected.value);
    const nextScore = score + (value === current.answer ? 10 : 0);
    const nextStep = step + 1;
    if (nextStep < quizQuestions.length) {
      renderQuizQuestion(nextStep, nextScore, name, team);
    } else {
      const result = await addChallengePoints(team, name, nextScore);
      if (!result) return;
      challengeModalBody.innerHTML = `
        <div class="challenge-result">
          <h4>انتهى الاختبار!</h4>
          <p>حصلت على ${nextScore} نقطة.</p>
          <p>كل سؤال صحيح يمنح 10 نقاط.</p>
        </div>
      `;
      challengeModalFooter.innerHTML = `
        <button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>
      `;
      document.getElementById('challengeCloseConfirm').addEventListener('click', closeChallengeModal);
    }
  });
}

function openChallengeForm(index) {
  let title = challenges[index].title;
  let body = `
    <div class="field-group">
      <label>اكتب اسمك</label>
      <input type="text" id="challengeName" placeholder="اكتب اسمك هنا" />
    </div>
    <div class="field-group">
      ${createTeamSelect()}
    </div>
  `;
  let footer = '';

  switch (index) {
    case 0:
      title = 'اختبر معلوماتك';
      body += `<p class="challenge-modal__note">كل سؤال بـ 10 نقاط.</p>`;
      footer = `<button class="btn btn--primary" id="challengeStart">ابدأ الاختبار الآن</button>`;
      break;
    case 1:
      title = 'رفع صور ف البوم الذكريات';
      body += `
        <div class="field-group">
          <label>اختر صورة من جهازك</label>
          <input type="file" id="challengePhoto" accept="image/*" />
        </div>
        <div class="field-group">
          <label>اكتب تعليقًا على الصورة</label>
          <textarea id="challengeCaption" placeholder="اكتب تعليقًا على صورتك"></textarea>
        </div>
        <p class="challenge-modal__note">ارفع الصورة لتحصل على 200 نقطة.</p>
      `;
      footer = `<button class="btn btn--primary" id="challengeStart">رفع الصورة والحصول على 200 نقطة</button>`;
      break;
    case 2:
      title = 'اترك رسالة تهنئة للعروسين';
      body += `
        <div class="field-group">
          <label>اكتب رسالتك للعروسين</label>
          <textarea id="challengeMessage" placeholder="اكتب تهنئة جميلة"></textarea>
        </div>
        <p class="challenge-modal__note">إرسال الرسالة يمنحك 60 نقطة.</p>
      `;
      footer = `<button class="btn btn--primary" id="challengeStart">ارسال الرسالة واحصل على 60 نقطة</button>`;
      break;
    case 3:
      title = 'تحدي مشاركة الذكريات';
      body += `
        <p class="challenge-modal__note">اكتب موقف مضحك أو نصيحة تقدمها أو ذكرى مميزة تجمعك بأحدهم.</p>
        <div class="field-group">
          <label>اكتب ذكريتك هنا</label>
          <textarea id="challengeMemory" placeholder="اكتب موقفك أو ذكرى مميزة"></textarea>
        </div>
      `;
      footer = `<button class="btn btn--primary" id="challengeStart">نشر الذكرى والحصول على 100 نقطة</button>`;
      break;
    case 4:
      title = 'تحدي التوقعات';
      body += `
        <p class="challenge-modal__note">من سيحكي أولاً أثناء مراسم الزفاف؟</p>
        <div class="field-group">
          <label>اختر توقعك</label>
          <select id="challengePrediction">
            <option value="مصطفى العريس">مصطفى العريس</option>
            <option value="أسماء العروسة">أسماء العروسة</option>
            <option value="كلاهما معًا">كلاهما معًا</option>
            <option value="ولا لن يبكي أحد وسيبقى يوم كله ضحك">ولا لن يبكي أحد وسيبقى يوم كله ضحك</option>
          </select>
        </div>
      `;
      footer = `<button class="btn btn--primary" id="challengeStart">ارسل التوقعات واحصل على 100 نقطة</button>`;
      break;
    default:
      footer = `<button class="btn btn--secondary" id="challengeCloseConfirm">إغلاق</button>`;
  }

  challengeModalTitle.textContent = title;
  challengeModalBody.innerHTML = body;
  challengeModalFooter.innerHTML = footer;
  openChallengeModal();
  challengeModalClose.onclick = closeChallengeModal;

  const startButton = document.getElementById('challengeStart');
  if (!startButton) return;

  startButton.addEventListener('click', async () => {
    const name = getChallengeName();
    const team = getChallengeTeam();
    if (!name) {
      showMessage('الرجاء كتابة الاسم');
      return;
    }

    const member = findMember(team, name);
    if (!member) {
      const otherMember = findMemberInOtherTeam(team, name);
      if (otherMember) {
        showMessage('الاسم مسجل في الفريق الآخر. اختر الفريق الصحيح.');
      } else {
        showMessage('الاسم غير مسجل في هذا الفريق. انضم أولاً بنفس الاسم ليتم احتساب النقاط.');
      }
      return;
    }

    if (index === 0) {
      renderQuizQuestion(0, 0, name, team);
      return;
    }

    if (index === 1) {
      const fileInput = document.getElementById('challengePhoto');
      if (!fileInput || !fileInput.files[0]) {
        showMessage('اختر صورة أولاً');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        localData.memories.unshift(reader.result);
        if (localData.memories.length > 12) localData.memories.pop();
        saveLocalData();
        await addChallengePoints(team, name, 200);
        renderMemories();
        challengeModalBody.innerHTML = `
          <div class="challenge-result">
            <h4>تم رفع الصورة!</h4>
            <p>حصلت على 200 نقطة.</p>
          </div>
        `;
        challengeModalFooter.innerHTML = `<button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>`;
        const closeConfirm = document.getElementById('challengeCloseConfirm');
        if (closeConfirm) closeConfirm.addEventListener('click', closeChallengeModal);
      };
      reader.readAsDataURL(fileInput.files[0]);
      return;
    }

    if (index === 2) {
      const message = document.getElementById('challengeMessage').value.trim();
      if (!message) {
        showMessage('اكتب رسالتك أولاً');
        return;
      }
      const result = await addChallengePoints(team, name, 60);
      if (!result) return;
      challengeModalBody.innerHTML = `
        <div class="challenge-result">
          <h4>تم ارسال الرسالة!</h4>
          <p>حصلت على 60 نقطة.</p>
        </div>
      `;
      challengeModalFooter.innerHTML = `<button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>`;
      document.getElementById('challengeCloseConfirm').addEventListener('click', closeChallengeModal);
      return;
    }

    if (index === 3) {
      const memory = document.getElementById('challengeMemory').value.trim();
      if (!memory) {
        showMessage('اكتب ذكريتك أولاً');
        return;
      }
      const result = await addChallengePoints(team, name, 100);
      if (!result) return;
      challengeModalBody.innerHTML = `
        <div class="challenge-result">
          <h4>تم نشر الذكرى!</h4>
          <p>حصلت على 100 نقطة.</p>
        </div>
      `;
      challengeModalFooter.innerHTML = `<button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>`;
      document.getElementById('challengeCloseConfirm').addEventListener('click', closeChallengeModal);
      return;
    }

    if (index === 4) {
      const prediction = document.getElementById('challengePrediction').value;
      const result = await addChallengePoints(team, name, 100);
      if (!result) return;
      challengeModalBody.innerHTML = `
        <div class="challenge-result">
          <h4>تم ارسال توقعك!</h4>
          <p>توقعك: ${prediction}</p>
          <p>حصلت على 100 نقطة.</p>
        </div>
      `;
      challengeModalFooter.innerHTML = `<button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>`;
      document.getElementById('challengeCloseConfirm').addEventListener('click', closeChallengeModal);
      return;
    }
  });
}

function openLightbox(src) {
  lightbox.classList.add('open');
  lightboxImage.src = src;
}

function closeLightbox() {
  lightbox.classList.remove('open');
}

async function addTeamEntry(team, name, points = 0) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    showMessage('الرجاء كتابة الاسم');
    return;
  }

  const existingMember = findMember(team, trimmedName);
  if (existingMember) {
    showMessage(`الاسم ${trimmedName} مسجل بالفعل في هذا الفريق.`);
    return;
  }

  const otherMember = findMemberInOtherTeam(team, trimmedName);
  if (otherMember) {
    showMessage(`الاسم ${trimmedName} موجود بالفعل في الفريق الآخر.`);
    return;
  }

  const { ok, payload } = await apiPost('/api/participants', {
    name: trimmedName,
    team,
    points: Number(points) || 10,
  });

  if (!ok) {
    showMessage(payload.message || 'فشل إضافة المشارك');
    return;
  }

  await fetchParticipants();
  showMessage(`تم انضمام ${trimmedName} إلى ${team === 'groom' ? 'فريق العريس' : 'فريق العروسة'}`);
}

async function handleTeamForm(team, inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    showMessage('الرجاء كتابة الاسم');
    return;
  }
  await addTeamEntry(team, name, 10);
  input.value = '';
}

function handleUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    localData.memories.unshift(reader.result);
    if (localData.memories.length > 12) localData.memories.pop();
    saveLocalData();
    renderMemories();
    showMessage('تمت إضافة الصورة بنجاح');
  };
  reader.readAsDataURL(file);
}

function initScrollReveal() {
  const items = document.querySelectorAll('.animate-up, .animate-zoom');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = '0.1s';
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  items.forEach((item) => observer.observe(item));
}

function initEvents() {
  const attendanceButton = document.querySelector('.dropdown-toggle');
  if (attendanceButton) {
    attendanceButton.addEventListener('click', openAttendanceModal);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (mobileNav) mobileNav.classList.toggle('open');
    });
  }

  window.addEventListener('scroll', () => {
    const topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.classList.toggle('scrolled', window.scrollY > 20);
    }
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target.closest('[data-challenge], #groomJoin, #brideJoin');
    if (!target) return;

    if (target.id === 'groomJoin') {
      handleTeamForm('groom', 'groomName');
      return;
    }
    if (target.id === 'brideJoin') {
      handleTeamForm('bride', 'brideName');
      return;
    }
    if (target.dataset.challenge) {
      openChallengeForm(Number(target.dataset.challenge));
      return;
    }
  });

  if (uploadInput) {
    uploadInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) handleUpload(file);
      uploadInput.value = '';
    });
  }

  if (copyLink) {
    copyLink.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showMessage('تم نسخ الرابط');
      } catch (error) {
        showMessage('فشل نسخ الرابط');
      }
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }
}

function openAttendanceModal() {
  if (!challengeModalTitle || !challengeModalBody || !challengeModalFooter) return;

  challengeModalTitle.textContent = 'تأكيد الحضور';
  challengeModalBody.innerHTML = `
    <div class="field-group">
      <label>اكتب اسمك</label>
      <input type="text" id="challengeName" placeholder="اكتب اسمك هنا" />
    </div>
    <div class="field-group">
      ${createTeamSelect()}
    </div>
    <p class="challenge-modal__note">إضافة الحضور تمنحك 100 نقطة.</p>
  `;
  challengeModalFooter.innerHTML = `
    <button class="btn btn--primary" id="attendanceConfirm">تأكيد الحضور واحصل على 100 نقطة</button>
  `;
  openChallengeModal();
  challengeModalClose.onclick = closeChallengeModal;

  const attendanceConfirm = document.getElementById('attendanceConfirm');
  if (!attendanceConfirm) return;
  attendanceConfirm.addEventListener('click', async () => {
    const name = getChallengeName();
    const team = getChallengeTeam();
    if (!name) {
      showMessage('الرجاء كتابة الاسم');
      return;
    }

    if (!(await addPointsToMember(team, name, 100))) {
      const otherMember = findMemberInOtherTeam(team, name);
      if (otherMember) {
        showMessage('الاسم مسجل في الفريق الآخر. اختر فريقك الصحيح.');
      } else {
        showMessage('الاسم غير مسجل في هذا الفريق. انضم أولاً بنفس الاسم ليتم احتساب الحضور.');
      }
      return;
    }

    challengeModalBody.innerHTML = `
      <div class="challenge-result">
        <h4>تم تأكيد الحضور!</h4>
        <p>حصلت على 100 نقطة.</p>
      </div>
    `;
    challengeModalFooter.innerHTML = `<button class="btn btn--secondary" id="challengeCloseConfirm">حسناً</button>`;
    const closeConfirm = document.getElementById('challengeCloseConfirm');
    if (closeConfirm) closeConfirm.addEventListener('click', closeChallengeModal);
  });
}

async function init() {
  loadLocalData();
  await fetchParticipants();
  renderChallenges();
  renderMemories();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  initScrollReveal();
  initEvents();
  await initAudio();
  setTimeout(() => loader.classList.add('hidden'), 700);
}

async function initAudio() {
  const audio = document.getElementById('backgroundAudio');
  const audioControl = document.getElementById('audioControl');
  const audioToggle = document.getElementById('audioToggle');

  if (!audio || !audioControl || !audioToggle) return;

  audio.autoplay = true;
  audio.playsInline = true;

  function setButtonState(isPlaying) {
    audioControl.classList.toggle('audio-control--playing', isPlaying);
    audioToggle.textContent = isPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى';
  }

  async function tryPlayAudio() {
    try {
      await audio.play();
      setButtonState(true);
      audioControl.classList.remove('hidden');
      return true;
    } catch (error) {
      setButtonState(false);
      audioControl.classList.remove('hidden');
      return false;
    }
  }

  function listenForUserGesture() {
    const playOnGesture = async () => {
      await tryPlayAudio();
      gestureEvents.forEach((eventName) => window.removeEventListener(eventName, playOnGesture));
    };

    const gestureEvents = ['click', 'touchstart', 'keydown'];
    gestureEvents.forEach((eventName) => {
      window.addEventListener(eventName, playOnGesture, { once: true, passive: true });
    });
  }

  audioToggle.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
        setButtonState(true);
      } catch (error) {
        setButtonState(false);
      }
    } else {
      audio.pause();
      setButtonState(false);
    }
  });

  const played = await tryPlayAudio();
  if (!played) {
    listenForUserGesture();
  }
}

window.addEventListener('DOMContentLoaded', init);
