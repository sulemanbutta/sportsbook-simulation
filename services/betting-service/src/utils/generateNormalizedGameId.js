function normalizeTeamName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')       // remove all whitespace
    .replace(/\./g, '')        // remove all periods
    .normalize('NFD')          
    .replace(/[\u0300-\u036f]/g, ''); // remove diacritics
}
  
  function getHourString(isoTime) {
    const date = new Date(isoTime);
    return date.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  }
  
  function generateNormalizedGameId(homeTeam, awayTeam, startTime) {
    const home = normalizeTeamName(homeTeam);
    const away = normalizeTeamName(awayTeam);
    const hour = getHourString(startTime);
    return `${away}_vs_${home}_${hour}`;
  }
  
  module.exports = { generateNormalizedGameId, normalizeTeamName };