import bittensor as bt

ALPHA_PER_EPOCH = 360
EPOCHS_PER_DAY = 20
MINER_SPLIT = 0.41
VALIDATOR_SPLIT = 0.59

netuid = 118

subtensor = bt.Subtensor("finney")
metagraph = subtensor.metagraph(netuid)

subnet_info = subtensor.get_subnet_info(netuid)
owner_hotkey = subnet_info.owner_ss58 if subnet_info else None

# Lấy alpha price
alpha_price = None
for s in subtensor.all_subnets():
    if int(s.netuid) == netuid:
        alpha_price = float(s.price) if s.price is not None else None
        break

print(f"Alpha price: {alpha_price}")

validators = []
miners = []

for uid in metagraph.uids:
    uid = int(uid)
    hotkey = metagraph.hotkeys[uid]
    vtrust = float(metagraph.validator_trust[uid])
    incentive = float(metagraph.incentive[uid])
    stake = float(metagraph.stake[uid])

    if hotkey == owner_hotkey:
        role = "owner"
    elif vtrust > 0:
        role = "validator"
    else:
        role = "miner"

    if role == "miner":
        daily_alpha = ALPHA_PER_EPOCH * MINER_SPLIT * incentive * EPOCHS_PER_DAY
        daily_tao = daily_alpha * alpha_price if alpha_price else None
        miners.append({"uid": uid, "hotkey": hotkey, "incentive": incentive, "daily_alpha": daily_alpha, "daily_tao": daily_tao})

    else:  # validator or owner — TODO: công thức đang xem xét lại
        validators.append({"uid": uid, "role": role, "hotkey": hotkey, "stake": stake, "vtrust": vtrust, "daily_tao": 0.0})

# --- In kết quả ---

print(f"\n=== Subnet {netuid} ===")
print(f"Owner hotkey : {owner_hotkey}")

print(f"\n--- Validators/Owners ({len(validators)}) ---")
for v in validators:
    print(f"  uid={v['uid']:3d} [{v['role']:9s}]  stake={v['stake']:10.2f}  vtrust={v['vtrust']:.4f}  daily_tao=TODO")

print(f"\n--- Miners ({len(miners)}) ---")
miners_sorted = sorted(miners, key=lambda x: x["daily_alpha"], reverse=True)
for m in miners_sorted[:20]:  # top 20
    print(f"  uid={m['uid']:3d}  incentive={m['incentive']:.6f}  daily_alpha={m['daily_alpha']:.4f}  daily_tao={m['daily_tao']:.6f if m['daily_tao'] else 'N/A'}")

print(f"\n--- Miner tổng ---")
print(f"  Total daily alpha : {sum(m['daily_alpha'] for m in miners):.4f}")
print(f"  Total daily TAO   : {sum(m['daily_tao'] for m in miners if m['daily_tao']):.6f}")
