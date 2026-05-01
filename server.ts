import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Web SDK initialization for backend
let db: any = null;
try {
  const configPath = path.join(__dirname, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, "utf-8");
    const firebaseConfig = JSON.parse(rawConfig);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found!");
  }
} catch (e) {
  console.error("Firebase Web SDK Init Error:", e);
}

const getFirestoreDb = () => db;

const appId = "1:547046490689:web:a3b5378ebf80f423c8fcc0";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV,
      firebase: !!admin.apps.length
    });
  });

  app.get("/api/test-casino", async (req, res) => {
    try {
      const response = await axios.get(`https://${CASINO_API_HOST}/getallproviders`, {
        headers: {
          "x-rapidapi-host": CASINO_API_HOST,
          "x-rapidapi-key": CASINO_API_KEY,
        },
        timeout: 5000
      });
      res.json({ 
        success: true, 
        type: typeof response.data, 
        isHtml: typeof response.data === 'string' && response.data.includes('<html'),
        preview: typeof response.data === 'string' ? response.data.substring(0, 100) : 'json'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // API Route for Sports Data using Gemini
  app.get("/api/sports", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Find current LIVE and UPCOMING sports matches for TODAY (${new Date().toDateString()}). 
      Provide matches for Cricket, Football, Tennis, and E-Sports.
      Return exactly 15 matches as a JSON array of objects.
      Schema:
      { "id": "unique_str", "sport": "Cricket/Football/Tennis/E-Sports", "league": "League Name", "homeTeam": "Team A", "awayTeam": "Team B", "status": "Live/Upcoming", "score": "Live Score/0-0", "time": "Match Time", "odds": {"home": 1.5, "draw": 3.0, "away": 2.5} }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text;
      
      try {
        const data = JSON.parse(text);
        res.json(Array.isArray(data) ? data.slice(0, 15) : data);
      } catch (parseError) {
        // Fallback to regex if JSON mode fails for some reason
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          res.json(data);
        } else {
          throw new Error("Invalid Gemini Response");
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("API key not valid")) {
        console.error("CRITICAL: GEMINI_API_KEY is invalid or not set in Settings > Secrets.");
      } else {
        console.error("Gemini API Error:", err);
      }
      // Fallback data if API fails
      const fallbackData = [
        { id: 'f1', sport: 'Football', league: 'UEFA Champions League', homeTeam: 'Real Madrid', awayTeam: 'Man City', status: 'Live', score: '2-1', time: '82:00', odds: { home: 1.25, draw: 5.50, away: 8.20 } },
        { id: 'c1', sport: 'Cricket', league: 'IPL 2024', homeTeam: 'CSK', awayTeam: 'MI', status: 'Upcoming', score: '0/0', time: '19:30', odds: { home: 1.85, draw: 15.0, away: 2.10 } },
        { id: 't1', sport: 'Tennis', league: 'ATP Miami', homeTeam: 'Carlos Alcaraz', awayTeam: 'Jannik Sinner', status: 'Live', score: '6-4, 3-2', time: 'Set 2', odds: { home: 1.45, draw: 0, away: 2.80 } },
        { id: 'e1', sport: 'E-Sports', league: 'DOTA 2 TI', homeTeam: 'Team Liquid', awayTeam: 'Gaimin Gladiators', status: 'Upcoming', score: '0-0', time: '22:00', odds: { home: 2.10, draw: 0, away: 1.65 } },
        { id: 'f2', sport: 'Football', league: 'Premier League', homeTeam: 'Arsenal', awayTeam: 'Liverpool', status: 'Upcoming', score: '0-0', time: '18:00', odds: { home: 2.40, draw: 3.40, away: 2.90 } },
        { id: 'c2', sport: 'Cricket', league: 'BBL', homeTeam: 'Perth Scorchers', awayTeam: 'Sydney Sixers', status: 'Live', score: '145/4 (16.2)', time: '1st Inn', odds: { home: 1.65, draw: 20.0, away: 2.45 } }
      ];
      res.json(fallbackData);
    }
  });

  // API Route for Chat using Gemini
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

      const ai = new GoogleGenAI({ apiKey });
      
      const formattedHistory = history.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const chatWithHistory = ai.chats.create({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction: "You are Ls Baji Live Chat Assistance, the official, professional, and empathetic support bot for the Ls Baji Elite premium casino and sports betting platform. Your capabilities include providing comprehensive guidance on all platform features such as: Deposit, Withdrawal, Betting Rules, Account Management, Bonuses, and Technical Issues. You are an expert at troubleshooting: guide users step-by-step through any issues they encounter, especially regarding deposit or withdrawal. Your tone is professional, encouraging, polite, slightly formal, and strictly helpful. You must strictly remind users to play responsibly when asked about betting. When addressing Deposit or Withdrawal issues, always ask for the required details (e.g., payment method, transaction ID) and provide actionable steps.",
        },
        history: formattedHistory
      });

      const response = await chatWithHistory.sendMessage({ message });
      res.json({ text: response.text });
    } catch (err) {
      if (err instanceof Error && err.message.includes("API key not valid")) {
        console.error("CRITICAL: GEMINI_API_KEY is invalid in Settings > Secrets.");
        res.status(401).json({ text: "I'm having trouble connecting to my AI brain. Please check the API key in settings." });
      } else {
        console.error("Chat API Error:", err);
        res.status(500).json({ error: "Failed to generate chat response" });
      }
    }
  });

  // API Route for Image Generation (Proxy/Mock since Gemini 1.5 doesn't generate images directly)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, size } = req.body;
      // Since Gemini 1.5 doesn't generate images, we'll use a high-quality placeholder for now
      // or if the user really wants AI images, we'd need a different API.
      // For this demo, we'll return a themed Picsum image based on the prompt keywords.
      const keywords = prompt.toLowerCase().split(' ').slice(0, 3).join(',');
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(keywords)}/1024/1024`;
      
      // We'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({ imageUrl });
    } catch (err) {
      console.error("Image Gen API Error:", err);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Telegram Notify API
  app.post('/api/notify-telegram', express.json(), async (req, res) => {
    const { message } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHA;
    if (!token || !chatId) return res.status(500).json({ error: 'Config missing' });
    
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      res.json({ status: 'ok' });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // API Route for Live Odds from RapidAPI
  app.get("/api/sports-odds", async (req, res) => {
    try {
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
      }

      const response = await fetch("https://betfair-sports-casino-live-tv-result-odds.p.rapidapi.com/odds", {
        method: "GET",
        headers: {
          "x-rapidapi-host": "betfair-sports-casino-live-tv-result-odds.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      });

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("RapidAPI Error:", err);
      res.status(500).json({ error: "Failed to fetch odds" });
    }
  });

  // API Route for Football Live Scores from API-Football
  app.get("/api/football-live", async (req, res) => {
    try {
      const apiKey = process.env.FOOTBALL_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "FOOTBALL_API_KEY not configured" });
      }

      const response = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": apiKey,
        },
      });

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("API-Football Error:", err);
      res.status(500).json({ error: "Failed to fetch football data" });
    }
  });

  // API Route for The Odds API
  app.get("/api/odds-v4", async (req, res) => {
    try {
      const apiKey = process.env.ODDS_API_KEY || "b17af5ea01b7980a5a486f6474ec1c27";
      // Fetch upcoming matches with h2h, spreads, and totals
      const response = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${apiKey}&regions=eu,uk,au&markets=h2h,spreads,totals&oddsFormat=decimal`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      
      // Transform data to match our app schema
      const transformedMatches = data.map((match: any) => {
        let homeOdds = 0, drawOdds = 0, awayOdds = 0;
        let spreadHome = null, spreadAway = null;
        let totalOver = null, totalUnder = null;
        
        if (match.bookmakers && match.bookmakers.length > 0) {
          // Take the first available bookmaker for odds
          const bm = match.bookmakers[0];
          
          const h2h = bm.markets.find((m: any) => m.key === 'h2h');
          if (h2h && h2h.outcomes) {
            const homeOutcome = h2h.outcomes.find((o: any) => o.name === match.home_team);
            const awayOutcome = h2h.outcomes.find((o: any) => o.name === match.away_team);
            const drawOutcome = h2h.outcomes.find((o: any) => o.name === 'Draw');
            
            if (homeOutcome) homeOdds = homeOutcome.price;
            if (awayOutcome) awayOdds = awayOutcome.price;
            if (drawOutcome) drawOdds = drawOutcome.price;
          }

          const spreads = bm.markets.find((m: any) => m.key === 'spreads');
          if (spreads && spreads.outcomes) {
            const homeOut = spreads.outcomes.find((o: any) => o.name === match.home_team);
            const awayOut = spreads.outcomes.find((o: any) => o.name === match.away_team);
            if (homeOut) spreadHome = { price: homeOut.price, point: homeOut.point };
            if (awayOut) spreadAway = { price: awayOut.price, point: awayOut.point };
          }

          const totals = bm.markets.find((m: any) => m.key === 'totals');
          if (totals && totals.outcomes) {
            const overOut = totals.outcomes.find((o: any) => o.name === 'Over');
            const underOut = totals.outcomes.find((o: any) => o.name === 'Under');
            if (overOut) totalOver = { price: overOut.price, point: overOut.point };
            if (underOut) totalUnder = { price: underOut.point, point: underOut.point };
          }
        }
        
        const isLive = new Date(match.commence_time).getTime() < Date.now();

        return {
          id: `odds_${match.id}`,
          sport: match.sport_title.includes('Football') || match.sport_title.includes('Soccer') ? 'Football' : 
                 match.sport_title.includes('Cricket') ? 'Cricket' : 
                 match.sport_title.includes('Tennis') ? 'Tennis' : match.sport_group,
          league: match.sport_title,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          status: isLive ? 'Live' : 'Upcoming',
          score: isLive ? '0-0' : 'VS',
          time: new Date(match.commence_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          odds: { 
            home: homeOdds, 
            draw: drawOdds, 
            away: awayOdds,
            spreads: { home: spreadHome, away: spreadAway },
            totals: { over: totalOver, under: totalUnder }
          }
        };
      });

      res.json(transformedMatches);
    } catch (err) {
      console.error("Odds API Error:", err);
      res.status(500).json({ error: "Failed to fetch from The Odds API" });
    }
  });

  // --- NEW: Casino RapidAPI Routes ---
  const CASINO_API_HOST = "live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com";
  const CASINO_API_KEY = process.env.CASINO_RAPIDAPI_KEY || "a88c23e188mshf2226e487989276p1b3fe1jsnd07a4537536b";

  app.get("/api/casino/providers", async (req, res) => {
    try {
      const response = await axios.get(`https://${CASINO_API_HOST}/getallproviders`, {
        headers: {
          "x-rapidapi-host": CASINO_API_HOST,
          "x-rapidapi-key": CASINO_API_KEY,
        },
      });

      if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
        return res.status(500).json({ 
          code: 1, 
          msg: "Provider error: API returned HTML. Check RapidAPI keys.",
          debug: response.data.substring(0, 100)
        });
      }

      res.json(response.data);
    } catch (err) {
      console.error("Casino Providers Error:", err);
      res.status(500).json({ error: "Failed to fetch casino providers" });
    }
  });

  // Repair
  app.get("/api/repair", async (req, res) => {
      try {
          const firestore = getFirestoreDb();
          if (!firestore) return res.send("No DB");
          const usersRef = firestore.collection(`artifacts/${appId}/users`);
          const snapshot = await usersRef.get();
          let fixed = 0;
          for (const doc of snapshot.docs) {
              const d = doc.data();
              if (d.balance === null || Number.isNaN(d.balance)) {
                  await doc.ref.update({ balance: 500 });
                  fixed++;
              }
          }
          res.send(`Repaired ${fixed} users.`);
      } catch (e) {
          res.send("Error " + e.message);
      }
  });

  // Repair
  app.get("/api/repair", async (req, res) => {
      try {
          const firestore = getFirestoreDb();
          if (!firestore) return res.send("No DB");
          const usersRef = collection(firestore, `artifacts/${appId}/users`);
          const snapshot = await getDocs(usersRef);
          let fixed = 0;
          for (const document of snapshot.docs) {
              const d = document.data();
              if (d.balance === null || Number.isNaN(d.balance) || d.balance === 0 || d.balance === 500) {
                  await updateDoc(document.ref, { balance: 5000 });
                  fixed++;
              }
          }
          res.send(`Repaired ${fixed} users.`);
      } catch (e: any) {
          res.send("Error " + e.message);
      }
  });

  // --- Casino Callback for Seamless Wallet ---
  app.post("/api/casino/callback", async (req, res) => {
    try {
      console.log("Casino Callback Received:", JSON.stringify(req.body));
      
      const { 
        member_account, 
        username: rawUsername,
        bet_amount = 0, 
        win_amount = 0,
        action,
        type
      } = req.body;

      const username = member_account || rawUsername; 

      if (!username) {
        return res.json({ success: false, msg: "Missing member account" });
      }

      const firestore = getFirestoreDb();
      if (!firestore) return res.json({ success: false, msg: "Database connection failed" });

      const userRef = doc(firestore, `artifacts/${appId}/users/${username}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error(`User ${username} not found for callback`);
        return res.json({ success: false, msg: "User account not found" });
      }

      const userData = userSnap.data() || {};
      const currentBalance = userData.balance || 0;

      const bet = parseFloat(bet_amount?.toString() || "0");
      const win = parseFloat(win_amount?.toString() || "0");
      
      let newBalance = currentBalance;
      
      // Only modify balance if actual bet/win values are provided and valid numbers
      if (!isNaN(bet) && !isNaN(win)) {
        newBalance = currentBalance - bet + win;
        
        // Prevent writing NaN to the database
        if (!isNaN(newBalance) && (bet > 0 || win > 0)) {
            await updateDoc(userRef, { 
               balance: newBalance,
               totalWagered: increment(bet),
               updatedAt: new Date().toISOString()
            });
            console.log(`Updated balance for ${username}: ${currentBalance} -> ${newBalance}`);
        }
      }

      return res.json({ 
        success: true, 
        msg: "Callback processed successfully", 
        handle: true, 
        money: parseFloat((isNaN(newBalance) ? currentBalance : newBalance).toFixed(2)) 
      });
      
    } catch (err) {
      console.error("Casino Callback Error:", err);
      res.json({ success: false, msg: "Internal server error" });
    }
  });

  app.get("/api/casino/games/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const response = await axios.get(`https://${CASINO_API_HOST}/getallgames?providerId=${providerId}`, {
        headers: {
          "x-rapidapi-host": CASINO_API_HOST,
          "x-rapidapi-key": CASINO_API_KEY,
        },
      });

      res.json(response.data);
    } catch (err) {
      console.error("Casino Games Error:", err);
      res.status(500).json({ error: "Failed to fetch games for provider" });
    }
  });

  app.post("/api/casino/game-url", async (req, res) => {
    try {
      const { username, gameId, currency, balance } = req.body;
      const origin = req.headers.origin || "https://lsbaji.com";
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const callbackUrl = `${protocol}://${host}/api/casino/callback`;
      
      const payload = {
        username: (username || "testuser" + Date.now().toString().slice(-6)).toLowerCase(),
        gameId: gameId, 
        lang: "en",
        money: balance || 0,
        home_url: origin,
        callback_url: callbackUrl, 
        platform: 1,
        currency: currency || "BDT"
      };

      console.log(`Launching game for ${payload.username} with balance ${payload.money}`);

      const response = await axios.post(`https://${CASINO_API_HOST}/getgameurl`, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": CASINO_API_HOST,
          "x-rapidapi-key": CASINO_API_KEY,
        }
      });

      if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
        console.error("RapidAPI returned HTML. Check API keys.");
        return res.status(500).json({ 
          code: 1, 
          msg: "Provider error: RapidAPI returned HTML. This usually means a key/subscription issue.",
          debug: response.data.substring(0, 100)
        });
      }

      // Hack to bypass X-Frame-Options for Casino providers that use a launcher page
      if (response.data && response.data.payload && response.data.payload.game_launch_url) {
        if (response.data.payload.game_launch_url.includes('/game?')) {
          response.data.payload.game_launch_url = response.data.payload.game_launch_url.replace('/game?', '/wrappedgame?');
        }
      }

      res.json(response.data);
    } catch (err: any) {
      console.error("Casino Game URL Error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to generate game launch URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
