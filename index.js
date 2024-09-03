const {
    loadJSON,
    initializeGroupResults,
    simulateGroupStage,
    rankTeams,
    simulateKnockoutMatches,
    drawQuarterFinals,
    calculateInitialForm
} = require('./utils');

const groups = loadJSON('groups.json');
const exhibitions = loadJSON('exhibitions.json');

const groupResults = initializeGroupResults(groups);

const teamForm = calculateInitialForm(exhibitions, [].concat(...Object.values(groups)));

simulateGroupStage(groups, groupResults, teamForm);

console.log('Grupna faza rezultati:');
for (const group in groupResults) {
    console.log(`Grupa ${group}:`);
    groupResults[group].forEach(Team => {
        console.log(`Tim: ${Team.Team}, Poeni: ${Team.points}, Postignuti: ${Team.scored}, Primljeni: ${Team.conceded}`);
        Team.matches.forEach(match => console.log(`     ${match}`));
        console.log("\n");
    });
}

let allTeams = [];
for (const group in groupResults) {
    groupResults[group] = rankTeams(groupResults[group]);
    allTeams = allTeams.concat(groupResults[group]);
}

allTeams = rankTeams(allTeams);

allTeams.forEach((Team, index) => {
    Team.overallRank = index + 1;
});

const eliminationTeams = allTeams.slice(0, 8);

console.log('\nTimovi koji prolaze u eliminacionu fazu:');
eliminationTeams.forEach((Team, index) => {
    console.log(`${index + 1}. ${Team.Team}`);
});

const quarterFinals = drawQuarterFinals(eliminationTeams);

console.log('\nČetvrtfinale:');
const quarterFinalResults = simulateKnockoutMatches(quarterFinals, teamForm);
quarterFinalResults.forEach(result => {
    console.log(result.match);
});

const semiFinals = [
    { team1: quarterFinalResults[0].winner, team2: quarterFinalResults[1].winner },
    { team1: quarterFinalResults[2].winner, team2: quarterFinalResults[3].winner }
];

console.log('\nPolufinale:');
const semiFinalResults = simulateKnockoutMatches(semiFinals, teamForm);
semiFinalResults.forEach(result => {
    console.log(result.match);
});

const finalMatch = { team1: semiFinalResults[0].winner, team2: semiFinalResults[1].winner };
const thirdPlaceMatch = { team1: semiFinalResults[0].loser, team2: semiFinalResults[1].loser };

console.log('\nUtakmica za treće mesto:');
const thirdPlaceResult = simulateKnockoutMatches([thirdPlaceMatch], teamForm);
thirdPlaceResult.forEach(result => {
    console.log(result.match);
});

console.log('\nFinale:');
const finalResult = simulateKnockoutMatches([finalMatch], teamForm);
finalResult.forEach(result => {
    console.log(result.match);
});

console.log('\nMedalje:');
console.log(`1. ${finalResult[0].winner.Team}`);
console.log(`2. ${finalMatch.team1.Team === finalResult[0].winner.Team ? finalMatch.team2.Team : finalMatch.team1.Team}`);
console.log(`3. ${thirdPlaceResult[0].winner.Team}`);
