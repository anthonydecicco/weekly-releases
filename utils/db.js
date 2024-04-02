const { MongoClient, ServerApiVersion } = require('mongodb');
const logger = require('./logger');
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

async function getUsers() {
    try {
        await client.connect();
        const cursor = collection.find();
        const users = await cursor.toArray();
        return users;
    } catch (error) {
        logger.error("Error fetching users: " + error);
    } finally {
        await client.close();
    }
}

async function addOrUpdateUserInfo(userInfo, requiresConfirmation) {
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

        if (result.matchedCount > 0 && result.modifiedCount > 0) {
            logger.info(`Document found using filter, ${result.modifiedCount} update(s) made.`);

            //if current user, no need to send confirmation email
            requiresConfirmation = false;

        } else if (result.matchedCount > 0 && result.modifiedCount === 0 || null) {
            logger.info("Document found using filter, no update made.");

            //if current user, no need to send confirmation email
            requiresConfirmation = false;

        } else {
            logger.info("No documents found using filter. Added user information and sending confirmation.")

            //if new user, confirmation email needed
            requiresConfirmation = true;
            
        }

    } catch (error) {
        logger.error("Error adding/updating user info" + error);
    }
    finally {
        await client.close();
    }
}

async function checkForRefreshToken(refreshTokenCookie) {
    if (refreshTokenCookie) {
        const filterRefreshToken = { "userRefreshToken": refreshTokenCookie }
    
        try {
            await client.connect();
            const result = await collection.findOne(filterRefreshToken);

            if (result) {
                const userRefreshToken = result.userRefreshToken;
                return userRefreshToken;
            } else {
                logger.info("No document found using the submitted refresh token.")
            }
        } catch (error) {
            logger.error("Error checking for refresh token:" + error)
        } finally {
            await client.close();
        }
    } else {
        logger.info("refreshTokenCookie = null");
    }
}

exports.client = client;
exports.collection = collection;
exports.addOrUpdateUserInfo = addOrUpdateUserInfo;
exports.getUsers = getUsers;
exports.checkForRefreshToken = checkForRefreshToken;

