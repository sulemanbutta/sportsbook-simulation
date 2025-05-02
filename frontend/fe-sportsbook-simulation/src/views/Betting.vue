<script setup>
import LiveGameCard from '@/components/LiveGameCard.vue'
import GameCard from '@/components/GameCard.vue'
import CompletedGameCard from '@/components/CompletedGameCard.vue'
import BetslipDrawer from '@/components/BetslipDrawer.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const firstLoad = ref(true)
const allGames = ref([])
//let livePollInterval = null
let fetchGamesInterval = null

function getLogoPath(teamName) {
  const removedAccentsName = teamName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filename = removedAccentsName.toLowerCase().replace(/\s+/g, '-') // "Detroit Pistons" → "detroit-pistons"
  return `/logos/${filename}.svg`
}

const countRefetch = ref(0)
const fetchGames = async () => {
  if (firstLoad.value) loading.value = true
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  countRefetch.value++
  console.log('pollingAllGames:', countRefetch.value, ' ', currentTime)

  try {
    const response = await axios.get('http://localhost:4001/betting/games')
    allGames.value = response.data
  } catch (error) {
    console.log('ERROR: ', error)
  } finally {
    loading.value = false
    firstLoad.value = false
  }
}
/*
const countLive = ref(0)
const pollLiveGames = async () => {
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  countLive.value++
  console.log('pollingLiveGames:', countLive.value, ' ', currentTime)

  try {
    const response = await axios.get('http://localhost:4001/betting/livegames')
    const updatedLiveGames = response.data
    console.log('updatedLiveGames')
    // Replace matching live games in allGames
    const liveIds = new Set(updatedLiveGames.map((g) => g.normalized_id))
    allGames.value = allGames.value.map((game) => {
      if (liveIds.has(game.normalized_id)) {
        const updated = updatedLiveGames.find((g) => g.normalized_id === game.normalized_id)
        if (updated) {
          const re = {
            ...game, // keep original game fields
            score: updated.score ?? game.score,
            odds: updated.odds ?? game.odds,
            isLive: updated.isLive ?? game.isLive,
            commence_time: updated.commence_time ?? game.commence_time,
            completed: updated.completed ?? game.completed,
          }
          console.log('re:', re)
          return re
        }
      }
      return game
    })
  } catch (error) {
    console.log('Live polling error:', error)
  }
}
*/
const liveGames = computed(() =>
  allGames.value
    .filter((game) => game.isLive && !game.completed)
    .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time)),
)
const upcomingGames = computed(() =>
  allGames.value
    .filter((game) => !game.isLive && !game.completed)
    .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time)),
)

const completedGames = computed(() => allGames.value.filter((game) => game.completed))

const selectedLeague = ref('ALL')

const filterByLeague = (games) => {
  if (selectedLeague.value === 'ALL') return games
  return games.filter((game) => game.league === selectedLeague.value)
}

const filteredLiveGames = computed(() => filterByLeague(liveGames.value))
const filteredUpcomingGames = computed(() => filterByLeague(upcomingGames.value))
const filteredCompletedGames = computed(() => filterByLeague(completedGames.value))

const handleVisibilityChange = () => {
  if (document.hidden) {
    //if (livePollInterval) clearInterval(livePollInterval)
    if (fetchGamesInterval) clearInterval(fetchGamesInterval)
    console.log('Tab hidden — polling paused.')
  } else {
    // Resume polling
    //pollLiveGames()
    fetchGames()
    //livePollInterval = setInterval(pollLiveGames, 30000)
    fetchGamesInterval = setInterval(fetchGames, 60000)
    console.log('Tab visible — polling resumed.')
  }
}

onMounted(() => {
  fetchGames()
  //livePollInterval = setInterval(pollLiveGames, 30000) // every 30s
  fetchGamesInterval = setInterval(fetchGames, 60000) // every 1 minutes
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  //if (livePollInterval) clearInterval(livePollInterval)
  if (fetchGamesInterval) clearInterval(fetchGamesInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div>
    <v-container>
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 80vh">
        <v-progress-circular indeterminate size="64" color="primary" />
      </div>

      <div v-else>
        <!-- League Toolbar -->
        <v-toolbar flat density="comfortable" class="mb-6">
          <v-toolbar-title class="text-subtitle-1">Filter by League</v-toolbar-title>
          <v-spacer />
          <v-btn-toggle v-model="selectedLeague" color="primary" mandatory rounded class="pa-1">
            <v-btn value="ALL">All</v-btn>
            <v-btn value="NBA">NBA</v-btn>
            <v-btn value="MLB">MLB</v-btn>
            <v-btn value="NHL">NHL</v-btn>
          </v-btn-toggle>
        </v-toolbar>

        <!-- Live Games -->
        <h2 class="mt-8">Live Games</h2>
        <v-divider class="mb-4" />
        <v-row dense>
          <v-col
            v-for="game in filteredLiveGames"
            :key="game.event_id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            border="lg"
          >
            <LiveGameCard
              :normalizedId="game.normalized_id"
              :eventId="game.event_id"
              :sport="game.sport"
              :homeName="game.home_team"
              :awayName="game.away_team"
              :homeMascot="game.home_team_mascot"
              :awayMascot="game.away_team_mascot"
              :homeLogo="getLogoPath(game.home_team)"
              :awayLogo="getLogoPath(game.away_team)"
              :homeScore="game.score?.home_team_score"
              :awayScore="game.score?.away_team_score"
              :homeOdds="game.odds?.home_team_odds"
              :awayOdds="game.odds?.away_team_odds"
              :gameStatus="game.score?.game_clock"
              :gameCommenceTime="game.commence_time"
            />
          </v-col>
        </v-row>
        <!-- Upcoming Games -->
        <h2 class="mt-8">Upcoming Games</h2>
        <v-divider class="mb-4" />
        <v-row dense>
          <v-col
            v-for="game in filteredUpcomingGames"
            :key="game.event_id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            border="lg"
          >
            <GameCard
              :eventId="game.event_id"
              :sport="game.sport"
              :homeName="game.home_team"
              :awayName="game.away_team"
              :homeMascot="game.home_team_mascot"
              :awayMascot="game.away_team_mascot"
              :homeRecord="'test'"
              :awayRecord="'test'"
              :homeLogo="getLogoPath(game.home_team)"
              :awayLogo="getLogoPath(game.away_team)"
              :homeOdds="game.odds?.home_team_odds"
              :awayOdds="game.odds?.away_team_odds"
              :gameCommenceTime="game.commence_time"
            />
          </v-col>
        </v-row>

        <!-- Completed Games -->
        <h2 class="mt-8">Completed Games</h2>
        <v-divider class="mb-4" />
        <v-row dense>
          <v-col
            v-for="game in filteredCompletedGames"
            :key="game.event_id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <CompletedGameCard
              :homeMascot="game.home_team_mascot"
              :awayMascot="game.away_team_mascot"
              :homeLogo="getLogoPath(game.home_team)"
              :awayLogo="getLogoPath(game.away_team)"
              :homeScore="Number(game.score.home_team_score)"
              :awayScore="Number(game.score.away_team_score)"
            />
          </v-col>
        </v-row>
      </div>
    </v-container>
    <BetslipDrawer />
  </div>
</template>
