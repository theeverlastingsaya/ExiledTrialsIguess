# Discord Bot

This bot has one command:

```text
/leaderboard
```

It ranks up to 15 Roblox players by `PlayerData.Stats.General.TimePlayed`.

## Bot Setup

Your `.env` needs:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_test_server_id
ROBLOX_BRIDGE_SECRET=IamAzulaTheZulaAndILoveChara
API_PORT=3000
```

Deploy the command:

```powershell
npm run deploy
```

Start the bot:

```powershell
npm start
```

The Roblox game must send `TimePlayed` to:

```text
POST /roblox/timeplayed
```

Payload:

```json
{
  "userId": 123,
  "username": "RobloxName",
  "timePlayed": 83832
}
```
