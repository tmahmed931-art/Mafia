// ===================== وضع القائد (يدوي) =====================
let leaderPlayers = [];
let leaderMafiaTarget = null, leaderDoctorProtect = null, leaderElderQuestion = null, leaderElderAnswer = null;
let leaderNightActions = { mafia: false, doctor: false, elder: false };
let leaderDoctorSelfUsed = false;

function leaderAddLog(msg, isError=false) {
    let logDiv = document.getElementById('leaderLog');
    let p = document.createElement('div');
    p.innerHTML = `🪶 ${msg}`;
    p.style.color = isError ? '#ffaa88' : '#cdd6f4';
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function leaderUpdatePlayersList() {
    let container = document.getElementById('leaderPlayersList');
    if(!leaderPlayers.length) { container.innerHTML = "<div class='player-tag'>لا يوجد لاعبون</div>"; return; }
    let html = '<div><i class="fas fa-users"></i> القائمة:</div>';
    leaderPlayers.forEach(p => {
        let roleText = p.role ? (p.role==='spy'?'🔪 جاسوس':(p.role==='doctor'?'💉 دكتور':(p.role==='elder'?'🦅 شايب':'👤 مدني'))) : '?';
        html += `<div class="player-tag">${p.name} <span class="role-badge">${roleText}</span> ${!p.isAlive ? '💀' : ''}
                 <button class="remove-player" data-name="${p.name}"><i class="fas fa-trash-alt"></i></button></div>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('#leaderPlayersList .remove-player').forEach(btn => {
        btn.addEventListener('click', () => leaderRemovePlayer(btn.getAttribute('data-name')));
    });
}

function leaderRemovePlayer(name) {
    leaderPlayers = leaderPlayers.filter(p => p.name !== name);
    leaderUpdatePlayersList();
    leaderAddLog(`🗑️ حذف ${name}`);
    leaderResetNight();
}

function leaderAddPlayer() {
    let name = document.getElementById('leaderNewPlayer').value.trim();
    if(!name) { leaderAddLog("أدخل اسمًا", true); return; }
    if(leaderPlayers.some(p => p.name === name)) { leaderAddLog("موجود", true); return; }
    leaderPlayers.push({ name, role: null, isAlive: true, protectedSelfUsed: false });
    document.getElementById('leaderNewPlayer').value = '';
    leaderUpdatePlayersList(); leaderAddLog(`✅ أضيف ${name}`);
    if(leaderPlayers.some(p => p.role)) leaderPlayers.forEach(p => p.role = null);
    leaderResetNight();
}

function leaderAssignRoles() {
    if(leaderPlayers.length < 4) { leaderAddLog("يحتاج 4 لاعبين على الأقل", true); return; }
    let spies = parseInt(document.getElementById('leaderSpiesCount').value);
    if(isNaN(spies)) spies = 1;
    if(spies > leaderPlayers.length-2) spies = Math.floor(leaderPlayers.length/3);
    let roles = [];
    for(let i=0;i<spies;i++) roles.push('spy');
    roles.push('doctor','elder');
    while(roles.length < leaderPlayers.length) roles.push('civilian');
    for(let i=roles.length-1;i>0;i--){ let j=Math.floor(Math.random()*(i+1)); [roles[i],roles[j]]=[roles[j],roles[i]]; }
    leaderPlayers.forEach((p,i)=> { p.role = roles[i]; p.isAlive=true; p.protectedSelfUsed=false; });
    leaderUpdatePlayersList(); leaderAddLog(`وزع الأدوار: ${spies} جاسوس، دكتور، شايب، ${leaderPlayers.length-spies-2} مدني`);
    leaderDoctorSelfUsed = false; leaderResetNight();
}

function leaderShowSelection(options, title, callback) {
    let modal = document.getElementById('leaderSelectionModal');
    modal.innerHTML = `<h4>${title}</h4><div class="selection-buttons"></div>`;
    let btnsDiv = modal.querySelector('.selection-buttons');
    options.forEach(opt => { let btn = document.createElement('button'); btn.textContent = opt; btn.onclick = () => { modal.style.display='none'; callback(opt); }; btnsDiv.appendChild(btn); });
    modal.style.display = 'block';
}

function leaderMafiaAction() {
    if(!leaderPlayers.length || !leaderPlayers.some(p=>p.role)) { leaderAddLog("وزع الأدوار أولاً",true); return; }
    let alive = leaderPlayers.filter(p=>p.isAlive);
    if(!alive.length) return;
    leaderShowSelection(alive.map(p=>p.name), "🔪 اختر الضحية", (chosen)=>{ leaderMafiaTarget = chosen; leaderNightActions.mafia = true; leaderAddLog(`القتلة استهدفوا ${chosen}`); document.getElementById('leaderMafiaBtn').classList.add('active'); });
}

function leaderDoctorAction() {
    let doctor = leaderPlayers.find(p=>p.role==='doctor' && p.isAlive);
    if(!doctor) { leaderAddLog("الدكتور ميت",true); return; }
    let alive = leaderPlayers.filter(p=>p.isAlive);
    leaderShowSelection(alive.map(p=>p.name), `💉 الدكتور ${doctor.name}: اختر من تحمي`, (chosen)=>{
        if(chosen === doctor.name) { if(leaderDoctorSelfUsed || doctor.protectedSelfUsed) { leaderAddLog("لا يمكن حماية النفس مرة أخرى",true); return; } leaderDoctorSelfUsed = true; doctor.protectedSelfUsed = true; leaderAddLog(`الدكتور ${doctor.name} حمى نفسه`); }
        else { leaderAddLog(`الدكتور ${doctor.name} حمى ${chosen}`); }
        leaderDoctorProtect = chosen; leaderNightActions.doctor = true; document.getElementById('leaderDoctorBtn').classList.add('active');
    });
}

function leaderElderAction() {
    let elder = leaderPlayers.find(p=>p.role==='elder' && p.isAlive);
    if(!elder) { leaderAddLog("الشايب ميت",true); return; }
    let alive = leaderPlayers.filter(p=>p.isAlive);
    leaderShowSelection(alive.map(p=>p.name), `🦅 الشايب ${elder.name}: اختر من تسأل`, (chosen)=>{
        let suspect = leaderPlayers.find(p=>p.name===chosen);
        leaderElderQuestion = chosen; leaderElderAnswer = suspect.role === 'spy';
        leaderAddLog(`الشايب سأل عن ${chosen}: الجواب ${leaderElderAnswer ? 'قاتل ✅' : 'برئ ❌'} (للشايب فقط)`);
        leaderNightActions.elder = true; document.getElementById('leaderElderBtn').classList.add('active');
    });
}

function leaderReveal() {
    if(!leaderNightActions.mafia) { leaderAddLog("لم يقتل القتلة بعد",true); return; }
    let killed = leaderPlayers.find(p=>p.name===leaderMafiaTarget && p.isAlive);
    if(killed && leaderDoctorProtect === killed.name) leaderAddLog(`🛡️ الدكتور أنقذ ${killed.name}، لم يمت أحد`);
    else if(killed) { killed.isAlive = false; leaderAddLog(`💀 ${killed.name} قُتل`); }
    else leaderAddLog("الهدف غير موجود أو ميت");
    if(leaderElderQuestion) leaderAddLog(`نتيجة استفسار الشايب: ${leaderElderQuestion} ${leaderElderAnswer ? "قاتل" : "برئ"}`);
    leaderUpdatePlayersList();
    let spiesAlive = leaderPlayers.filter(p=>p.role==='spy' && p.isAlive).length;
    let goodAlive = leaderPlayers.filter(p=>p.role!=='spy' && p.isAlive).length;
    if(spiesAlive===0) leaderAddLog("🏆 انتصار المدنيين");
    else if(goodAlive===0) leaderAddLog("🏆 انتصار الجواسيس");
    else leaderAddLog("🌅 النهار: يمكنكم المناقشة ثم التصويت");
    leaderResetNight();
    document.getElementById('leaderStartVoteBtn').disabled = false;
}

function leaderResetNight() {
    leaderMafiaTarget = null; leaderDoctorProtect = null; leaderElderQuestion = null; leaderElderAnswer = null;
    leaderNightActions = { mafia: false, doctor: false, elder: false };
    ['leaderMafiaBtn','leaderDoctorBtn','leaderElderBtn'].forEach(id=> document.getElementById(id).classList.remove('active'));
    document.getElementById('leaderSelectionModal').style.display='none';
    leaderAddLog("🔄 إعادة ضبط الليل");
}

// وظائف التصويت في وضع القائد
let currentLeaderVotes = {};
let leaderSkipVotes = 0;

function showLeaderVotingPanel() {
    const panel = document.getElementById('leaderVotingPanel');
    const alivePlayers = leaderPlayers.filter(p => p.isAlive);
    if(alivePlayers.length === 0) {
        panel.innerHTML = '<div class="vote-player-item">لا يوجد لاعبين أحياء للتصويت</div>';
        panel.style.display = 'block';
        return;
    }
    currentLeaderVotes = {};
    alivePlayers.forEach(p => { currentLeaderVotes[p.name] = 0; });
    leaderSkipVotes = 0;
    renderLeaderVotingUI();
    panel.style.display = 'block';
}

function renderLeaderVotingUI() {
    const panel = document.getElementById('leaderVotingPanel');
    const alivePlayers = leaderPlayers.filter(p => p.isAlive);
    let html = `<div style="margin-bottom: 1rem;"><strong><i class="fas fa-check-double"></i> التصويت النهاري</strong> (اضغط + لزيادة الصوت)</div>`;
    alivePlayers.forEach(p => {
        html += `<div class="vote-player-item">
                    <span>${p.name} <span class="role-badge">${currentLeaderVotes[p.name]}</span></span>
                    <div class="vote-controls">
                        <button class="vote-inc" data-name="${p.name}"><i class="fas fa-plus-circle"></i></button>
                        <button class="vote-dec" data-name="${p.name}"><i class="fas fa-minus-circle"></i></button>
                    </div>
                </div>`;
    });
    html += `<div class="vote-player-item vote-skip">
                <span>⏭️ تخطى التصويت <span id="leaderSkipVotesCount">${leaderSkipVotes}</span></span>
                <div class="vote-controls">
                    <button id="leaderSkipInc"><i class="fas fa-plus-circle"></i></button>
                    <button id="leaderSkipDec"><i class="fas fa-minus-circle"></i></button>
                </div>
             </div>`;
    html += `<div style="margin-top: 1rem;"><button id="leaderApplyVoteBtn" class="primary">تطبيق نتيجة التصويت</button></div>`;
    panel.innerHTML = html;
    document.querySelectorAll('#leaderVotingPanel .vote-inc').forEach(btn => {
        btn.onclick = () => { const name = btn.getAttribute('data-name'); currentLeaderVotes[name]++; renderLeaderVotingUI(); };
    });
    document.querySelectorAll('#leaderVotingPanel .vote-dec').forEach(btn => {
        btn.onclick = () => { const name = btn.getAttribute('data-name'); if(currentLeaderVotes[name] > 0) currentLeaderVotes[name]--; renderLeaderVotingUI(); };
    });
    document.getElementById('leaderSkipInc').onclick = () => { leaderSkipVotes++; renderLeaderVotingUI(); };
    document.getElementById('leaderSkipDec').onclick = () => { if(leaderSkipVotes > 0) leaderSkipVotes--; renderLeaderVotingUI(); };
    document.getElementById('leaderApplyVoteBtn').onclick = () => applyLeaderVote();
}

function applyLeaderVote() {
    const alivePlayers = leaderPlayers.filter(p => p.isAlive);
    if(alivePlayers.length === 0) return;
    let maxVotes = -1;
    let elected = null;
    let tie = false;
    for(let name in currentLeaderVotes) {
        if(currentLeaderVotes[name] > maxVotes) {
            maxVotes = currentLeaderVotes[name];
            elected = name;
            tie = false;
        } else if(currentLeaderVotes[name] === maxVotes && maxVotes !== -1) {
            tie = true;
        }
    }
    if(leaderSkipVotes > maxVotes) {
        leaderAddLog("🗳️ التصويت: تم تخطى الإقصاء (أصوات التخطي أكثر)");
        document.getElementById('leaderVotingPanel').style.display = 'none';
        return;
    } else if(leaderSkipVotes === maxVotes && maxVotes !== -1) {
        leaderAddLog("🗳️ التصويت: تعادل بين الإقصاء والتخطي → لا يُطرد أحد");
        document.getElementById('leaderVotingPanel').style.display = 'none';
        return;
    }
    if(elected === null || maxVotes <= 0) {
        leaderAddLog("🗳️ التصويت: لا أصوات صالحة، لم يُطرد أحد");
        document.getElementById('leaderVotingPanel').style.display = 'none';
        return;
    }
    if(tie) {
        leaderAddLog(`🗳️ التصويت: تعادل بين أكثر من لاعب، لم يُطرد أحد.`);
        document.getElementById('leaderVotingPanel').style.display = 'none';
        return;
    }
    const eliminated = leaderPlayers.find(p => p.name === elected);
    if(eliminated && eliminated.isAlive) {
        eliminated.isAlive = false;
        leaderAddLog(`🗳️ نتيجة التصويت: ${eliminated.name} طُرد من القرية.`);
        leaderUpdatePlayersList();
        let spiesAlive = leaderPlayers.filter(p=>p.role==='spy' && p.isAlive).length;
        let goodAlive = leaderPlayers.filter(p=>p.role!=='spy' && p.isAlive).length;
        if(spiesAlive === 0) leaderAddLog("🏆 انتصار المدنيين! تم القضاء على جميع الجواسيس.");
        else if(goodAlive === 0) leaderAddLog("🏆 انتصار الجواسيس! سيطرت المافيا.");
        else leaderAddLog("🌙 انتهى التصويت. استعدوا لليل القادم.");
    }
    document.getElementById('leaderVotingPanel').style.display = 'none';
}

// ===================== وضع الظل (آلي) =====================
let shadowPlayers = [];
let shadowGameState = { phase: 'setup', mafiaTarget: null, doctorProtect: null, elderQuestion: null, elderAnswer: null, doctorSelfUsed: false };
let currentOverlay = null;
let shadowLogEntries = [];
let adminCode = Math.floor(1000 + Math.random() * 9000).toString();
let isUnlocked = false;
document.getElementById('adminCodeDisplay').innerText = adminCode;

function shadowAddLog(msg, isError=false) {
    shadowLogEntries.push({ msg, isError });
    if (isUnlocked) {
        let logDiv = document.getElementById('shadowLog');
        let p = document.createElement('div');
        p.innerHTML = `🪶 ${msg}`;
        p.style.color = isError ? '#ffaa88' : '#cdd6f4';
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

function shadowUpdatePlayersList() {
    let container = document.getElementById('shadowPlayersList');
    if(!shadowPlayers.length) { container.innerHTML = "<div class='player-tag'>لا يوجد لاعبون</div>"; return; }
    let html = '<div><i class="fas fa-users"></i> اللاعبون:</div>';
    shadowPlayers.forEach(p => {
        let roleText = p.role ? (p.role==='spy'?'🔪 جاسوس':(p.role==='doctor'?'💉 دكتور':(p.role==='elder'?'🦅 شايب':'👤 مدني'))) : '?';
        html += `<div class="player-tag">${p.name} <span class="role-badge">${roleText}</span> ${!p.isAlive ? '💀' : ''}</div>`;
    });
    container.innerHTML = html;
}

function unlockGame() {
    let inputCode = document.getElementById('adminCodeInput').value.trim();
    if (inputCode === adminCode) {
        isUnlocked = true;
        document.getElementById('shadowPlayersListContainer').style.display = 'block';
        document.getElementById('shadowLogContainer').style.display = 'block';
        document.getElementById('revealRolesBtnContainer').style.display = 'block';
        let logDiv = document.getElementById('shadowLog');
        logDiv.innerHTML = '';
        shadowLogEntries.forEach(entry => {
            let p = document.createElement('div'); p.innerHTML = `🪶 ${entry.msg}`; p.style.color = entry.isError ? '#ffaa88' : '#cdd6f4'; logDiv.appendChild(p);
        });
        shadowUpdatePlayersList();
        shadowAddLog(`✅ تم فتح الإدارة.`);
        document.getElementById('adminCodeInput').value = '';
    } else alert("الكود غير صحيح");
}

function hideAdmin() {
    isUnlocked = false;
    document.getElementById('shadowPlayersListContainer').style.display = 'none';
    document.getElementById('shadowLogContainer').style.display = 'none';
    document.getElementById('revealRolesBtnContainer').style.display = 'none';
    shadowAddLog("🔒 تم إخفاء الإدارة.");
}

function startRoleReveal(playersList) {
    if (!playersList.length) return;
    let currentIndex = 0, revealed = false;
    function updateModal() {
        if (currentIndex >= playersList.length) { if(currentOverlay) document.body.removeChild(currentOverlay); currentOverlay=null; shadowAddLog("✅ تم عرض جميع الأدوار."); return; }
        let player = playersList[currentIndex];
        let roleText = player.role==='spy'?"🔪 جاسوس (قاتل)":(player.role==='doctor'?"💉 دكتور":(player.role==='elder'?"🦅 شايب":"👤 مدني"));
        const overlay = document.createElement('div'); overlay.className = 'overlay-modal';
        if (!revealed) overlay.innerHTML = `<div class="modal-content"><h2>اللاعب الحالي</h2><p style="font-size:2rem;">${player.name}</p><button id="revealRoleBtn">🎭 اضغط لكشف الدور</button></div>`;
        else overlay.innerHTML = `<div class="modal-content"><h2>دور ${player.name}</h2><p style="font-size:2rem;">${roleText}</p><button id="nextPlayerBtn">التالي ➡️</button></div>`;
        if(currentOverlay) document.body.removeChild(currentOverlay);
        document.body.appendChild(overlay); currentOverlay=overlay;
        if(!revealed) overlay.querySelector('#revealRoleBtn').onclick = () => { revealed=true; updateModal(); };
        else overlay.querySelector('#nextPlayerBtn').onclick = () => { currentIndex++; revealed=false; updateModal(); };
    }
    updateModal();
}

function shadowAssignAndReveal() {
    if(shadowPlayers.length < 4) { shadowAddLog("يحتاج 4 لاعبين على الأقل", true); return; }
    let spies = parseInt(document.getElementById('shadowSpiesCount').value);
    if(isNaN(spies)) spies=1;
    if(spies > shadowPlayers.length-2) spies = Math.floor(shadowPlayers.length/3);
    let roles = [];
    for(let i=0;i<spies;i++) roles.push('spy');
    roles.push('doctor','elder');
    while(roles.length < shadowPlayers.length) roles.push('civilian');
    for(let i=roles.length-1;i>0;i--){ let j=Math.floor(Math.random()*(i+1)); [roles[i],roles[j]]=[roles[j],roles[i]]; }
    shadowPlayers.forEach((p,i)=> { p.role = roles[i]; p.isAlive=true; p.protectedSelfUsed=false; });
    if(isUnlocked) shadowUpdatePlayersList();
    shadowAddLog(`تم توزيع الأدوار: ${spies} جاسوس، دكتور، شايب، ${shadowPlayers.length-spies-2} مدني`);
    shadowGameState.doctorSelfUsed = false;
    startRoleReveal(shadowPlayers);
}

function manualRoleReveal() { if(!shadowPlayers.length || !shadowPlayers.some(p=>p.role)) { shadowAddLog("لا توجد أدوار موزعة", true); return; } startRoleReveal(shadowPlayers); }

function shadowAddPlayer() {
    let name = document.getElementById('shadowNewPlayer').value.trim();
    if(!name) { shadowAddLog("أدخل اسمًا", true); return; }
    if(shadowPlayers.some(p => p.name === name)) { shadowAddLog("موجود", true); return; }
    shadowPlayers.push({ name, role: null, isAlive: true, protectedSelfUsed: false });
    document.getElementById('shadowNewPlayer').value = '';
    if(isUnlocked) shadowUpdatePlayersList();
    shadowAddLog(`✅ أضيف ${name}`);
    if(shadowPlayers.some(p => p.role)) shadowPlayers.forEach(p => p.role = null);
}

// دوال الليل
function showFullscreenSelection(options, title, callback) {
    if(currentOverlay) document.body.removeChild(currentOverlay);
    const overlay = document.createElement('div'); overlay.className = 'overlay-modal';
    overlay.innerHTML = `<div class="modal-content"><h2>${title}</h2><div id="fullscreenOptions" class="selection-buttons"></div></div>`;
    document.body.appendChild(overlay);
    const container = overlay.querySelector('#fullscreenOptions');
    options.forEach(opt => { let btn = document.createElement('button'); btn.textContent = opt; btn.onclick = () => { document.body.removeChild(overlay); currentOverlay=null; callback(opt); }; container.appendChild(btn); });
    currentOverlay = overlay;
}

function showElderAnswer(answerText, callback) {
    if(currentOverlay) document.body.removeChild(currentOverlay);
    const overlay = document.createElement('div'); overlay.className = 'overlay-modal';
    overlay.innerHTML = `<div class="modal-content"><h2>🔮 إجابة الشايب</h2><p style="font-size:2rem;">${answerText}</p><button id="skipElderBtn">تخطي</button><div style="margin-top:0.5rem;">سيغلق بعد 10 ثوانٍ</div></div>`;
    document.body.appendChild(overlay); currentOverlay=overlay;
    const timeout = setTimeout(() => { if(currentOverlay===overlay) { document.body.removeChild(overlay); currentOverlay=null; showPhoneDownInstruction(callback); } }, 10000);
    overlay.querySelector('#skipElderBtn').onclick = () => { clearTimeout(timeout); document.body.removeChild(overlay); currentOverlay=null; showPhoneDownInstruction(callback); };
}

function showPhoneDownInstruction(callback) {
    const overlay = document.createElement('div'); overlay.className = 'overlay-modal'; overlay.style.backdropFilter='blur(12px)';
    overlay.innerHTML = `<div class="modal-content"><h2>📱 ضع التليفون في النص</h2><p style="font-size:1.5rem;">وأغلق عينيك</p><p>سيتم الانتقال بعد 10 ثوانٍ</p><button id="skipPhoneBtn">تخطي</button></div>`;
    document.body.appendChild(overlay); currentOverlay=overlay;
    const timeout = setTimeout(() => { if(currentOverlay===overlay) { document.body.removeChild(overlay); currentOverlay=null; if(callback) callback(); } }, 10000);
    overlay.querySelector('#skipPhoneBtn').onclick = () => { clearTimeout(timeout); document.body.removeChild(overlay); currentOverlay=null; if(callback) callback(); };
}

function shadowStartNight() {
    if(!shadowPlayers.length || !shadowPlayers.some(p=>p.role)) { shadowAddLog("وزع الأدوار أولاً", true); return; }
    shadowGameState.phase='night'; shadowGameState.mafiaTarget=null; shadowGameState.doctorProtect=null; shadowGameState.elderQuestion=null; shadowGameState.elderAnswer=null;
    shadowNextStep();
}

function shadowNextStep() {
    let aliveSpies = shadowPlayers.filter(p=>p.role==='spy' && p.isAlive);
    let doctor = shadowPlayers.find(p=>p.role==='doctor' && p.isAlive);
    let elder = shadowPlayers.find(p=>p.role==='elder' && p.isAlive);
    if(!shadowGameState.mafiaTarget && aliveSpies.length>0) {
        let opts = shadowPlayers.filter(p=>p.isAlive).map(p=>p.name);
        showFullscreenSelection(opts, "🔪 القتلة: اختر ضحية", (chosen)=>{ shadowGameState.mafiaTarget=chosen; shadowAddLog(`🔪 استهدفوا ${chosen}`); shadowNextStep(); });
        return;
    }
    if(shadowGameState.mafiaTarget && !shadowGameState.doctorProtect && doctor) {
        let opts = shadowPlayers.filter(p=>p.isAlive).map(p=>p.name);
        showFullscreenSelection(opts, `💉 الدكتور ${doctor.name}: اختر من تحمي`, (chosen)=>{
            if(chosen===doctor.name) { if(shadowGameState.doctorSelfUsed||doctor.protectedSelfUsed) { shadowAddLog("لا يمكن حماية النفس مجدداً",true); shadowNextStep(); return; } shadowGameState.doctorSelfUsed=true; doctor.protectedSelfUsed=true; shadowAddLog(`الدكتور حمى نفسه`); }
            else shadowAddLog(`الدكتور حمى ${chosen}`);
            shadowGameState.doctorProtect=chosen; shadowNextStep();
        });
        return;
    }
    if(shadowGameState.mafiaTarget && !shadowGameState.elderQuestion && elder) {
        let opts = shadowPlayers.filter(p=>p.isAlive).map(p=>p.name);
        showFullscreenSelection(opts, `🦅 الشايب ${elder.name}: اختر من تسأل`, (chosen)=>{
            let suspect=shadowPlayers.find(p=>p.name===chosen);
            let isSpy=suspect.role==='spy';
            shadowGameState.elderQuestion=chosen; shadowGameState.elderAnswer=isSpy;
            showElderAnswer(isSpy?"✅ نعم، هذا اللاعب قاتل":"❌ لا، هذا اللاعب ليس قاتلاً", ()=>{
                shadowAddLog(`الشايب سأل عن ${chosen}: الجواب ${isSpy?'قاتل ✅':'برئ ❌'}`);
                shadowNextStep();
            });
        });
        return;
    }
    shadowRevealResult();
}

function shadowRevealResult() {
    let killed = shadowPlayers.find(p=>p.name===shadowGameState.mafiaTarget && p.isAlive);
    if(killed && shadowGameState.doctorProtect === killed.name) shadowAddLog(`🛡️ الدكتور أنقذ ${killed.name}، لم يمت أحد.`);
    else if(killed) { killed.isAlive=false; shadowAddLog(`💀 ${killed.name} قُتل.`); }
    else shadowAddLog(`⚠️ الهدف غير موجود.`);
    if(shadowGameState.elderQuestion) shadowAddLog(`📜 نتيجة الشايب: ${shadowGameState.elderQuestion} ${shadowGameState.elderAnswer?"قاتل":"برئ"}`);
    if(isUnlocked) shadowUpdatePlayersList();
    let aliveSpies=shadowPlayers.filter(p=>p.role==='spy' && p.isAlive).length;
    let aliveGood=shadowPlayers.filter(p=>p.role!=='spy' && p.isAlive).length;
    if(aliveSpies===0) shadowAddLog("🏆 انتصار المدنيين!");
    else if(aliveGood===0) shadowAddLog("🏆 انتصار الجواسيس!");
    else shadowAddLog("🌅 انتهى الليل. اضغط 'بدء التصويت النهاري' للمناقشة.");
    shadowGameState.mafiaTarget=null; shadowGameState.doctorProtect=null; shadowGameState.elderQuestion=null; shadowGameState.elderAnswer=null;
    document.getElementById('shadowStartVoteBtn').disabled = false;
}

// وظائف التصويت في وضع الظل
let currentShadowVotes = {};
let shadowSkipVotes = 0;

function showShadowVotingPanel() {
    const panel = document.getElementById('shadowVotingPanel');
    const alivePlayers = shadowPlayers.filter(p => p.isAlive);
    if(alivePlayers.length === 0) {
        panel.innerHTML = '<div class="vote-player-item">لا يوجد لاعبين أحياء للتصويت</div>';
        panel.style.display = 'block';
        return;
    }
    currentShadowVotes = {};
    alivePlayers.forEach(p => { currentShadowVotes[p.name] = 0; });
    shadowSkipVotes = 0;
    renderShadowVotingUI();
    panel.style.display = 'block';
}

function renderShadowVotingUI() {
    const panel = document.getElementById('shadowVotingPanel');
    const alivePlayers = shadowPlayers.filter(p => p.isAlive);
    let html = `<div style="margin-bottom: 1rem;"><strong><i class="fas fa-check-double"></i> التصويت النهاري</strong> (اضغط + لزيادة الصوت)</div>`;
    alivePlayers.forEach(p => {
        html += `<div class="vote-player-item">
                    <span>${p.name} <span class="role-badge">${currentShadowVotes[p.name]}</span></span>
                    <div class="vote-controls">
                        <button class="vote-inc" data-name="${p.name}"><i class="fas fa-plus-circle"></i></button>
                        <button class="vote-dec" data-name="${p.name}"><i class="fas fa-minus-circle"></i></button>
                    </div>
                </div>`;
    });
    html += `<div class="vote-player-item vote-skip">
                <span>⏭️ تخطى التصويت <span id="shadowSkipVotesCount">${shadowSkipVotes}</span></span>
                <div class="vote-controls">
                    <button id="shadowSkipInc"><i class="fas fa-plus-circle"></i></button>
                    <button id="shadowSkipDec"><i class="fas fa-minus-circle"></i></button>
                </div>
             </div>`;
    html += `<div style="margin-top: 1rem;"><button id="shadowApplyVoteBtn" class="primary">تطبيق نتيجة التصويت</button></div>`;
    panel.innerHTML = html;
    document.querySelectorAll('#shadowVotingPanel .vote-inc').forEach(btn => {
        btn.onclick = () => { const name = btn.getAttribute('data-name'); currentShadowVotes[name]++; renderShadowVotingUI(); };
    });
    document.querySelectorAll('#shadowVotingPanel .vote-dec').forEach(btn => {
        btn.onclick = () => { const name = btn.getAttribute('data-name'); if(currentShadowVotes[name] > 0) currentShadowVotes[name]--; renderShadowVotingUI(); };
    });
    document.getElementById('shadowSkipInc').onclick = () => { shadowSkipVotes++; renderShadowVotingUI(); };
    document.getElementById('shadowSkipDec').onclick = () => { if(shadowSkipVotes > 0) shadowSkipVotes--; renderShadowVotingUI(); };
    document.getElementById('shadowApplyVoteBtn').onclick = () => applyShadowVote();
}

function applyShadowVote() {
    const alivePlayers = shadowPlayers.filter(p => p.isAlive);
    if(alivePlayers.length === 0) return;
    let maxVotes = -1;
    let elected = null;
    let tie = false;
    for(let name in currentShadowVotes) {
        if(currentShadowVotes[name] > maxVotes) {
            maxVotes = currentShadowVotes[name];
            elected = name;
            tie = false;
        } else if(currentShadowVotes[name] === maxVotes && maxVotes !== -1) {
            tie = true;
        }
    }
    if(shadowSkipVotes > maxVotes) {
        shadowAddLog("🗳️ التصويت: تم تخطى الإقصاء (أصوات التخطي أكثر)");
        document.getElementById('shadowVotingPanel').style.display = 'none';
        return;
    } else if(shadowSkipVotes === maxVotes && maxVotes !== -1) {
        shadowAddLog("🗳️ التصويت: تعادل بين الإقصاء والتخطي → لا يُطرد أحد");
        document.getElementById('shadowVotingPanel').style.display = 'none';
        return;
    }
    if(elected === null || maxVotes <= 0) {
        shadowAddLog("🗳️ التصويت: لا أصوات صالحة، لم يُطرد أحد");
        document.getElementById('shadowVotingPanel').style.display = 'none';
        return;
    }
    if(tie) {
        shadowAddLog(`🗳️ التصويت: تعادل بين أكثر من لاعب، لم يُطرد أحد.`);
        document.getElementById('shadowVotingPanel').style.display = 'none';
        return;
    }
    const eliminated = shadowPlayers.find(p => p.name === elected);
    if(eliminated && eliminated.isAlive) {
        eliminated.isAlive = false;
        shadowAddLog(`🗳️ نتيجة التصويت: ${eliminated.name} طُرد من القرية.`);
        if(isUnlocked) shadowUpdatePlayersList();
        let spiesAlive = shadowPlayers.filter(p=>p.role==='spy' && p.isAlive).length;
        let goodAlive = shadowPlayers.filter(p=>p.role!=='spy' && p.isAlive).length;
        if(spiesAlive === 0) shadowAddLog("🏆 انتصار المدنيين! تم القضاء على جميع الجواسيس.");
        else if(goodAlive === 0) shadowAddLog("🏆 انتصار الجواسيس! سيطرت المافيا.");
        else shadowAddLog("🌙 انتهى التصويت. استعدوا لليل القادم.");
    }
    document.getElementById('shadowVotingPanel').style.display = 'none';
}

// ===================== ربط الأزرار بعد تحميل الصفحة =====================
document.addEventListener('DOMContentLoaded', function() {
    // ربط أزرار وضع القائد
    const leaderAddBtn = document.getElementById('leaderAddPlayerBtn');
    const leaderAssignBtn = document.getElementById('leaderAssignRolesBtn');
    const leaderMafia = document.getElementById('leaderMafiaBtn');
    const leaderDoctor = document.getElementById('leaderDoctorBtn');
    const leaderElder = document.getElementById('leaderElderBtn');
    const leaderRevealBtn = document.getElementById('leaderRevealBtn');
    const leaderReset = document.getElementById('leaderResetBtn');
    const leaderVote = document.getElementById('leaderStartVoteBtn');

    if (leaderAddBtn) leaderAddBtn.onclick = leaderAddPlayer;
    if (leaderAssignBtn) leaderAssignBtn.onclick = leaderAssignRoles;
    if (leaderMafia) leaderMafia.onclick = leaderMafiaAction;
    if (leaderDoctor) leaderDoctor.onclick = leaderDoctorAction;
    if (leaderElder) leaderElder.onclick = leaderElderAction;
    if (leaderRevealBtn) leaderRevealBtn.onclick = leaderReveal;
    if (leaderReset) leaderReset.onclick = leaderResetNight;
    if (leaderVote) leaderVote.onclick = showLeaderVotingPanel;

    // ربط أزرار وضع الظل
    const shadowAdd = document.getElementById('shadowAddPlayerBtn');
    const shadowAssign = document.getElementById('shadowAssignRolesBtn');
    const shadowNight = document.getElementById('shadowStartNightBtn');
    const unlock = document.getElementById('unlockBtn');
    const hide = document.getElementById('hideAdminBtn');
    const manualReveal = document.getElementById('revealRolesToPlayersBtn');
    const shadowVote = document.getElementById('shadowStartVoteBtn');

    if (shadowAdd) shadowAdd.onclick = shadowAddPlayer;
    if (shadowAssign) shadowAssign.onclick = shadowAssignAndReveal;
    if (shadowNight) shadowNight.onclick = shadowStartNight;
    if (unlock) unlock.onclick = unlockGame;
    if (hide) hide.onclick = hideAdmin;
    if (manualReveal) manualReveal.onclick = manualRoleReveal;
    if (shadowVote) shadowVote.onclick = showShadowVotingPanel;

    // ربط بطاقات اختيار الوضع
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            let mode = card.getAttribute('data-mode');
            document.getElementById('modeSelector').style.display = 'none';
            if(mode === 'leader') document.getElementById('leaderMode').style.display = 'block';
            else if(mode === 'shadow') document.getElementById('shadowMode').style.display = 'block';
        });
    });

    // دالة العودة للقائمة (تُستخدم من الأزرار)
    window.showModeSelector = function() {
        document.getElementById('leaderMode').style.display = 'none';
        document.getElementById('shadowMode').style.display = 'none';
        document.getElementById('modeSelector').style.display = 'flex';
        if (currentOverlay) { document.body.removeChild(currentOverlay); currentOverlay = null; }
    };

    // إظهار شاشة اختيار الوضع في البداية
    showModeSelector();
});