const API_URL = "http://localhost:3000/api/players";

// Form Submit Handler
async function handleFormSubmit(event) {
  event.preventDefault();

  const playerData = {
    name: document.getElementById("name").value,
    dob: document.getElementById("dob").value,
    photo_url: document.getElementById("photo_url").value,
    birth_place: document.getElementById("birth_place").value,
    career: document.getElementById("career").value,
    matches: document.getElementById("matches").value,
    score: document.getElementById("score").value,
    fifties: document.getElementById("fifties").value,
    centuries: document.getElementById("centuries").value,
    wickets: document.getElementById("wickets").value,
    average: document.getElementById("average").value,
  };

  try {
    const res = await axios.post(API_URL, playerData);
    alert(res.data.message);
    document.getElementById("playerForm").reset();
    fetchAllPlayers();
  } catch (error) {
    console.error("Error saving player:", error);
    alert("Failed to save player details.");
  }
}

// Fetch all players when page loads
window.addEventListener("DOMContentLoaded", () => {
  fetchAllPlayers();
});

async function fetchAllPlayers() {
  try {
    const res = await axios.get(`${API_URL}/search`);
    renderPlayers(res.data.players);
  } catch (error) {
    console.error("Error fetching players:", error);
  }
}

// Handle dynamic search input
async function handleSearch() {
  const query = document.getElementById("searchInput").value.trim();

  try {
    const res = await axios.get(
      `${API_URL}/search?name=${encodeURIComponent(query)}`,
    );
    renderPlayers(res.data.players);
  } catch (error) {
    console.error("Error searching players:", error);
  }
}

// Render cards in UI
function renderPlayers(players) {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";

  if (!players || players.length === 0) {
    container.innerHTML = '<p class="no-data">No matching players found.</p>';
    return;
  }

  players.forEach((player) => {
    const defaultPhoto = "https://via.placeholder.com/300x180?text=No+Photo";
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <img src="${player.photo_url || defaultPhoto}" alt="${player.name}" class="player-img" onerror="this.src='${defaultPhoto}'">
      <div class="player-info">
        <h3>${player.name}</h3>
        <p><strong>DOB:</strong> ${player.dob}</p>
        <p><strong>Birth Place:</strong> ${player.birth_place || "N/A"}</p>
        <p><strong>Career:</strong> ${player.career || "N/A"}</p>
        
        <div class="stats-grid">
          <div><strong>Matches:</strong> ${player.matches}</div>
          <div><strong>Runs:</strong> ${player.score}</div>
          <div><strong>50s:</strong> ${player.fifties}</div>
          <div><strong>100s:</strong> ${player.centuries}</div>
          <div><strong>Wickets:</strong> ${player.wickets}</div>
          <div><strong>Average:</strong> ${player.average}</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      showPlayerDetails(player);
    });
    container.appendChild(card);
  });
}

function showPlayerDetails(player) {
  const defaultPhoto = "https://via.placeholder.com/600x600?text=No+Photo";

  //create overlay
  const overlay = document.createElement("div");
  overlay.className = "player-modal";

  overlay.innerHTML = `
    <div class="player-modal-content">

      <button class="close-btn">&times;</button>

      <!-- Left side -->
      <div class="player-modal-left">

        <img
          src="${player.photo_url || defaultPhoto}"
          alt="${player.name}"
          onerror="this.src='${defaultPhoto}'"
        >

      </div>

      <!-- Right side -->
      <div class="player-modal-right">

        <h1>${player.name}</h1>

        <div class="player-details">

          <div class="detail-item">
            <span>Date of Birth</span>
            <strong>${player.dob || "N/A"}</strong>
          </div>

          <div class="detail-item">
            <span>Birth Place</span>
            <strong>${player.birth_place || "N/A"}</strong>
          </div>

          <div class="detail-item">
            <span>Career</span>
            <strong>${player.career || "N/A"}</strong>
          </div>

        </div>

        <h2>Career Statistics</h2>

        <div class="modal-stats">

          <div class="stat">
            <span>Matches</span>
            <strong>${player.matches || 0}</strong>
          </div>

          <div class="stat">
            <span>Runs</span>
            <strong>${player.score || 0}</strong>
          </div>

          <div class="stat">
            <span>Fifties</span>
            <strong>${player.fifties || 0}</strong>
          </div>

          <div class="stat">
            <span>Centuries</span>
            <strong>${player.centuries || 0}</strong>
          </div>

          <div class="stat">
            <span>Wickets</span>
            <strong>${player.wickets || 0}</strong>
          </div>

          <div class="stat">
            <span>Average</span>
            <strong>${player.average || 0}</strong>
          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.close-btn');

  closeBtn.addEventListener('click',()=>{
    overlay.remove();
  });

  overlay.addEventListener('click',(event)=>{
    if(event.target === overlay){
      overlay.remove();
    }
  });

  document.addEventListener('keydown',function handleEscape(event){
    if(event.key === 'Escape'){
      overlay.remove();
      document.removeEventListener('keydown',handleEscape);
    }
  })
}
