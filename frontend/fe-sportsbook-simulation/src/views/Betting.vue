<script setup>
import LiveGameCard from '@/components/LiveGameCard.vue'
import GameCard from '@/components/GameCard.vue'
import CompletedGameCard from '@/components/CompletedGameCard.vue'
import BetslipDrawer from '@/components/BetslipDrawer.vue'
import ServiceStartup from '@/components/ServiceStartup.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import apiClient from '@/utils/api.js'

const loading = ref(true)
const firstLoad = ref(true)
const allGames = ref([])
let fetchGamesInterval = null

// Service startup state
const isServiceStarting = ref(false)
const startupMessage = ref('')
const retryAttempt = ref(0)

function getLogoPath(teamName) {
  const removedAccentsName = teamName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filename = removedAccentsName.toLowerCase().replace(/\s+/g, '-') // "Detroit Pistons" → "detroit-pistons"
  return `/logos/${filename}.svg`
}

const countRefetch = ref(0)
const fetchGamesInitial = async () => {
  if (firstLoad.value) loading.value = true

  console.log('🔍 Starting fetchGamesInitial');
  console.log('🔍 isServiceStarting before:', isServiceStarting.value);

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
    const BETTING_API = import.meta.env.VITE_BETTING_API_URL;
    console.log('🔍 BETTING_API:', BETTING_API);

    const response = await apiClient.makeRequest(
      () => {
        console.log('🔍 Making axios request...');
        return axios.get(`${BETTING_API}/betting/games`);
      },
      {
        onServiceStarting: (attempt, maxAttempts) => {
          console.log('🚀 onServiceStarting callback triggered!', { attempt, maxAttempts });
          console.log('🔍 Setting isServiceStarting to true');
          isServiceStarting.value = true
          retryAttempt.value = attempt
          startupMessage.value = `Starting betting service... (${attempt}/${maxAttempts})`
          console.log('🔍 isServiceStarting after setting:', isServiceStarting.value);
        },
        onRetry: (attempt, error) => {
          console.log(`🔄 Betting service retry attempt ${attempt}:`, error.message)
        }
      }
    );

    console.log('✅ Request successful, response:', response.status);
    allGames.value = response.data
  } catch (error) {
    console.log('❌ ERROR in fetchGamesInitial:', error)
    console.log('❌ Error status:', error.response?.status)
    console.log('❌ Error message:', error.message)
  } finally {
    console.log('🔍 In finally block');
    console.log('🔍 isServiceStarting before reset:', isServiceStarting.value);
    loading.value = false
    firstLoad.value = false
    isServiceStarting.value = false
    startupMessage.value = ''
    retryAttempt.value = 0
    console.log('🔍 isServiceStarting after reset:', isServiceStarting.value);
  }
}

// Background polling (silent, no modal)
const fetchGamesPolling = async () => {
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  countRefetch.value++
  console.log('Background poll - pollingAllGames:', countRefetch.value, ' ', currentTime)

  try {
    const BETTING_API = import.meta.env.VITE_BETTING_API_URL;
    // Simple request with no retry logic for background polling
    const response = await axios.get(`${BETTING_API}/betting/games`, {
      timeout: 10000 // 10 second timeout
    });
    allGames.value = response.data
  } catch (error) {
    console.log('Background polling error (silent):', error.message)
    // Don't show modal for background polling failures
  }
}

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
    if (fetchGamesInterval) clearInterval(fetchGamesInterval)
    console.log('Tab hidden — polling paused.')
  } else {
    // Resume polling
    fetchGamesPolling()
    fetchGamesInterval = setInterval(fetchGamesPolling, 60000)
    console.log('Tab visible — polling resumed.')
  }
}

const testModal = () => {
  console.log('🧪 Testing modal manually');
  isServiceStarting.value = true;
  retryAttempt.value = 2;
  startupMessage.value = 'Testing startup modal...';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    isServiceStarting.value = false;
    startupMessage.value = '';
    retryAttempt.value = 0;
  }, 5000);
}

onMounted(() => {
  fetchGamesInitial()
  fetchGamesInterval = setInterval(fetchGamesPolling, 60000) // every 1 minutes
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (fetchGamesInterval) clearInterval(fetchGamesInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div>
    <v-container>
 <!-- Add this test button -->
      <v-row class="mb-4">
        <v-col>
          <v-btn @click="testModal" color="warning">
            Test Modal
          </v-btn>
          <v-btn @click="fetchGamesInitial" :loading="loading" color="primary" class="ml-2">
            Refresh Games
          </v-btn>
        </v-col>
      </v-row>

      <div v-if="loading && !isServiceStarting" class="d-flex justify-center align-center" style="height: 80vh">
        <v-progress-circular indeterminate size="64" color="primary" />
      </div>

      <div v-else-if="!isServiceStarting">
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

    <!-- Service startup modal -->
    <ServiceStartup
      :show="isServiceStarting"
      :attempt="retryAttempt"
      :message="startupMessage"
    />
  </div>
</template>
