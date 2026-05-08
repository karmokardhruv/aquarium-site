(function() {
  var theme = localStorage.getItem('site-theme') || 'night';
  document.body.setAttribute('data-theme', theme);
})();
