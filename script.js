let tournamentData = null;

// Speichert die Turnierdaten im Local Storage
function saveTournament() {
    localStorage.setItem("dartTournament", JSON.stringify(tournamentData));
}

// Lädt die Turnierdaten aus dem Local Storage und aktualisiert die Ansicht
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

// Mischt ein Array zufällig (Fisher-Yates-Algorithmus)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Startet das Turnier, fragt für jeden Spieler einen Namen ab und generiert den Spielplan
function generateTournament() {
    const playerCount = parseInt(document.getElementById("playerCount").value);
    const dartAutomaten = parseInt(document.getElementById("dartAutomaten").value);
    if (playerCount < 2 || dartAutomaten < 1) {
        alert("Bitte gültige Werte eingeben!");
        return;
    }
    let players = [];
    // Für jeden Spieler wird der Name per Prompt abgefragt
    for (let i = 1; i <= playerCount; i++) {
        let name = prompt("Bitte gib den Namen für Spieler " + i + " ein:", "Spieler " + i);
        if (!name || name.trim() === "") {
            name = "Spieler " + i;
        }
        players.push(name.trim());
    }
    // Mische die Spielernamen zufällig
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
}

// Erzeugt einen Round Robin Spielplan (fügt "bye" hinzu bei ungerader Spielerzahl)
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

// Zeigt den Spielplan an und erstellt die zwei Inputfelder pro Match
function displaySchedule(rounds) {
    const scheduleDiv = document.getElementById("schedule");
    scheduleDiv.innerHTML = "";
    rounds.forEach((round, roundIndex) => {
        const roundDiv = document.createElement("div");
        roundDiv.className = "round";
        const header = document.createElement("h3");
        header.textContent = "Runde " + round.round;
        roundDiv.appendChild(header);
        round.matches.forEach((match, matchIndex) => {
            const matchDiv = document.createElement("div");
            matchDiv.className = "match";

            // Anzeige, wer gegen wen spielt (kein flex-grow, damit die Inputs links bleiben)
            const matchInfo = document.createElement("span");
            matchInfo.textContent = match.player1 + " vs " + match.player2 + " - Legs:";
            matchDiv.appendChild(matchInfo);

            // Erstes Inputfeld (Score Spieler 1)
            const legsInput1 = document.createElement("input");
            legsInput1.type = "number";
            legsInput1.min = "0";
            legsInput1.max = "2";
            legsInput1.placeholder = "0";
            legsInput1.value = match.legs ? match.legs.split("-")[0] : "0";
            legsInput1.dataset.roundIndex = roundIndex;
            legsInput1.dataset.matchIndex = matchIndex;
            legsInput1.classList.add("legsInput1");

            // Zweites Inputfeld (Score Spieler 2)
            const legsInput2 = document.createElement("input");
            legsInput2.type = "number";
            legsInput2.min = "0";
            legsInput2.max = "2";
            legsInput2.placeholder = "0";
            legsInput2.value = match.legs ? match.legs.split("-")[1] : "0";
            legsInput2.dataset.roundIndex = roundIndex;
            legsInput2.dataset.matchIndex = matchIndex;
            legsInput2.classList.add("legsInput2");

            // Eventlistener: Bei Änderung wird das Ergebnis aktualisiert
            legsInput1.addEventListener("change", function () {
                updateMatchResult(roundIndex, matchIndex);
                updateStandings();
            });
            legsInput2.addEventListener("change", function () {
                updateMatchResult(roundIndex, matchIndex);
                updateStandings();
            });

            // Füge die Inputfelder und einen Trenner (":") in die Anzeige ein
            matchDiv.appendChild(legsInput1);
            const separator = document.createElement("span");
            separator.textContent = " : ";
            matchDiv.appendChild(separator);
            matchDiv.appendChild(legsInput2);

            roundDiv.appendChild(matchDiv);
        });
        scheduleDiv.appendChild(roundDiv);
    });
}

// Aktualisiert das Ergebnis eines Matches in den Turnierdaten anhand der zwei Inputfelder
function updateMatchResult(roundIndex, matchIndex) {
    const input1 = document.querySelector(`input.legsInput1[data-round-index="${roundIndex}"][data-match-index="${matchIndex}"]`);
    const input2 = document.querySelector(`input.legsInput2[data-round-index="${roundIndex}"][data-match-index="${matchIndex}"]`);

    let score1 = parseInt(input1.value) || 0;
    let score2 = parseInt(input2.value) || 0;

    // Falls Unentschieden – nicht erlaubt:
    if (score1 === score2) {
        alert("Unentschieden sind nicht erlaubt. Das Ergebnis wird angepasst.");
        if (score1 === 0) {
            score2 = 1;
            input2.value = "1";
        } else {
            score2 = 0;
            input2.value = "0";
        }
    }
    tournamentData.rounds[roundIndex].matches[matchIndex].legs = score1 + "-" + score2;
    saveTournament();
}

// Berechnet und aktualisiert den Turnierstand inkl. Zählung der Legs und Leg-Differenz
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
            const parts = result.split("-");
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

// Setzt alle Turnierdaten zurück und leert den Local Storage sowie die Ansicht
function resetTournament() {
    tournamentData = null;
    localStorage.removeItem("dartTournament");
    document.getElementById("playerCount").value = 4;
    document.getElementById("dartAutomaten").value = 2;
    document.getElementById("schedule").innerHTML = "";
    document.getElementById("standingsList").innerHTML = "";
}

// Dark Mode-Funktionen
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

// Registrierung der Eventlistener nach vollständigem Laden des DOM
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("generateBtn").addEventListener("click", generateTournament);
    document.getElementById("refreshBtn").addEventListener("click", updateStandings);
    document.getElementById("resetBtn").addEventListener("click", resetTournament);
    document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
    loadTournament();
});
