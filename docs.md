# Mimi Bot — Complete Documentation

> Version 6.0.0 | Author: Alive | License: MIT
> Node.js ≥ 18.x | discord.js v14 | MongoDB | Hybrid Sharding

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Bot Configuration](#bot-configuration)
4. [Command System](#command-system)
5. [Commands Reference](#commands-reference)
   - [Anti-Nuke](#anti-nuke)
   - [Automations](#automations)
   - [Automod](#automod)
   - [Autoresponder](#autoresponder)
   - [Boost](#boost)
   - [Config](#config)
   - [Custom Commands](#custom-commands)
   - [Dating](#dating)
   - [Embed](#embed)
   - [Favorites](#favorites)
   - [Filter](#filter)
   - [Fun](#fun)
   - [Games](#games)
   - [Giveaway](#giveaway)
   - [Information](#information)
   - [Join2Create](#join2create)
   - [JoinDM](#joindm)
   - [Leave](#leave)
   - [Leaderboard](#leaderboard)
   - [Moderation](#moderation)
   - [Music](#music)
   - [Owner](#owner)
   - [Permit](#permit)
   - [PFP](#pfp)
   - [Playlist](#playlist)
   - [Reaction Roles](#reaction-roles)
   - [Tickets](#tickets)
   - [Logs](#logs)
   - [Utility](#utility)
   - [Vanity Roles](#vanity-roles)
   - [VC Mod](#vc-mod)
   - [Welcome](#welcome)
6. [Database Schemas](#database-schemas)
7. [Events System](#events-system)
8. [Utilities & Functions](#utilities--functions)
9. [Plugins](#plugins)
10. [Permission Flags Reference](#permission-flags-reference)

---

## Overview

**Mimi** is a feature-rich, all-in-one Discord bot built with discord.js v14+. It combines advanced music streaming, server management, moderation, fun interactions, leaderboards, giveaways, tickets, and much more into a single bot — powered by MongoDB for data persistence and Lavalink/Kazagumo for high-quality music playback.

**Key Highlights:**
- 200+ commands across 30+ categories
- High-quality music via Lavalink (Kazagumo + Shoukaku)
- Supports Spotify, YouTube, Deezer, Apple Music, SoundCloud
- Full anti-nuke protection system
- Ticket system with multi-panel support
- Join-to-Create voice channel system
- Leaderboards: voice, message, and invite tracking
- Giveaway system with roles, rerolls, and staff
- Component v2 UI (ContainerBuilder / MediaGalleryBuilder)
- Hybrid sharding for scalability

---

## Architecture & Tech Stack

### Runtime & Framework
| Component | Package | Version |
|-----------|---------|---------|
| Runtime | Node.js | ≥ 18.x |
| Discord Library | discord.js | ^14.25.1 |
| Sharding | discord-hybrid-sharding | ^2.2.6 |
| Database | mongoose (MongoDB) | ^8.20.4 |
| Music Engine | kazagumo | ^3.4.0 |
| Lyrics | genius-lyrics + lrclib-api | latest |
| HTTP | axios, node-fetch, got | latest |
| Image | canvas, jimp | latest |
| Giveaways | discord-giveaways | ^6.0.1 |
| Session/Express | express, express-session | latest |
| Config | js-yaml, dotenv | latest |
| Eval | dokdo (Jishaku port) | ^1.0.1 |

### Music Plugins (Kazagumo)
| Plugin | Purpose |
|--------|---------|
| kazagumo-spotify | Spotify support |
| kazagumo-deezer | Deezer support |
| kazagumo-apple | Apple Music support |
| kazagumo-filter | Audio filter support |

### File Structure
```
├── commands/          # All command files (by category folder)
├── database/          # Mongoose schema files
├── events/
│   ├── client/        # Discord.js client events
│   ├── custom/        # Custom internal events
│   ├── node/          # Lavalink node events
│   └── player/        # Kazagumo player events
├── functions/
│   ├── formatters/    # Time & bytes formatters
│   ├── generators/    # UI generators (buttons, cards, graphs)
│   ├── loaders/       # Command/event loaders
│   ├── msgCrt/        # Message-create middleware checks
│   └── reloaders/     # Hot-reload utilities
├── main/
│   ├── extendedClient.js  # Extended Discord.js Client
│   └── sharder.js         # Hybrid shard manager entry
├── plugins/           # Core plugins (player, embed, button, logger, antinuke)
├── utils/             # Utility helpers
├── assets/            # Emoji sets & static assets
└── config/            # options.js, colors, etc.
```

### Sharding
- Uses `discord-hybrid-sharding` with `ClusterClient`
- Entry point: `main/sharder.js` (spawns clusters)
- Client entry: `main/extendedClient.js`
- Each cluster handles a subset of shards

### UI System (Component v2)
All responses use Discord's **Component v2** system:
- `ContainerBuilder` — top-level container
- `TextDisplayBuilder` — text sections inside containers
- `SeparatorBuilder` — visual dividers
- `MediaGalleryBuilder` — image display
- `ActionRowBuilder` + `ButtonBuilder` — interactive buttons
- Sent with `flags: MessageFlags.IsComponentsV2`

---

## Bot Configuration

Located in `config/options.js` (loaded from env/yaml):

| Field | Description |
|-------|-------------|
| `bot.token` | Discord bot token |
| `bot.owners` | Array of owner user IDs |
| `bot.admins` | Array of admin user IDs |
| `bot.prefix` | Default command prefix |
| `bot.emoji` | Emoji set key |
| `bot.color` | Embed accent color |
| `links.support` | Support server invite |
| `links.invite` | Bot invite link |
| `links.topgg` | Top.gg vote link |
| `webhooks.error` | Error log webhook URL |
| `webhooks.static` | Static log webhook URL |
| `webhooks.server` | Server join/leave webhook |
| `webhooks.player` | Player event webhook |
| `webhooks.command` | Command usage webhook |
| `lavalink[]` | Array of Lavalink node configs |
| `mongodb` | MongoDB connection URI |

---

## Command System

### How Commands Are Loaded
1. `functions/loaders/commands.js` reads all files in `commands/`
2. Each file exports a module with metadata + `run(client, message, args)` function
3. Commands are stored in `client.commands` (Collection)
4. Aliases are stored in `client.aliases` (Collection)

### Command Module Structure
```js
module.exports = {
  name: 'commandname',          // Primary command name
  aliases: ['alias1', 'alias2'],// Alternative names
  category: 'category',         // Category folder name
  description: 'What it does',  // Description
  usage: '<required> [optional]',// Usage syntax
  cooldown: '5',                // Cooldown in seconds
  vote: false,                  // Requires top.gg vote
  admin: false,                 // Bot admin only
  owner: false,                 // Bot owner only
  botPerms: ['SendMessages'],   // Required bot permissions
  userPerms: ['ManageGuild'],   // Required user permissions
  player: false,                // Requires active music player
  queue: false,                 // Requires songs in queue
  inVoiceChannel: false,        // Requires user in VC
  sameVoiceChannel: false,      // Requires user in same VC as bot
  new: false,                   // New command flag
  premium: false,               // Premium-only command
  run: async (client, message, args) => { ... }
};
```

### Middleware Checks (messageCreate flow)
Each command goes through these checks in order:
1. `functions/msgCrt/ignored.js` — channel is not ignored
2. `functions/msgCrt/checkPerms.js` — bot and user have required permissions
3. `functions/msgCrt/cooldown.js` — user is not on cooldown
4. `functions/msgCrt/checkVote.js` — user has voted (if vote: true)
5. `functions/msgCrt/checkVoice.js` — user is in correct voice channel (if required)
6. `functions/msgCrt/checkPremium.js` — server has premium (if premium: true)

---

## Commands Reference

### Notation
- `<arg>` = Required argument
- `[arg]` = Optional argument
- `|` = or (pick one)
- **P** = Requires active music player
- **Q** = Requires songs in queue
- **VC** = User must be in voice channel
- **ADM** = Bot admin only
- **OWN** = Bot owner only
- **VOTE** = Requires top.gg vote
- **PREM** = Premium servers only

---

### Anti-Nuke

> Protect your server from nukers, raiders, and malicious admins.

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `antinuke` | `an`, `nukeprotect` | Configure the full anti-nuke protection system | `<enable\|disable\|status\|setup\|module\|limit\|punishment\|logchannel>` | Administrator |
| `antinukeconfig` | `anconfig`, `ancfg` | View anti-nuke configuration and all module statuses | — | Administrator |
| `antinukelimit` | `anlimit`, `nukelimit` | Set the action threshold for an anti-nuke module (1–20) | `<module> <1-20>` | Administrator |
| `antinukepunishment` | `anpunish`, `nukepunish` | Set the punishment for anti-nuke violations | `<ban\|kick\|strip\|quarantine>` | Administrator |
| `antinukereset` | `anreset`, `nukeresetall` | Reset all anti-nuke settings to defaults | — | Administrator |
| `admin` | `an-admin`, `anadmin` | Manage the admin list for anti-nuke | `<add\|remove\|view\|reset> [@user]` | Administrator |
| `whitelist` | `wl`, `anwl2` | Whitelist a user from anti-nuke | `<@user>` | Administrator |
| `unwhitelist` | `unwl`, `anuwl` | Remove a user from anti-nuke whitelist | `<@user>` | Administrator |
| `anwhitelist` | `anwl`, `nwl` | Manage the anti-nuke whitelist | `<add\|remove\|list> [@user]` | Administrator |
| `whitelisted` | `wled`, `anwled` | View all whitelisted users | — | Administrator |
| `whitelistreset` | `wlreset`, `anwlreset` | Clear the entire antinuke whitelist | — | Administrator |
| `mainrole` | `mr`, `mrole` | Manage protected main roles | `<add\|remove\|list\|reset> [role]` | Administrator |

**Anti-Nuke Modules:**
- `ban` — detects mass bans
- `kick` — detects mass kicks
- `channel` — detects mass channel create/delete
- `role` — detects mass role create/delete/update
- `webhook` — detects webhook creation
- `emoji` — detects mass emoji deletion
- `botadd` — detects unauthorized bot additions

**How It Works:**
- Tracks action counts per user within a time window
- If actions exceed the configured limit, punishment is applied
- Punishments: `ban`, `kick`, `strip` (remove all roles), `quarantine`
- Whitelisted users are exempt from all checks
- Admins in the admin list receive elevated trust

---

### Automations

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `autorole` | `ar`, `joinrole` | Automatically assign roles to new humans/bots on join | `<humans\|bots\|enable\|disable\|config\|reset> [add\|remove] [@role]` | ManageRoles |

**autorole subcommands:**
- `humans add @role` — add a role given to human members
- `bots add @role` — add a role given to bots
- `enable` / `disable` — toggle the autorole system
- `config` — view current autorole configuration
- `reset` — remove all autorole settings

---

### Automod

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `automod` | `am`, `filter2` | Configure the automod system with message filtering | `<enable\|disable\|module\|punishment\|config\|logging\|threshold\|ignore\|unignore\|reset>` | ManageGuild |
| `antibot` | `ab`, `botprotect` | Block unauthorized bots from joining your server | `<enable\|disable\|action\|add\|remove\|wl\|config\|reset>` | ManageGuild |

**automod modules:** `links`, `invites`, `spam`, `mentions`, `caps`, `emoji`, `words`, `duplicates`, `newlines`

**automod punishments:** `warn`, `mute`, `kick`, `ban`, `delete`

**antibot actions:** `kick`, `ban`

---

### Autoresponder

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `autoresponder` | `autoresp`, `responder` | Auto-reply to specific trigger words or phrases | `<create\|delete\|edit\|list\|enable\|disable\|exactmatch\|variables>` | ManageGuild |
| `react` | `autoreact`, `areact` | Auto-react to messages containing trigger words | `<add\|remove\|list\|reset>` | ManageGuild |

**autoresponder variables:** `{user}`, `{server}`, `{count}`, `{channel}`, `{mention}`

---

### Boost

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `setboost` | `boost`, `boostsetup` | Set up boost messages when members boost the server | `<#channel> [message]` | ManageGuild |
| `boostchannel` | `bch`, `boostch` | Change the boost message channel | `<#channel>` | ManageGuild |
| `boostmessage` | `bmsg`, `boostmsg` | Change the boost message text | `<message>` | ManageGuild |
| `boostview` | `bview`, `boostcfg` | View current boost message configuration | — | ManageGuild |
| `boosttest` | `btest`, `testboost` | Send a test boost message to the configured channel | — | ManageGuild |
| `boostdisable` | `bdis`, `boostoff` | Disable boost messages for this server | — | ManageGuild |

**Boost message variables:** `{user}`, `{mention}`, `{server}`, `{count}`, `{boostcount}`

---

### Config

| Command | Aliases | Description | Usage | Cooldown |
|---------|---------|-------------|-------|----------|
| `config` | `cfg`, `settings` | View all server configuration at a glance | — | — |
| `prefix` | `pfx`, `px` | Set or reset the bot prefix | `<reset\|new_prefix>` | — |
| `247` | `nonstop`, `alwayson` | Enable/disable 24/7 music mode | — | — |
| `engine` | `eng`, `searchengine` | Set your default music search engine | `[spotify\|youtube\|deezer\|apple]` | — |
| `ignore` | `ign`, `ignorechannel` | Choose channels the bot ignores | `<add\|del> <channel>` | — |
| `profile` | `prof`, `myprofile` | View user profile and badges | `[user]` | — |
| `premium` | `prem`, `premiumstatus` | Shows your premium status and benefits | — | — |
| `botconfig` | `bcfg`, `bconfig` | Configure the bot (avatar/banner/bio/nickname) | `<avatar\|banner\|bio\|nickname\|reset> [value]` | — |

---

### Custom Commands

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `custom` | `cc`, `customcmd` | Create and manage custom bot commands for your server | `<create\|delete\|edit\|list\|view\|enable\|disable>` | ManageGuild |

**custom subcommands:**
- `create <name> <response>` — create a new custom command
- `delete <name>` — delete a custom command
- `edit <name> <new response>` — edit an existing command
- `list` — list all custom commands
- `view <name>` — view a specific command
- `enable` / `disable <name>` — toggle a command

---

### Dating

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `dating` | `date`, `datingprofile` | Manage your dating profile and match with others | `<create\|delete\|view\|match\|like\|dislike\|profile\|edit>` |

**dating subcommands:**
- `create` — set up your dating profile with bio, age, gender
- `match` — get a random profile to react to
- `like @user` / `dislike @user` — respond to profiles
- `view [@user]` — view a profile
- `edit` — update your profile
- `delete` — remove your profile

---

### Embed

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `embed` | `em`, `custemembed` | Build and send custom embeds with a full editor | — | ManageMessages |

**embed features:**
- Interactive button editor for all embed fields
- Title, description, color, footer, thumbnail, image, author
- Field addition/removal
- Send to current or specified channel
- Preview before sending

---

### Favorites

> Save and manage your favorite music tracks.

| Command | Aliases | Description | Usage | Requires |
|---------|---------|-------------|-------|----------|
| `like` | `fav`, `heart` | Add the currently playing song to your favorites | — | P |
| `unlike` | `unfav`, `dislike` | Remove a song from your favorites by position | `<number>` | — |
| `showliked` | `showfav`, `mylist` | Show your liked songs with pagination | — | — |
| `playliked` | `playfav`, `mymusic` | Play your liked songs | — | VC |
| `likequeue` | `lq`, `likeall` | Add all songs from current queue to favorites | — | P, Q |
| `clearliked` | `clearfav`, `clf` | Clear all your liked songs | — | — |

---

### Filter

> Audio filters for the music player.

| Command | Aliases | Description | Usage | Requires |
|---------|---------|-------------|-------|----------|
| `bassboost` | `bb`, `bass` | Quick bass boost with intensity levels | `[low\|medium\|high\|off]` | P, VC |
| `equalizer` | `eq`, `equaliser` | 5-band equalizer | — | P, VC |
| `filter` | `fx`, `effects` | Choose an audio filter to enhance your music | — | P, VC |
| `clearfilter` | `cf`, `nofilter` | Remove all active audio filters and reset to default | — | P, VC |
| `speed` | `sp`, `playbackspeed` | Change playback speed (0.5x to 2.0x) | `<0.5-2.0>` | P, VC |
| `enhance` | `enh`, `audioquality` | Optimize for best audio quality | — | P, VC |
| `optimize` | `opt`, `netfix` | Optimize for poor network connections | — | P, VC |

**Available Filters:** `bassboost`, `nightcore`, `vaporwave`, `8d`, `karaoke`, `tremolo`, `vibrato`, `rotation`, `distortion`, `lowpass`

---

### Fun

> Reaction GIFs, emotion commands, and fun utilities.

#### Meter / Rating Commands

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `ship` | `lovemeter`, `couple` | Calculate a love percentage between two users | `<@user1> [@user2]` |
| `rate` | `rating`, `rater` | Rate something on a scale of 1–10 | `<thing>` |
| `howcute` | `cute`, `cutemeter` | How cute is someone? | `[@user]` |
| `howdumb` | `dumb`, `dumbmeter` | How dumb is someone? | `[@user]` |
| `howgay` | `gay`, `gaymeter` | How gay is someone? | `[@user]` |
| `howsimp` | `simp`, `simpmeter` | How much of a simp is someone? | `[@user]` |
| `howsmart` | `smart`, `smartmeter` | How smart is someone? | `[@user]` |

#### Text / Utility Fun

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `advice` | `tip`, `randomadvice` | Get a random piece of advice from an API | — |
| `meme` | `memes`, `randommeme` | Get a random meme from Reddit | — |
| `catsay` | `cs`, `meow` | Make a cat say something | `<message>` |
| `say` | `echo`, `repeat` | Make the bot say something | `<message>` |
| `reverse` | `rev`, `backwards` | Reverse a piece of text | `<text>` |
| `mock` | `spongemock`, `mocking` | Spongebob mock-ify some text | `<text>` |
| `shout` | `yell`, `scream` | SHOUT SOMETHING | `<text>` |
| `choose` | `pick`, `decide` | Pick from a list of options | `<option1, option2, ...>` |
| `coinflip` | `flip`, `toss` | Flip a coin | — |
| `dice` | `die`, `rolldice` | Roll a dice | `[sides]` |
| `roast` | `roasted`, `burn` | Roast someone with a random insult | `[@user]` |

#### Reaction GIF Commands (all support `[@user]`)

| Command | Aliases | Command | Aliases |
|---------|---------|---------|---------|
| `airkiss` | `airk`, `flyingkiss` | `kiss` | `smooch`, `muah` |
| `angry` | `rage`, `angery` | `laugh` | `lol`, `lmao` |
| `bite` | `chomp`, `biting` | `lick` | `licking`, `licks` |
| `bleh` | `bleh2`, `tongue` | `love` | `iloveyou`, `crush` |
| `blush` | `blushing`, `pink` | `mad` | `furious`, `angry2` |
| `bonk` | `bonked`, `bonking` | `nervous` | `anxiety`, `stressed` |
| `brofist` | `bf`, `fist` | `no` | `nope`, `nah` |
| `celebrate` | `cele`, `party` | `nom` | `eating`, `chomp2` |
| `cheers` | `toast`, `cheering` | `nosebleed` | `nbleed`, `anime` |
| `clap` | `applause`, `clapping2` | `nuzzle` | `nuzzles`, `nuzzling` |
| `clap2` | `clapping`, `slowclap2` | `nyah` | `nya`, `catgirl` |
| `confused` | `confuse`, `huh2` | `pat` | `headpat`, `pats` |
| `cool` | `sunglasses`, `swag` | `peek` | `peeking`, `spying` |
| `cry` | `sob`, `weep` | `pinch` | `pinching`, `ouch` |
| `cuddle` | `snuggle`, `cuddling` | `poke` | `prod`, `poked` |
| `dance` | `groove`, `dancing` | `pout` | `pouting`, `sulk` |
| `drool` | `drooling`, `drools` | `punch` | `hit`, `bop` |
| `evillaugh` | `evil`, `muhaha` | `roll` | `rolling`, `tumble` |
| `facepalm` | `fp`, `palm` | `run` | `runaway`, `flee` |
| `handhold` | `hands`, `holdhand` | `sad` | `sadge`, `depressed` |
| `happy` | `joyful`, `happyface` | `scared` | `fear`, `frightened` |
| `headbang` | `bang`, `metalhead` | `sigh` | `sighing`, `exhale` |
| `hug` | `embrace`, `hugme` | `sip` | `sipping`, `drink` |
| `huh` | `whatthe`, `huh3` | `slap` | `slapped`, `slapping` |
| `kill` | `murder`, `eliminate` | `sleep` | `nap`, `sleeping` |
| `slowclap` | `sclap`, `sarcasticclap` | `smack` | `smacking`, `whack` |
| `smile` | `grin`, `smiling` | `smug` | `smugface`, `smugging` |
| `sneeze` | `achoo`, `sneezing` | `sorry` | `apologize`, `apology` |
| `stare` | `glare`, `staring` | `stop` | `stopstop`, `halt` |
| `surprised` | `shocked`, `gasp` | `sweat` | `sweating`, `nervous2` |
| `thumbsup` | `thumbup`, `likeme` | `tickle` | `tickled`, `tickling` |
| `tired` | `exhausted`, `sleepy` | `wave` | `hi`, `hello` |
| `wink` | `winking`, `winks` | `woah` | `whoa`, `wow` |
| `yawn` | `yawning`, `bored` | `yay` | `woohoo`, `hooray` |
| `yes` | `yep`, `yeah` | `shy` | `shyface`, `timid` |

---

### Games

| Command | Aliases | Description | Usage | Cooldown |
|---------|---------|-------------|-------|----------|
| `8ball` | `8b`, `magicball` | Ask the magic 8-ball a question | `<question>` | 3s |
| `connect4` | `c4`, `four` | Play Connect 4 against another user | `<@user>` | 5s |
| `dare` | `dare2`, `td` | Get a random dare challenge | — | 3s |
| `fastmath` | `fm`, `mathquiz` | Solve math questions as fast as possible | — | 5s |
| `gtn` | `guess`, `guessnum` | Guess the number the bot is thinking of | — | 5s |
| `hangman` | `hm`, `hang` | Play hangman with a random word | — | 5s |
| `hl` | `highlow`, `hilo` | Higher or lower number guessing game | — | 3s |
| `reaction` | `reacttest`, `reactiontime` | Test your reaction speed | — | 5s |
| `riddle` | `rid`, `puzzle` | Answer a riddle (45 second timer) | — | 5s |
| `rps` | `rockpaperscissors`, `rockpaper` | Play Rock Paper Scissors against the bot | — | 3s |
| `scramble` | `scram`, `wordscramble` | Unscramble a word before time runs out | — | 5s |
| `slots` | `slot`, `spin` | Pull the slot machine lever | — | 3s |
| `trivia` | `quiz`, `triviatime` | Answer a trivia question from Open Trivia DB | — | 5s |
| `truth` | `truth2`, `tt` | Get a random truth question | — | 3s |
| `wyr` | `wouldyourather`, `or` | Vote on a Would You Rather question | — | 5s |

---

### Giveaway

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `gstart` | `gw`, `giveaway` | Start a giveaway | `<time> <winners> <prize>` | ManageGuild |
| `gend` | `giveawayend`, `gwend` | End a giveaway early | `<messageId>` | ManageGuild |
| `greroll` | `gwr`, `reroll` | Reroll a giveaway winner | `<messageId>` | ManageGuild |
| `glist` | `gwlist`, `activegw` | List all active giveaways | — | ManageGuild |
| `gconfig` | `gcfg`, `gwconfig` | View giveaway system configuration | — | ManageGuild |
| `gstaff` | `gstaffrole`, `gwstaff` | Set or reset the giveaway staff role | `<@role\|reset>` | ManageGuild |

**gstart examples:**
- `gstart 1h 1 Nitro` — 1-hour giveaway with 1 winner for "Nitro"
- `gstart 30m 3 Discord Subscription` — 30 minutes, 3 winners

**Bot Permissions Required:** ManageMessages (for giveaway messages)

---

### Information

| Command | Aliases | Description | Usage | Cooldown |
|---------|---------|-------------|-------|----------|
| `help` | `h`, `cmds` | Show help menu or info about a specific command/category | `[command\|category]` | — |
| `info` | `botinfo`, `about` | Show bot information and statistics | — | — |
| `ping` | `latency`, `ms` | Show detailed latency information | — | 3s |
| `uptime` | `up`, `runtime` | Show bot uptime | — | — |
| `invite` | `inv`, `addbot` | Get bot invite link | — | — |
| `support` | `sv`, `supportserver` | Get support server link | — | — |
| `vote` | `topgg`, `voteme` | Get vote link for top.gg | — | — |
| `website` | `web`, `site` | Get link to official Top.gg page | — | — |
| `stats` | `botstats`, `botstat` | Show detailed bot statistics and performance | — | 5s |
| `system` | `sys`, `sysinfo` | Display detailed system statistics | — | 5s |
| `node` | `nodeinfo`, `lavalink` | Show Lavalink node information | — | — |
| `list` | `ls`, `members` | List server members by category | `<boosters\|inrole\|emojis\|bots\|admins\|mods\|roles\|early\|activedeveloper>` | — |
| `membercount` | `mc`, `mcount` | Show server member count | — | — |
| `lb` | `songlb`, `topsongs` | View global leaderboard for most listened songs | — | 5s |
| `history` | `hist`, `recent` | View your recently listened songs and full history | `[user]` | 5s |
| `report` | `bugreport`, `bug` | Show bug report options | — | — |
| `aio` | `allinone`, `aiomanager` | Enable or disable all-in-one server management modules | `<enable\|disable>` | — |

---

### Join2Create

> Users join a "create" voice channel and get their own personal VC automatically.

**Setup:** `j2csetup <#voice-channel> [categoryId]`

#### Server Setup

| Command | Aliases | Description | Usage | Bot Perms |
|---------|---------|-------------|-------|-----------|
| `j2csetup` | `j2cs`, `setupvc` | Set up the Join-to-Create system | `<#voice-channel> [categoryId]` | ManageChannels |

#### Channel Management (channel owner only)

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `j2cname` | `j2cn`, `vcname` | Rename your voice channel | `<new name>` |
| `j2climit` | `j2cl`, `vclimit` | Set user limit (0 = unlimited) | `<0-99>` |
| `j2cbitrate` | `j2cbr`, `vcbr` | Set audio bitrate in kbps | `<8-384>` |
| `j2clock` | `j2clo`, `lockvc2` | Lock your channel so no one new can join | — |
| `j2cunlock` | `j2cul`, `unlockvc2` | Unlock your channel | — |
| `j2cghost` | `ghost`, `hidevc` | Hide your channel from the channel list | — |
| `j2cunghost` | `unghost`, `showvc` | Make your hidden channel visible again | — |
| `j2cstatus` | `j2cst`, `vcstatus` | Set a status message for your channel | `<status text\|clear>` |
| `j2cregion` | `j2cr2`, `vcregion` | Change voice region | `<region\|auto>` |
| `j2creset` | `j2cr`, `vcresetall` | Reset your channel to default settings | — |
| `j2ctransfer` | `j2ct`, `transfervc` | Transfer ownership to another user | `<@user>` |
| `j2cclaim` | `j2cc`, `claimvc` | Claim ownership when owner has left | — |
| `j2cinfo` | `vcinfo`, `j2ci` | View information about your channel | — |

#### User Permissions

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `j2cpermit` | `j2cp`, `vcpermit` | Permit a user to join your locked channel | `<@user>` |
| `j2cunpermit` | `j2cup`, `vcunpermit` | Remove a user's permit | `<@user>` |
| `j2cdeny` | `j2cd`, `vcdeny` | Remove a user from your channel | `<@user>` |
| `j2ckick` | `j2ck`, `kickvc` | Kick a user from your channel | `<@user>` |
| `j2cban` | `vcblock`, `j2cb` | Ban a user from your channel (persists across rejoins) | `<@user>` |
| `j2cunban` | `j2cub`, `vcunblock` | Unban a user from your channel | `<@user>` |

---

### JoinDM

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `joindm` | `jdm`, `joinmessage` | Configure DM messages sent to users when they join | `<enable\|disable\|message\|config>` | ManageGuild |
| `say2` | `say3`, `botsay` | Make the bot say something in a channel | `<message>` | ManageGuild |

**joindm variables:** `{user}`, `{server}`, `{count}`

---

### Leave

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `setleave` | `sl`, `leavesetup` | Set up leave messages when members leave | `<#channel> [message]` | ManageGuild |
| `leavechannel` | `lch`, `leavech` | Change the leave message channel | `<#channel>` | ManageGuild |
| `leavemessage` | `lmsg`, `leavemsg` | Change the leave message text | `<message>` | ManageGuild |
| `leaveview` | `lv`, `viewleave` | View current leave message configuration | — | ManageGuild |
| `leavetest` | `lt`, `testleave` | Send a test leave message | — | ManageGuild |
| `leavedisable` | `ldis`, `leaveoff` | Disable leave messages for this server | — | ManageGuild |

**Leave message variables:** `{user}`, `{tag}`, `{server}`, `{count}`, `{mention}`

---

### Leaderboard

| Command | Aliases | Description | Usage | Cooldown |
|---------|---------|-------------|-------|----------|
| `leaderboard` | `top`, `rankings` | Unified leaderboard — voice, message, or invite | `[voice\|message\|invite] [daily\|weekly\|total]` | — |
| `voiceleaderboard` | `vlb2`, `voicetop` | View voice time leaderboard | `[daily\|weekly\|total]` | — |
| `messageleaderboard` | `mlb`, `msgtop` | View message leaderboard | `[daily\|weekly\|total]` | — |
| `inviteleaderboard` | `invlb`, `invitetop` | View invite leaderboard | `[total\|regular\|fake\|left]` | — |
| `invites` | `invs`, `myinvites` | View detailed invite stats for a user | `[@user]` | — |
| `vcstats` | `vs`, `voicestats` | View detailed voice stats for a user | `[@user]` | — |
| `msgstats` | `ms2`, `messagestats` | View detailed message stats for a user | `[@user]` | — |
| `voicelb` | `vlb`, `voicetrack` | Enable or disable voice leaderboard tracking | `<on\|off>` | — |
| `msglb` | `mslb`, `msgtrack` | Enable or disable message leaderboard tracking | `<on\|off>` | — |
| `invitelb` | `ilb`, `invitetrack` | Enable or disable invite leaderboard tracking | `<on\|off>` | — |
| `lbreset` | `lbr`, `resetlb` | Reset leaderboard data for this server | `<voice\|message\|invite\|all> [daily\|weekly\|total\|user @user]` | — |
| `lblist` | `lbcfg`, `lbsettings` | View leaderboard config and blacklisted channels | — | — |
| `blacklistchannel` | `blch`, `lbblock` | Blacklist a channel from leaderboard tracking | `<#channel>` | — |
| `unblacklistchannel` | `ublch`, `lbunblock` | Remove a channel from leaderboard blacklist | `<#channel>` | — |

**Tracking periods:** `daily`, `weekly`, `total` (default: total)

---

### Moderation

| Command | Aliases | Description | Usage | User Perms | Bot Perms |
|---------|---------|-------------|-------|------------|-----------|
| `ban` | `b`, `banish` | Ban a member from the server | `<@user> [reason]` | BanMembers | BanMembers |
| `unban` | `ub`, `pardon` | Unban a user by their ID | `<userId> [reason]` | BanMembers | BanMembers |
| `unbanall` | `uba`, `unbaneveryone` | Unban all banned users | — | BanMembers | BanMembers |
| `softban` | `sb`, `tempban` | Ban then immediately unban (deletes messages) | `<@user> [reason]` | BanMembers | BanMembers |
| `massban` | `mb`, `mban` | Ban multiple users at once | `<@user1 @user2 ...> [--reason text]` | BanMembers | BanMembers |
| `kick` | `k`, `boot` | Kick a member from the server | `<@user> [reason]` | KickMembers | KickMembers |
| `warn` | `w`, `warning` | Warn a member and log it | `<@user> [reason]` | ModerateMembers | — |
| `warnings` | `warns`, `warnlist` | View all warnings for a member | `<@user>` | ModerateMembers | — |
| `clearwarn` | `cw`, `clearwarns` | Clear specific or all warnings for a member | `<@user> [warnId\|all]` | ModerateMembers | — |
| `modlogs` | `ml`, `modlog` | View moderation history for a user or case | `[@user\|caseId]` | ModerateMembers | — |
| `timeout` | `mute`, `to` | Timeout a member for a specified duration | `<@user> <duration: 60s/5m/1h/1d> [reason]` | ModerateMembers | ModerateMembers |
| `untimeout` | `unmute`, `uto` | Remove a timeout from a member | `<@user> [reason]` | ModerateMembers | ModerateMembers |
| `nick` | `nickname`, `sn` | Change or reset a member's nickname | `<@user> [new nickname]` | ManageNicknames | ManageNicknames |
| `role` | `r`, `roles` | Role management commands | `<@user> <@role> \| <create\|delete\|rename\|all\|humans\|bots>` | ManageRoles | ManageRoles |
| `removerole` | `rrole`, `massroleremove` | Remove a role from all/humans/bots | `<all\|humans\|bots> <@role>` | ManageRoles | ManageRoles |
| `lock` | `lk`, `lockchannel` | Lock a channel so members cannot send messages | `[#channel] [reason]` | ManageChannels | ManageChannels |
| `unlock` | `ul`, `unlockchannel` | Unlock a channel | `[#channel] [reason]` | ManageChannels | ManageChannels |
| `lockall` | `la`, `lockeverything` | Lock all channels | — | ManageChannels | ManageChannels |
| `unlockall` | `ula`, `unlockeverything` | Unlock all channels | — | ManageChannels | ManageChannels |
| `hide` | `hc`, `hidechannel` | Hide a channel from everyone | `[#channel] [reason]` | ManageChannels | ManageChannels |
| `unhide` | `uhc`, `unhidechannel` | Unhide a channel | `[#channel] [reason]` | ManageChannels | ManageChannels |
| `hideall` | `hcall`, `hideallchannels` | Hide all channels | — | ManageChannels | ManageChannels |
| `unhideall` | `uha`, `unhideallchannels` | Unhide all channels | — | ManageChannels | ManageChannels |
| `slowmode` | `sm`, `slow` | Set slowmode for a channel (0 to disable) | `<seconds 0-21600> [#channel]` | ManageChannels | ManageChannels |
| `purge` | `clear`, `prune` | Bulk delete messages | `<amount> [filter]` | ManageMessages | ManageMessages |
| `clone` | `clonechannel`, `cc3` | Clone the current channel | — | ManageChannels | ManageChannels |
| `nuke` | `nc`, `nukechannel` | Clone and delete the current channel | — | ManageChannels | ManageChannels |
| `enlarge` | `emoji`, `bigemoji` | Get a larger version of an emoji | `<emoji>` | — | — |
| `jail` | `prison`, `jailuser` | Jail a user or manage jail system | `<@user\|setup\|list\|config\|reset> [reason]` | ManageRoles | ManageRoles |
| `unjail` | `uj`, `freejail` | Release a user from jail | `<@user> [reason]` | ManageRoles | ManageRoles |

**Timeout duration formats:** `60s`, `5m`, `1h`, `1d`, `1w` (max: 28 days)

**Mod Logging:** All moderation actions are logged to the configured mod-log channel and stored in MongoDB with case IDs.

---

### Music

> Powered by Kazagumo + Shoukaku (Lavalink). Supports Spotify, YouTube, Deezer, Apple Music, SoundCloud.

| Command | Aliases | Description | Usage | Requires | Cooldown |
|---------|---------|-------------|-------|----------|----------|
| `play` | `p`, `music` | Play a song using your default search engine | `<url / name / file>` | VC | — |
| `search` | `se`, `findsong` | Search for a song and pick from results | `<query>` | VC | — |
| `pause` | `pa`, `pausemusic` | Pause the player | — | P, Q, VC | — |
| `resume` | `res`, `continue` | Resume the player | — | P, Q, VC | — |
| `skip` | `s`, `next` | Skip the current song or skip to a position | `[position]` | P, Q, VC | — |
| `stop` | `st`, `stopmusic` | Stop the player and clear the queue | — | P, Q, VC | — |
| `queue` | `q`, `songlist` | Show the current music queue | `[page number]` | P | — |
| `nowplaying` | `np2`, `current` | Show the currently playing song with live progress | — | P | — |
| `loop` | `l`, `repeat` | Set loop mode (off / song / queue) | — | P, Q, VC | — |
| `shuffle` | `sh`, `mix` | Shuffle the queue | — | P, Q, VC | — |
| `volume` | `vol`, `v` | Set player volume (1–500) | `[1-500]` | P, VC | — |
| `seek` | `sk`, `jumpto` | Seek to a specific position in the song | `<Xs or Xm>` | P, Q, VC | — |
| `remove` | `rm`, `removesong` | Remove a song from the queue by position | `<position>` | P, Q, VC | — |
| `move` | `mv`, `moveto` | Move the bot to your current voice channel | — | VC | — |
| `join` | `summon`, `comehere` | Make the bot join your voice channel | — | VC | — |
| `leave` | `dc`, `disconnect` | Make the bot leave the voice channel | — | P, VC | — |
| `rejoin` | `rj`, `reconnect` | Rejoin the voice channel | — | VC | — |
| `previous` | `prev`, `back` | Play the previous song | — | P, Q, VC | — |
| `replay` | `rpl`, `restartsong` | Replay the current song from the beginning | — | P, Q, VC | — |
| `clear` | `cq`, `clearqueue` | Clear the filter or queue | — | P, VC | — |
| `autoplay` | `ap`, `autoq` | Enable/disable autoplay based on listening history | — | P, Q, VC | — |
| `lyrics` | `ly`, `songlyrics` | Get lyrics for the current song or search | `[song name]` | — | — |
| `grab` | `dm2`, `songdm` | Send current song info to your DMs | — | P | — |
| `radio` | `rad`, `radiostation` | Choose and play a radio station | — | VC | — |
| `recommend` | `rec`, `suggestions` | Get personalized song recommendations | `[user]` | — | 10s |
| `debug` | `fixplayer`, `playerfix` | Reset player settings (rejoin + debug) | — | VC | — |

**Supported Sources:**
- YouTube (default), YouTube Music
- Spotify (tracks, albums, playlists, artists)
- Deezer
- Apple Music
- SoundCloud
- Direct file URLs (mp3, mp4, etc.)
- HTTP streams / radio URLs

**247 Mode:** When enabled, bot stays in VC even when all members leave. Toggle with `247` command.

---

### Owner

> Bot owner-only commands. **OWN** flag required.

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `add` | `addprem`, `givepremium` | Grant premium to a server | `<guildId> [plan]` |
| `revoke` | `rp`, `revokepremium` | Revoke premium from a server | `<guildId>` |
| `bdg` | `badge`, `givebadge` | Give a badge to a user | `<@user> <badge>` |
| `changelog` | `cl2`, `changes` | Post changelog to a webhook | — |
| `reload` | `rl`, `reloadcmd` | Hot-reload a command, event, or function | `<type> <name>` |
| `steal` | `grab`, `stealemoji` | Steal an emoji from another server | `<emoji>` |
| `backup` | `bkp`, `getbackup` | Send bot backup zip to owner's DMs | — |
| `dm` | `directmessage`, `owndm` | Send a DM to any user through the bot | `<user> <message>` |
| `list` | `servers`, `guilds` | Show the list of servers the bot is in | — |
| `movefast` | `mf`, `fastmove` | Rapidly move a user between voice channels | `<@user/userId>` |
| `noprefix` | `np`, `nopfx` | Manage no-prefix users with plan selection | `<userId>` |
| `pi` | `pistat`, `sysstat` | Display bot system stats | — |
| `pingreact` | `pr`, `pingreaction` | Enable/disable ping reactions for a server | `[enable/disable]` |
| `restart` | `rs`, `reboot` | Respawn all shards | — |
| `roleicon` | `ricon`, `setriconrole` | Add an emoji or image as a role icon | — |

---

### Permit

> Bot admin-only permission management.

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `extraowner` | `eo`, `eown` | Manage extra owners (bot-level permission) | `<add\|remove\|list> <@user>` |
| `ignore2` | `ig2`, `ignorecmd` | Manage ignored servers or users at bot level | `<add\|remove\|list>` |

---

### PFP

> Fetch and browse profile pictures with interactive navigation buttons.

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `anime` | `anipfp`, `animepic` | Browse random anime profile pictures | — |
| `boys` | `bp`, `boyspfp` | Browse random boys' profile pictures | — |
| `girls` | `gp`, `girlspfp` | Browse random girls' profile pictures | — |
| `couples` | `cp`, `couplespfp` | Browse random couples profile pictures | — |
| `pic` | `pfp`, `randompfp` | Browse random profile pictures | — |

All PFP commands use `ContainerBuilder` + `MediaGalleryBuilder` with Previous/Next/Stop buttons and an interactive collector.

---

### Playlist

> Create, manage, and share personal music playlists.

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `plcreate` | `plc`, `newplaylist` | Create a new empty playlist | `<playlist name>` |
| `pldelete` | `pld`, `deleteplaylist` | Delete one of your playlists permanently | `<playlist name>` |
| `pladd` | `pla`, `addtoplaylist` | Add a song to your playlist | `<playlist name> [song url/name]` |
| `pladdqueue` | `plaq`, `addqueuetopl` | Add the entire current queue to your playlist | `<playlist name>` |
| `plremove` | `plr`, `removefrompl` | Remove a song from your playlist by track number | `<playlist name> <track number>` |
| `plplay` | `plp`, `playplaylist` | Load and play songs from your playlist | `<playlist name>` |
| `plplayshared` | `plps`, `playshared` | Play a public playlist using its share code | `<share code>` |
| `pllist` | `pll`, `myplaylists` | List all your playlists with track counts | — |
| `plview` | `plv`, `viewplaylist` | View songs in a playlist with pagination | `<playlist name>` |
| `plprivacy` | `plpr`, `playlistprivacy` | Toggle playlist privacy (public/private) | `<playlist name>` |
| `plshare` | `plsh`, `shareplaylist` | Share your playlist with a share code | `<playlist name>` |
| `plpubliclist` | `plpub`, `publicplaylists` | Browse all public playlists | — |
| `plstats` | `plst`, `playliststats` | View detailed statistics for a playlist | `<playlist name>` |
| `pltop` | `plt`, `topplaylists` | View the top playlist creators leaderboard | `[global\|server]` |

---

### Reaction Roles

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `reactionrole` | `rr`, `reactrole` | Set up reaction roles on messages | `<create\|delete\|list\|add\|remove\|reset>` | ManageRoles |

**reactionrole subcommands:**
- `create <messageId> <emoji> <@role>` — add a reaction role to a message
- `delete <messageId> <emoji>` — remove a reaction role
- `list` — list all reaction roles
- `reset` — remove all reaction roles

---

### Tickets

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `ticket` | `tickets`, `tc` | Full ticket system management | `<setup\|panel\|staff\|category\|log\|transcript\|limit\|addcategory\|removecategory\|categories\|adduser\|removeuser\|close\|claim\|rename\|topic\|config\|reset>` | ManageGuild |

**ticket subcommands:**

| Subcommand | Description |
|------------|-------------|
| `setup` | Initial ticket system setup |
| `panel` | Send the ticket create panel to a channel |
| `staff <@role>` | Set the staff role for tickets |
| `category <categoryId>` | Set the category for ticket channels |
| `log <#channel>` | Set the log channel for ticket events |
| `transcript` | Send a transcript of the current ticket |
| `limit <number>` | Set max open tickets per user |
| `addcategory` | Add a ticket category/type |
| `removecategory` | Remove a ticket category/type |
| `categories` | List all ticket categories |
| `adduser <@user>` | Add a user to the current ticket |
| `removeuser <@user>` | Remove a user from the current ticket |
| `close [reason]` | Close the current ticket |
| `claim` | Claim the current ticket (staff) |
| `rename <name>` | Rename the ticket channel |
| `topic <text>` | Set the ticket topic |
| `config` | View current ticket configuration |
| `reset` | Reset all ticket settings |

**Features:**
- Multi-category ticket panels
- Staff claim system
- Auto-transcript on close
- Ticket channel naming patterns
- Per-user ticket limits
- Component v2 styled welcome/claim messages

---

### Utility

| Command | Aliases | Description | Usage |
|---------|---------|-------------|-------|
| `afk` | `away`, `setafk` | Set your AFK status with an optional message | `[message]` |
| `avatar` | `av`, `pfp2` | Show a user's avatar | `[@user]` |
| `banner` | `bn`, `userbanner` | Show a user's profile banner | `[@user]` |
| `servericon` | `sicon`, `serverpic` | Show the server icon | — |
| `serverinfo` | `si`, `guildinfo` | Show detailed server information | — |
| `userinfo` | `ui`, `whois` | Show detailed information about a user | `[@user]` |
| `roleinfo` | `ri`, `rinfo` | Show detailed information about a role | `<@role>` |
| `snipe` | `sn2`, `lastmessage` | Snipe the last deleted message in a channel | — |
| `poll` | `vote2`, `survey` | Create a reaction-based poll | `<question>` |
| `purge` | `clear`, `prune` | Bulk delete messages | `<amount> [bots\|user @user\|text]` |
| `purgebots` | `pb`, `deletebots` | Bulk delete bot messages | `[amount]` |
| `media` | `med`, `attachments` | Display media/attachments from a message | `<messageId>` |

**AFK System:**
- When AFK, the bot replies to any mentions of you with your AFK message
- AFK is cleared automatically when you send a message
- AFK status is stored per-user in MongoDB

---

### Logs

> Advanced server audit logging system. Log moderation, member, message, voice, and server events to dedicated channels.

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `logging` | `log`, `auditlog` | Advanced logging configuration — setup, auto-configure, status, test, reset | `<setup\|auto\|status\|test\|reset>` | ManageGuild |
| `setlog` | `sl2`, `logset` | Set the log channel for a specific event type | `<type> <#channel>` | ManageGuild |
| `unsetlog` | `usl`, `logremove` | Remove a log channel setting | `<type\|all>` | ManageGuild |
| `viewlogs` | `vl`, `loglist` | View all configured log channels for this server | — | ManageGuild |

**Log types:** `mod`, `member`, `message`, `voice`, `server`, `role`, `channel`, `invite`, `all`

---

### Vanity Roles

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `vanityroles` | `vr`, `vanity` | Give roles to members who put the server vanity in their status | `<setup\|enable\|disable\|role\|message\|config\|reset>` | ManageGuild |

---

### VC Mod

> Moderate users in voice channels.

| Command | Aliases | Description | Usage | User Perms | Bot Perms |
|---------|---------|-------------|-------|------------|-----------|
| `vcban` | `vb`, `vcblock2` | Ban a user from joining a specific voice channel | `<@user> [#channel] [reason]` | MoveMembers | ManageChannels |
| `vcunban` | `vcub`, `vcunblock2` | Unban a user from a voice channel | `<@user> [#channel]` | MoveMembers | ManageChannels |
| `vckick` | `vck`, `voicekick` | Kick a member from their voice channel | `<@user> [reason]` | MoveMembers | MoveMembers |
| `vcmute` | `vcm`, `voicemute` | Server mute a member in a voice channel | `<@user> [reason]` | MuteMembers | MuteMembers |
| `vcunmute` | `vcum`, `voiceunmute` | Remove server mute from a member | `<@user>` | MuteMembers | MuteMembers |
| `vcdeafen` | `vcd`, `vcdf` | Server deafen a member | `<@user> [reason]` | DeafenMembers | DeafenMembers |
| `vcundeafen` | `vcud`, `vcundf` | Remove server deafen from a member | `<@user>` | DeafenMembers | DeafenMembers |
| `vclock` | `vcl`, `lockvoice` | Lock a voice channel so no one new can join | `[#voicechannel]` | ManageChannels | ManageChannels |
| `vcunlock` | `vcul`, `unlockvoice` | Unlock a voice channel | `[#voicechannel]` | ManageChannels | ManageChannels |
| `vcrole` | `vcr`, `voicerole` | Assign a role when a user joins a VC | `<add\|remove\|config>` | ManageRoles | ManageRoles |

---

### Welcome

| Command | Aliases | Description | Usage | User Perms |
|---------|---------|-------------|-------|------------|
| `setwelcome` | `sw`, `welcomeset` | Set up welcome messages when members join | `<#channel> [message]` | ManageGuild |
| `welcomedisable` | `wd`, `welcomeoff` | Disable welcome messages for this server | — | ManageGuild |
| `welcometest` | `wt`, `testwelcome` | Send a test welcome message | — | ManageGuild |

**Welcome message variables:** `{user}`, `{tag}`, `{mention}`, `{server}`, `{count}`, `{membercount}`

**Welcome message is parsed by:** `functions/embedParser.js` which supports full embed configuration (color, title, description, footer, image, thumbnail, fields) stored in MongoDB.

---

## Database Schemas

All data is persisted in MongoDB using Mongoose. Below is every schema file and what it stores.

| Schema File | Collection | Purpose |
|-------------|------------|---------|
| `adminList.js` | `adminlists` | Bot admin user IDs |
| `afk.js` | `afks` | AFK statuses per user (userId, message, timestamp) |
| `aio.js` | `aios` | All-in-one module enable/disable per guild |
| `antibot.js` | `antibots` | Antibot settings per guild (enable, action, whitelist) |
| `antinuke.js` | `antinukes` | Anti-nuke config per guild (modules, limits, punishment, whitelist, admins) |
| `automod.js` | `automods` | Automod settings per guild (modules, thresholds, punishment, ignored channels) |
| `autoreact.js` | `autoreacts` | Auto-react triggers per guild (trigger → emoji mappings) |
| `autoresponder.js` | `autoresponders` | Auto-responder entries per guild (trigger → response) |
| `autorole.js` | `autoroles` | Autorole config per guild (humanRoles, botRoles, enabled) |
| `badges.js` | `badges` | User badges (userId → badge array) |
| `blacklist.js` | `blacklists` | Blacklisted users/guilds at bot level |
| `boostSchema.js` | `boostschemas` | Boost message config per guild (channel, message, enabled) |
| `customCmds.js` | `customcmds` | Custom commands per guild (name, response, enabled) |
| `customEmbed.js` | `customembeds` | Custom embed configurations per guild |
| `customSetup.js` | `customsetups` | Custom setup config per guild |
| `dating.js` | `datings` | Dating profiles per user (bio, age, gender, likes, dislikes) |
| `extraowner.js` | `extraowners` | Extra owner user IDs |
| `favorites.js` | `favorites` | Liked songs per user (array of track data) |
| `giveaway.js` | `giveaways` | Giveaway data (managed by discord-giveaways) |
| `greet.js` | `greets` | Welcome message config per guild (channel, message, enabled) |
| `guildLogs.js` | `guildlogs` | Audit log settings per guild (modlog channel) |
| `ignore.js` | `ignores` | Ignored channels per guild |
| `inviteRole.js` | `inviteroles` | Roles assigned based on invites per guild |
| `inviteTracker.js` | `invitetrackers` | Invite tracking data per guild/user |
| `jail.js` | `jails` | Jail system config and active jails per guild |
| `join2create.js` | `join2creates` | J2C system config per guild + owned channels per user |
| `joindm.js` | `joindms` | Join DM config per guild (message, enabled) |
| `kvStore.js` | `kvstores` | General key-value store for miscellaneous data |
| `lbBlacklist.js` | `lbblacklists` | Channels blacklisted from leaderboard tracking |
| `lbSettings.js` | `lbsettings` | Leaderboard enable/disable settings per guild |
| `leaveSchema.js` | `leaveschemas` | Leave message config per guild |
| `mainrole.js` | `mainroles` | Protected main roles per guild (anti-nuke) |
| `media.js` | `medias` | Saved media/attachment references |
| `messageRole.js` | `messageroles` | Roles given after N messages |
| `messageStats.js` | `messagestats` | Message count stats per user per guild |
| `modAction.js` | `modactions` | Moderation action log (case ID, type, user, reason, moderator) |
| `modWarn.js` | `modwarns` | Warning records per user per guild |
| `musicSource.js` | `musicsources` | Default music search engine per user |
| `noprefix.js` | `noprefixs` | No-prefix users (bot bypasses prefix requirement) |
| `playlistSchema.js` | `playlistschemas` | Playlist metadata (name, owner, privacy, shareCode, createdAt) |
| `playlists.js` | `playlists` | Playlist tracks (playlistId → array of track data) |
| `prefix.js` | `prefixes` | Custom prefix per guild |
| `premium.js` | `premiums` | Premium status per guild (plan, expiry) |
| `reactionRoles.js` | `reactionroles` | Reaction role mappings per guild (messageId, emoji, roleId) |
| `spotify.js` | `spotifies` | Linked Spotify data per user |
| `tickets.js` | `tickets` | Ticket system config per guild + active ticket data |
| `twoFourSeven.js` | `twofourdevens` | 24/7 mode status per guild |
| `userStats.js` | `userstats` | User listening statistics (songsPlayed, timeListened, history) |
| `vanityRoles.js` | `vanityroles` | Vanity role config per guild |
| `vcBans.js` | `vcbans` | VC ban records per guild (userId, channelId) |
| `vcrole.js` | `vcroles` | VC roles — roles given when user joins a VC |
| `voiceStats.js` | `voicestats` | Voice time stats per user per guild |
| `vouchers.js` | `vouchers` | Premium voucher codes |
| `welcomeSchema.js` | `welcomeschemas` | Welcome message config per guild |

---

## Events System

### Client Events (`events/client/`)

| Event File | Discord Event | Purpose |
|------------|---------------|---------|
| `channelCreate.js` | `channelCreate` | Anti-nuke channel creation monitoring |
| `channelDelete.js` | `channelDelete` | Anti-nuke channel deletion monitoring |
| `emojiDelete.js` | `emojiDelete` | Anti-nuke emoji deletion monitoring |
| `guildBanAdd.js` | `guildBanAdd` | Anti-nuke ban monitoring |
| `guildCreate.js` | `guildCreate` | Bot joins server — initialize DB, send webhook log |
| `guildDelete.js` | `guildDelete` | Bot leaves server — send webhook log |
| `guildMemberAdd.js` | `guildMemberAdd` | Welcome message, autorole, join DM, invite tracking |
| `guildMemberRemove.js` | `guildMemberRemove` | Leave message, invite tracking |
| `guildMemberUpdate.js` | `guildMemberUpdate` | Boost detection, vanity role check |
| `guildUpdate.js` | `guildUpdate` | Server update logging |
| `interactionCreate.js` | `interactionCreate` | Button interactions (j2cPanel, player, embed, tickets) |
| `inviteCreate.js` | `inviteCreate` | Invite tracking — cache new invites |
| `inviteDelete.js` | `inviteDelete` | Invite tracking — remove cached invite |
| `messageCreate.js` | `messageCreate` | Main message handler — prefix commands, AFK, autoresponder, stats |
| `messageDelete.js` | `messageDelete` | Snipe cache, AFK removal |
| `messageReactionAdd.js` | `messageReactionAdd` | Reaction roles add |
| `messageReactionRemove.js` | `messageReactionRemove` | Reaction roles remove |
| `messageUpdate.js` | `messageUpdate` | Auto-mod, message edit logging |
| `presenceUpdate.js` | `presenceUpdate` | Vanity roles check on status change |
| `roleCreate.js` | `roleCreate` | Anti-nuke role creation monitoring |
| `roleDelete.js` | `roleDelete` | Anti-nuke role deletion monitoring |
| `voiceStateUpdate.js` | `voiceStateUpdate` | J2C channel create/delete, VC stats, vcrole, vcban, 247 mode |
| `webhooksUpdate.js` | `webhooksUpdate` | Anti-nuke webhook monitoring |

### Custom Events (`events/custom/`)

| Event File | Purpose |
|------------|---------|
| `afk.js` | AFK mention detection and auto-reply |
| `blUser.js` | Blacklisted user check |
| `infoRequested.js` | Handle info requested event from cluster |
| `mention.js` | Bot mention handler — show prefix info |
| `messagecreate.js` | Auto-responder and auto-react processing |
| `playerButtonClick.js` | Music player button interactions |

### Lavalink Node Events (`events/node/`)

| Event File | Purpose |
|------------|---------|
| `close.js` | Node connection closed |
| `disconnect.js` | Node disconnected |
| `error.js` | Node error |
| `ready.js` | Node connected and ready |

### Player Events (`events/player/`)

| Event File | Purpose |
|------------|---------|
| `playerDestroy.js` | Player destroyed — cleanup |
| `playerEmpty.js` | Queue empty — handle autoplay or destroy |
| `playerEnd.js` | Song ended — advance queue |
| `playerError.js` | Playback error — log and skip |
| `playerException.js` | Lavalink exception — log |
| `playerStart.js` | Song started — send now-playing card, update stats |

---

## Utilities & Functions

### Core Functions (`functions/`)

| File | Purpose |
|------|---------|
| `handleReadyEvent.js` | Bot ready handler — loads 247 players, schedules LB updates |
| `load247players.js` | Restores 247-mode music players after restart |
| `autoplay.js` | Generates next autoplay track based on listening history |
| `backup.js` | Creates backup archive of bot data |
| `botProfile.js` | Manages bot's own profile (avatar, banner, bio) |
| `checkVote.js` | Verifies if a user has voted on top.gg |
| `embedParser.js` | Parses stored embed configs (welcome/leave messages) into Discord embeds |
| `getBotStats.js` | Gathers bot statistics (guilds, users, shards, memory) |
| `nodeHealthCheck.js` | Checks Lavalink node health and reconnects if needed |
| `playSharedPlaylist.js` | Loads and plays a shared playlist by share code |
| `processPlayerCommands.js` | Central handler for music command execution |
| `replyToClick.js` | Handles button click reply logic |
| `updateBotGuilds.js` | Updates guild count on top.gg |
| `updateEmbed.js` | Updates embed messages (now-playing, etc.) |

### Formatters (`functions/formatters/`)

| File | Purpose |
|------|---------|
| `formatTime.js` | Converts milliseconds to human-readable time (00:00 format) |
| `formatBytes.js` | Converts bytes to human-readable size (KB, MB, GB) |

### Generators (`functions/generators/`)

| File | Purpose |
|------|---------|
| `commandList.js` | Generates paginated command list for help command |
| `eqGraph.js` | Generates 5-band equalizer graph using Canvas |
| `ignore.js` | Generates ignore channel list display |
| `playerButtons.js` | Generates music player control buttons (play/pause, skip, etc.) |
| `playerCard.js` | Generates now-playing card with progress bar using Canvas |
| `progressbar.js` | Generates ASCII/visual progress bar |
| `radio.js` | Generates radio station selection UI |

### Message Create Middleware (`functions/msgCrt/`)

| File | Purpose |
|------|---------|
| `checkPerms.js` | Validates bot and user permissions before command run |
| `checkPremium.js` | Checks if server has active premium for premium commands |
| `checkVoice.js` | Validates voice channel requirements (inVC, sameVC) |
| `checkVote.js` | Validates top.gg vote status for vote-gated commands |
| `cooldown.js` | Enforces per-user cooldowns |
| `ignored.js` | Checks if channel is in the ignored channels list |

### Loaders (`functions/loaders/`)

| File | Purpose |
|------|---------|
| `commands.js` | Loads all command files from `commands/` into `client.commands` and `client.aliases` |
| `clientEvents.js` | Loads all event handlers from `events/client/` |
| `customEvents.js` | Loads custom event handlers from `events/custom/` |
| `nodeEvents.js` | Loads Lavalink node event handlers |
| `playerEvents.js` | Loads Kazagumo player event handlers |

### Reloaders (`functions/reloaders/`)

| File | Purpose |
|------|---------|
| `reloadCommands.js` | Hot-reload a command file without restarting |
| `reloadEvents.js` | Hot-reload an event handler |
| `reloadFunctions.js` | Hot-reload a function file |
| `reloadEmojis.js` | Reload the emoji set |

---

## Plugins

Plugins are core, pre-loaded modules attached to the client instance.

| Plugin File | Attachment | Purpose |
|-------------|------------|---------|
| `plugins/player.js` | `client.manager` | Sets up Kazagumo music manager with all Lavalink nodes, plugins (spotify, deezer, apple, filter), and event bindings |
| `plugins/button.js` | `client.button` | Handles all button interaction routing — dispatches to the correct handler based on button customId |
| `plugins/embed.js` | `client.embed` | Returns a pre-configured base embed builder with bot color |
| `plugins/logger.js` | `client.logger` | Structured console logger with color-coded output (log, warn, error, debug) |
| `plugins/antinuke.js` | — | Core anti-nuke tracking engine — maintains action counters, checks limits, applies punishments |

---

## Utils

| Util File | Purpose |
|-----------|---------|
| `utils/antiCrash.js` | Global uncaught exception and unhandled rejection handlers |
| `utils/codestats.js` | Counts lines of code across the project |
| `utils/emojiSafe.js` | Wraps emoji object to return empty string for missing emojis |
| `utils/j2cPanel.js` | Builds and sends the Join-to-Create control panel (v2 components) |
| `utils/lbDisplay.js` | Formats leaderboard data for display |
| `utils/lbScheduler.js` | Schedules daily/weekly leaderboard resets |
| `utils/modLogger.js` | Logs moderation actions to the mod-log channel and MongoDB |
| `utils/paginate.js` | Generic pagination utility — creates paginated messages with Previous/Next buttons |
| `utils/pfpFetcher.js` | Fetches random profile picture URLs from external APIs |
| `utils/ticketHandler.js` | Handles ticket lifecycle — create, claim, close, transcript, welcome message |
| `utils/userData.js` | Helper to get or create user data documents from MongoDB |

---

## Permission Flags Reference

### User Permission Flags Used

| Flag | Description |
|------|-------------|
| `Administrator` | Full admin access |
| `ManageGuild` | Manage server settings |
| `ManageMessages` | Delete and pin messages |
| `ManageChannels` | Create, edit, delete channels |
| `ManageRoles` | Create, edit, assign roles |
| `ManageNicknames` | Change member nicknames |
| `BanMembers` | Ban and unban members |
| `KickMembers` | Kick members |
| `ModerateMembers` | Timeout members |
| `MoveMembers` | Move members between VCs |
| `MuteMembers` | Server mute members |
| `DeafenMembers` | Server deafen members |
| `AddReactions` | Add reactions to messages |

### Bot Permission Flags Used

Same flags as above, plus:

| Flag | Description |
|------|-------------|
| `SendMessages` | Send messages in channels |
| `EmbedLinks` | Send embedded content |
| `AttachFiles` | Send file attachments |
| `ReadMessageHistory` | Read previous messages |
| `UseExternalEmojis` | Use emojis from other servers |
| `Connect` | Connect to voice channels |
| `Speak` | Speak in voice channels |
| `UseApplicationCommands` | Use slash commands |

---

## Quick Reference — Command Aliases

### Short Aliases Cheat Sheet

| Short | Command | Category |
|-------|---------|---------|
| `p` | play | Music |
| `s` | skip | Music |
| `q` | queue | Music |
| `l` | loop | Music |
| `v` | volume | Music |
| `np2` | nowplaying | Music |
| `pa` | pause | Music |
| `res` | resume | Music |
| `st` | stop | Music |
| `sh` | shuffle | Music |
| `dc` | leave | Music |
| `ly` | lyrics | Music |
| `h` | help | Information |
| `mc` | membercount | Information |
| `ms` | ping | Information |
| `b` | ban | Moderation |
| `k` | kick | Moderation |
| `w` | warn | Moderation |
| `mute` | timeout | Moderation |
| `unmute` | untimeout | Moderation |
| `sm` | slowmode | Moderation |
| `ml` | modlogs | Moderation |
| `sb` | softban | Moderation |
| `clear` | purge | Moderation |
| `an` | antinuke | Anti-Nuke |
| `wl` | whitelist | Anti-Nuke |
| `cfg` | config | Config |
| `pfx` | prefix | Config |
| `rr` | reactionrole | Reaction Roles |
| `tc` | ticket | Tickets |
| `bb` | bassboost | Filter |
| `eq` | equalizer | Filter |
| `fav` | like | Favorites |
| `ttt` | tictactoe | Games |
| `c4` | connect4 | Games |
| `gw` | gstart | Giveaway |
| `top` | leaderboard | Leaderboard |
| `av` | avatar | Utility |
| `ui` | userinfo | Utility |
| `si` | serverinfo | Utility |
| `vr` | vanityroles | Vanity Roles |
| `vcm` | vcmute | VC Mod |
| `sw` | setwelcome | Welcome |
| `ar` | autorole | Automations |

---

*This document covers all 200+ commands, all backend schemas, all events, all utilities, and all architectural components of the Mimi bot (v6.0.0).*
