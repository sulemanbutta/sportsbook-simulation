<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const headers = [
  {
    title: 'ID',
    key: 'id',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Event',
    key: 'event',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Selection',
    key: 'selection',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Odds',
    key: 'odds',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Stake',
    key: 'stake',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Payout',
    key: 'payout',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
  {
    title: 'Status',
    key: 'status',
    headerProps: {
      style: 'font-weight: bold',
    },
  },
]

const betHistory = ref([])
const loading = ref(true)

async function fetchBetHistory() {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:4001/betting/mybets', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    //betHistory.value = res.data
    const data = res.data
    betHistory.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (error) {
    console.error('Error fetching bet history', error)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  console.log(Date)
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return new Date(dateStr).toLocaleString(undefined, options)
}

function statusColor(status) {
  switch (status) {
    case 'WIN':
      return 'green'
    case 'LOSS':
      return 'red'
    case 'PENDING':
      return 'grey'
    default:
      return 'grey'
  }
}

function formatOdds(odds) {
  if (odds > 0) {
    return `+${odds}`
  }
  return odds
}

onMounted(() => {
  fetchBetHistory()
})
</script>

<template>
  <div v-if="loading" class="d-flex justify-center align-center" style="height: 80vh">
    <v-progress-circular indeterminate size="64" color="primary" />
  </div>
  <div v-else>
    <v-data-table
      v-if="!loading"
      :headers="headers"
      :items="betHistory"
      item-value="id"
      class="elevation-1"
      density="comfortable"
    >
      <!-- ID Column: bet_id or parlay_id + created_at -->
      <template v-slot:[`item.id`]="{ item }">
        <div>
          <div>{{ item.bet_id || item.parlay_id }}</div>
          <div class="text-caption text-grey-darken-1">{{ formatDate(item.created_at) }}</div>
        </div>
      </template>

      <!-- Event Column: single or multiple -->
      <template v-slot:[`item.event`]="{ item }">
        <div>
          <div v-if="item.legs">
            <div v-for="(leg, index) in item.legs" :key="index" class="mb-2">
              <div>{{ leg.away_team }} at {{ leg.home_team }}</div>
              <div class="text-caption text-grey-darken-1">{{ formatDate(leg.commence_time) }}</div>
            </div>
          </div>

          <div v-else>
            <div>{{ item.away_team }} at {{ item.home_team }}</div>
            <div class="text-caption text-grey-darken-1">{{ formatDate(item.commence_time) }}</div>
          </div>
        </div>
      </template>

      <!-- Selection Column -->
      <template v-slot:[`item.selection`]="{ item }">
        <div>
          <div v-if="item.legs">
            <div v-for="(leg, index) in item.legs" :key="index" class="mb-2">
              {{ leg.selected_team }}
            </div>
          </div>
          <div v-else>
            {{ item.selected_team }}
          </div>
        </div>
      </template>

      <!-- Odds Column -->
      <template v-slot:[`item.odds`]="{ item }">
        <div>{{ formatOdds(item.odds) }}</div>
      </template>

      <!-- Stake Column -->
      <template v-slot:[`item.stake`]="{ item }">
        <div>${{ Number(item.stake).toFixed(2) }}</div>
      </template>

      <!-- Payout Column -->
      <template v-slot:[`item.payout`]="{ item }">
        <div>${{ Number(item.payout).toFixed(2) }}</div>
      </template>

      <!-- Status Column: colored chip -->
      <template v-slot:[`item.status`]="{ item }">
        <v-chip :color="statusColor(item.status)" class="text-white" size="small">
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.text-caption {
  font-size: 0.75rem; /* Smaller caption text for times */
  color: grey;
}
</style>
