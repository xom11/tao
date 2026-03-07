tôi cần tạo một repo với mục đích theo định kì sẽ clone data của mạng bittensor , lưu vào database sau đó tạo một trang web để theo dõi thông tin của hệ thống
# Thu thập database
- sử dụng python bittensor sdk [github](https://github.com/opentensor/bittensor)
    ```python
    import bittensor as bt
    sub = bt.Subtensor('finney')

    ```
- sử dụng api của taostats [taostats](https://docs.taostats.io/docs/welcome) ( cần api key tôi sẽ cung cấp trong phần .env)
- sử dụng uv
- cần thu thập các thông tin sau:
    - Overview data ( những data tổng quan về bittensor)
    - Subnet data (những data về từng subnet)
- data sẽ được lưu lại ở database (nhưng tôi chưa biết sử dụng database nào). Nhưng các trường data cần lưu có thể được thêm bớt sau này
## Overview Data 
- lấy balance của một câu key (sẽ có một list các coldkey của mình đăng kí và sẽ lấy thông tin coldkey đó)  
    ```python
    balance = sub.get_balance(coldkey)
    ```
- một vài thông tin khác tôi sẽ cung cấp sau
## Subnet Info
- overview
    ```python
    subnets = sub.get_all_subnets_info()
    ```
- metagraph
    ```python
    # filter qua từng netuid
    meta = sub.metagraph(netuid=netuid)
    for uid in meta.uids:
        # get info for each miner
    ```
- một vài thông tin khác sẽ cung cấp sau
## Thông tin tự nhập hoặc sẽ làm sau

# Xây dựng tool theo dõi
tôi định sẽ xây dựng một trang web hay cái gì đó để quan sát, sẽ tiếp tục xây dựng sau

