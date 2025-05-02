import { defineStore } from 'pinia'
import axios from 'axios'

export const useBetslipStore = defineStore('betslip', {
  state: () => ({
    isOpen: false,
    bets: [],
    stake: 0,
  }),
  getters: {
    isParlay: (state) => state.bets.length > 1,
  },
  actions: {
    addBet(bet) {
      const exists = this.bets.find((b) => b.event_id === bet.event_id)
      if (!exists) {
        this.bets.push(bet)
        this.isOpen = true
      } else {
        this.bets = this.bets.map((b) => (b.event_id === bet.event_id ? bet : b))
      }
    },
    removeBet(event_id) {
      this.bets = this.bets.filter((b) => b.event_id !== event_id)
    },
    setStake(amount) {
      this.stake = amount
    },
    clearBets() {
      this.bets = []
      this.stake = 0
    },
    openSlip() {
      this.isOpen = true
    },
    closeSlip() {
      this.isOpen = false
    },
    async placeBet() {
      if (!this.stake || this.bets.length === 0) {
        console.warn('Missing stake or bets.')
        return
      }

      const token = localStorage.getItem('token')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      const payload = {
        isParlay: this.bets.length > 1,
        stake: this.stake,
        bets: this.bets,
      }
      try {
        const endpoint = 'http://localhost:4001/betting/bet'
        const response = await axios.post(endpoint, payload, config)

        // Optional: handle response
        console.log('Bet placed:', response.data)

        // Reset the slip
        this.clearBets()
        this.closeSlip()

        // Return success so component can respond
        return { success: true, data: response.data }
      } catch (err) {
        console.error('Bet placement error:', err)
        return { success: false, error: err }
      }
    },
  },
})
