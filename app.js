const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketTeam.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectToResponseObject = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
    jerseyNumber: player.jersey_number,
    role: player.role,
  };
};

// API 1 List of all players in team

app.get("/players", async (request, response) => {
  const getPlayersQuery = `
        SELECT * FROM cricket_team;
    `;
  const playerDetailsArray = await db.all(getPlayersQuery);
  const convertedPlayersArray = playerDetailsArray.forEach(
    convertDBObjectToResponseObject(eachPlayerDetail)
  );
  response.send(convertedPlayersArray);
});

//API 2 Creates new Player in Team

app.post("/players", async (request, response) => {
  const playerDetails = request.body;
  const { playerName, jerseyNumber, role } = playerDetails;

  const addPlayerQuery = `
    INSERT INTO 
        cricket_team(player_name, jersey_number, role)
    VALUES
        (
            '${playerName}',
            '${jerseyNumber}',
            '${role}'
        );`;

  const dbResponse = await db.run(addPlayerQuery);
  const playerId = dbResponse.lastId;
  response.send("Player Added to Team");
});

//API 3 Returns a player based on player id

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getSinglePlayerQuery = `
        SELECT * FROM 
            cricket_team
        WHERE 
            player_id = ${playerId};`;

  const player = await db.get(getSinglePlayerQuery);
  const responseObj = convertDBObjectToResponseObject(player);
  response.send(responseObj);
});

//API 4 Updates details of player

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName, jerseyNumber, role } = playerDetails;

  const updateQuery = `
    UPDATE 
        cricket_team
    SET
        player_name = '${playerName}',
        jersey_number = '${jerseyNumber}',
        role = '${role}'
    WHERE 
        player_id = ${playerId};
    `;

  await db.run(updateQuery);
  response.send("Player Details Updated");
});

//API 5 Deletes a player from team

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const deleteQuery = `
    DELETE FROM cricket_team
    WHERE player_id = '${playerId}';
    `;
  await db.run(deleteQuery);
  response.send("Player Removed");
});

module.exports = app;
