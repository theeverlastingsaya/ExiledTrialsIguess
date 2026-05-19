const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "timeplayed.json");

function ensureDataFile() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify({ players: {} }, null, 2));
    }
}

function readData() {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeData(data) {
    ensureDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function parseTimePlayed(value) {
    if (typeof value === "number") {
        return value;
    }

    const text = String(value || "").trim();
    const parts = text.split(":").map((part) => Number(part));

    if (parts.length === 3 && parts.every(Number.isFinite)) {
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }

    return Number(text) || 0;
}

function formatTimePlayed(value) {
    const totalSeconds = Math.max(0, Math.floor(parseTimePlayed(value)));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTimePlayed(userId, username, timePlayed) {
    const cleanUserId = String(userId);
    const cleanUsername = String(username || "Unknown");
    const cleanTimePlayed = Math.max(0, Math.floor(parseTimePlayed(timePlayed)));

    const data = readData();
    data.players[cleanUserId] = {
        userId: cleanUserId,
        username: cleanUsername,
        timePlayed: cleanTimePlayed,
        updatedAt: new Date().toISOString(),
    };

    writeData(data);
}

function getLeaderboard(limit = 15) {
    const data = readData();

    return Object.values(data.players)
        .sort((a, b) => b.timePlayed - a.timePlayed)
        .slice(0, limit);
}

module.exports = {
    formatTimePlayed,
    getLeaderboard,
    setTimePlayed,
};
