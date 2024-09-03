// index.js

const {
    loadJSON,
    initializeGroupResults,
    simulateGroupStage,
    rankTeams,
    simulateKnockoutMatches,
    drawQuarterFinals,
    calculateInitialForm
} = require('./utils');

// Load group and exhibition data
const groups = loadJSON('groups.json');
const exhibitions = loadJSON('exhibitions.json');

// Initialize group results
const groupResults = initializeGroupResults(groups);

// Calculate initial form based on exhibition matches
const teamForm = calculateInitialForm(exhibitions, [].concat(...Object.values(groups)));

// Simulate the group stage with form taken into account
simulateGroupStage(groups, groupResults, teamForm);

// Display group results
console.log('Grupna faza rezultati:');
for (const group in groupResults) {
    console.log(`Grupa ${group}:`);
    groupResults[group].forEach(Team => {
        console.log(`Tim: ${Team.Team}, Poeni: ${Team.points}, Postignuti: ${Team.scored}, Primljeni: ${Team.conceded}`);
        Team.matches.forEach(match => console.log(`     ${match}`));
        console.log("\n");
    });
}

// Rank teams within groups and combine all teams for overall ranking
let allTeams = [];
for (const group in groupResults) {
    groupResults[group] = rankTeams(groupResults[group]);
    allTeams = allTeams.concat(groupResults[group]);
}

// Rank all teams across all groups
allTeams = rankTeams(allTeams);

// Assign overall rankings
allTeams.forEach((Team, index) => {
    Team.overallRank = index + 1;
});

// Select top 8 teams for the knockout phase
const eliminationTeams = allTeams.slice(0, 8);

// Display teams proceeding to the elimination round
console.log('\nTimovi koji prolaze u eliminacionu fazu:');
eliminationTeams.forEach((Team, index) => {
    console.log(`${index + 1}. ${Team.Team}`);
});

// Draw for quarterfinals
const quarterFinals = drawQuarterFinals(eliminationTeams);

// Simulate quarterfinal matches with form taken into account
console.log('\nČetvrtfinale:');
const quarterFinalResults = simulateKnockoutMatches(quarterFinals, teamForm);
quarterFinalResults.forEach(result => {
    console.log(result.match);
});

// Prepare for semifinals
const semiFinals = [
    { team1: quarterFinalResults[0].winner, team2: quarterFinalResults[1].winner },
    { team1: quarterFinalResults[2].winner, team2: quarterFinalResults[3].winner }
];

// Simulate semifinal matches with form taken into account
console.log('\nPolufinale:');
const semiFinalResults = simulateKnockoutMatches(semiFinals, teamForm);
semiFinalResults.forEach(result => {
    console.log(result.match);
});

// Determine final and third-place matches
const finalMatch = { team1: semiFinalResults[0].winner, team2: semiFinalResults[1].winner };
const thirdPlaceMatch = { team1: semiFinalResults[0].loser, team2: semiFinalResults[1].loser };

// Simulate third-place match with form taken into account
console.log('\nUtakmica za treće mesto:');
const thirdPlaceResult = simulateKnockoutMatches([thirdPlaceMatch], teamForm);
thirdPlaceResult.forEach(result => {
    console.log(result.match);
});

// Simulate final match with form taken into account
console.log('\nFinale:');
const finalResult = simulateKnockoutMatches([finalMatch], teamForm);
finalResult.forEach(result => {
    console.log(result.match);
});

// Display medal winners
console.log('\nMedalje:');
console.log(`1. ${finalResult[0].winner.Team}`);
console.log(`2. ${finalMatch.team1.Team === finalResult[0].winner.Team ? finalMatch.team2.Team : finalMatch.team1.Team}`);
console.log(`3. ${thirdPlaceResult[0].winner.Team}`);
