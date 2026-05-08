document.addEventListener('DOMContentLoaded', function() {
  // Pick a random error GIF (1-13) and apply via CSS class
  var randomIndex = Math.floor(Math.random() * 13) + 1;
  document.body.classList.add('error-bg-' + randomIndex);

  // Redirect to homepage after 10 seconds
  setTimeout(function() {
    window.location.href = 'index.html'; 
  }, 10000);
});
