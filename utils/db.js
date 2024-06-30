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

const db = client.db(process.env.DATABASE_NAME);
const collection = db.collection(process.env.DATABASE_COLLECTION_USERS);

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

async function getUserInfo(userId) {
    try {
        await client.connect();
        const filterUserInfo = { "userId": userId };
        const result = await collection.findOne(filterUserInfo);
        return result;
    } catch (error) {
        logger.error("Error finding user: " + userId);
    } finally {
        await client.close();
    }
}

async function addOrUpdateUserInfo(userInfo) {
    const filterUserInfo = { "userId": userInfo.userId };
    const updateUserInfo = {
        $set: {
            userImage: userInfo.userImage,
            userDisplayName: userInfo.userDisplayName,
            userEmail: userInfo.userEmail,
            userTempAccessToken: userInfo.userTempAccessToken,
            userRefreshToken: userInfo.userRefreshToken,
        }
    }
    const updateOptions = { upsert: true };
    
    let requiresConfirmation = null;
    let redirectCheck = null;

    try {
        await client.connect();

        const result = await collection.updateOne(filterUserInfo, updateUserInfo, updateOptions);

        if (result.matchedCount > 0 && result.modifiedCount > 0) {
            logger.info(`Document found using filter, ${result.modifiedCount} update(s) made.`);

            //if current user, no need to send confirmation email
            requiresConfirmation = false;

        } else if (result.matchedCount > 0 && (result.modifiedCount === 0 || null)) {
            logger.info("Document found using filter, no update made.");

            //if current user, no need to send confirmation email
            requiresConfirmation = false;

        } else {
            logger.info("No documents found using filter. Added user information and sending confirmation.")

            //if new user, confirmation email needed
            requiresConfirmation = true;
            
        }

        redirectCheck = false;

    } catch (error) {
        logger.error("Error adding/updating user info " + error);
        
        //if this process fails, redirect user to error page
        redirectCheck = true;

    }
    finally {
        await client.close();
        return { requiresConfirmation, redirectCheck };
    }
}

async function addOrUpdatePreferredEmail(userId, userPreferredEmail) {
    const filterUserInfo = { "userId": userId };
    const updateUserInfo = {
        $set: {
            userPreferredEmail: userPreferredEmail,
        }
    }
    const updateOptions = { upsert: true };

    try {
        await client.connect();
        const result = await collection.updateOne(filterUserInfo, updateUserInfo, updateOptions);
    } catch (error) {
        logger.error("Error adding/updating user's preferred email " + error);
    } finally {
        await client.close();
        return;
    }
}

async function deleteUser(userId) {
    if (userId) {
        const filterUser = { "userId": userId }
        
        try {
            await client.connect();
            const result = await collection.deleteOne(filterUser);

            if (result) {
                const deletedCount = result.deletedCount;
                return deletedCount;
            } else {
                logger.info("No user found using that id, no data deleted.")
            } 
        } catch (error) {
            logger.error(`Error deleting user, userId submitted: ${userId}`);
        } finally {
            await client.close();
        }
    } else {
        logger.info(`No user deleted. userId =  ${userId}`);
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

module.exports = {
    client,
    db,
    collection,
    addOrUpdateUserInfo,
    addOrUpdatePreferredEmail,
    getUsers,
    getUserInfo,
    deleteUser,
    checkForRefreshToken,
}