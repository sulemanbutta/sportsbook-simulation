require("dotenv").config();
const axios = require("axios");

const fetchEventResults = async () => {
    try {
		
        const response = await axios.get(process.env.ODDS_API_SCORES_URL);
        const results = response.data;
        const eventResults = new Map();
        results.forEach((event) => {
          if (event.completed) {
            eventResults.set(event.id, event)
          }
        });
        //console.log("results:", results)
        console.log("eventResults:", eventResults)
        return eventResults;
		/*
        const mockResults = 
        [
            {
                "id": "o8w6lhd9r6izrxrbqw5kkhe74oxp7a16",
                "sport_key": "basketball_nba",
                "sport_title": "NBA",
                "commence_time": "2025-02-22T00:10:00Z",
                "completed": true,
                "home_team": "Washington Wizards",
                "away_team": "Milwaukee Bucks",
                "scores": [
                    {
                        "name": "Washington Wizards",
                        "score": "101"
                    },
                    {
                        "name": "Milwaukee Bucks",
                        "score": "104"
                    }
                ],
                "last_update": "2025-02-22T10:43:05Z"
            },
            {
                "id": "mpc30p02be3dv1m2m83syfix8h5koi79",
                "sport_key": "basketball_nba",
                "sport_title": "NBA",
                "commence_time": "2025-02-22T00:11:00Z",
                "completed": true,
                "home_team": "Orlando Magic",
                "away_team": "Memphis Grizzlies",
                "scores": [
                    {
                        "name": "Orlando Magic",
                        "score": "104"
                    },
                    {
                        "name": "Memphis Grizzlies",
                        "score": "105"
                    }
                ],
                "last_update": "2025-02-22T10:43:05Z"
            },
            {
                "id": "9a5cee259a4c70367132f4fb6f90be03",
                "sport_key": "basketball_nba",
                "sport_title": "NBA",
                "commence_time": "2025-02-22T00:13:58Z",
                "completed": true,
                "home_team": "Cleveland Cavaliers",
                "away_team": "New York Knicks",
                "scores": [
                    {
                        "name": "Cleveland Cavaliers",
                        "score": "142"
                    },
                    {
                        "name": "New York Knicks",
                        "score": "105"
                    }
                ],
                "last_update": "2025-02-22T10:43:05Z"
            },
            {
                "id": "fbfec0530e2ee30e2129c0cf827d2879",
                "sport_key": "basketball_nba",
                "sport_title": "NBA",
                "commence_time": "2025-02-22T00:44:00Z",
                "completed": true,
                "home_team": "Toronto Raptors",
                "away_team": "Miami Heat",
                "scores": [
                    {
                        "name": "Toronto Raptors",
                        "score": "111"
                    },
                    {
                        "name": "Miami Heat",
                        "score": "120"
                    }
                ],
                "last_update": "2025-02-22T10:43:05Z"
            }
        ]
        //const mockEventResults = new Map(mockResults.map((event) => [event.id, event]));
        const mockEventResults = new Map();
        mockResults.forEach((event) => {
          if (event.completed) {
            mockEventResults.set(event.id, event)
          }
        });
        console.log("mockEventResults:", mockEventResults)
        return mockEventResults;*/
    } catch (error) {
        console.error("Error fetching event results:", error);
        return null;
    }
};

module.exports = { fetchEventResults };