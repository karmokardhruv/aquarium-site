document.addEventListener('DOMContentLoaded', () => {
  // Abstract toggles
  document.querySelectorAll('.pub-abstract-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.nextElementSibling.classList.toggle('show');
      btn.textContent = btn.nextElementSibling.classList.contains('show') ? 'Abstract ↑' : 'Abstract ↓';
    });
  });

  // Citation copy buttons
  document.querySelectorAll('.pub-btn[data-citation]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.citation);
      const original = btn.innerText;
      btn.innerText = 'COPIED!';
      setTimeout(() => btn.innerText = original, 2000);
    });
  });
});
