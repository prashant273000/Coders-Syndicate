//Tier Logic
const getTier = (level) => {
    if(level< 5) return "Bronze";
    if (level < 10) return "Silver";
    if(level < 20) return "Gold";
    return "Diamond";
};
module.exports = getTier;