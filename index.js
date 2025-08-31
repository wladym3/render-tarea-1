import express from "express";
import axios from "axios";
import querystring from "querystring";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = 3000;
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Telegram config
const TOKEN = "8285917666:AAF-GfXWk9IsiufFq9OkEE8mAmv2eb6PnPc";
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

// Spotify config
const SPOTIFY_CLIENT_ID = '0523aee1134c4e84981ffc9d228b394e';
const SPOTIFY_CLIENT_SECRET = '0761262b75214580a2a266a078a0e7af';
const SPOTIFY_REDIRECT_URI = 'https://render-tarea-1.onrender.com/callback';


const userTokens = {};

const messageTrackMap = {};

// Home
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Tarea 1 Wladimir Villalobos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f7f7f7; }
          .container { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px #ccc; max-width: 600px; margin: auto; text-align: center; }
          h1 { color: #2c3e50; margin-bottom: 30px; }
          img { max-width: 350px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="Logo.png" alt="Logo">
          <h1>Tarea 1 Wladimir Villalobos</h1>
        </div>
      </body>
    </html>
  `);
});
// Telegram webhook
app.post("/webhook", async (req, res) => {
  const update = req.body;
  console.log("📩 Update recibido:", JSON.stringify(update, null, 2));
  if (update.message) {
    const chatId = update.message.chat.id;
    const texto = update.message.text.trim();
    console.log(`👉 Mensaje de ${chatId}: ${texto}`);
    const tokenData = userTokens[chatId];
    const requireSpotify = async (fn) => {
      if (!tokenData) {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: "Please connect your Spotify account first! Use /install.",
        });
        return;
      }
      await fn();
    };

    if (texto === "/install") {

  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-library-modify user-library-read';
  const params = querystring.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: chatId
  });
  const installUrl = `https://accounts.spotify.com/authorize?${params}`;

  // /install
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: `Install Spotify here: ${installUrl}`,
  });
} else if (texto === "/help") {
      // /help
await axios.post(`${TELEGRAM_API}/sendMessage`, {
  chat_id: chatId,
  text: `Available commands:\n/install\n/current\n/play\n/pause\n/next\n/previous\n/search [query]\n/help`,
});
    } else if (texto === "/current") {
  await requireSpotify(async () => {
    try {
      const resp = await axios.get('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        validateStatus: () => true
      });
      console.log("Respuesta Spotify /current:", resp.status, resp.data);

      // /current
if (resp.status === 401) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Token expired or invalid. Please use /install again.",
  });
} else if (resp.status === 204) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No song is currently playing. Open Spotify and play a song.",
  });
} else if (resp.status === 200 && resp.data && resp.data.item) {
  const song = resp.data.item;
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: `🎵 Currently Playing:\nNow playing: ${song.name} by ${song.artists.map(a => a.name).join(", ")}`,
  });
} else if (resp.status === 404) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No active Spotify device found. Open Spotify on your phone or computer.",
  });
} else {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No song is currently playing.",
  });
}
    } catch (err) {
      console.error("Error en /current:", err.response?.data || err.message);
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Error getting current song.",
      });
    }
  });
}else if (texto === "/play") {
  await requireSpotify(async () => {
    try {
      const resp = await axios.put('https://api.spotify.com/v1/me/player/play', {}, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        validateStatus: () => true
      });


      // /play
if (resp.status === 200 || resp.status === 204) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Playback resumed.",
  });
} else if (resp.status === 403) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "The song is already playing.",
  });
} else if (resp.status === 404) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No active Spotify device found. Open Spotify on any device.",
  });
} else if (resp.status === 401) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Token expired or invalid. Please use /install again.",
  });
} else {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: `Unexpected error: ${resp.status}.`,
  });
}
    } catch (err) {
      console.error("Error in /play:", err.response?.data || err.message);
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Error resuming playback.",
      });
    }
  });
} else if (texto === "/pause") {
  await requireSpotify(async () => {
    try {
      const resp = await axios.put('https://api.spotify.com/v1/me/player/pause', {}, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        validateStatus: () => true 
      });

      // /pause
if (resp.status === 200 || resp.status === 204) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Playback paused.",
  });
} else if (resp.status === 403) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "The song is already paused.",
  });
} else if (resp.status === 404) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No active Spotify device found. Open Spotify on any device.",
  });
} else if (resp.status === 401) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Token expired or invalid. Please use /install again.",
  });
} else {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: `Unexpected error: ${resp.status}.`,
  });
}
    } catch (err) {
      console.error("Error in /pause:", err.response?.data || err.message);
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Error pausing playback.",
      });
    }
  });
} else if (texto === "/next") {
      await requireSpotify(async () => {
        try {
          await axios.post('https://api.spotify.com/v1/me/player/next', {}, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          // /next
await axios.post(`${TELEGRAM_API}/sendMessage`, {
  chat_id: chatId,
  text: "Skipped to next song!",
});
        } catch {
          await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: "Error skipping to next song.",
          });
        }
      });
    } else if (texto === "/previous") {
  await requireSpotify(async () => {
    try {
      const resp = await axios.post('https://api.spotify.com/v1/me/player/previous', {}, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        validateStatus: () => true
      });
      console.log("/PREVIOUS respuesta: ", resp.status, resp.data);

      // /previous
if (resp.status === 200 || resp.status === 204) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Went to previous song!",
  });
} else if (resp.status === 404) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "No active Spotify device found. Open Spotify on any device.",
  });
} else if (resp.status === 403) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "There is no previous song to play.",
  });
} else if (resp.status === 401) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Token expired or invalid. Please use /install again.",
  });
} else {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: `Unexpected error: ${resp.status}.`,
  });
}
    } catch (err) {
      console.error("Error in /previous:", err.response?.data || err.message);
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Error going to previous song.",
      });
    }
  });
} else if (texto === "/search" || (texto.startsWith("/search ") && texto.replace("/search ", "").trim() === "")) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: "Please provide a search term.",
  });
} else if (texto.startsWith("/search ")) {
  await requireSpotify(async () => {
    const query = texto.replace("/search ", "").trim();
    if (!query) {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Please provide a search term. Example: /search happy",
      });
      return;
    }
    try {
      const resp = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        params: { q: query, type: "track", limit: 5 }
      });
      const tracks = resp.data.tracks.items;
      if (tracks.length === 0) {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: `No songs found for '${query}'.`,
        });
      } else {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: chatId,
          text: `🎵 Found ${tracks.length} songs tagged with '${query}':\nReact with ❤️ to add to favorites!`,
        });
        if (!messageTrackMap[chatId]) messageTrackMap[chatId] = {};
        for (const [i, track] of tracks.entries()) {
          const sentMsg = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: `${i + 1}. ${track.name} - ${track.artists.map(a => a.name).join(", ")}`
          });
          const messageId = sentMsg.data.result.message_id;
          messageTrackMap[chatId][messageId] = { 
            id: track.id, 
            name: track.name, 
            artists: track.artists.map(a => a.name).join(", ") 
          };
        }
      }
    } catch {
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: "Error searching for songs.",
      });
    }
  });
} else {

await axios.post(`${TELEGRAM_API}/sendMessage`, {
  chat_id: chatId,
  text: "Unrecognized command. Use /help to see available commands.",
});
    }
  }
