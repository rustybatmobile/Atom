const config = require("../../config");
const axios = require("axios");

const addMemberToDB = async (payload) => {

    const apiUrl = `${config.apiBaseUrl}${config.memberEndpoint}`;

    axios.post(apiUrl, payload).then(response => {
        console.log('Response:', response.data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

module.exports = {
    addMemberToDB
}