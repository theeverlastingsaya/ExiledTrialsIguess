const { Client, EmbedBuilder, Events, GatewayIntentBits } = require("discord.js");
const http = require("http");
const { formatTimePlayed, getLeaderboard, setTimePlayed } = require("./timeplayed-store");
require("dotenv").config();

const token = process.env.DISCORD_TOKEN;
const bridgeSecret = process.env.ROBLOX_BRIDGE_SECRET;
const apiPort = Number(process.env.PORT || process.env.API_PORT || 3000);

if (!token) {
    console.error("Missing DISCORD_TOKEN in .env");
    process.exit(1);
}

if (!bridgeSecret) {
    console.error("Missing ROBLOX_BRIDGE_SECRET in .env");
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "leaderboard") {
        return;
    }

    try {
        await interaction.deferReply();

        const leaders = getLeaderboard(10);

        if (leaders.length === 0) {
            await interaction.editReply("No TimePlayed data has been received yet.");
            return;
        }

        const embeds = leaders.map((player, index) => {
            const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${encodeURIComponent(player.userId)}&width=150&height=150&format=png`;

            return new EmbedBuilder()
                .setColor(0x2f80ed)
                .setTitle(`#${index + 1} ${player.username}`)
                .setURL(`https://www.roblox.com/users/${encodeURIComponent(player.userId)}/profile`)
                .setThumbnail(avatarUrl)
                .addFields(
                    {
                        name: "Time Played",
                        value: formatTimePlayed(player.timePlayed),
                        inline: true,
                    },
                    {
                        name: "Roblox User ID",
                        value: String(player.userId),
                        inline: true,
                    }
                );
        });

        await interaction.editReply({
            content: "**TimePlayed Leaderboard**",
            embeds,
        });
    } catch (error) {
        console.error("Leaderboard command failed:", error);

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply("The leaderboard command hit an error. Check the bot logs.");
        } else {
            await interaction.reply({
                content: "The leaderboard command hit an error. Check the bot logs.",
                ephemeral: true,
            });
        }
    }
});

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;

            if (body.length > 10000) {
                request.destroy();
                reject(new Error("Request body too large"));
            }
        });

        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

const server = http.createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/roblox/timeplayed") {
        sendJson(response, 404, { ok: false });
        return;
    }

    if (request.headers["x-roblox-secret"] !== bridgeSecret) {
        sendJson(response, 401, { ok: false });
        return;
    }

    try {
        const body = await readRequestBody(request);
        const { userId, username, timePlayed } = JSON.parse(body);

        if (!userId || !username || timePlayed == null) {
            sendJson(response, 400, {
                ok: false,
                error: "Missing userId, username, or timePlayed",
            });
            return;
        }

        setTimePlayed(userId, username, timePlayed);
        console.log(`Updated ${username}/${userId} TimePlayed: ${formatTimePlayed(timePlayed)}`);
        sendJson(response, 200, { ok: true });
    } catch (error) {
        sendJson(response, 400, { ok: false, error: "Invalid JSON body" });
    }
});

server.listen(apiPort, "0.0.0.0", () => {
    console.log(`Roblox TimePlayed bridge listening on port ${apiPort}`);
});

client.login(token).catch((error) => {
    console.error("Discord login failed:", error);
    process.exit(1);
});
