const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
    console.error("Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env");
    process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);
const commands = [
    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("shows players inthe top 10 playtime.")
        .toJSON(),
];

async function deployCommands() {
    try {
        console.log("Deploying slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log("Slash commands deployed.");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

deployCommands();
