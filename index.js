const login = require("fca-unofficial");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

// Login usando variáveis do Railway
login({email: process.env.FB_EMAIL, password: process.env.FB_PASS}, (err, api) => {
  if(err) return console.error("❌ Erro ao logar:", err);

  console.log("🤖 Bot online no Facebook!");

  api.listenMqtt(async (err, message) => {
    if(err) return console.error(err);

    if(message.body && message.body.startsWith(".sing")) {
      const query = message.body.replace(".sing", "").trim();
      if(!query) return api.sendMessage("Digite o nome da música depois de .sing", message.threadID);

      api.sendMessage("🔎 Procurando música: " + query, message.threadID);

      try {
        // Busca info do YouTube
        const search = await ytdl.getInfo(`ytsearch:${query}`);
        const videoUrl = search.videoDetails.video_url;

        // Salva áudio em arquivo temporário
        const output = `song_${Date.now()}.mp3`;
        const stream = ytdl(videoUrl, { quality: "highestaudio" });

        ffmpeg(stream)
          .audioBitrate(128)
          .save(output)
          .on("end", () => {
            api.sendMessage(
              { body: "🎶 Toma aí tua música:", attachment: fs.createReadStream(output) },
              message.threadID,
              () => fs.unlinkSync(output) // apaga depois
            );
          });

      } catch (e) {
        console.error(e);
        api.sendMessage("❌ Não consegui achar essa música.", message.threadID);
      }
    }
  });
});