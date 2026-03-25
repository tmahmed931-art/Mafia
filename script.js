// إضافة الخلفية المتحركة للصقور
function addFlyingFalcons() {
    const bgDiv = document.createElement('div');
    bgDiv.className = 'flying-falcons';
    for (let i = 0; i < 8; i++) {
        const falcon = document.createElement('i');
        falcon.className = 'fas fa-falcon falcon-bg';
        falcon.style.animationDelay = `${Math.random() * 20}s`;
        falcon.style.animationDuration = `${25 + Math.random() * 20}s`;
        falcon.style.top = `${Math.random() * 100}%`;
        falcon.style.left = `${-10 - Math.random() * 20}%`;
        falcon.style.fontSize = `${2 + Math.random() * 4}rem`;
        falcon.style.opacity = 0.05 + Math.random() * 0.1;
        bgDiv.appendChild(falcon);
    }
    document.body.insertBefore(bgDiv, document.body.firstChild);
}
addFlyingFalcons();