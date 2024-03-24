const baseUrl = process.env.BASE_URL;

async function getUsers() {
    try {
        const response = await fetch(baseUrl + "api/users")
        const users = await response.json();
        return users;
    } catch (error) {
        console.error("Error fetching users: " + error);
    }
}

exports.getUsers = getUsers;