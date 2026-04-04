let queue = [];

//Waiting logic
const addToQueue = (userId) => {
    if (!queue.includes(userId)){
        queue.push(userId);
    }
};

//MatchMaking
const getMatch = () => {
    if (queue.length >= 2) {
        return [queue.shift(), queue.shift()];
    }
    return null;
};

module.exports ={ addToQueue, getMatch };