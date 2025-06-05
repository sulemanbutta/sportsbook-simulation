<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const balance = ref(0)
const amount = ref(0)
const loading = ref(false)

const fetchBalance = async () => {
  try {
    loading.value = true
    const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
    const res = await axios.get(`${AUTH_API}/auth/balance`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    balance.value = res.data.balance
  } catch (error) {
    console.error('Failed to fetch balance', error)
  } finally {
    loading.value = false
  }
}

const updateBalance = async () => {
  try {
    loading.value = true
    const AUTH_API = import.meta.env.VITE_AUTH_API_URL;
    const res = await axios.post(
      `${AUTH_API}/auth/deposit`,
      { amount: parseFloat(amount.value.toFixed(2)) },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
    )
    balance.value = res.data.balance
    amount.value = 0
  } catch (error) {
    console.error('Balance update failed', error)
  } finally {
    loading.value = false
  }
}

function formatAmountInput() {
  if (amount.value !== null) {
    const parsed = parseFloat(amount.value)
    if (!isNaN(parsed)) {
      amount.value = Math.floor(parsed * 100) / 100
    }
  }
}

onMounted(fetchBalance)
</script>
<template>
  <v-container class="d-flex justify-center">
    <v-card class="pa-6" width="400">
      <v-card-title class="text-h5 mb-4">Wallet</v-card-title>

      <v-card-text>
        <div class="text-subtitle-1 mb-4">
          Current Balance:
          <span class="font-weight-bold">${{ balance.toFixed(2) }}</span>
        </div>

        <v-text-field
          v-model.number="amount"
          label="Amount"
          type="number"
          prepend-inner-icon="mdi-currency-usd"
          variant="outlined"
          class="mb-4"
          min="0"
          step="1"
          @input="formatAmountInput"
        ></v-text-field>

        <v-btn :loading="loading" color="primary" block @click="updateBalance" :disabled="!amount">
          Add Funds
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped></style>
