<script setup>
import { computed, ref } from 'vue'
import { useBetslipStore } from '@/stores/useBetslipStore'

const store = useBetslipStore()
const stake = ref(store.stake)

const payout = computed(() => {
  if (!store.stake || store.bets.length === 0) return 0
  if (store.bets.length === 1) {
    const odds = store.bets[0].odds
    const decimalOdds = odds >= 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds)
    return store.stake * decimalOdds
  } else {
    const decimalCombined = store.bets.reduce((acc, leg) => {
      return acc * (leg.odds >= 0 ? 1 + leg.odds / 100 : 1 + 100 / Math.abs(leg.odds))
    }, 1)
    return store.stake * decimalCombined
  }
})

const formatOdds = (odds) => {
  return odds > 0 ? `+${odds}` : `${odds}`
}

const combinedOdds = computed(() => {
  if (store.bets.length <= 1) return null

  const decimal = store.bets.reduce((acc, leg) => {
    return acc * (leg.odds >= 0 ? 1 + leg.odds / 100 : 1 + 100 / Math.abs(leg.odds))
  }, 1)

  const american = decimal >= 2 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1))
  return formatOdds(american)
})

const handlePlaceBet = async () => {
  const result = await store.placeBet()
  /*
  if (result.success) {
    // success feedback
  } else {
    // error feedback
  }
    */
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return (
    date.toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
      hour12: true,
    }) + ' CT'
  )
}
</script>

<template>
  <v-navigation-drawer
    v-model="store.isOpen"
    app
    location="right"
    width="500"
    clipped
    elevation="4"
    class="pa-4"
  >
    <v-toolbar flat dense>
      <v-toolbar-title> Bet Slip </v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" icon @click="store.closeSlip">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-divider class="my-2" />
    <v-card v-for="(bet, index) in store.bets" :key="index" class="full-bet" flat outlined>
      <div class="bet-info">
        <div>{{ bet.selected_team }} ({{ formatOdds(bet.odds) }})</div>
        <small>{{ bet.away_team }} vs {{ bet.home_team }}</small>
        <div>
          <small>{{ formatDate(bet.commence_timeString) }}</small>
        </div>
      </div>
      <v-btn icon @click="store.removeBet(bet.event_id)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-card>

    <v-divider class="my-2" v-if="store.bets.length > 0" />
    <v-card-text class="text-subtitle-1" v-if="combinedOdds">
      <strong>Combined Odds:</strong> {{ combinedOdds }}
    </v-card-text>
    <v-text-field
      type="number"
      prepend-inner-icon="mdi-currency-usd"
      min="0"
      step="1"
      v-model.number="stake"
      @input="store.setStake(stake)"
    />

    <v-card-text class="text-subtitle-1">
      <strong>Potential Payout:</strong> ${{ payout.toFixed(2) }}
    </v-card-text>

    <v-btn block color="primary" @click="handlePlaceBet">
      Place {{ store.isParlay ? 'Parlay' : 'Bet' }}
    </v-btn>
  </v-navigation-drawer>
</template>

<style scoped>
.full-bet {
  display: flex;
  flex-direction: row;
  padding: 5px;
}

.bet-info {
  flex: 1;
}
</style>
