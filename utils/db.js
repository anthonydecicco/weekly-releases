const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoDbString = process.env.DATABASE_URL;

const client = new MongoClient(mongoDbString, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}); 

const db = client.db("New-Music-Notifications");
const collection = db.collection("UserInfo");

async function addOrUpdateUserInfo(userInfo) {
    const filterUserInfo = { "userId": userInfo.userId };
    const updateUserInfo = {
        $set: {
            userEmail: userInfo.userEmail,
            userTempAccessToken: userInfo.userTempAccessToken,
            userRefreshToken: userInfo.userRefreshToken,
        }
    }
    const updateOptions = { upsert: true };

    try {
        await client.connect();

        const result = await collection.updateOne(filterUserInfo, updateUserInfo, updateOptions);
        // console.log(
        //     `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
        // );

    } catch (error) {
        console.log("error:" + error);
    }
    finally {
        await client.close();
    }
}

exports.client = client;
exports.collection = collection;
exports.addOrUpdateUserInfo = addOrUpdateUserInfo;
