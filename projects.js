// Witty Text Randomizer for Under Construction page
document.addEventListener("DOMContentLoaded", () => {
  const wittyLines = [
    "Projects are currently marinating. Good things take time, and a lot of Stack Overflow.",
    "Currently fine-tuning the physics of a virtual fish tank. Real projects will surface once the fish are fed.",
    "Rome wasn't built in a day, and neither is this page. Mostly because I spent 4 hours choosing a font.",
    "404: Masterpieces not found... yet. The hamsters powering my servers are currently on a union break.",
    "Cooking up some code. Warning: May contain traces of spaghetti and misplaced semicolons.",
    "I'm currently busy breaking things locally before I push them to production. Stay tuned.",
    "Battling a rogue CSS flexbox. If I survive, the projects will appear here soon."
  ];

  const randomLine = wittyLines[Math.floor(Math.random() * wittyLines.length)];
  const textEl = document.getElementById("witty-text");
  if (textEl) {
    textEl.textContent = `"${randomLine}"`;
  }
});
