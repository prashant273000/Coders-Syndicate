//XP Logic

const getLevelFormXP = (xp) => {
    return Math.floor(xp / 100) + 1;
};

module.exports = getLevelFormXP;