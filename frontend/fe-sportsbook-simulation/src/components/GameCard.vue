<script setup>
import { useBetslipStore } from '@/stores/useBetslipStore'

defineProps({
  eventId: String,
  sport: String,
  homeName: String,
  awayName: String,
  homeMascot: String,
  awayMascot: String,
  homeLogo: String,
  awayLogo: String,
  homeOdds: Number,
  awayOdds: Number,
  gameCommenceTime: String,
})
const betslip = useBetslipStore()

const handleSelect = (
  eventId,
  sport,
  homeName,
  awayName,
  selected_team,
  odds,
  gameCommenceTime,
) => {
  betslip.openSlip()
  betslip.addBet({
    event_id: eventId,
    sport,
    selected_team: selected_team === 'home' ? homeName : awayName,
    odds,
    home_team: homeName,
    away_team: awayName,
    commence_timeString: gameCommenceTime,
  })
}

function formatTime(isoString) {
  const date = new Date(isoString)
  return (
    date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
      hour12: true,
    }) + ' CT'
  )
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: '2-digit',
    month: '2-digit',
    day: 'numeric',
  })
}
</script>

<template>
  <v-card class="game-card pa-2" elevation="2">
    <v-row align="center" justify="space-between">
      <!-- Away Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="awayLogo" max-height="24" contain />
        <div class="team-name mt-1">{{ awayMascot }}</div>
      </v-col>

      <!-- Game Time -->
      <v-col cols="4" class="text-center">
        <div class="time">{{ formatDate(gameCommenceTime) }}</div>
        <div class="time">{{ formatTime(gameCommenceTime) }}</div>
      </v-col>

      <!-- Home Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="homeLogo" height="24" contain />
        <div class="team-name mt-1">{{ homeMascot }}</div>
      </v-col>

      <!-- Odds Buttons -->
      <v-row class="mb-4" justify="center" align="center" no-gutters>
        <template v-if="homeOdds && awayOdds">
          <v-col cols="4" class="d-flex justify-center">
            <v-btn
              small
              color="primary"
              @click="
                handleSelect(eventId, sport, homeName, awayName, 'away', awayOdds, gameCommenceTime)
              "
            >
              {{ awayOdds > 0 ? '+' + awayOdds : awayOdds }}
            </v-btn>
          </v-col>

          <v-col cols="4" class="text-center">
            <div class="odds-label">Moneyline</div>
          </v-col>

          <v-col cols="4" class="d-flex justify-center">
            <v-btn
              small
              color="primary"
              @click="
                handleSelect(eventId, sport, homeName, awayName, 'home', homeOdds, gameCommenceTime)
              "
            >
              {{ homeOdds > 0 ? '+' + homeOdds : homeOdds }}
            </v-btn>
          </v-col>
        </template>
        <template v-else>
          <v-col cols="12" class="text-center">
            <div class="no-odds">Betting not available</div>
          </v-col>
        </template>
      </v-row>
    </v-row>
  </v-card>
</template>

<style scoped>
.game-card {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.team-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-weight: bold;
  font-size: 12px;
}

.time-zone {
  font-size: 12px;
}

.odds-btn {
  font-size: 12px;
  min-height: 28px;
  width: 40px;
}

.odds-label {
  font-size: 12px;
  font-weight: 500;
  color: #555;
}

.no-odds {
  font-size: 12px;
  color: gray;
}
</style>
