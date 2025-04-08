let tournamentData = null;

function saveTournament() {
    localStorage.setItem("dartTournament", JSON.stringify(tournamentData));
}

function loadTournament() {
    const data = localStorage.getItem("dartTournament");
    if (data) {
        tournamentData = JSON.parse(data);
        document.getElementById("playerCount").value = tournamentData.playerCount;
        document.getElementById("dartAutomaten").value = tournamentData.dartAutomaten;
        displaySchedule(tournamentData.rounds);
        updateStandings();
    }
    loadDarkMode();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Startet das Turnier und öffnet das Modal zur Eingabe der Spielernamen
function generateTournament() {
    const playerCount = parseInt(document.getElementById("playerCount").value);
    const dartAutomaten = parseInt(document.getElementById("dartAutomaten").value);
    if (playerCount < 2 || dartAutomaten < 1) {
        alert("Bitte gültige Werte eingeben!");
        return;
    }
    showPlayerModal(playerCount, dartAutomaten);
}

// Öffnet das Modal und erzeugt dynamisch Eingabefelder
function showPlayerModal(playerCount, dartAutomaten) {
    const playerForm = document.getElementById("playerForm");
    playerForm.innerHTML = "";
    for (let i = 1; i <= playerCount; i++) {
        const div = document.createElement("div");
        div.classList.add("mb-3");
        div.innerHTML = `
      <label for="player${i}" class="form-label">Spieler ${i}</label>
      <input type="text" class="form-control" id="player${i}" placeholder="Name Spieler ${i}" value="Spieler ${i}">
    `;
        playerForm.appendChild(div);
    }
    const playerModalEl = document.getElementById("playerModal");
    const playerModal = new bootstrap.Modal(playerModalEl);
    playerModal.show();

    document.getElementById("savePlayersBtn").onclick = function () {
        let players = [];
        for (let i = 1; i <= playerCount; i++) {
            let input = document.getElementById("player" + i);
            let name = input.value.trim();
            if (!name) {
                name = "Spieler " + i;
            }
            players.push(name);
        }
        players = shuffleArray(players);
        const rounds = generateRoundRobin(players);
        let finalRounds = [];
        rounds.forEach((round, roundIndex) => {
            if (round.length <= dartAutomaten) {
                finalRounds.push({ round: (roundIndex + 1).toString(), matches: round });
            } else {
                const subRoundsCount = Math.ceil(round.length / dartAutomaten);
                for (let sub = 0; sub < subRoundsCount; sub++) {
                    const subMatches = round.slice(sub * dartAutomaten, (sub + 1) * dartAutomaten);
                    finalRounds.push({ round: (roundIndex + 1) + "." + (sub + 1), matches: subMatches });
                }
            }
        });
        tournamentData = {
            playerCount: playerCount,
            dartAutomaten: dartAutomaten,
            players: players,
            rounds: finalRounds
        };
        saveTournament();
        displaySchedule(tournamentData.rounds);
        updateStandings();
        playerModal.hide();
    }
}

function generateRoundRobin(players) {
    let rounds = [];
    let n = players.length;
    const isOdd = (n % 2 !== 0);
    let playersList = players.slice();
    if (isOdd) {
        playersList.push("bye");
        n++;
    }
    for (let round = 0; round < n - 1; round++) {
        let roundMatches = [];
        for (let i = 0; i < n / 2; i++) {
            const home = playersList[i];
            const away = playersList[n - 1 - i];
            if (home !== "bye" && away !== "bye") {
                roundMatches.push({ player1: home, player2: away, legs: "" });
            }
        }
        rounds.push(roundMatches);
        playersList.splice(1, 0, playersList.pop());
    }
    return rounds;
}

function displaySchedule(rounds) {
    const scheduleDiv = document.getElementById("schedule");
    scheduleDiv.innerHTML = "";
    rounds.forEach((round, roundIndex) => {
        const roundCard = document.createElement("div");
        roundCard.className = "card mb-3";

        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header";
        cardHeader.textContent = "Runde " + round.round;
        roundCard.appendChild(cardHeader);

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        round.matches.forEach((match, matchIndex) => {
            const matchDiv = document.createElement("div");
            matchDiv.className = "mb-2";

            const matchInfo = document.createElement("p");
            matchInfo.innerHTML = `<strong>${match.player1}</strong> vs <strong>${match.player2}</strong> - Ergebnis:`;
            matchDiv.appendChild(matchInfo);

            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("btn-group", "mb-2");
            const results = ["2:0", "2:1", "0:2", "1:2"];
            results.forEach(result => {
                const btn = document.createElement("button");
                btn.textContent = result;
                btn.classList.add("btn", "btn-outline-primary");
                if (match.legs === result) {
                    btn.classList.add("active");
                }
                btn.addEventListener("click", function () {
                    updateMatchResultWithResult(roundIndex, matchIndex, result, buttonContainer);
                    updateStandings();
                });
                buttonContainer.appendChild(btn);
            });
            matchDiv.appendChild(buttonContainer);
            cardBody.appendChild(matchDiv);
        });

        roundCard.appendChild(cardBody);
        scheduleDiv.appendChild(roundCard);
    });
}

function updateMatchResultWithResult(roundIndex, matchIndex, result, container) {
    tournamentData.rounds[roundIndex].matches[matchIndex].legs = result;
    saveTournament();
    container.querySelectorAll("button").forEach(btn => {
        btn.classList.remove("active");
    });
    const pressedBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent === result);
    if (pressedBtn) {
        pressedBtn.classList.add("active");
    }
}

