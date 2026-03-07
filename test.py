import bittensor as bt

sub = bt.Subtensor(network="finney")

# Cách 1: Từ subnet info
info = sub.get_subnet_info(netuid=1)
print(f"Emission: {info.emission_value}")

# Cách 2: Từ metagraph - tổng emission của subnet
meta = sub.metagraph(netuid=1)
total_emission = meta.E.sum()
print(f"Total emission: {total_emission}")

# Cách 3: Emission của từng neuron trong subnet
for uid in range(meta.n.item()):
    print(f"UID {uid}: emission = {meta.E[uid]:.6f}")
