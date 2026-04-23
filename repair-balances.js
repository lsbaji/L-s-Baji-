import admin from 'firebase-admin';

// Initialize with application default credentials, which the container provides
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = '106046112333';

async function repairBalances() {
    try {
        const usersRef = db.collection(`artifacts/${APP_ID}/users`);
        const snapshot = await usersRef.get();
        let fixedCount = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let needsUpdate = false;
            let newObj = {};
            
            // Check if balance is NaN or null and fix it
            if (data.balance === null || Number.isNaN(data.balance)) {
                newObj.balance = 500; // Give them 500 to compensate if it broke
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await doc.ref.update(newObj);
                console.log(`Repaired user ${doc.id}: balance was set to 500`);
                fixedCount++;
            }
        }
        console.log(`Finished. Repaired ${fixedCount} users.`);
    } catch(e) {
        console.log("Error:", e);
    }
}
repairBalances();
