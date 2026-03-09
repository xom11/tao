import bittensor as bt

netuid = 124

subtensor = bt.Subtensor("finney")

burn_cost = subtensor.recycle(netuid)

print("Miner registration cost:", burn_cost)
