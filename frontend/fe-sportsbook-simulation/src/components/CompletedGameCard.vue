<script setup>
import { computed } from 'vue'

const props = defineProps({
  homeMascot: String,
  awayMascot: String,
  homeLogo: String,
  awayLogo: String,
  homeScore: Number,
  awayScore: Number,
})

const isHomeWinner = computed(() => props.homeScore > props.awayScore)
const isAwayWinner = computed(() => props.awayScore > props.homeScore)
</script>

<template>
  <v-card class="game-card pa-2" elevation="2">
    <v-row align="center" justify="space-between">
      <!-- Away Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="awayLogo" max-height="24" contain />
        <div class="team-name mt-1" :class="{ winner: isAwayWinner }">{{ awayMascot }}</div>
        <div class="score">{{ awayScore }}</div>
      </v-col>

      <!-- Game Time -->
      <v-col cols="4" class="text-center">
        <div class="final-label">FINAL</div>
      </v-col>

      <!-- Home Team -->
      <v-col cols="4" class="text-center">
        <v-img :src="homeLogo" height="24" contain />
        <div class="team-name mt-1" :class="{ winner: isHomeWinner }">{{ homeMascot }}</div>
        <div class="score">{{ homeScore }}</div>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
.game-card {
  height: 120px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

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
  color: #333;
}

.final-label {
  font-weight: bold;
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.winner {
  color: green;
  font-weight: 700;
}
</style>
