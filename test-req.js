import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/casino/game-url', {
      username: 'testguy',
      gameId: '874c49d5d915de9b82f66088f9794789',
      balance: 1000
    });
    
    if (res.data?.payload?.game_launch_url) {
       const url = res.data.payload.game_launch_url;
       const wrappedUrl = url.replace('/game', '/wrappedgame');
       console.log("Wrapped URL:", wrappedUrl);
       const headRes = await axios.get(wrappedUrl, { validateStatus: () => true });
       console.log("Wrapped Headers:", headRes.headers);
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
