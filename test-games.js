import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/casino/providers');
    console.log("Providers:", res.data);
  } catch (e) {
    console.error("Error:", e.response?.data || e.message);
  }
}
test();
