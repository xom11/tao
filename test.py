import bittensor as bt

sub = bt.Subtensor(network="finney")

# Lấy tất cả subnet
subnets = sub.get_all_subnets_info()

for netuid, info in subnets:
    print(f"Subnet {netuid}:")
    print(f"  Owner: {info.owner_ss58}")
    print(f"  Tempo: {info.tempo}")
    print(f"  Emission: {info.emission_value}")
    print(f"  Max neurons: {info.max_n}")
    print(f"  Difficulty: {info.difficulty}")
    print("---")
    break
