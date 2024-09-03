
const fs = require('fs');

const loadJSON = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const normalizeTeamName = (name) => name.trim().toLowerCase();

const calculateInitialForm = (exhibitions, teams) => {
    const teamForm = {};

    for (const teamCode in exhibitions) {
        const matches = exhibitions[teamCode];
        let form = 0;

        matches.forEach(match => {
            const [teamScore, opponentScore] = match.Result.split('-').map(Number);
            const scoreDifference = teamScore - opponentScore;
            const isWin = scoreDifference > 0;

            form += scoreDifference + (isWin ? 10 : -10);
        });

        const team = teams.find(t => t.ISOCode === teamCode);
        if (team) {
            teamForm[team.Team] = form;
        }
    }

    return teamForm;
};

const simulateMatch = (team1, team2, teamForm) => {
    const team1Form = teamForm[team1.Team];
    const team2Form = teamForm[team2.Team];

    if (team1Form === undefined || team2Form === undefined) {
        console.error(`Form not found for teams: ${team1.Team}, ${team2.Team}`);
    }

    const rankingDifference = team1.FIBARanking - team2.FIBARanking;
    const formDifference = (team1Form || 0) - (team2Form || 0);

    const adjustment = Math.max(-20, Math.min(20, Math.floor((rankingDifference + formDifference) / 2)));

    const baseScore1 = 80 + Math.floor(Math.random() * 21);
    const baseScore2 = 80 + Math.floor(Math.random() * 21);

    const score1 = Math.max(0, baseScore1 + adjustment);
    const score2 = Math.max(0, baseScore2 - adjustment);

    const result = {
        [team1.Team]: score1,
        [team2.Team]: score2
    };

    const scoreDifference = score1 - score2;
    if (scoreDifference > 0) {
        teamForm[team1.Team] = (teamForm[team1.Team] || 0) + scoreDifference + 10;
        teamForm[team2.Team] = (teamForm[team2.Team] || 0) - scoreDifference - 10;
    } else {
        teamForm[team1.Team] = (teamForm[team1.Team] || 0) + scoreDifference - 10;
        teamForm[team2.Team] = (teamForm[team2.Team] || 0) - scoreDifference + 10;
    }

    return result;
};

const rankTeams = (teams) => {
    return teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const pointDifferenceA = a.scored - a.conceded;
        const pointDifferenceB = b.scored - b.conceded;
        if (pointDifferenceB !== pointDifferenceA) return pointDifferenceB - pointDifferenceA;
        return b.scored - a.scored;
    });
};

const initializeGroupResults = (groups) => {
    const groupResults = {};
    for (const group in groups) {
        groupResults[group] = groups[group].map(team => ({
            Team: team.Team,
            ISOCode: team.ISOCode,
            FIBARanking: team.FIBARanking,
            points: 0,
            scored: 0,
            conceded: 0,
            matches: []
        }));
    }
    return groupResults;
};

const simulateGroupStage = (groups, groupResults, teamForm) => {
    for (const group in groups) {
        const teams = groups[group];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const team1 = teams[i];
                const team2 = teams[j];
                const result = simulateMatch(team1, team2, teamForm);
                const team1Result = groupResults[group].find(t => t.Team === team1.Team);
                const team2Result = groupResults[group].find(t => t.Team === team2.Team);

                team1Result.scored += result[team1.Team];
                team1Result.conceded += result[team2.Team];
                team2Result.scored += result[team2.Team];
                team2Result.conceded += result[team1.Team];

                if (result[team1.Team] > result[team2.Team]) {
                    team1Result.points += 2;
                    team2Result.points += 1;
                } else {
                    team1Result.points += 1;
                    team2Result.points += 2;
                }

                team1Result.matches.push(`${team1.Team} ${result[team1.Team]} - ${team2.Team} ${result[team2.Team]}`);
                team2Result.matches.push(`${team1.Team} ${result[team1.Team]} - ${team2.Team} ${result[team2.Team]}`);
            }
        }
    }
};

const simulateKnockoutMatches = (matches, teamForm) => {
    return matches.map(match => {
        const result = simulateMatch(match.team1, match.team2, teamForm);
        const winner = result[match.team1.Team] > result[match.team2.Team] ? match.team1 : match.team2;
        const loser = result[match.team1.Team] < result[match.team2.Team] ? match.team1 : match.team2;
        return {
            match: `${match.team1.Team} ${result[match.team1.Team]} - ${match.team2.Team} ${result[match.team2.Team]}`,
            winner,
            loser
        };
    });
};

const drawQuarterFinals = (teams) => {
    const pots = [[], [], [], []]; // D, E, F, G

    teams.forEach(Team => {
        if (Team.overallRank === 1 || Team.overallRank === 2) pots[0].push(Team);
        if (Team.overallRank === 3 || Team.overallRank === 4) pots[1].push(Team);
        if (Team.overallRank === 5 || Team.overallRank === 6) pots[2].push(Team);
        if (Team.overallRank === 7 || Team.overallRank === 8) pots[3].push(Team);
    });

    const quarterFinals = [];

    quarterFinals.push({ team1: pots[0][0], team2: pots[3][0] });
    quarterFinals.push({ team1: pots[1][0], team2: pots[2][0] });
    quarterFinals.push({ team1: pots[0][1], team2: pots[3][1] });
    quarterFinals.push({ team1: pots[1][1], team2: pots[2][1] });

    return quarterFinals;
};

module.exports = {
    loadJSON,
    simulateMatch,
    rankTeams,
    initializeGroupResults,
    simulateGroupStage,
    simulateKnockoutMatches,
    drawQuarterFinals,
    calculateInitialForm
};
