import bittensor as bt

netuid = 124

subtensor = bt.Subtensor("finney")

all_info = {int(s.netuid): s for s in subtensor.get_all_subnets_info()}
info = all_info.get(netuid)

print("register_fee_tao:", float(info.burn) if info and info.burn is not None else None)
