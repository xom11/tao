import bittensor as bt
def main():
    sub = bt.Subtensor('finney')
    meta = sub.metagraph(118)

    for uid in meta.uids:
        hotkey = meta.hotkeys[uid]
        stake  = meta.stake[uid]
        incentive = meta.incentive[uid]
        print(uid, hotkey, stake, incentive)


if __name__ == "__main__":
    main()
