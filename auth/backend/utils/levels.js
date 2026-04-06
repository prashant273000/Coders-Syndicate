//XP Logic

const getLevelFromXP = (xp) => {
    return Math.floor(xp / 100) + 1;
};

module.exports = getLevelFromXP;