function updateStandings() {
    if (!tournamentData) return;

    let standings = {};
    tournamentData.players.forEach(player => {
        standings[player] = {
            played: 0,
            wins: 0,
            losses: 0,
            legsFor: 0,
            legsAgainst: 0,
            diffLegs: 0,
            points: 0
        };
    });

    tournamentData.rounds.forEach(round => {
        round.matches.forEach(match => {
            const result = match.legs.trim();
            if (result === "") return;
            const parts = result.split(":");
            if (parts.length !== 2) return;
            const score1 = parseInt(parts[0]);
            const score2 = parseInt(parts[1]);
            if (isNaN(score1) || isNaN(score2)) return;
            const player1 = match.player1;
            const player2 = match.player2;

            standings[player1].played += 1;
            standings[player2].played += 1;

            standings[player1].legsFor += score1;
            standings[player1].legsAgainst += score2;
            standings[player2].legsFor += score2;
            standings[player2].legsAgainst += score1;

            if (score1 > score2) {
                standings[player1].wins += 1;
                standings[player1].points += 3;
                standings[player2].losses += 1;
            } else if (score2 > score1) {
                standings[player2].wins += 1;
                standings[player2].points += 3;
                standings[player1].losses += 1;
            }
        });
    });

    Object.keys(standings).forEach(player => {
        standings[player].diffLegs = standings[player].legsFor - standings[player].legsAgainst;
    });

    saveTournament();

    let standingsArray = Object.keys(standings).map(player => {
        return { player: player, ...standings[player] };
    });
    standingsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.diffLegs - a.diffLegs;
    });

    const standingsDiv = document.getElementById("standingsList");
    standingsDiv.innerHTML = "";
    const table = document.createElement("table");
    table.classList.add("table", "table-striped", "table-bordered", "table-hover");
    const headerLabels = ["Spieler", "Spiele", "Siege", "Niederl.", "Legs", "Gegenlegs", "Diff Legs", "Punkte"];
    const headerRow = document.createElement("tr");
    headerLabels.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    standingsArray.forEach(row => {
        const tr = document.createElement("tr");
        const cells = [
            row.player,
            row.played,
            row.wins,
            row.losses,
            row.legsFor,
            row.legsAgainst,
            row.diffLegs,
            row.points
        ];
        cells.forEach(cellText => {
            const td = document.createElement("td");
            td.textContent = cellText;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    standingsDiv.appendChild(table);
}

function resetTournament() {
    tournamentData = null;
    localStorage.removeItem("dartTournament");
    document.getElementById("playerCount").value = 4;
    document.getElementById("dartAutomaten").value = 2;
    document.getElementById("schedule").innerHTML = "";
    document.getElementById("standingsList").innerHTML = "";
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

function loadDarkMode() {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

// Registrierung der Eventlistener nach DOM-Content-Loaded
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("generateBtn").addEventListener("click", generateTournament);
    document.getElementById("resetBtn").addEventListener("click", resetTournament);
    document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
    loadTournament();
});
