const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running successfully");
    });
  } catch (e) {
    console.log(`Db error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerTableAsObject = function (dbObject) {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchTableAsObject = function (dbObject) {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertMatchPlayerTableAsObject = function (dbObject) {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.playerId,
    matchId: dbObject.matchId,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API -1
app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT player_id AS playerId,player_name AS playerName
   FROM player_details ORDER BY player_id;`;
  const dbResponse = await db.all(playersQuery);
  const playersArray = dbResponse;
  response.send(playersArray);
});

//API -2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params,
    playerDetailsQuery = `SELECT player_id AS playerId,player_name AS playerName
     FROM player_details WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(playerDetailsQuery);
  response.send(dbResponse);
});

//API -3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerQuery = `UPDATE player_details SET 
        player_name = '${playerName}' 
    WHERE player_id = ${playerId};`;
  const dbResponse = await db.run(playerQuery);
  console.log(playerQuery);
  response.send("Player Details Updated");
});

//API -4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT match_id AS matchId,match,year
   FROM match_details WHERE match_id = ${matchId};`;
  const dbResponse = await db.get(matchQuery);
  response.send(dbResponse);
});

//ApI -5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `SELECT match_id AS matchId,match,year
   FROM player_details NATURAL JOIN match_details
    WHERE player_details.player_id = ${playerId};`;
  const dbResponse = await db.all(playerMatchesQuery);
  response.send(dbResponse);
});

//API - 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchPlayerQuery = `SELECT player_id AS playerId,player_name AS playerName
    FROM player_details NATURAL JOIN match_details
    WHERE match_id = ${matchId};`;
  const dbResponse = await db.all(matchPlayerQuery);
  response.send(dbResponse);
});

//API-7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoresQuery = `SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.player_id = ${playerId}
    GROUP BY player_details.player_id;`;
  const dbResponse = await db.all(playerScoresQuery);
  response.send(dbResponse);
});

module.exports = app;