if (update.message_reaction) {
  const reaction = update.message_reaction;
  const chatId = reaction.chat.id;
  const messageId = reaction.message_id;
  const userId = reaction.user.id;
  const newReaction = reaction.new_reaction;


  if (newReaction.some(r => r.emoji === "❤" || r.emoji === "❤️")) {

    const trackId = messageTrackMap[chatId]?.[messageId];
    const tokenData = userTokens[chatId];
if (trackId && tokenData) {
  try {
    await axios.put(
      'https://api.spotify.com/v1/me/tracks',
      { ids: [trackId.id] },
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: `Added to favorites: ${trackId.artists} - ${trackId.name} `,
    });
  } catch {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: "Error adding song to favorites.",
    });
  }
}
  }
}

res.sendStatus(200);
});

// Spotify callback (OAuth)
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null; 
  if (!code || !state) return res.send('No code or state provided');
  try {
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token, refresh_token } = tokenResponse.data;
    userTokens[state] = { access_token, refresh_token };
    console.log("Guardando token para chatId:", state, access_token);

    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

await axios.post(`${TELEGRAM_API}/sendMessage`, {
  chat_id: state,
  text: `Spotify installation successful! Your user is: ${userResponse.data.display_name}`,
});

    res.json({
      access_token,
      refresh_token,
      user: userResponse.data
    });
  } catch (err) {
    res.status(500).send('Error authenticating with Spotify');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});