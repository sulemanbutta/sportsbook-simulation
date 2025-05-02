<script setup>
import { useBetslipStore } from '@/stores/useBetslipStore'

const props = defineProps({
  normalizedId: String,
  eventId: String,
  sport: String,
  homeName: String,
  awayName: String,
  homeMascot: String,
  awayMascot: String,
  homeLogo: String,
  awayLogo: String,
  homeScore: [Number, null],
  awayScore: [Number, null],
  homeOdds: [Number, null],
  awayOdds: [Number, null],
  gameStatus: String,
  gameCommenceTime: String,
})
const betslip = useBetslipStore()
console.log('props.normalizedId', props.normalizedId)
console.log('props.homeOdds', props.homeOdds)
console.log('props.awayOdds', props.awayOdds)
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
</script>

<template>
  <v-card class="game-card pa-2" elevation="2">
    <v-row align="center" justify="space-between">
      <!-- Away Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="awayLogo" max-height="24" contain />
        <div class="team-name mt-1">{{ awayMascot }}</div>
        <div class="score">{{ awayScore }}</div>
      </v-col>

      <!-- Game Status -->
      <v-col cols="4" class="text-center">
        <div class="live-label">LIVE</div>
        <div class="period">{{ gameStatus }}</div>
      </v-col>

      <!-- Home Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="homeLogo" max-height="24" contain />
        <div class="team-name mt-1">{{ homeMascot }}</div>
        <div class="score">{{ homeScore }}</div>
      </v-col>
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
.team-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score {
  font-size: 14px;
  font-weight: bold;
  margin-top: 4px;
}

.live-label {
  color: red;
  font-weight: bold;
  font-size: 14px;
}

.period {
  font-size: 12px;
  color: #555;
}

.game-card {
  width: 100%;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
